var githubbrowser = require('./')('b62b1d055dc3ce744ffbc8da45c7dcc9c05ac5aa');

githubbrowser.request('/user/orgs', function(err, res) {
    console.log(arguments);
});
