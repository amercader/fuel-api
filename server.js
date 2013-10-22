var express = require('express');
var api = require('./api.js');


var app = express();

app.get('/api', function(req, res){
  res.send({versions: [1]});
});

var apiMiddleware = [api.CORS, api.checkVersion, api.debug];

app.get('/api/:version', apiMiddleware, function(req, res){
  res.send({methods: ['search', 'autocomplete']});
});

app.get('/api/:version/search', apiMiddleware, api.search);


app.get('/api/:version/autocomplete', apiMiddleware, function(req, res){
  res.send({fields: ['manufacturer', 'model']});
});

app.get('/api/:version/autocomplete/:field', apiMiddleware, api.autocomplete);

app.listen(3000);
console.log('Listening to port 3000');
