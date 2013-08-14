## github-file-browser

A 'minimal' file browser for geospatial files on GitHub.

### example

```js
d3.select('.browser').call(browse.gistBrowse(token)
    .on('chosen', function() {
        console.log('chosen', arguments);
    }));
```
