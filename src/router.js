const express = require('express');
const bodyParser = require('body-parser');

const router = express.Router();

const MongoClient = require('mongodb').MongoClient;

// Connection URL
const url = 'mongodb://localhost:27017';

// Database Name
const dbName = 'myproject';

let db, collection;

// Use connect method to connect to the server
MongoClient.connect(url, function(err, client) {
  if(err){
    console.log("Error:" + err);
    return;
  }
  console.log("Connected successfully to server");
  db = client.db(dbName);
  collection = db.collection('documents');
});

router.post('/login',function(req,res){

  const regexForEmail = /^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[A-Za-z]+$/;
  res.setHeader('Content-Type', 'application/json');

    if(regexForEmail.test(req.body.email) && req.body.password.length > 0) {

      collection.find({'email': req.body.email}).toArray(function(err, docs) {
        if(err){
          res.status(400);
          res.json({
            loggedIn: false,
            message:'Invalid Login credentials'
          });
          return;
        }

        if(req.body.password == docs[0].password) {
          console.log("matched");
          res.json({
            loggedIn: true,
            message: 'Login Successful'
          });
        }

      });
    } else {
        res.status(400);
        res.json({
          loggedIn: false,
          message:'Invalid Login credentials'
        });
    }

});

//Signing Up the new user
router.post("/signup", function(req, res){
  const regexForName = /^[A-Za-z\s]+$/,
      regexForEmail = /^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[A-Za-z]+$/;
      res.setHeader('Content-Type', 'application/json');

      console.log(req.body);
  if(regexForName.test(req.body.name) && regexForEmail.test(req.body.email) && req.body.password.length > 0) {

    let obj = {
      name: req.body.name,
      email: req.body.email,
      password: req.body.password
    };

    collection.insert(obj, function(err, result) {
      console.log("Inserted new user into the collection");
      res.json({
        message: "Signed Up Successfully",
        username: obj.email
      });
    });
  }
  else {
    res.status(400);
    res.json({message: "Bad Request"});
  }
});

module.exports = router;
