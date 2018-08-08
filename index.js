var express = require('express');
var app = express();
var bodyParser = require('body-parser');

const router = require('./src/router.js');

app.use('/api',router);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.listen(8000);
