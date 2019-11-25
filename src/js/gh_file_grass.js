import { select } from 'd3-selection'
import { json } from 'd3-fetch'

export default class GHFileGrass {
  constructor(logUri) {
    this.fontSize = 10
    this.py0 = 100
    this.lc = this.fontSize * 1.2
    this.dc = this.fontSize * 0.2
    this.logUri = logUri
  }

  _makeSVGCanvas(width, height) {
    select('#gh-file-grass')
      .append('svg')
      .attr('id', 'gh-file-grass-canvas')
      .attr('width', width)
      .attr('height', height)
  }

  _makeFileLabels() {
    select('svg#gh-file-grass-canvas')
      .selectAll('text.gh-file-label')
      .data(this.files)
      .enter()
      .append('text')
      .attr('id', d => d.name)
      .attr('class', 'gh-file-label')
      .attr('x', this._px(0))
      .attr('y', d => this._py(d.index))
      .text(d => d.name)
  }

  _makeCommitLabels() {
    select('svg#gh-file-grass-canvas')
      .selectAll('text.gh-commit-label')
      .data(this.commits)
      .enter()
      .append('text')
      .attr('id', d => d.sha_short)
      .attr('class', 'gh-commit-label')
      .attr('x', d => this._px(d.index))
      .attr('y', this._py(0))
      .attr('transform', d => `rotate(-60,${this._px(d.index)},${this._py(0)})`)
      .text(d => d.sha_short)
  }

  _px(i) {
    return this.px0 + i * (this.lc + this.dc)
  }

  _py(i) {
    return this.py0 + i * (this.lc + this.dc)
  }

  async draw() {
    const data = await json(this.logUri)
    this.files = data.files
    this.commits = data.commits
    this.stats = data.stats

    console.log('files : ', this.files)
    console.log('commits : ', this.commits)

    this.px0 = Math.max(...this.files.map(d => d.name.length)) * this.fontSize * 0.7
    this.width = this._px(this.commits.length) * 1.2
    this.height = this._py(this.files.length)

    console.log(`width: ${this.width}, height:${this.height}`)

    this._makeSVGCanvas(this.width, this.height)
    this._makeFileLabels()
    this._makeCommitLabels()
  }
}