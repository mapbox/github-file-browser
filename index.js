module.exports = function(d3) {
    var base = 'https://api.github.com';

    function authorize(xhr, token) {
        return token ?
            xhr.header('Authorization', 'token ' + token) :
            xhr;
    }

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
                    var enter = selection.selectAll('div.gist')
                        .data(gists)
                        .enter()
                        .append('div')
                        .attr('class', 'fl item pad1 clearfix col12');

                    enter
                        .append('div')
                        .attr('class', 'col2')
                        .append('strong')
                        .text(function(d) {
                            return d.id;
                        });

                    enter
                        .append('div')
                        .attr('class', 'col4')
                        .text(function(d) {
                            return (d.description || '-') + ' ';
                        });

                    enter
                        .append('div')
                        .attr('class', 'col4')
                        .selectAll('span')
                        .data(function(d) {
                            return d3.entries(d.files);
                        })
                        .enter()
                        .append('span')
                        .attr('class', 'deemphasize')
                        .text(function(d) {
                            return d.key + ' ';
                        })
                        .attr('title', function(d) {
                            return d.value.type + ', ' + d.value.size + ' bytes';
                        });

                    enter
                        .append('div')
                        .attr('class', 'col2 deemphasize')
                        .text(function(d) {
                            return time_format(new Date(d.updated_at));
                        });

                });
            }
            return d3.rebind(browse, event, 'on');
        };
    }

    return {
        gitHubBrowser: gitHubBrowse(d3),
        gistBrowse: gistBrowse(d3)
    };
};
