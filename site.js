var fs = require('fs'),
    insertCss = require('insert-css');

insertCss(fs.readFileSync('treeui.css'));

var githubbrowser = require('./')(require('./token'));

var container = document.body.appendChild(document.createElement('div'));

githubbrowser.open()
    .onclick(function(err, res) {
    })
    .appendTo(container);
