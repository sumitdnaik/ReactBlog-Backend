const express = require('express');
const bodyParser = require('body-parser');

const router = express.Router();
const regexForEmail = /^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[A-Za-z]+$/;

const MongoClient = require('mongodb').MongoClient;
// Connection URL
const url = 'mongodb://localhost:27017';
// Database Name
const dbName = 'myproject';

//Connect to the DB server
MongoClient.connect(url, function(err, client) {
  if(err){
    console.log("Error:" + err);
    return;
  }
  console.log("Connected successfully to server");
  const db = client.db(dbName);
  const collection = db.collection('documents');

  function errorResponse(res){
    res.status(200);
    res.json({
      loggedIn: false,
      message:'Invalid Login credentials'
    });
  }

  //Defining APIs only after connecting to DB
  router.post('/login',function (req,res) {
    let authenticationObj = JSON.parse(req.body.authenticationObj);
    console.log(authenticationObj);
    res.setHeader('Content-Type', 'application/json');
    if(regexForEmail.test(authenticationObj.email) && authenticationObj.password.length > 0) {
      collection.find({'email': authenticationObj.email}).toArray(function(err, docs) {
        console.log('error is '+ JSON.stringify(err));
        console.log('error is '+ JSON.stringify(docs));
        if(err){
          errorResponse(res);
          return;
        }
        if(docs.length == 0){
          errorResponse(res);
        }
        else if(authenticationObj.password == docs[0].password) {
          console.log("matched");
          res.json({
            loggedIn: true,
            message: 'Login Successful'
          });
        }
        else {
          res.json({
            loggedIn: false,
            message: 'Password Incorrect'
          });
        }
      });
    }
    else {
      console.log('wrong email or password');
      errorResponse(res);
    }
  });

  //Signing Up the new user
  router.post("/signup", function(req, res){
    console.log(req.body);
    const regexForName = /^[A-Za-z\s]+$/,
          regexForEmail = /^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[A-Za-z]+$/;
    res.setHeader('Content-Type', 'application/json');
    if(regexForName.test(req.body.name) && regexForEmail.test(req.body.email) && req.body.password.length > 0) {

      let obj = {
        name: req.body.name,
        email: req.body.email,
        password: req.body.password
      };

      collection.find({'email': req.body.email}).toArray(function(err, docs) {
        if(err){
          console.log(err);
          return;
        }

        if(docs.length == 0){
          collection.insert(obj, function(err, result) {
            console.log("Inserted new user into the collection");
            res.json({
              message: "Signed Up Successfully",
              username: obj.email,
              status: true
            });
          });
        }
        else {
          res.json({
            message: `User with email ${req.body.email} already exists.`,
            status: false
          });
        }

      });

    }
    else {
      res.status(400);
      res.json({message: "Bad Request"});
    }
  });

});

module.exports = router;
