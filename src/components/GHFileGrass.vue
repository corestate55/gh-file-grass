<template>
  <div id="gh-file-grass"></div>
</template>

<script>
import GHFileGrass from '../js/gh_file_grass'
import '../css/file_grass.scss'

export default {
  data: () => ({
    fileGrass: null
  }),
  mounted() {
    this.fileGrass = new GHFileGrass()
    this.fileGrass.draw('./logs.json')
  }
}
</script>

<style scoped>
</style>
