var express = require('express');
var api = require('./api.js');


var app = express();

app.get('/api', function(req, res){
  res.send({versions: [1]});
});

var apiMiddleware = [api.checkVersion];

app.get('/api/:version', apiMiddleware, function(req, res){
  res.send({methods: ['search']});
});

app.get('/api/:version/search', apiMiddleware, api.search);

app.listen(3000);
console.log('Listening to port 3000');
