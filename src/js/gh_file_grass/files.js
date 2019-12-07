export default class GHLogFiles {
  constructor(files) {
    this.files = files
    this.all = this.files // alias
    this.length = this.files.length
  }

  maxFileNameLength() {
    const fileLengthList = this.files.map(d => d.name.length)
    return Math.max(...fileLengthList)
  }

  indexOf(fileName) {
    return this.files.map(d => d.name).indexOf(fileName) + 1
  }
}
