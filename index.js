var queue = require('queue-async'),
    request = require('browser-request'),
    treeui = require('treeui'),
    token;

var base = 'https://api.github.com';

module.exports = function(_) {
    token = _;
    return module.exports;
};

module.exports.open = open;
module.exports.request = req;

function open() {
    return treeui(treeRequest)
        .display(function(res) {
            var last = res[res.length - 1];
            return last.name || last.login || last.path;
        });
}

function treeRequest(tree, callback) {
    if (tree.length === 0) {
        req('/user/orgs', function(err, res) {
            callback(null, res[0].map(function(_) {
                return [_];
            }));
        });
    } else if (tree.length === 1) {
        req('/orgs/' + tree[0].login + '/repos', function(err, res) {
            callback(null, res[0].map(function(_) {
                return [tree[0], _];
            }));
        });
    } else if (tree.length === 2) {
        req('/repos/' + tree[1].full_name + '/branches', function(err, res) {
            callback(null, res[0].map(function(_) {
                return [tree[0], tree[1], _];
            }));
        });
    } else if (tree.length === 3) {
        req('/repos/' + tree[1].full_name + '/git/trees/' + tree[2].commit.sha, function(err, res) {
            callback(null, res[0].tree.map(function(_) {
                return [tree[0], tree[1], tree[2], _];
            }));
        });
    } else if (tree.length > 3) {
        req('/repos/' + tree[1].full_name + '/git/trees/' + tree[3].sha, function(err, res) {
            callback(null, res[0].tree.map(function(_) {
                return [tree[0], tree[1], tree[2], tree[3]].concat([_]);
            }));
        });
    }
}

function req(postfix, callback) {
    var q = queue(1);

    q.defer(page, null)
        .awaitAll(function(err, res) {
            callback(err, res);
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
            callback(null, body);
        });
    }
}
