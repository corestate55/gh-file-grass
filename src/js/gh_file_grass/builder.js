import { linkHorizontal } from 'd3-shape'
import { scaleLinear } from 'd3-scale'
import GHFileGrassBase from './base'

export default class GHFileGrassBuilder extends GHFileGrassBase {
  _fileClass(index) {
    return `file${index}`
  }

  _fileLabelId(index) {
    return `${this._fileClass(index)}-label`
  }

  _commitClass(index) {
    return `commit${index}`
  }

  _commitLabelId(index) {
    return `${this._commitClass(index)}-label`
  }

  _statClass(index) {
    return `stat${index}`
  }

  _statRectId(index) {
    return this._statClass(index)
  }

  _commitHistorgramId(index) {
    return `${this._fileClass(index)}-histogram`
  }

  _modClass(index) {
    return `mod${index}`
  }

  _makeFileLabels() {
    this._selectClippedGroup('files')
      .selectAll('text.file-label')
      .data(this.files.files)
      .enter()
      .append('a')
      .attr('xlink:href', d => `${this.origin}/blob/${this.branch}/${d.name}`)
      .attr('target', '_blank')
      .append('text')
      .attr('id', d => this._fileLabelId(d.index))
      .attr('class', d => `file-label ${this._fileClass(d.index)}`)
      .attr('x', d => this._px(0, d))
      .attr('y', d => this._py(d.index, d))
      .attr('dy', this.fontSize)
      .text(d => d.name)
  }

  _makeCommitLabels() {
    this._selectClippedGroup('commits')
      .selectAll('text.commit-label')
      .data(this.commits.commits)
      .enter()
      .append('a')
      .attr('xlink:href', d => `${this.origin}/commit/${d.sha}`)
      .attr('target', '_blank')
      .append('text')
      .attr('id', d => this._commitLabelId(d.index))
      .attr('class', d => `commit-label ${this._commitClass(d.index)}`)
      .attr('x', d => this._px(d.index, d))
      .attr('y', d => this._py(0, d))
      .attr('dx', this.fontSize / 2)
      .attr('dy', this.fontSize / 2)
      .attr('transform', d => `rotate(-60,${d.px},${d.py})`)
      .text(d => d.sha_short)
  }

  _lifeStartIndex(file) {
    const stat1 = this.stats.findByFileAndType(file.name, 'new')
    if (stat1) {
      // console.log(`- start-1: `, stat1)
      return this.commits.indexOf(stat1.sha_short)
    }
    const stat2 = this.stats.findByFileAndRenamed(file.name)
    if (stat2) {
      // console.log('- start-2: ', stat2)
      return this.commits.indexOf(stat2.sha_short)
    }
    return 1
  }

  _lifeEndIndex(file) {
    const stat1 = this.stats.findByFileAndType(file.name, 'deleted')
    if (stat1) {
      // console.log('- end-1: ', stat1)
      return this.commits.indexOf(stat1.sha_short)
    }
    const stat2 = this.stats
      .findAllByPath(file.name)
      .find(d => this.stats.isSamePathDstStat(d))
    if (stat2) {
      // console.log('- end-2: ', stat2)
      return this.commits.indexOf(stat2.sha_short)
    }
    return this.commits.length
  }

  _makeFileLifeStatsRect() {
    for (const file of this.files.files) {
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
        ['file-life', this._fileClass(d.fileIndex), this._commitClass(d.commitIndex)].join(
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

  _makeStatRects() {
    const classBy = d => {
      d.fileIndex = this.files.indexOf(d.path)
      d.commitIndex = this.commits.indexOf(d.sha_short)
      return [
        'stats',
        this._statClass(d.index),
        this._fileClass(d.fileIndex),
        this._commitClass(d.commitIndex),
        this._modClass(d.modifiedClass)
      ].join(' ')
    }

    // class attr (classBy) must be before rect[XY] to set files/commit index
    this._selectClippedGroup('stats')
      .selectAll('rect.stats')
      .data(this.stats.stats)
      .enter()
      .append('rect')
      .attr('id', d => this._statRectId(d.index))
      .attr('class', classBy)
      .attr('x', d => this._rectX(d))
      .attr('y', d => this._rectY(d))
      .attr('width', this.lc)
      .attr('height', this.lc)
  }

  _rectX(stat) {
    return this._px(stat.commitIndex, stat)
  }

  _rectY(stat) {
    return this._py(stat.fileIndex, stat)
  }

  _makeStatsArrow() {
    const arrows = []
    const dxy = this.lc / 2
    for (const stat of this.stats.stats) {
      const dstStats = this.stats.findAllDstOf(stat)
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
    const commitHist = this.files.files.map(d => ({
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
      .attr('id', d => this._commitHistorgramId(d.index))
      .attr('class', d => `commit-hist ${this._fileClass(d.index)}`)
      .attr('x', this.px0 * basePosRatio)
      .attr('y', d => this._py(d.index, d))
      .attr('width', d => xScale(d.hist))
      .attr('height', this.lc)
  }
}
