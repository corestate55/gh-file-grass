import { linkHorizontal } from 'd3-shape'
import { scaleLinear } from 'd3-scale'
import GHFileGrassBase from './base'

export default class GHFileGrassBuilder extends GHFileGrassBase {
  _makeFileLabels() {
    this._selectClippedGroup('files')
      .selectAll('text.file-label')
      .data(this.files.files)
      .enter()
      .append('a')
      .attr('xlink:href', d => `${this.origin}/blob/${this.branch}/${d.name}`)
      .attr('target', '_blank')
      .append('text')
      .attr('id', d => `file-${d.index}-label`)
      .attr('class', d => `file-label file-${d.index}`)
      .attr('x', d => this._px(0, d))
      .attr('y', d => this._py(d.index, d))
      .attr('dy', this.fontSize)
      .text(d => d.name)
  }

  _makeCommitLabels() {
    this._selectClippedGroup('commits')
      .selectAll('text.commit-label')
      .data(this.commits.commits)
      .enter()
      .append('a')
      .attr('xlink:href', d => `${this.origin}/commit/${d.sha}`)
      .attr('target', '_blank')
      .append('text')
      .attr('id', d => `commit-${d.index}-label`)
      .attr('class', d => `commit-label commit-${d.index}`)
      .attr('x', d => this._px(d.index, d))
      .attr('y', d => this._py(0, d))
      .attr('dx', this.fontSize)
      .attr('transform', d => `rotate(-60,${d.px},${d.py})`)
      .text(d => d.sha_short)
  }

  _lifeStartIndex(file) {
    const stat1 = this.stats.findByFileAndType(file.name, 'new')
    if (stat1) {
      // console.log(`- start-1: `, stat1)
      return this.commits.indexOf(stat1.sha_short)
    }
    const stat2 = this.stats.findByFileAndRenamed(file.name)
    if (stat2) {
      // console.log('- start-2: ', stat2)
      return this.commits.indexOf(stat2.sha_short)
    }
    return 1
  }

  _lifeEndIndex(file) {
    const stat1 = this.stats.findByFileAndType(file.name, 'deleted')
    if (stat1) {
      // console.log('- end-1: ', stat1)
      return this.commits.indexOf(stat1.sha_short)
    }
    const stat2 = this.stats
      .findAllByPath(file.name)
      .find(d => this.stats.isSamePathDstStat(d))
    if (stat2) {
      // console.log('- end-2: ', stat2)
      return this.commits.indexOf(stat2.sha_short)
    }
    return this.commits.length
  }

  _makeFileLifeStatsRect() {
    for (const file of this.files.files) {
      // console.log(`file: ${file.name}`)
      const startIndex = this._lifeStartIndex(file)
      const endIndex = this._lifeEndIndex(file)
      // console.log(`- start:${startIndex}, end:${endIndex}`)
      const range = Array.from(
        { length: endIndex - startIndex + 1 },
        (_, i) => ({
          fileIndex: file.index,
          commitIndex: i + startIndex
        })
      )
      const classBy = d =>
        ['file-life', `file-${d.fileIndex}`, `commit-${d.commitIndex}`].join(
          ' '
        )

      this._selectClippedGroup('stats')
        .selectAll(`rect.file-${file.index}`)
        .data(range)
        .enter()
        .append('rect')
        .attr('class', classBy)
        .attr('x', d => this._px(d.commitIndex, d))
        .attr('y', d => this._py(d.fileIndex, d))
        .attr('width', this.lc)
        .attr('height', this.lc)
    }
  }

  _makeStatsRect() {
    const classBy = d => {
      d.fileIndex = this.files.indexOf(d.path)
      d.commitIndex = this.commits.indexOf(d.sha_short)
      return [
        'stats',
        `stat-${d.index}`,
        `file-${d.fileIndex}`,
        `commit-${d.commitIndex}`,
        `mod-${d.modifiedClass}`
      ].join(' ')
    }

    // class attr (classBy) must be before rect[XY] to set files/commit index
    this._selectClippedGroup('stats')
      .selectAll('rect.stats')
      .data(this.stats.stats)
      .enter()
      .append('rect')
      .attr('class', classBy)
      .attr('x', d => this._rectX(d))
      .attr('y', d => this._rectY(d))
      .attr('width', this.lc)
      .attr('height', this.lc)
  }

  _rectX(stat) {
    return this._px(stat.commitIndex, stat)
  }

  _rectY(stat) {
    return this._py(stat.fileIndex, stat)
  }

  _makeStatsArrow() {
    const arrows = []
    const dxy = this.lc / 2
    for (const stat of this.stats.stats) {
      const dstStats = this.stats.findAllDstOf(stat)
      if (dstStats.length < 1) {
        continue
      }
      dstStats.forEach(dstStat => {
        arrows.push({
          sourceIndex: stat.index,
          targetIndex: dstStat.index,
          source: [stat.px + dxy, stat.py + dxy],
          target: [dstStat.px + dxy, dstStat.py + dxy]
        })
      })
    }
    const classBy = d =>
      ['stat-arrow', `stat-${d.sourceIndex}`, `stat-${d.targetIndex}`].join(' ')

    this.statsLink = linkHorizontal() // link generator
    this._selectClippedGroup('stats')
      .selectAll('path.stat-arrow')
      .data(arrows)
      .enter()
      .insert('path', 'rect.stats') // paths be under stats-rect
      .attr('class', classBy)
      .attr('d', d => this.statsLink(d))
  }

  _makeCommitHistogram() {
    const commitHist = this.files.files.map(d => ({
      index: d.index,
      name: d.name, // for debug
      hist: d.commits.length
    }))

    const basePosRatio = 0.7
    const xScale = scaleLinear()
      .domain([0, Math.max(...commitHist.map(d => d.hist))])
      .range([0, (1 - basePosRatio) * this.px0])

    this._selectClippedGroup('files')
      .selectAll('rect.commit-hist')
      .data(commitHist)
      .enter()
      .append('rect')
      .attr('class', d => `file-${d.index} commit-hist`)
      .attr('x', this.px0 * basePosRatio)
      .attr('y', d => this._py(d.index, d))
      .attr('width', d => xScale(d.hist))
      .attr('height', this.lc)
  }
}
