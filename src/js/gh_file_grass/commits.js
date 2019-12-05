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
