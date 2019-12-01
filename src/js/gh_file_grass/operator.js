import { event } from 'd3-selection'
import { drag } from 'd3-drag'
import GHFileGrassBuilder from "./builder"

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

  _addSelected(selection) {
    selection.classed('selected', true)
  }

  _removeSelected(selection) {
    selection.classed('selected', false)
  }

  _addFilesHandler() {
    const mouseOver = d => this._selectFile(d.index, this._addSelected)
    const mouseOut = d => this._selectFile(d.index, this._removeSelected)
    this._selectClippedGroup('files').selectAll('text')
      .on('mouseover', mouseOver)
      .on('mouseout', mouseOut)
    this._selectClippedGroup('files').selectAll('rect')
      .on('mouseover', mouseOver)
      .on('mouseout', mouseOut)
  }

  _addCommitsHandler() {
    const mouseOver = d => this._selectCommit(d.index, this._addSelected)
    const mouseOut = d => this._selectCommit(d.index, this._removeSelected)
    this._selectClippedGroup('commits').selectAll('text')
      .on('mouseover', mouseOver)
      .on('mouseout', mouseOut)
  }

  _addDragToGroups() {
    const dragged = () => {
      this._selectClippedGroup('commits').selectAll('text')
        .attr('x', d => d.px += event.dx)
        .attr('transform', d => `rotate(-60,${d.px},${d.py})`)
      this._selectClippedGroup('files').selectAll('text')
        .attr('y', d => d.py += event.dy)
      this._selectClippedGroup('stats').selectAll('rect')
        .attr('x', d => d.px += event.dx)
        .attr('y', d => d.py += event.dy)
      this._selectClippedGroup('stats').selectAll('path')
        .attr('d', d => {
          d.source[0] += event.dx; d.source[1] += event.dy
          d.target[0] += event.dx; d.target[1] += event.dy
          return this.statsLink(d)
      })
      this._selectClippedGroup('files').selectAll('rect')
        .attr('y', d => d.py += event.dy)
    }

    this._selectGroup('stats')
      .append('rect')
      .attr('id', 'pointer-event-handler')
      .attr('width', this.width1)
      .attr('height', this.height1)
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .call(drag().on('drag', dragged))
  }
}
