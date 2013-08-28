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

                req('/user', token, function(err, user) {

                    reqList('/user/orgs', token, function(err, orgs) {
                        var rootLevel = 0;

                        var orgColumn = wrap.append('div')
                            .attr('class', 'miller-column root')
                            .attr('data-level', rootLevel);

                        var orgItems;

                        if (orgs && orgs.length) {
                            orgs.unshift(user);

                            orgItems = orgColumn.selectAll('div.item')
                                .data(orgs)
                                .enter()
                                .append('div')
                                .attr('class', 'item')
                                .text(function(d) {
                                    return d.login;
                                })
                                .on('click', organizationRoot(
                                    rootLevel + 1,
                                    d3.selection()
                                ));

                            metaResize();
                        } else {
                          organizationRoot(rootLevel)(user);
                        }

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

                        function organizationRoot(orgLevel, orgItems) {
                            return function(d) {
                                cleanup(orgLevel);

                                var that = this;

                                if (orgItems && orgItems.length) {
                                  orgItems.classed('active', function() {
                                      return this == that;
                                  });
                                }

                                var url = d.type && d.type === 'User' ?
                                    '/user/repos' : '/orgs/' + d.login + '/repos';

                                reqList(url, token, function(err, repos) {

                                    var repoColumn = wrap.append('div')
                                        .attr('class', 'miller-column root')
                                        .attr('data-level', orgLevel);

                                     var repoItems = repoColumn.selectAll('div.item')
                                        .data(repos)
                                        .enter()
                                        .append('div')
                                        .attr('class', 'item')
                                        .text(function(d) {
                                            return d.name;
                                        })
                                        .on('click', repositoryRoot(orgLevel + 1, d3.selection()));

                                    metaResize();
                                });
                            }
                        }

                        function repositoryRoot(repoLevel, repoItems) {
                            return function(d) {
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
                                        cleanup(repoLevel);

                                        var rootColumn = wrap.append('div')
                                            .attr('class', 'miller-column repo-root')
                                            .attr('data-level', repoLevel);

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
                                                    .on('click', repositoryTree(columnItems, repoLevel + 1, [d]));
                                            } else {
                                                d3.select(this)
                                                    .on('click', event.chosen);

                                            }
                                        });

                                        metaResize();
                                    };
                                }

                                function repositoryTree(columnItems, level, parents) {
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
                                                    t.parents = parents;
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
                                                        d3.select(this).on('click', repositoryTree(columnItems, level + 1,
                                                            parents.concat([d])));
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

                        }
                    });

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
                reqList('/gists', token, function(err, gists) {
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

    function reqList(postfix, token, callback, l, url, count) {
        l = l || [];
        count = count || 0;
        authorize(d3.xhr(url || (base + postfix)), token)
            .on('load', function(data) {
                l = l.concat(data.list);
                if (data.next && ++count < 8) {
                    return req(postfix, token, callback, l, data.next, count);
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

    function req(postfix, token, callback) {
        authorize(d3.json((base + postfix)), token)
            .on('load', function(data) {
                callback(null, data);
            })
            .on('error', function(error) {
                callback(error, null);
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
