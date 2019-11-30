import { event } from 'd3-selection'
import { drag } from 'd3-drag'
import GHFileGrassBuilder from "./builder"

export default class GHFileGrassOperator extends GHFileGrassBuilder {
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
      this._selectClippedGroup('stats').selectAll('line')
        .attr('x1', d => d.x1 += event.dx)
        .attr('y1', d => d.y1 += event.dy)
        .attr('x2', d => d.x2 += event.dx)
        .attr('y2', d => d.y2 += event.dy)
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
