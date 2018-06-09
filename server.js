var path = require('path');
var express = require('express');
var app = express();


app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/src/:file', function(req, res){
  res.sendFile(__dirname + '/src/' + req.params.file);
});

app.get('/roms/:file', function(req, res){
  res.sendFile(__dirname + '/roms/' + req.params.file);
});
app.get('/statics/:file', function(req, res){
  res.sendFile(__dirname + '/statics/' + req.params.file);
});

app.listen(3000);
