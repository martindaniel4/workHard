var express = require('express');
var app = express();

app.get('/', function(req, res) {
    res.render('home.ejs');
});

app.get('/welcome', function(req, res) {
    res.render('welcome.ejs');
});

app.listen(8080);