# gh-file-grass

## Project setup (ruby)
```
bundle install
```
### Generate gh data
```
bundle exec ./bin/log_corrector.rb -r /path/to/repository > ./public/logs.json
```
Options:
* `-n COUNT`: number of logs
* `-p`: pretty-print


## Project setup (JS app)
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
