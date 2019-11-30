import { linkHorizontal } from 'd3-shape'
import GHFileGrassBase from './base'

export default class GHFileGrassBuilder extends GHFileGrassBase {
  _makeFileLabels() {
    this._selectClippedGroup('files')
      .selectAll('text.file-label')
      .data(this.files)
      .enter()
      .append('text')
      .attr('id', d => `file-${d.index}-label`)
      .attr('class', d => `file-label file-${d.index}`)
      .attr('x', d => this._px(0, d))
      .attr('y', d => this._py(d.index, d))
      .attr('dy', this.fontSize)
      .text(d => d.name)
  }

  _makeCommitLabels() {
    this._selectClippedGroup('commits')
      .selectAll('text.commit-label')
      .data(this.commits)
      .enter()
      .append('text')
      .attr('id', d => `commit-${d.index}-label`)
      .attr('class', d => `commit-label commit-${d.index}`)
      .attr('x', d => this._px(d.index, d))
      .attr('y', d => this._py(0, d))
      .attr('dx', this.fontSize)
      .attr('transform', d => `rotate(-60,${d.px},${d.py})`)
      .text(d => d.sha_short)
  }

  _findStatsByFile(file) {
    return this.stats.filter(d => d.path === file)
  }

  _findStatByFileAndType(file, type) {
    return this.stats.find(d => d.path === file && d.type === type)
  }

  _isRenamedStat(stat) {
    return stat.stat_path.src !== stat.stat_path.dst
  }

  _findStatByFileAndRenamed(file) {
    return this.stats.find(d => d.path === file && this._isRenamedStat(d))
  }

  _lifeStartIndex(file) {
    const stat1 = this._findStatByFileAndType(file.name, 'new')
    if (stat1) {
      // console.log(`- start-1: `, stat1)
      return this._indexOfCommit(stat1.sha_short)
    }
    const stat2 = this._findStatByFileAndRenamed(file.name)
    if (stat2) {
      // console.log('- start-2: ', stat2)
      return this._indexOfCommit(stat2.sha_short)
    }
    return 1
  }

  _isDstStatRenamed(stat) {
    const dstStat = this._findDstStat(stat)
    if (dstStat) {
      return this._isRenamedStat(dstStat)
    }
    return false
  }

  _lifeEndIndex(file) {
    const stat1 = this._findStatByFileAndType(file.name, 'deleted')
    if (stat1) {
      // console.log('- end-1: ', stat1)
      return this._indexOfCommit(stat1.sha_short)
    }
    const stat2 = this._findStatsByFile(file.name).find(d => this._isDstStatRenamed(d))
    if (stat2) {
      // console.log('- end-2: ', stat2)
      return this._indexOfCommit(stat2.sha_short)
    }
    return this.commits.length
  }

  _makeFileLifeStatsRect() {
    for (const file of this.files) {
      // console.log(`file: ${file.name}`)
      const startIndex = this._lifeStartIndex(file)
      const endIndex = this._lifeEndIndex(file)
      // console.log(`- start:${startIndex}, end:${endIndex}`)
      const range = Array.from(
        {length: endIndex - startIndex + 1},
        (_, i) => ({ index: i + startIndex })
      )
      this._selectClippedGroup('stats')
        .selectAll(`rect.file-${file.index}`)
        .data(range)
        .enter()
        .append('rect')
        .attr('class', `file-life file-${file.index}`)
        .attr('x', d => this._px(d.index, d))
        .attr('y', d => this._py(file.index, d))
        .attr('width', this.lc)
        .attr('height', this.lc)
    }
  }

  _makeStatsRect() {
    this._selectClippedGroup('stats')
      .selectAll('rect.stats')
      .data(this.stats)
      .enter()
      .append('rect')
      .attr('class', 'stats')
      .attr('x', d => this._rectX(d))
      .attr('y', d => this._rectY(d))
      .attr('width', this.lc)
      .attr('height', this.lc)
  }

  _rectX(stat) {
    return this._px(this._indexOfCommit(stat.sha_short), stat)
  }

  _rectY(stat) {
    return this._py(this._indexOfFile(stat.path), stat)
  }

  _indexOfCommit(sha_short) {
    return this.commits.map(d => d.sha_short).indexOf(sha_short) + 1
  }

  _indexOfFile(key) {
    return this.files.map(d => d.name).indexOf(key) + 1
  }

  _findDstStat(stat) {
    if (stat.dst === '0000000' || stat.dst === '') {
      return undefined
    }
    return this.stats.find(d => d.src === stat.dst)
  }

  _makeStatsArrow() {
    const arrows = []
    const dxy = this.lc / 2
    for (const stat of this.stats) {
      const dstStat = this._findDstStat(stat)
      if (!dstStat) {
        continue
      }
      arrows.push({
        source: [stat.px + dxy, stat.py + dxy],
        target: [dstStat.px + dxy, dstStat.py + dxy]
      })
    }
    this.statsLink = linkHorizontal()
    this._selectClippedGroup('stats')
      .selectAll('line')
      .data(arrows)
      .enter()
      .append('path')
      .attr('d', d => this.statsLink(d))
  }
}
