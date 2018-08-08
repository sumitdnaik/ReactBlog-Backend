const express = require('express');
const app = express();
const bodyParser = require('body-parser');


//For Testing purpose. This middleware should be removed in case of PROD
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Origin", "*");
  next();
});


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api',router);

app.use('/api',router);
app.listen(8000);
