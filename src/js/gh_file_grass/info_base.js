export default class GHInfoBase {
  _svgActionMark(mark) {
    return (
      '<svg class="action" width="14" height="16" aria-hidden="true">' +
      mark +
      '</svg>'
    )
  }

  _addedMark() {
    const mark =
      '<path class="added-mark" fill-rule="evenodd" d="M13 1H1c-.55 0-1 .45-1 1v12c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V2c0-.55-.45-1-1-1zm0 13H1V2h12v12zM6 9H3V7h3V4h2v3h3v2H8v3H6V9z"></path>'
    return this._svgActionMark(mark)
  }

  _deletedMark() {
    const mark =
      '<path class="deleted-mark" fill-rule="evenodd" d="M13 1H1c-.55 0-1 .45-1 1v12c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V2c0-.55-.45-1-1-1zm0 13H1V2h12v12zm-2-5H3V7h8v2z"></path>'
    return this._svgActionMark(mark)
  }

  _modifiedMark() {
    const mark =
      '<path class="modified-mark" fill-rule="evenodd" d="M13 1H1c-.55 0-1 .45-1 1v12c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V2c0-.55-.45-1-1-1zm0 13H1V2h12v12zM4 8c0-1.66 1.34-3 3-3s3 1.34 3 3-1.34 3-3 3-3-1.34-3-3z"></path>'
    return this._svgActionMark(mark)
  }

  _renamedMark() {
    const mark =
      '<path class="renamed-mark" fill-rule="evenodd" d="M6 9H3V7h3V4l5 4-5 4V9zm8-7v12c0 .55-.45 1-1 1H1c-.55 0-1-.45-1-1V2c0-.55.45-1 1-1h12c.55 0 1 .45 1 1zm-1 0H1v12h12V2z"></path>'
    return this._svgActionMark(mark)
  }

  _liStr(value) {
    return `<li>${value}</li>`
  }

  _insStr(value) {
    return `<span class="ins">${value}</span>`
  }

  _delStr(value) {
    return `<span class="del">${value}</span>`
  }

  _modStr(value) {
    return `<span class="mod">${value}</span>`
  }

  _codeStr(value) {
    return `<code>${value}</code>`
  }

  _filesStr(value) {
    return `<span class="files">${value}</span>`
  }
}
