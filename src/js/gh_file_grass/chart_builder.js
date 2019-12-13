import { scaleLinear } from 'd3-scale'
import GHFileGrassBuilder from './builder'

export default class GHBarChartBuilder extends GHFileGrassBuilder {
  _commitHistogramId(index) {
    return `${this._fileClass(index)}-histogram`
  }

  _commitLinesChartId(index) {
    return `${this._commitClass(index)}-chart`
  }

  _commitLinesChartRank(lines) {
    const rank = Math.floor(lines / 10)
    return `rank${rank > 3 ? 4 : rank}` // max:4
  }

  _makeCommitLinesData() {
    return this.commits.all.map(d => ({
      index: d.index,
      sha_short: d.sha_short, // for debug
      logLines: Math.floor(10 * Math.log10(d.stat_total.lines)),
      lines: d.stat_total.lines,
      commit: d // refs to call toolTipHtml()
    }))
  }

  _makeCommitLinesChart() {
    const commitLines = this._makeCommitLinesData()
    const yScale = scaleLinear()
      .domain([0, Math.max(...commitLines.map(d => d.logLines))])
      .range([0, this.py0 * (1 - this.cBaseRatio)])
    const classBy = d =>
      [
        'commit-chart',
        this._commitClass(d.index),
        this._commitLinesChartRank(d.logLines)
      ].join(' ')

    this._selectClippedGroup('commits')
      .selectAll('rect.commit-chart')
      .data(commitLines)
      .enter()
      .append('rect')
      .attr('id', d => this._commitLinesChartId(d.index))
      .attr('class', classBy)
      .attr('x', d => this._px(d.index, d))
      .attr('y', 0)
      .attr('width', this.lc)
      .attr('height', d => yScale(d.logLines))
  }

  _makeCommitHistogramData() {
    return this.files.all.map(d => ({
      index: d.index,
      name: d.name, // for debug
      hist: d.commits.length
    }))
  }

  _makeCommitHistogram() {
    const commitHist = this._makeCommitHistogramData()
    const basePosRatio = 0.7
    const xScale = scaleLinear()
      .domain([0, Math.max(...commitHist.map(d => d.hist))])
      .range([0, (1 - basePosRatio) * this.px0])
    const classBy = d =>
      ['commit-hist', `${this._fileClass(d.index)}`].join(' ')

    this._selectClippedGroup('files')
      .selectAll('rect.commit-hist')
      .data(commitHist)
      .enter()
      .append('rect')
      .attr('id', d => this._commitHistogramId(d.index))
      .attr('class', classBy)
      .attr('x', this.px0 * basePosRatio)
      .attr('y', d => this._py(d.index, d))
      .attr('width', d => xScale(d.hist))
      .attr('height', this.lc)
  }
}
