import GHFileGrassOperator from './gh_file_grass/operator'

export default class GHFileGrass extends GHFileGrassOperator {
  async draw(logUrl) {
    await this._initialize(logUrl)
    this._makeSVGCanvas()

    this._makeCommitHistogram()
    this._makeCommitLinesChart()

    this._makeFileLabels()
    this._makeCommitLabels()

    this._makeFileLifeStatRects()
    this._makeStatRects()
    this._makeStatArrows() // must be after making stats-rect

    this._addFilesHandler()
    this._addCommitsHandler()
    this._addStatsHandler()
    this._addStatsArrowHandler()
    this._addCommitHistogramHandler()
    this._addCommitLinesChartHandler()

    this._addDragToCommitsGroup()
    this._addDragToFilesGroup()
    this._addDragToStatsGroup()
  }
}
