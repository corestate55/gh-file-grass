import { select, event } from 'd3-selection'
import { drag } from 'd3-drag'
import GHBarChartBuilder from './chart_builder'

export default class GHFileGrassOperator extends GHBarChartBuilder {
  _selectObject(classStr, callback) {
    const selection = this.svg.selectAll(`.${classStr}`)
    callback(selection)
  }

  _selectFile(fileIndex, callback) {
    this._selectObject(this._fileClass(fileIndex), callback)
  }

  _selectCommit(commitIndex, callback) {
    this._selectObject(this._commitClass(commitIndex), callback)
  }

  _selectStat(statIndex, callback) {
    this._selectObject(this._statClass(statIndex), callback)
  }

  _addSelected(selection) {
    selection.classed('selected', true)
  }

  _removeSelected(selection) {
    selection.classed('selected', false)
  }

  _addFilesHandler() {
    const mouseOver = d => this._selectFile(d.index, this._addSelected)
    const mouseOut = d => this._selectFile(d.index, this._removeSelected)
    this._selectClippedGroup('files')
      .selectAll('text')
      .on('mouseover', mouseOver)
      .on('mouseout', mouseOut)
  }

  _addCommitsHandler() {
    const mouseOver = d => {
      this._selectCommit(d.index, this._addSelected)
      this._enableTooltip(d.tooltipHtml(), this._commitLabelId(d.index))
    }
    const mouseOut = d => {
      this._selectCommit(d.index, this._removeSelected)
      this._disableTooltip()
    }
    this._selectClippedGroup('commits')
      .selectAll('text')
      .on('mouseover', mouseOver)
      .on('mouseout', mouseOut)
  }

  _positionMatrixOfId(id) {
    const target = document.getElementById(id)
    // attribute .[xy] are only for rect and text.
    return target
      .getScreenCTM()
      .translate(+target.getAttribute('x'), +target.getAttribute('y'))
  }

  _enableTooltip(htmlStr, id) {
    const matrix = this._positionMatrixOfId(id)
    let yMargin = id.match(/commit.*label/) ? 1 : 2
    select('div#stat-tooltip')
      .style('visibility', 'visible')
      .style('left', `${window.pageXOffset + matrix.e - this.lc * 1.25}px`)
      .style('top', `${window.pageYOffset + matrix.f + this.lc * yMargin}px`)
      .html(htmlStr)
  }

  _disableTooltip() {
    select('div#stat-tooltip').style('visibility', 'hidden')
  }

  _addStatsHandler() {
    const mouseOver = d => {
      this._selectCommit(d.commitIndex, this._addSelected)
      this._selectFile(d.fileIndex, this._addSelected)
      if (d.index) {
        this._selectStat(d.index, this._addSelected)
        this._enableTooltip(d.tooltipHtml(), this._statRectId(d.index))
      }
    }
    const mouseOut = d => {
      this._selectCommit(d.commitIndex, this._removeSelected)
      this._selectFile(d.fileIndex, this._removeSelected)
      if (d.index) {
        this._selectStat(d.index, this._removeSelected)
        this._disableTooltip()
      }
    }
    this._selectClippedGroup('stats')
      .selectAll('rect')
      .on('mouseover', mouseOver)
      .on('mouseout', mouseOut)
  }

  _addStatsArrowHandler() {
    const mouseOver = d => {
      [d.sourceIndex, d.targetIndex].forEach(statIndex => {
        this._selectStat(statIndex, this._addSelected)
      })
    }
    const mouseOut = d => {
      [d.sourceIndex, d.targetIndex].forEach(statIndex => {
        this._selectStat(statIndex, this._removeSelected)
      })
    }
    this._selectClippedGroup('stats')
      .selectAll('path')
      .on('mouseover', mouseOver)
      .on('mouseout', mouseOut)
  }

  _histogramToolTipHtml(d) {
    return `${d.hist} ${d.hist > 1 ? 'commits' : 'commit'}`
  }

  _addCommitHistogramHandler() {
    this._selectClippedGroup('files')
      .selectAll('rect.commit-hist')
      .on('mouseover', d => {
        this._selectFile(d.index, this._addSelected)
        this._enableTooltip(
          this._histogramToolTipHtml(d),
          this._commitHistogramId(d.index)
        )
      })
      .on('mouseout', d => {
        this._selectFile(d.index, this._removeSelected)
        this._disableTooltip()
      })
  }

  _addCommitLinesChartHandler() {
    this._selectClippedGroup('commits')
      .selectAll('rect.commit-chart')
      .on('mouseover', d => {
        this._selectCommit(d.index, this._addSelected)
        this._enableTooltip(
          d.commit.tooltipHtml(),
          this._commitLinesChartId(d.index)
        )
      })
      .on('mouseout', d => {
        this._selectCommit(d.index, this._removeSelected)
        this._disableTooltip()
      })
  }

  _dragAll(dx, dy) {
    this._selectClippedGroup('commits')
      .selectAll('text')
      .attr('x', d => (d.px += dx))
      .attr('transform', d => `rotate(-60,${d.px},${d.py})`)
    this._selectClippedGroup('files')
      .selectAll('text')
      .attr('y', d => (d.py += dy))
    this._selectClippedGroup('stats')
      .selectAll('rect')
      .attr('x', d => (d.px += dx))
      .attr('y', d => (d.py += dy))
    this._selectClippedGroup('stats')
      .selectAll('path')
      .attr('d', d => {
        d.source[0] += dx
        d.source[1] += dy
        d.target[0] += dx
        d.target[1] += dy
        return this.statsLink(d)
      })
    this._selectClippedGroup('files')
      .selectAll('rect')
      .attr('y', d => (d.py += dy))
    this._selectClippedGroup('commits')
      .selectAll('rect')
      .attr('x', d => (d.px += dx))
  }

  _addDragToGroups() {
    const handlerOf = {
      'commits': () => this._dragAll(event.dx, 0),
      'files': () => this._dragAll(0, event.dy),
      'stats': () => this._dragAll(event.dx, event.dy)
    }
    for (const area of Object.keys(handlerOf)) {
      // NOTICE: insert drag-handler rect before 'g' (clipped-group)
      // to prevent to cover (and disable) stat-rect event.
      this._selectGroup(area)
        .insert('rect', 'g')
        .attr('id', `${area}-drag-handler`)
        .attr('class', 'drag-handler')
        .attr('x', d => d.clipPath.x)
        .attr('y', d => d.clipPath.y)
        .attr('width', d => d.clipPath.width)
        .attr('height', d => d.clipPath.height)
        .call(drag().on('drag', handlerOf[area]))
    }
  }
}
