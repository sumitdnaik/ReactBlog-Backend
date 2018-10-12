const express = require('express');
const bodyParser = require('body-parser');

const router = express.Router();
const regexForEmail = /^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[A-Za-z]+$/;
const mongo = require('mongodb');
const MongoClient = mongo.MongoClient;
// Connection URL
const url = 'mongodb://localhost:27017';
// Database Name
const dbName = 'myproject';

//USE STATUS = TRUE FOR SUCCESS RESPONSE, USE FALSE FOR ERROR - SENDING RESPONSE

function errorRes(res, message){
  res.status(200);
  res.json({
      message: message,
      status: false
  });
}

//Connect to the DB server
MongoClient.connect(url, function(err, client) {
  if(err){
    console.log("Error:" + err);
    return;
  }
  console.log("Connected successfully to server");
  const db = client.db(dbName);
  const userCollection = db.collection('users');
  const storyCollection = db.collection('stories');
  function errorResponse(res){
    res.status(200);
    res.json({
      loggedIn: false,
      message:'Invalid Login credentials',
      status: false
    });
  }

  //Defining APIs only after connecting to DB
  router.post('/login',function (req,res) {
    let authenticationObj = req.body;
    res.setHeader('Content-Type', 'application/json');
    if(regexForEmail.test(authenticationObj.email) && authenticationObj.password.length > 0) {
      userCollection.find({'email': authenticationObj.email}).project({'email': 1, 'password':1, 'name': 1, '_id': 0}).toArray(function(err, docs) {
        if(err){
          errorResponse(res);
          return;
        }
        if(docs.length == 0){
          errorResponse(res);
        }
        else if(authenticationObj.password == docs[0].password) {
          let obj = {...docs[0]};
          delete obj.password;
          res.json({
            loggedIn: true,
            userData: obj,
            message: 'Login Successful',
            status: true
          });
        }
        else {
          res.json({
            loggedIn: false,
            message: 'Password Incorrect',
            status: false
          });
        }
      });
    }
    else {
      console.log('Incorrect Email or Password');
      errorResponse(res);
    }
  });

  //Signing Up the new user
  router.post("/signup", function(req, res){
    const regexForName = /^[A-Za-z\s]+$/,
          regexForEmail = /^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[A-Za-z]+$/;
    res.setHeader('Content-Type', 'application/json');
    if(regexForName.test(req.body.name) && regexForEmail.test(req.body.email) && req.body.password.length > 0) {
      let obj = {
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        stories: []
      };

      userCollection.find({'email': req.body.email}).toArray(function(err, docs) {
        if(err){
          console.log(err);
          return;
        }
        if(docs.length == 0){
          userCollection.insert(obj, function(err, result) {
            console.log("Inserted new user into the collection");
            res.json({
              message: "Signed Up Successfully",
              username: obj.email,
              status: true
            });
          });
        }
        else {
          errorRes(res, `User with email ${req.body.email} already exists.`);
        }
      });
    }
    else {
      errorRes(res, "Bad Request: Field has incorrect or empty value");
    }
  });

  router.post("/createStory", function(req, res){
      let createdAtTime = new Date();
      let obj = {
        story: {
          title: req.body.story.title,
          content:req.body.story.content,
          category: req.body.story.category,
          summary: req.body.story.summary
        },
        createdBy: {
          name: req.body.user.name,
          email: req.body.user.email
        },
        createdAt: createdAtTime
      };

      storyCollection.insert(obj, function(err, result) {
        if(err){
          console.log(err);
          errorRes(res, 'Error publishing story.');
          return;
        }
        let storyId = result.insertedIds['0'];
        userCollection.updateOne({'email': req.body.user},  { $addToSet: { stories: storyId } }, function(err, docs) {
          if(err){
            errorRes(res, 'Error publishing story.');
            return;
          }
        });
        console.log("Inserted new article into the collection");
        res.json({
          message: "Published Successfully",
          data: {
            storyId: storyId
          },
          status: true
        });
      });
  });

  router.post("/getHomeStories", function(req, res){
    storyCollection.find().project({'createdAt': 1, 'createdBy': 1, 'story.title': 1, 'story.category': 1, 'story.summary': 1}).sort({createdAt: -1}).limit(10).toArray(function(err, docs){
      if(err){
        errorRes(res, 'Error retrieving the stories.');
        return;
      }
      else {
        res.json({
          message: "Stories retrieved successfully",
          stories: docs,
          status: true
        });
      }
    });
  });

  router.post("/readStory", function(req, res){
    var o_id = new mongo.ObjectID(req.body.storyId);
    storyCollection.find({_id: o_id}).toArray(function(err, docs){
      if(err){
        errorRes(res, 'Error retrieving the stories.');
        return;
      }
      else {
        let storyObj = docs[0];
        userCollection.find({'email': storyObj.createdBy.email}).project({'email': 1, 'name': 1, '_id': 0}).toArray(function(err, docs) {
          if(err){
            errorRes(res, 'Error retrieving the stories.');
            return;
          }
          else {
            res.json({
              message: "Story retrieved successfully",
              data: {
                storyData: storyObj,
                userData: docs[0]
              },
              status: true
            });
          }
        });
      }
    });
  });

});

module.exports = router;
