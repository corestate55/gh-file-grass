class GHLogCommit {
  constructor(commit) {
    this.sha = commit.sha
    this.sha_short = commit.sha_short
    this.author = commit.author
    this.date = commit.date
    this.message = commit.message
    this.index = commit.index
    this.stat_total = commit.stat_total
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

  _filesStr(value) {
    return `<span class="files">${value}</span>`
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
      this._liStr(this.sha),
      this._liStr(`${this.author.name} &lt;${this.author.email}&gt;`),
      this._liStr(this.date),
      this._liStr(this.message),
      this._liStr(this._statTotalStr()),
      '</ul>'
    ].join('')
  }
}

export default class GHLogCommits {
  constructor(commits) {
    this.commits = commits.map(d => new GHLogCommit(d))
    this.length = commits.length
    this.sort()
  }

  sort() {
    this.commits.sort((a, b) => a.index - b.index)
  }

  indexOf(shaShort) {
    return this.commits.map(d => d.sha_short).indexOf(shaShort) + 1
  }
}
