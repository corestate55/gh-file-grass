import { linkHorizontal } from 'd3-shape'
import { scaleLinear } from 'd3-scale'
import GHFileGrassBase from './base'

export default class GHFileGrassBuilder extends GHFileGrassBase {
  _makeFileLabels() {
    this._selectClippedGroup('files')
      .selectAll('text.file-label')
      .data(this.files)
      .enter()
      .append('a')
      .attr('xlink:href', d => `${this.origin}/blob/${this.branch}/${d.name}`)
      .attr('target', '_blank')
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
      .append('a')
      .attr('xlink:href', d => `${this.origin}/commit/${d.sha}`)
      .attr('target', '_blank')
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

  _areRenamedDstStatsOf(stat) {
    const dstStats = this._findAllDstStats(stat)
    if (dstStats.length < 1) {
      return false
    }
    const results = dstStats.map(dstStat => {
      return this._isRenamedStat(dstStat) || stat.path !== dstStat.path
    })
    // if exists false in results: stat has NOT-RENAMED destination in dstStats.
    return results.reduce((acc, curr) => acc && curr, true)
  }

  _lifeEndIndex(file) {
    const stat1 = this._findStatByFileAndType(file.name, 'deleted')
    if (stat1) {
      // console.log('- end-1: ', stat1)
      return this._indexOfCommit(stat1.sha_short)
    }
    const stat2 = this._findStatsByFile(file.name).find(d =>
      this._areRenamedDstStatsOf(d)
    )
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
        { length: endIndex - startIndex + 1 },
        (_, i) => ({
          fileIndex: file.index,
          commitIndex: i + startIndex
        })
      )
      const classBy = d =>
        ['file-life', `file-${d.fileIndex}`, `commit-${d.commitIndex}`].join(
          ' '
        )

      this._selectClippedGroup('stats')
        .selectAll(`rect.file-${file.index}`)
        .data(range)
        .enter()
        .append('rect')
        .attr('class', classBy)
        .attr('x', d => this._px(d.commitIndex, d))
        .attr('y', d => this._py(d.fileIndex, d))
        .attr('width', this.lc)
        .attr('height', this.lc)
    }
  }

  _classifyStatsByModifiedLines() {
    const stepDiv = this.stats.length / 4
    let count = 1
    let step = stepDiv
    this.stats
      .sort((a, b) => a.lines - b.lines)
      .forEach((d, i) => {
        if (i > step) {
          count++
          step = stepDiv * count
        }
        d.modifiedClass = count
      })
    this.stats.sort((a, b) => a.index - b.index)
  }

  _makeStatsRect() {
    this._classifyStatsByModifiedLines()

    const classBy = d => {
      d.fileIndex = this._indexOfFile(d.path)
      d.commitIndex = this._indexOfCommit(d.sha_short)
      return [
        'stats',
        `stat-${d.index}`,
        `file-${d.fileIndex}`,
        `commit-${d.commitIndex}`,
        `mod-${d.modifiedClass}`
      ].join(' ')
    }

    this._selectClippedGroup('stats')
      .selectAll('rect.stats')
      .data(this.stats)
      .enter()
      .append('rect')
      .attr('class', classBy)
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

  _findAllDstStats(stat) {
    if (stat.dst === '0000000' || stat.dst === '') {
      return []
    }
    return this.stats.filter(d => d.src === stat.dst)
  }

  _makeStatsArrow() {
    const arrows = []
    const dxy = this.lc / 2
    for (const stat of this.stats) {
      const dstStats = this._findAllDstStats(stat)
      if (dstStats.length < 1) {
        continue
      }
      dstStats.forEach(dstStat => {
        arrows.push({
          sourceIndex: stat.index,
          targetIndex: dstStat.index,
          source: [stat.px + dxy, stat.py + dxy],
          target: [dstStat.px + dxy, dstStat.py + dxy]
        })
      })
    }
    const classBy = d =>
      ['stat-arrow', `stat-${d.sourceIndex}`, `stat-${d.targetIndex}`].join(' ')

    this.statsLink = linkHorizontal() // link generator
    this._selectClippedGroup('stats')
      .selectAll('path.stat-arrow')
      .data(arrows)
      .enter()
      .insert('path', 'rect.stats') // paths be under stats-rect
      .attr('class', classBy)
      .attr('d', d => this.statsLink(d))
  }

  _makeCommitHistogram() {
    const commitHist = this.files.map(d => ({
      index: d.index,
      name: d.name, // for debug
      hist: d.commits.length
    }))

    const basePosRatio = 0.7
    const xScale = scaleLinear()
      .domain([0, Math.max(...commitHist.map(d => d.hist))])
      .range([0, (1 - basePosRatio) * this.px0])

    this._selectClippedGroup('files')
      .selectAll('rect.commit-hist')
      .data(commitHist)
      .enter()
      .append('rect')
      .attr('class', d => `file-${d.index} commit-hist`)
      .attr('x', this.px0 * basePosRatio)
      .attr('y', d => this._py(d.index, d))
      .attr('width', d => xScale(d.hist))
      .attr('height', this.lc)
  }
}
