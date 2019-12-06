class GHLogStat {
  constructor(stat) {
    this.path = stat.path
    this.mode = stat.mode
    this.type = stat.type
    this.src = stat.src
    this.dst = stat.dst
    this.stat_path = stat.stat_path
    this.insertions = stat.insertions
    this.deletions = stat.deletions
    this.lines = stat.lines
    this.sha_short = stat.sha_short
    this.index = stat.index
  }

  isRenamed() {
    return this.stat_path.src !== this.stat_path.dst
  }

  isModified() {
    return this.lines > 0
  }

  _svgActionMark(mark) {
    return (
      '<svg class="action" width="14" height="16" aria-hidden="true">' +
      mark +
      '</svg>'
    )
  }

  _addedMark() {
    const mark =
      '<path class="added-mark" fill-rule="evenodd" d="M13 1H1c-.55 0-1 .45-1 1v12c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V2c0-.55-.45-1-1-1zm0 13H1V2h12v12zM6 9H3V7h3V4h2v3h3v2H8v3H6V9z"></path>'
    return this._svgActionMark(mark)
  }

  _deletedMark() {
    const mark =
      '<path class="deleted-mark" fill-rule="evenodd" d="M13 1H1c-.55 0-1 .45-1 1v12c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V2c0-.55-.45-1-1-1zm0 13H1V2h12v12zm-2-5H3V7h8v2z"></path>'
    return this._svgActionMark(mark)
  }

  _modifiedMark() {
    const mark =
      '<path class="modified-mark" fill-rule="evenodd" d="M13 1H1c-.55 0-1 .45-1 1v12c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V2c0-.55-.45-1-1-1zm0 13H1V2h12v12zM4 8c0-1.66 1.34-3 3-3s3 1.34 3 3-1.34 3-3 3-3-1.34-3-3z"></path>'
    return this._svgActionMark(mark)
  }

  _renamedMark() {
    const mark =
      '<path class="renamed-mark" fill-rule="evenodd" d="M6 9H3V7h3V4l5 4-5 4V9zm8-7v12c0 .55-.45 1-1 1H1c-.55 0-1-.45-1-1V2c0-.55.45-1 1-1h12c.55 0 1 .45 1 1zm-1 0H1v12h12V2z"></path>'
    return this._svgActionMark(mark)
  }

  _statBarStr(ins, del) {
    const total = ins + del
    const box = '■'
    const barStr = (classStr, count) => {
      return `<span class="${classStr}">${box.repeat(count)}</span>`
    }
    const cal = (val, total) => {
      return total <= 5 ? val : Math.floor(val / (total / 5))
    }
    const insRepeat = cal(ins, total)
    const delRepeat = cal(del, total)
    const keepRepeat = 5 - insRepeat - delRepeat
    const barData = { ins: insRepeat, del: delRepeat, keep: keepRepeat }
    return Object.keys(barData)
      .map(key => barStr(key, barData[key]))
      .join('')
  }

  _liStr(value) {
    return `<li>${value}</li>`
  }

  _insStr(value) {
    return `<span class="ins">${value}</span>`
  }

  _delStr(value) {
    return `<span class="del">${value}</span>`
  }

  _modStr(value) {
    return `<span class="mod">${value}</span>`
  }

  _fileActionStr() {
    const space = '&nbsp;&nbsp;'
    const markedStr = (mark, str) => [mark, str].join(space)

    if (this.type === 'new') {
      return markedStr(this._addedMark(), this._insStr(this.path))
    } else if (this.type === 'deleted') {
      return markedStr(this._deletedMark(), this._delStr(this.path))
    } else if (this.isRenamed()) {
      return markedStr(this._renamedMark(), this.stat_path.path)
    } else {
      // modified
      const str = this.isRenamed()
        ? this.stat_path.path
        : this._modStr(this.path)
      return markedStr(this._modifiedMark(), str)
    }
  }

  _diffIndexStr() {
    if (!this.isModified()) {
      return ''
    }
    return this._liStr(`${this.src}..${this.dst} ${this.mode}`)
  }

  _statIndicatorStr() {
    const ins = '+' + this.insertions
    const del = '-' + this.deletions
    const bar = this._statBarStr(this.insertions, this.deletions)
    return `${this._insStr(ins)}, ${this._delStr(del)} ${bar} (${this.lines})`
  }

  tooltipHtml() {
    return [
      '<ul>',
      this._liStr(this.sha_short),
      this._liStr(this._fileActionStr()),
      this._liStr(this._statIndicatorStr()),
      this._diffIndexStr(), // empty for no-diff stat
      '</ul>'
    ].join('')
  }
}

export default class GHLogStats {
  constructor(stats) {
    this.stats = stats.map(d => new GHLogStat(d))
    this.length = this.stats.length
    // this._classifyByModifiedLines()
    this._classifyByLog10ModifiedLines()
  }

  isSamePathDstStat(stat) {
    const dstStats = this.findAllDstOf(stat)
    if (dstStats.length < 1) {
      return false
    }
    const results = dstStats.map(dstStat => {
      return dstStat.isRenamed() || stat.path !== dstStat.path
    })
    // if exists false in results: stat has NOT-RENAMED destination in dstStats.
    return results.reduce((acc, curr) => acc && curr, true)
  }

  findAllByPath(file) {
    return this.stats.filter(d => d.path === file)
  }

  findByFileAndType(file, type) {
    return this.stats.find(d => d.path === file && d.type === type)
  }

  findByFileAndRenamed(file) {
    return this.stats.find(d => d.path === file && d.isRenamed())
  }

  findAllDstOf(stat) {
    if (stat.dst === '0000000' || stat.dst === '') {
      return []
    }
    return this.stats.filter(d => d.src === stat.dst)
  }

  sortByIndex() {
    this.stats.sort((a, b) => a.index - b.index)
  }

  sortByLines() {
    this.stats.sort((a, b) => a.lines - b.lines)
  }

  _statsDistByLog10Line() {
    const statsDist = {}
    this.stats.forEach(d => {
      const countKey = d.lines > 0 ? Math.floor(10 * Math.log10(d.lines)) : 0
      if (!statsDist[countKey]) {
        statsDist[countKey] = []
      }
      statsDist[countKey].push(d)
    })
    Object.keys(statsDist).forEach(ck =>
      console.log(`log(lines)=${ck} : ${'*'.repeat(statsDist[ck].length)}`)
    )
    return statsDist
  }

  _classifyByLog10ModifiedLines() {
    this.sortByLines()
    const statsDist = this._statsDistByLog10Line()
    const stepDiv = Object.keys(statsDist).length / 4
    let modClass = 1
    let step = stepDiv
    Object.keys(statsDist)
      .sort((a, b) => a - b)
      .forEach((countKey, i) => {
        if (i > step) {
          modClass += 1
          step = stepDiv * modClass
        }
        statsDist[countKey].forEach(d => {
          d.modifiedClass = modClass
        })
      })
    this.sortByIndex()
  }

  _classifyByModifiedLines() {
    this.sortByLines()
    const stepDiv = this.stats.length / 4
    let modClass = 1
    let step = stepDiv
    this.stats.forEach((d, i) => {
      if (i > step) {
        modClass += 1
        step = stepDiv * modClass
      }
      d.modifiedClass = modClass
    })
    this.sortByIndex()
  }
}
