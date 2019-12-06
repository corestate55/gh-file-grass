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

  _liStr(key, value) {
    return `<li><span class="key">${key}:</span> ${value}</li>`
  }

  _statTotalStr() {
    const st = this.stat_total
    return `<li><span class="files">${st.files} changed
      ${st.files > 1 ? 'files' : 'file'}</span>
      with <span class="ins">${st.insertions} additions</span>
      and <span class="del">${st.deletions} deletions</span>.`
  }

  tooltipHtml() {
    return [
      '<ul>',
      this._liStr('SHA', this.sha),
      this._liStr('Date', this.date),
      this._liStr('Message', this.message),
      this._liStr(
        'Author',
        `${this.author.name} &lt;${this.author.email}&gt;`
      ),
      this._statTotalStr(),
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
