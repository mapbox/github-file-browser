(function(e){if("function"==typeof bootstrap)bootstrap("githubfilebrowser",e);else if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else if("undefined"!=typeof ses){if(!ses.ok())return;ses.makeGithubFileBrowser=e}else"undefined"!=typeof window?window.githubFileBrowser=e():global.githubFileBrowser=e()})(function(){var define,ses,bootstrap,module,exports;
return (function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
module.exports = function(d3) {
    var preview = require('static-map-preview')(d3, 'tmcw.map-dsejpecw');

    function gitHubBrowse(d3) {
        return function(token) {
            var event = d3.dispatch('chosen');

            function browse(selection) {
                var outer = selection.append('div')
                    .attr('class', 'miller-outer');

                var wrap = outer.append('div')
                    .attr('class', 'miller-wrap');

                req('/user/repos', token, function(err, repos) {

                    var repocolumn = wrap.append('div')
                        .attr('class', 'miller-column root')
                        .attr('data-level', 0);

                     var repoItems = repocolumn.selectAll('div.item')
                        .data(repos)
                        .enter()
                        .append('div')
                        .attr('class', 'item')
                        .text(function(d) {
                            return d.name;
                        })
                        .on('click', repositoryRoot);

                    metaResize();

                    function cleanup(level) {
                        wrap.selectAll('.miller-column').each(function() {
                            if (+d3.select(this).attr('data-level') >= level) {
                                d3.select(this).remove();
                            }
                        });
                    }

                    function metaResize() {
                        wrap.style('width', function() {
                            return (selection.selectAll('.miller-column')[0].length * 200) + 'px';
                        });
                        wrap.selectAll('.miller-column')
                            .style('height', function() {
                                var max = 0;
                                selection.selectAll('.miller-column').each(function() {
                                    var children = d3.select(this).selectAll('div.item')[0].length;
                                    if (children > max) max = children;
                                });
                                return (max * 35) + 'px';
                            });
                    }

                    function repositoryRoot(d) {
                        var that = this;

                        repoItems.classed('active', function() {
                            return this == that;
                        });

                        req('/repos/' + [
                            d.owner.login,
                            d.name,
                            'branches',
                            d.default_branch
                        ].join('/'), token, onBranch);

                        function onBranch(err, branch) {
                            req('/repos/' + [
                                d.owner.login,
                                d.name,
                                'git',
                                'trees',
                                branch.commit.sha
                            ].join('/'), token, onItems(d));
                        }

                        function onItems(parent) {
                            return function(err, items) {
                                cleanup(1);

                                var rootColumn = wrap.append('div')
                                    .attr('class', 'miller-column repo-root')
                                    .attr('data-level', 1);

                                items.tree = items.tree.map(function(t) {
                                    t.parent = parent;
                                    return t;
                                });

                                var columnItems = rootColumn.selectAll('div.item')
                                    .data(items.tree)
                                    .enter()
                                    .append('div')
                                    .attr('class', function(d) {
                                        return 'item pad1 ' + d.type;
                                    })
                                    .text(function(d) {
                                        return d.path;
                                    });

                                columnItems.each(function(d) {
                                    if (d.type == 'tree') {
                                        d3.select(this)
                                            .on('click', repositoryTree(columnItems, 2));
                                    } else {
                                        d3.select(this)
                                            .on('click', event.chosen);

                                    }
                                });

                                metaResize();
                            };
                        }

                        function repositoryTree(columnItems, level) {
                            return function(d) {
                                var that = this;

                                columnItems.classed('active', function() {
                                    return this == that;
                                });

                                req('/repos/' + [
                                    d.parent.owner.login,
                                    d.parent.name,
                                    'git',
                                    'trees',
                                    d.sha
                                ].join('/'), token, onSubItems(d.parent));

                                function onSubItems(parent) {
                                    return function(err, items) {

                                        cleanup(level);

                                        var rootColumn = wrap.append('div')
                                            .attr('class', 'miller-column repo-subcolumn')
                                            .attr('data-level', level);

                                        items.tree = items.tree.map(function(t) {
                                            t.parent = parent;
                                            return t;
                                        });

                                        var columnItems = rootColumn.selectAll('div.item')
                                            .data(items.tree)
                                            .enter()
                                            .append('div')
                                            .attr('class', 'item pad1')
                                            .text(function(d) {
                                                return d.path;
                                            });

                                        columnItems.each(function(d) {
                                            if (d.type == 'tree') {
                                                d3.select(this).on('click', repositoryTree(columnItems, level + 1));
                                            } else {
                                                d3.select(this)
                                                    .on('click', event.chosen);
                                            }
                                        });

                                        metaResize();
                                    };
                                }
                            };
                        }
                    }
                });
            }

            return d3.rebind(browse, event, 'on');
        };
    }

    function gistBrowse(d3) {
        return function(token) {
            var event = d3.dispatch('chosen');
            var time_format = d3.time.format('%Y/%m/%d');
            function browse(selection) {
                req('/gists', token, function(err, gists) {
                    gists = gists.filter(hasMapFile);
                    var item = selection.selectAll('div.item')
                        .data(gists)
                        .enter()
                        .append('div')
                        .attr('class', 'fl item')
                        .on('click', function(d) {
                            event.chosen(d);
                        });

                    item.append('div')
                        .attr('class', 'map-preview')
                        .call(mapPreview(token));

                    var overlay = item.append('div')
                        .attr('class', 'overlay')
                        .text(function(d) {
                            return d.id + ' / ' + d.description + ' edited at ' + time_format(new Date(d.updated_at));
                        });

                    overlay.append('div')
                        .attr('class', 'files')
                        .selectAll('small')
                        .data(function(d) {
                            return d3.entries(d.files);
                        })
                        .enter()
                        .append('small')
                        .attr('class', 'deemphasize')
                        .text(function(d) {
                            return d.key + ' ';
                        })
                        .attr('title', function(d) {
                            return d.value.type + ', ' + d.value.size + ' bytes';
                        });
                });
            }
            return d3.rebind(browse, event, 'on');
        };
    }

    var base = 'https://api.github.com';

    function req(postfix, token, callback, l, url) {
        l = l || [];
        authorize(d3.xhr(url || (base + postfix)), token)
            .on('load', function(data) {
                l = l.concat(data.list);
                if (data.next) {
                    return req(postfix, token, callback, l, data.next);
                }
                callback(null, l);
            })
            .on('error', function(error) {
                callback(error, null);
            })
            .response(function(request) {
                var nextLink = (request.getResponseHeader('Link') || '').match(/\<([^\>]+)\>\; rel="next"/);
                nextLink = nextLink ? nextLink[1] : null;
                return {
                    list: JSON.parse(request.responseText),
                    next: nextLink
                };
            })
            .get();
    }

    function mapPreview(token) {
        return function(selection) {
            selection.each(function(d) {
                var sel = d3.select(this);
                req('/gists/' + d.id, token, function(err, data) {
                    var geojson = mapFile(data);
                    if (geojson) {
                        var previewMap = preview(geojson, [200, 200]);
                        sel.node().appendChild(previewMap.node());
                    }
                });
            });
        };
    }

    return {
        gitHubBrowse: gitHubBrowse(d3),
        gistBrowse: gistBrowse(d3)
    };
};

function authorize(xhr, token) {
    return token ?
        xhr.header('Authorization', 'token ' + token) :
        xhr;
}

function hasMapFile(data) {
    for (var f in data.files) {
        if (f.match(/\.geojson$/)) return true;
    }
}

function mapFile(data) {
    try {
        for (var f in data.files) {
            if (f.match(/\.geojson$/)) return JSON.parse(data.files[f].content);
        }
    } catch(e) {
        return null;
    }
}

},{"static-map-preview":2}],2:[function(require,module,exports){
var scaleCanvas = require('autoscale-canvas');

module.exports = function(d3, mapid) {
    var ratio = window.devicePixelRatio || 1,
        retina = ratio !== 1,
        projection = d3.geo.mercator().precision(0),
        path = d3.geo.path().projection(projection);

    function staticUrl(cz, wh) {
        var size = retina ? [wh[0] * 2, wh[1] * 2] : wh;
        return 'http://a.tiles.mapbox.com/v3/' + [
            mapid, cz.join(','), size.join('x')].join('/') + '.png';
    }

    return function(geojson, wh) {
        projection.translate([wh[0]/2, wh[1]/2]);

        var container = d3.select(document.createElement('div'))
            .attr('class', 'static-map-preview'),
            image = container.append('img'),
            canvas = container.append('canvas'),
            z = 19;

        canvas.attr('width', wh[0]).attr('height', wh[1]);
        image.attr('width', wh[0]).attr('height', wh[1]);
        projection.center(projection.invert(path.centroid(geojson)));
        projection.scale((1 << z) / 2 / Math.PI);

        var bounds = path.bounds(geojson);

        while (bounds[1][0] - bounds[0][0] > wh[0] ||
            bounds[1][1] - bounds[0][1] > wh[1]) {
            projection.scale((1 << z) / 2 / Math.PI);
            bounds = path.bounds(geojson);
            z--;
        }
        image.attr('src', staticUrl(projection.center().concat([z-6]), wh));

        var ctx = scaleCanvas(canvas.node()).getContext('2d'),
            painter = path.context(ctx);

        ctx.strokeStyle = '#E000F5';
        ctx.lineWidth = 2;
        painter(geojson);
        ctx.stroke();

        return container;
    };
};

},{"autoscale-canvas":3}],3:[function(require,module,exports){

/**
 * Retina-enable the given `canvas`.
 *
 * @param {Canvas} canvas
 * @return {Canvas}
 * @api public
 */

module.exports = function(canvas){
  var ctx = canvas.getContext('2d');
  var ratio = window.devicePixelRatio || 1;
  if (1 != ratio) {
    canvas.style.width = canvas.width + 'px';
    canvas.style.height = canvas.height + 'px';
    canvas.width *= ratio;
    canvas.height *= ratio;
    ctx.scale(ratio, ratio);
  }
  return canvas;
};
},{}]},{},[1])(1)
});
;