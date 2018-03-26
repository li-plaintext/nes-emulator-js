var path = require('path');
var express = require('express');
var app = express();


app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/src/index.js', function(req, res){
  res.sendFile(__dirname + '/src/index.js');
});

app.get('/roms/:file', function(req, res){
  res.sendFile(__dirname + '/roms/' + req.params.file);
});

app.listen(3000);
