module.exports = function(d3) {
    var preview = require('static-map-preview')(d3, 'tmcw.map-dsejpecw');

    function gitHubBrowse(d3) {
        return function(token) {
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

    function req(postfix, token, callback) {
        authorize(d3.json(base + postfix), token)
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
        gitHubBrowser: gitHubBrowse(d3),
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
