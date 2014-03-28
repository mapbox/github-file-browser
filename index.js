var queue = require('queue-async'),
    request = require('browser-request'),
    token;

var base = 'https://api.github.com';

module.exports = function(_) {
    token = _;
    return module.exports;
};

module.exports.request = function(postfix, callback) {
    var q = queue(1);

    q.defer(page, null)
        .awaitAll(function(err, res) {
            console.log(arguments);
        });

    function page(url, callback) {
        request({
            uri: url || 'https://api.github.com' + postfix,
            headers: {
                Authorization: 'token ' + token
            },
            json: true,
            crossOrigin: true
        }, function(err, res, body) {
            var link = (res.getResponseHeader('Link') || '').match(/\<([^\>]+)\>\; rel="next"/);
            if (link) {
                q.defer(page, link[1]);
            }
            callback(body);
        });
    }
};
