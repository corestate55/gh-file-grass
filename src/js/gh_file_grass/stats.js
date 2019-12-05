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
