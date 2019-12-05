import { json } from 'd3-fetch'
import { select } from 'd3-selection'

export default class GHFileGrassBase {
  constructor() {
    this.fontSize = 10
    this.py0 = 100
    this.lc = this.fontSize * 1.2
    this.dc = this.fontSize * 0.4
  }

  _maxFileLength() {
    const fileLengthList = this.files.map(d => d.name.length)
    return Math.max(...fileLengthList)
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

  async _initialize(logUri) {
    const data = await json(logUri)
    this.branch = data.branch
    this.origin = data.origin
    this.files = data.files
    this.commits = data.commits.reverse()
    this.stats = data.stats

    this.px0 = this._maxFileLength() * this.fontSize * 0.7
    this.width0 = this.px0 + this._px(this.commits.length) + 50
    this.height0 = this.py0 + this._py(this.files.length) + 50
    this.width1 = this.width0 - this.px0
    this.height1 = this.height0 - this.py0
  }

  _makeGroups() {
    const groupData = [
      {
        keyword: 'commits',
        px: this.px0,
        py: this.py0,
        clipPath: {
          x: 0,
          y: -this.py0,
          width: this.width1,
          height: this.py0
        }
      },
      {
        keyword: 'files',
        px: 0,
        py: this.py0,
        clipPath: {
          x: 0,
          y: 0,
          width: this.px0,
          height: this.height1
        }
      },
      {
        keyword: 'stats',
        px: this.px0,
        py: this.py0,
        clipPath: {
          x: 0,
          y: 0,
          width: this.width1,
          height: this.height1
        }
      }
    ]
    const groups = this.svg
      .selectAll('g')
      .data(groupData)
      .enter()
      .append('g')
      .attr('id', d => `${d.keyword}-group`)
      .attr('transform', d => `translate(${d.px},${d.py})`)
    groups
      .append('defs')
      .append('SVG:clipPath')
      .attr('id', d => `${d.keyword}-clip`)
      .append('rect')
      .attr('x', d => d.clipPath.x)
      .attr('y', d => d.clipPath.y)
      .attr('width', d => d.clipPath.width)
      .attr('height', d => d.clipPath.height)
    groups.append('g').attr('clip-path', d => `url(#${d.keyword}-clip)`)
  }

  _makeSVGCanvas() {
    this.svg = select('#gh-file-grass')
      .append('svg')
      .attr('id', 'gh-file-grass-canvas')
      .attr('width', this.width0)
      .attr('height', this.height0)
    this._makeGroups()
  }

  _selectGroup(keyword) {
    return this.svg.select(`g#${keyword}-group`)
  }

  _selectClippedGroup(keyword) {
    return this._selectGroup(keyword).select('g')
  }
}
