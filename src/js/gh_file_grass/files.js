class GHLogFile {
  constructor(file) {
    this.name = file.name
    this.index = file.index
    this.commits = file.commits
  }
}

export default class GHLogFiles {
  constructor(files) {
    this.files = files.map(d => new GHLogFile(d))
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
