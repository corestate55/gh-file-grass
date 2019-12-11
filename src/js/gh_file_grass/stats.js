import GHLogStat from './stat'

export default class GHLogStats {
  constructor(stats) {
    this.stats = stats.map(d => new GHLogStat(d))
    this.all = this.stats // alias
    this.length = this.stats.length
    // this._classifyByModifiedLines()
    this._classifyByLog10ModifiedLines()
  }

  findByFileAndType(file, type) {
    return this.stats.find(d => d.path === file && d.type === type)
  }

  findByFileAndRenamed(file) {
    return this.stats.find(d => d.path === file && d.isRenamed())
  }

  findByDstAndRenamed(file) {
    return this.stats.find(d => d.stat_path.dst === file && d.isRenamed())
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
