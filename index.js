var express = require('express');
var app = express();


const router = require('./src/router.js');

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

app.use('/api',router);
app.listen(8000);
