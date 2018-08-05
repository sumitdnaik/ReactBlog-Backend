var express = require('express');
var app = express();
var bodyParser = require('body-parser');
//var things = require("./things");
//app.use("/things", things);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


//For Testing purpose. This middleware should be removed in case of PROD
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

//Signing Up the new user
app.post("/signup", function(req, res){
  var regexForName = /^[A-Za-z\s]+$/,
      regexForEmail = /^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[A-Za-z]+$/;
      res.setHeader('Content-Type', 'application/json');
  if(regexForName.test(req.body.fullname) && regexForEmail.test(req.body.email) && req.body.password.length > 4) {
    res.json(JSON.stringify({
      message: "Signed Up Successfully",
      username: req.body.email
    }));
  }
  else {
    res.status(400);
    res.json({message: "Bad Request"});
  }
});

app.listen(8000);
