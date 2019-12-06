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

  isRenamedStat() {
    return this.stat_path.src !== this.stat_path.dst
  }

  _statModifiedLinesBar(ins, del) {
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

  _insStr(value) {
    return `<span class="ins">${value}</span>`
  }

  _delStr(value) {
    return `<span class="del">${value}</span>`
  }

  _liStr(key, value) {
    return `<li><span class="key">${key}:</span> ${value}</li>`
  }

  _typeStr(value) {
    if (value === 'new') {
      return this._insStr(value)
    } else if (value === 'deleted') {
      return this._delStr(value)
    } else {
      return value
    }
  }

  tooltipHtml() {
    const sp = this.stat_path // alias
    const movedPath = this.isRenamedStat() ? this._liStr('Renamed', sp.path) : ''
    const modifiedIndicator = `
      <li>+${this._insStr(this.insertions)},-${this._delStr(this.deletions)}
          : ${this._statModifiedLinesBar(this.insertions, this.deletions)}
      </li>`

    return [
      '<ul>',
      this._liStr('Commit', this.sha_short),
      this._liStr('File', this.path),
      this._liStr('Type', this._typeStr(this.type)),
      this._liStr('Index', `${this.src}..${this.dst} ${this.mode}`),
      movedPath,
      modifiedIndicator,
      '</ul>'
    ].join('')
  }
}

export default class GHLogStats {
  constructor(stats) {
    this.stats = stats.map(d => new GHLogStat(d))
    this.length = this.stats.length
    this._classifyByModifiedLines()
  }

  findByFile(file) {
    return this.stats.filter(d => d.path === file)
  }

  findByFileAndType(file, type) {
    return this.stats.find(d => d.path === file && d.type === type)
  }

  findByFileAndRenamed(file) {
    return this.stats.find(d => d.path === file && d.isRenamedStat())
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

  _classifyByModifiedLines() {
    const stepDiv = this.stats.length / 4
    let count = 1
    let step = stepDiv
    this.sortByLines()
    this.stats.forEach((d, i) => {
      if (i > step) {
        count++
        step = stepDiv * count
      }
      d.modifiedClass = count
    })
    this.sortByIndex()
  }
}
