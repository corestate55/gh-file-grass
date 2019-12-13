import GHInfoBase from './info_base'

export default class GHLogStat extends GHInfoBase {
  constructor(stat) {
    super()
    this.path = stat.path
    this.mode = stat.mode
    this.type = stat.type
    this.src = stat.src
    this.dst = stat.dst
    this.bin = stat.bin
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

  _statBarStr(ins, del) {
    const total = ins + del
    const barStr = (classStr, count) => {
      return `<span class="stat-box ${classStr}"></span>`.repeat(count)
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
    return this._liStr(this._codeStr(`${this.src}..${this.dst} ${this.mode}`))
  }

  _statIndicatorStr() {
    const bar = this._statBarStr(this.insertions, this.deletions)
    if (this.bin) {
      return `BIN ${bar}`
    }
    const ins = '+' + this.insertions
    const del = '-' + this.deletions
    return `${this._insStr(ins)}, ${this._delStr(del)} ${bar} (${this.lines})`
  }

  tooltipHtml() {
    return [
      '<ul>',
      this._liStr(this._codeStr(this.sha_short)),
      this._liStr(this._fileActionStr()),
      this._liStr(this._statIndicatorStr()),
      this._diffIndexStr(), // empty for no-diff stat
      '</ul>'
    ].join('')
  }
}
