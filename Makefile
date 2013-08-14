all: github-file-browser.js site.bundle.js

github-file-browser.js: index.js package.json
	browserify -s githubFileBrowser index.js > github-file-browser.js

site.bundle.js: index.js site.js package.json
	browserify site.js > site.bundle.js
