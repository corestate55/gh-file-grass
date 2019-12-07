import GHLogCommit from './commit'

export default class GHLogCommits {
  constructor(commits) {
    this.commits = commits.map(d => new GHLogCommit(d))
    this.all = this.commits // alias
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
