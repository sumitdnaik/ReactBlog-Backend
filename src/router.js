const express = require('express');
const bodyParser = require('body-parser');
const mongo = require('mongodb');

const router = express.Router();
const dbPromise = require('./db');

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWTAuthMiddleware = require("./middlewares/JWTAuthentication");

const regexForEmail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

//USE STATUS = TRUE FOR SUCCESS RESPONSE, USE FALSE FOR ERROR - SENDING RESPONSE

function errorRes(res, message){
  res.status(200);
  res.json({
      message: message,
      status: false
  });
}

//Connect to the DB server
dbPromise.then((db) => {
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
      console.log('user data is '+JSON.stringify(authenticationObj));
      res.setHeader('Content-Type', 'application/json');
      if(regexForEmail.test(authenticationObj.email) && authenticationObj.password.length > 0) {
        userCollection.find({'email': authenticationObj.email}).project({'email': 1, 'password':1, 'name': 1}).toArray(function(err, docs) {
          console.log('user data is '+JSON.stringify(docs));
          if(err){
            errorResponse(res);
            return;
          }
          if(docs.length == 0){
            errorResponse(res);
            return;
          }
          let isPasswordValid = bcrypt.compareSync(authenticationObj.password, docs[0].password);
          if( isPasswordValid ) {
            let obj = {...docs[0]};
            delete obj.password;
            delete obj._id;
            let token = jwt.sign({ id: docs[0].email, name: docs[0].name }, process.env.AUTH_SECRET_KEY, {
              expiresIn: 86400 // expires in 24 hours
            });
            res.json({
              loggedIn: true,
              userData: obj,
              token: token,
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
        let hashedPassword = bcrypt.hashSync(req.body.password, 8);
        let obj = {
          name: req.body.name,
          email: req.body.email,
          password: hashedPassword,
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
              let token = jwt.sign({ id: req.body.email, name: req.body.name }, process.env.AUTH_SECRET_KEY, {
                expiresIn: 86400 // expires in 24 hours
              });
              res.json({
                message: "Signed Up Successfully",
                username: obj.email,
                token: token,
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
        errorRes(res, "Field has incorrect or empty value");
      }
    });

    router.post('/saveProfile',function (req,res) {
      let userProfileObj = req.body;
      res.setHeader('Content-Type', 'application/json');
      //if(regexForEmail.test(userProfileObj.email) && userProfileObj.password.length > 0) {
        userCollection.updateOne({'email': userProfileObj.email},{ $set : userProfileObj} , function(err, docs) {
          
          if(err){
            errorResponse(res);
            return;
          }
          if(docs.length == 0){
            errorResponse(res);
            return;
          }
          
        });
      // }
      // else {
      //   console.log('Incorrect Email or Password');
      //   errorResponse(res);
      // }
    });


    router.post("/createStory", JWTAuthMiddleware, function(req, res){
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
          res.json({
            message: "Story retrieved successfully",
            data: {
              storyData: storyObj
            },
            status: true
          });
        }
      });
    });

}).catch((msg) => console.log(msg));


module.exports = router;
