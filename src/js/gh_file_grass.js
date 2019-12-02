import GHFileGrassOperator from "./gh_file_grass/operator"

export default class GHFileGrass extends GHFileGrassOperator {
  async draw(logUrl) {
    await this._initialize(logUrl)
    this._makeSVGCanvas()

    this._makeCommitHistogram()

    this._makeFileLabels()
    this._makeCommitLabels()

    this._makeFileLifeStatsRect()
    this._makeStatsRect()
    this._makeStatsArrow()

    this._addFilesHandler()
    this._addCommitsHandler()
    this._addStatsHandler()
    this._addStatsArrowHandler()
    this._addDragToGroups()
  }
}
