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

  _makeGroups() {
    const groupData = [
      {
        keyword: 'commits', px: this.px0, py: this.py0,
        clipPath: {
          x: 0, y: -this.py0, width: this.width1, height: this.py0
        }
      },
      {
        keyword: 'files', px: this.px0, py: this.py0,
        clipPath: {
          x: -this.px0, y: 0, width: this.px0, height: this.height1
        }
      },
      {
        keyword: 'stats', px: this.px0, py: this.py0,
        clipPath: {
          x: 0, y: 0, width: this.width1, height: this.height1
        }
      }
    ]
    const groups = this.svg.selectAll('g')
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
    groups
      .append('g')
      .attr('clip-path', d => `url(#${d.keyword}-clip)`)
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

  _addDragToGroups() {
    const dragged = () => {
      this._selectClippedGroup('commits').selectAll('text')
        .attr('x', d => d.px += event.dx)
        .attr('transform', d => `rotate(-60,${d.px},${d.py})`)
      this._selectClippedGroup('files').selectAll('text')
        .attr('y', d => d.py += event.dy)
      this._selectClippedGroup('stats').selectAll('rect')
        .attr('x', d => d.px += event.dx)
        .attr('y', d => d.py += event.dy)
      this._selectClippedGroup('stats').selectAll('line')
        .attr('x1', d => d.x1 += event.dx)
        .attr('y1', d => d.y1 += event.dy)
        .attr('x2', d => d.x2 += event.dx)
        .attr('y2', d => d.y2 += event.dy)
    }

    this._selectGroup('stats')
      .append('rect')
      .attr('id', 'pointer-event-handler')
      .attr('width', this.width1)
      .attr('height', this.height1)
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .call(drag().on('drag', dragged))
  }

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
      return this._indexOfCommit(stat1.sha_short)
    }
    const stat2 = this._findStatByFileAndRenamed(file.name)
    if (stat2) {
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
      return this._indexOfCommit(stat1.sha_short)
    }
    const stat2 = this._findStatsByFile(file.name).find(d => this._isDstStatRenamed(d))
    if (stat2) {
      return this._indexOfCommit(stat2.sha_short)
    }
    return this.commits.length
  }

  _makeFileLifeStatsRect() {
    for (const file of this.files) {
      const startIndex = this._lifeStartIndex(file)
      const endIndex = this._lifeEndIndex(file)
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
        x1: stat.px + dxy, y1: stat.py + dxy,
        x2: dstStat.px + dxy, y2: dstStat.py + dxy
      })
    }
    this._selectClippedGroup('stats')
      .selectAll('line')
      .data(arrows)
      .enter()
      .append('line')
      .attr('x1', d => d.x1)
      .attr('y1', d => d.y1)
      .attr('x2', d => d.x2)
      .attr('y2', d => d.y2)
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
    this._makeFileLifeStatsRect()
    this._makeStatsRect()
    this._makeStatsArrow()
    this._addDragToGroups()
  }
}
