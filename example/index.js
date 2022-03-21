'use strict'

var fs = require('fs')
const path = require('path')
var postcss = require('postcss')
var pxToViewport = require('../dist')

var css = fs.readFileSync(path.resolve(__dirname, 'main.css'), 'utf8')

var processedCss = postcss(pxToViewport()).process(css, {
  from: path.resolve(__dirname, 'main.css'),
  to: path.resolve(__dirname, 'main-viewport.css')
}).css

fs.writeFile(
  path.resolve(__dirname, 'main-viewport.css'),
  processedCss,
  function (err) {
    if (err) {
      throw err
    }
    console.log('File with viewport units written.')
  }
)
