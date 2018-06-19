NODE_BIN=./node_modules/.bin

all: github-file-browser.js site.bundle.js

clean:
	rm -rf node_modules
	rm -f site.bundle.js

node_modules: package.json
	npm install

github-file-browser.js: index.js node_modules
	${NODE_BIN}/browserify -s githubFileBrowser index.js > github-file-browser.js

site.bundle.js: index.js site.js node_modules
	${NODE_BIN}/browserify site.js > site.bundle.js
