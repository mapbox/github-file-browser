var d3 = require('d3'),
    browse = require('./')(d3),
    token = localStorage.github_token;

d3.select('.browser').call(browse.gistBrowse(token)
    .on('chosen', function() {
        console.log('chosen', arguments);
    }));

    /*
d3.select('.repos').call(browse.gitHubBrowse(token)
    .on('chosen', function() {
        console.log('chosen', arguments);
    }));
    */
