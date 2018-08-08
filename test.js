var express = require('express');
var app = express();
var bodyParser = require('body-parser');
//var things = require("./things");
//app.use("/things", things);

const MongoClient = require('mongodb').MongoClient;
//const assert = require('assert');

// Connection URL
const url = 'mongodb://localhost:27017';

// Database Name
const dbName = 'myproject';

// Use connect method to connect to the server
MongoClient.connect(url, function(err, client) {
  assert.equal(null, err);
  console.log("Connected successfully to server");

  const db = client.db(dbName);
  const collection = db.collection('documents');

//  insertDocuments(db, function() {
    collection.find({'a': 3}).toArray(function(err, docs) {
      console.log(docs);
    });
  //});

});

const insertDocuments = function(db, callback) {
  // Get the documents collection
  const collection = db.collection('documents');
  // Insert some documents
  collection.insertMany([
    {a : 1}, {a : 2}, {a : 3}
  ], function(err, result) {
    assert.equal(err, null);
    assert.equal(3, result.result.n);
    assert.equal(3, result.ops.length);
    console.log("Inserted 3 documents into the collection");
    callback(result);
  });
}

/*APIs*/

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
      //res.setHeader('Content-Type', 'application/json');
  if(regexForName.test(req.body.fullname) && regexForEmail.test(req.body.email) && req.body.password.length > 4) {

    res.json({
      message: "Signed Up Successfully",
      username: req.body.email
    });
  }
  else {
    res.status(400);
    res.json({message: "Bad Request"});
  }
});

app.listen(8000);
