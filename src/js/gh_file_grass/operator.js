import { select, event } from 'd3-selection'
import { drag } from 'd3-drag'
import GHFileGrassBuilder from './builder'

export default class GHFileGrassOperator extends GHFileGrassBuilder {
  _selectObject(keyword, index, callback) {
    const selection = this.svg.selectAll(`.${keyword}-${index}`)
    callback(selection)
  }

  _selectFile(fileIndex, callback) {
    this._selectObject('file', fileIndex, callback)
  }

  _selectCommit(commitIndex, callback) {
    this._selectObject('commit', commitIndex, callback)
  }

  _selectStat(statIndex, callback) {
    this._selectObject('stat', statIndex, callback)
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
      this._enableTooltip(d.tooltipHtml())
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

  _enableTooltip(htmlStr) {
    select('div#stat-tooltip')
      .style('visibility', 'visible')
      .style('top', `${event.pageY - this.lc * 1.5}px`)
      .style('left', `${event.pageX + this.lc * 2}px`)
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
        this._enableTooltip(d.tooltipHtml())
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

  _historgramToolTipHtml(d) {
    return `${d.hist} ${d.hist > 1 ? 'commits' : 'commit'}`
  }

  _addCommitHistogramHandler() {
    this._selectClippedGroup('files')
      .selectAll('rect.commit-hist')
      .on('mouseover', d => {
        this._selectFile(d.index, this._addSelected)
        this._enableTooltip(this._historgramToolTipHtml(d))
      })
      .on('mouseout', d => {
        this._selectFile(d.index, this._removeSelected)
        this._disableTooltip()
      })
  }

  _addDragToGroups() {
    const dragged = () => {
      this._selectClippedGroup('commits')
        .selectAll('text')
        .attr('x', d => (d.px += event.dx))
        .attr('transform', d => `rotate(-60,${d.px},${d.py})`)
      this._selectClippedGroup('files')
        .selectAll('text')
        .attr('y', d => (d.py += event.dy))
      this._selectClippedGroup('stats')
        .selectAll('rect')
        .attr('x', d => (d.px += event.dx))
        .attr('y', d => (d.py += event.dy))
      this._selectClippedGroup('stats')
        .selectAll('path')
        .attr('d', d => {
          d.source[0] += event.dx
          d.source[1] += event.dy
          d.target[0] += event.dx
          d.target[1] += event.dy
          return this.statsLink(d)
        })
      this._selectClippedGroup('files')
        .selectAll('rect')
        .attr('y', d => (d.py += event.dy))
    }

    // NOTICE: insert before 'g' (group of clipped-stats)
    // to enable stats-rect event handling.
    this._selectGroup('stats')
      .insert('rect', 'g')
      .attr('id', 'pointer-event-handler')
      .attr('width', this.width1)
      .attr('height', this.height1)
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .call(drag().on('drag', dragged))
  }
}
