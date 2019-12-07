import GHInfoBase from './info_base'

export default class GHLogCommit extends GHInfoBase {
  constructor(commit) {
    super()
    this.sha = commit.sha
    this.sha_short = commit.sha_short
    this.author = commit.author
    this.date = commit.date
    this.message = commit.message
    this.index = commit.index
    this.stat_total = commit.stat_total
  }

  _statTotalStr() {
    const st = this.stat_total // shortening alias
    const file = `${st.files} changed ${st.files > 1 ? 'files' : 'file'}`
    const add = `${st.insertions} additions`
    const del = `${st.deletions} deletions`

    return `${this._filesStr(file)} with ${this._insStr(
      add
    )} and ${this._delStr(del)}.`
  }

  tooltipHtml() {
    return [
      '<ul>',
      this._liStr(this._codeStr(this.sha)),
      this._liStr(`${this.author.name} &lt;${this.author.email}&gt;`),
      this._liStr(this.date),
      this._liStr(this.message),
      this._liStr(this._statTotalStr()),
      '</ul>'
    ].join('')
  }
}
