import { select, event } from 'd3-selection'
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
    this._selectClippedGroup('files').selectAll('text')
      .on('mouseover', mouseOver)
      .on('mouseout', mouseOut)
  }

  _commitTooltipHtml(commit) {
    return [
      '<ul>',
      this._liStr('SHA', commit.sha),
      this._liStr('Date', commit.date),
      this._liStr('Message', commit.message),
      this._liStr('Author', `${commit.author.name} &lt;${commit.author.email}&gt;`),
      '</ul>'
    ].join('')
  }

  _addCommitsHandler() {
    const mouseOver = d => {
      this._selectCommit(d.index, this._addSelected)
      this._enableTooltip(this._commitTooltipHtml(d))
    }
    const mouseOut = d => {
      this._selectCommit(d.index, this._removeSelected)
      this._disableTooltip()
    }
    this._selectClippedGroup('commits').selectAll('text')
      .on('mouseover', mouseOver)
      .on('mouseout', mouseOut)
  }

  _statModifiedLinesBar(ins, del) {
    const total = ins + del
    const box = '■'
    const barStr = (classStr, count) => {
      return `<span class="${classStr}">${box.repeat(count)}</span>`
    }
    const cal = (val, total) => {
      return total <= 5 ? val : Math.floor(val / (total / 5))
    }
    const insRepeat = cal(ins, total)
    const delRepeat = cal(del, total)
    const keepRepeat = 5 - insRepeat - delRepeat
    const barData = {ins: insRepeat, del: delRepeat, keep: keepRepeat}
    return Object.keys(barData).map(key => barStr(key, barData[key])).join('')
  }

  _insStr(value) {
    return `<span class="ins">${value}</span>`
  }

  _delStr(value) {
    return `<span class="del">${value}</span>`
  }

  _liStr(key, value) {
    return `<li><span class="key">${key}:</span> ${value}</li>`
  }

  _typeStr(value) {
    if (value === 'new') {
      return this._insStr(value)
    } else if (value === 'deleted') {
      return this._delStr(value)
    } else {
      return value
    }
  }
  _statTooltipHtml(stat) {
    const sp = stat.stat_path // alias
    const movedPath = sp.src !== sp.dst ? this._liStr('Renamed', sp.path) : ''
    const modifiedIndicator = `
      <li>+${this._insStr(stat.insertions)},-${this._delStr(stat.deletions)}
          : ${this._statModifiedLinesBar(stat.insertions, stat.deletions)}
      </li>`

    return [
      '<ul>',
      this._liStr('Commit', stat.sha_short),
      this._liStr('File', stat.path),
      this._liStr('Type', this._typeStr(stat.type)),
      this._liStr('Index', `${stat.src}..${stat.dst} ${stat.mode}`),
      movedPath,
      modifiedIndicator,
      '</ul>'
    ].join('')
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
        this._enableTooltip(this._statTooltipHtml(d))
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
    this._selectClippedGroup('stats').selectAll('rect')
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
    this._selectClippedGroup('stats').selectAll('path')
      .on('mouseover', mouseOver)
      .on('mouseout', mouseOut)
  }

  _addCommitHistogramHandler() {
    this._selectClippedGroup('files')
      .selectAll('rect.commit-hist')
      .on('mouseover', d => {
        this._selectFile(d.index, this._addSelected)
        const htmlStr = `${d.hist} ${d.hist > 1 ? 'commits' : 'commit'}`
        this._enableTooltip(htmlStr)
      })
      .on('mouseout', d => {
        this._selectFile(d.index, this._removeSelected)
        this._disableTooltip()
      })
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
