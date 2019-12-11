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
      .data(this.files.all)
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
      .data(this.commits.all)
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
    const stat =
      this.stats.findByFileAndType(file.name, 'new') ||
      this.stats.findByDstAndRenamed(file.name)

    if (stat) {
      // console.log(`- start-1: `, stat1)
      return this.commits.indexOf(stat.sha_short)
    }
    return 1
  }

  _lifeEndIndex(file) {
    const stat =
      this.stats.findByFileAndType(file.name, 'deleted') ||
      this.stats.findByFileAndRenamed(file.name)

    if (stat) {
      // console.log('- end-1: ', stat1)
      return this.commits.indexOf(stat.sha_short)
    }
    return this.commits.length
  }

  _makeFileLifeStatRectsData(file) {
    const startIndex = this._lifeStartIndex(file)
    const endIndex = this._lifeEndIndex(file)

    return Array.from({ length: endIndex - startIndex + 1 }, (_, i) => ({
      fileIndex: file.index,
      commitIndex: i + startIndex
    }))
  }

  _makeFileLifeStatRects() {
    for (const file of this.files.all) {
      // console.log(`file: ${file.name}`)
      const range = this._makeFileLifeStatRectsData(file)
      const classBy = d =>
        [
          'file-life',
          this._fileClass(d.fileIndex),
          this._commitClass(d.commitIndex)
        ].join(' ')

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

  _updateStatRectsData() {
    // add file/commit index
    this.stats.all.forEach(d => {
      d.fileIndex = this.files.indexOf(d.path)
      d.commitIndex = this.commits.indexOf(d.sha_short)
    })
  }

  _makeStatRects() {
    this._updateStatRectsData()
    const classBy = d =>
      [
        'stats',
        this._statClass(d.index),
        this._fileClass(d.fileIndex),
        this._commitClass(d.commitIndex),
        this._modClass(d.modifiedClass)
      ].join(' ')

    this._selectClippedGroup('stats')
      .selectAll('rect.stats')
      .data(this.stats.all)
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

  _makeStatArrowsData() {
    const arrows = []
    const dxy = this.lc / 2
    for (const stat of this.stats.all) {
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
    return arrows
  }

  _makeStatArrows() {
    const arrows = this._makeStatArrowsData()
    const classBy = d =>
      [
        'stat-arrow',
        this._statClass(d.sourceIndex),
        this._statClass(d.targetIndex)
      ].join(' ')

    this.statsLink = linkHorizontal() // link generator
    this._selectClippedGroup('stats')
      .selectAll('path.stat-arrow')
      .data(arrows)
      .enter()
      .insert('path', 'rect.stats') // paths be under stats-rect
      .attr('class', classBy)
      .attr('d', d => this.statsLink(d))
  }

  _makeCommitHistogramData() {
    return this.files.all.map(d => ({
      index: d.index,
      name: d.name, // for debug
      hist: d.commits.length
    }))
  }

  _makeCommitHistogram() {
    const commitHist = this._makeCommitHistogramData()
    const basePosRatio = 0.7
    const xScale = scaleLinear()
      .domain([0, Math.max(...commitHist.map(d => d.hist))])
      .range([0, (1 - basePosRatio) * this.px0])
    const classBy = d =>
      ['commit-hist', `${this._fileClass(d.index)}`].join(' ')

    this._selectClippedGroup('files')
      .selectAll('rect.commit-hist')
      .data(commitHist)
      .enter()
      .append('rect')
      .attr('id', d => this._commitHistorgramId(d.index))
      .attr('class', classBy)
      .attr('x', this.px0 * basePosRatio)
      .attr('y', d => this._py(d.index, d))
      .attr('width', d => xScale(d.hist))
      .attr('height', this.lc)
  }
}
