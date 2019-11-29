import { select, event } from 'd3-selection'
import { json } from 'd3-fetch'
import { drag } from 'd3-drag'

export default class GHFileGrass {
  constructor(logUri) {
    this.fontSize = 10
    this.py0 = 100
    this.lc = this.fontSize * 1.2
    this.dc = this.fontSize * 0.4
    this.logUri = logUri
  }

  _makeCommitsGroup() {
    // Commits : X-Axis
    this.commitsGroup = this.svg
      .append('g')
      .attr('id', 'commits-group')
      .attr('transform', `translate(${this.px0},${this.py0})`)
    this.commitsGroup
      .append('defs')
      .append('SVG:clipPath')
      .attr('id', 'commits-clip')
      .append('rect')
      .attr('x', 0)
      .attr('y', -this.py0)
      .attr('width', this.width1)
      .attr('height', this.py0)
    this.clippedCommitsGroup = this.commitsGroup
      .append('g')
      .attr('clip-path', 'url(#commits-clip)')
  }

  _makeFilesGroup() {
    // Files : Y-Axis
    this.filesGroup = this.svg
      .append('g')
      .attr('id', 'files-group')
      .attr('transform', `translate(${this.px0},${this.py0})`)
    this.filesGroup
      .append('defs')
      .append('SVG:clipPath')
      .attr('id', 'files-clip')
      .append('rect')
      .attr('x', -this.px0)
      .attr('y', 0)
      .attr('width', this.px0)
      .attr('height', this.height1)
    this.clippedFilesGroup = this.filesGroup
      .append('g')
      .attr('clip-path', 'url(#files-clip)')
  }

  _makeStatsGroup() {
    // Stats : contents
    this.statsGroup = this.svg
      .append('g')
      .attr('id', 'stats-group')
      .attr('transform', `translate(${this.px0},${this.py0})`)
    this.statsGroup
      .append('defs')
      .append('SVG:clipPath')
      .attr('id', 'stats-clip')
      .append('rect')
      .attr('width', this.width1)
      .attr('height', this.height1)
    this.clippedStatsGroup = this.statsGroup
      .append('g')
      .attr('clip-path', 'url(#stats-clip)')
  }

  _makeSVGCanvas() {
    this.svg = select('#gh-file-grass')
      .append('svg')
      .attr('id', 'gh-file-grass-canvas')
      .attr('width', this.width0)
      .attr('height', this.height0)
    this._makeCommitsGroup()
    this._makeFilesGroup()
    this._makeStatsGroup()
  }

  _addDragToGroups() {
    this.statsGroup
      .append('rect')
      .attr('id', 'pointer-event-handler')
      .attr('width', this.width1)
      .attr('height', this.height1)
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .call(drag()
        .on('drag', () => {
          this.clippedCommitsGroup.selectAll('text')
            .attr('x', d => d.px += event.dx)
            .attr('transform', d => `rotate(-60,${d.px},${d.py})`)
          this.clippedFilesGroup.selectAll('text')
            .attr('y', d => d.py += event.dy)
          this.clippedStatsGroup.selectAll('rect')
            .attr('x', d => d.px += event.dx)
            .attr('y', d => d.py += event.dy)
        })
      )
  }

  _makeFileLabels() {
    this.clippedFilesGroup
      .selectAll('text.gh-file-label')
      .data(this.files)
      .enter()
      .append('text')
      .attr('id', d => d.name)
      .attr('class', 'gh-file-label')
      .attr('x', d => this._px(0, d))
      .attr('y', d => this._py(d.index, d))
      .attr('dy', this.fontSize)
      .text(d => d.name)
  }

  _makeCommitLabels() {
    this.clippedCommitsGroup
      .selectAll('text.gh-commit-label')
      .data(this.commits)
      .enter()
      .append('text')
      .attr('id', d => d.sha_short)
      .attr('class', 'gh-commit-label')
      .attr('x', d => this._px(d.index, d))
      .attr('y', d => this._py(0, d))
      .attr('dx', this.fontSize)
      .attr('transform', d => `rotate(-60,${d.px},${d.py})`)
      .text(d => d.sha_short)
  }

  _makeStatsRect() {
    this.clippedStatsGroup
      .selectAll('rect.gh-stats')
      .data(this.stats)
      .enter()
      .append('rect')
      .attr('class', 'gh-stats')
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

  _indexOfCommit(key) {
    return this.commits.map(d => d.sha_short).indexOf(key) + 1
  }

  _indexOfFile(key) {
    return this.files.map(d => d.name).indexOf(key) + 1
  }

  // Function `_px()` and `_py()` are used to calculate initial position
  // for each data (svg object), and they keep its position in data as [px,py].
  // In event handler, use `px`/`py` to calculate position of svg-object.
  _px(index, data) {
    const d = data || {}
    d.px = index * (this.lc + this.dc) // save current position
    return d.px
  }

  _py(index, data) {
    const d = data || {}
    d.py = index * (this.lc + this.dc) // save current position
    return d.py
  }

  _maxFileLength() {
    const fileLengthList = this.files.map(d => d.name.length)
    return Math.max(...fileLengthList)
  }

  async draw() {
    const data = await json(this.logUri)
    this.files = data.files
    this.commits = data.commits.reverse()
    this.stats = data.stats

    this.px0 = this._maxFileLength() * this.fontSize * 0.7
    this.width0 = this.px0 + this._px(this.commits.length) * 1.2
    this.height0 = this.py0 + this._py(this.files.length)
    this.width1 = this.width0 - this.px0
    this.height1 = this.height0 - this.py0

    this._makeSVGCanvas()
    this._makeFileLabels()
    this._makeCommitLabels()
    this._makeStatsRect()
    this._addDragToGroups()
  }
}
