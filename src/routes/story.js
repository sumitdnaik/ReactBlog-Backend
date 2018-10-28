const express = require('express');
const mongo = require('mongodb');
const router = express.Router();
const getDb = require('../utils/db').getDb;
const errorUtils = require('../utils/errorUtils');
const jwt = require('jsonwebtoken');
const JWTAuthMiddleware = require("../middlewares/JWTAuthentication");

router.post("/createStory", JWTAuthMiddleware, function(req, res){
  const db = getDb();
  const storyCollection = db.collection('stories');
  const userCollection = db.collection('users');
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
      createdAt: createdAtTime,
      upvotedBy: [],
      upvotes: 0
    };

    storyCollection.insert(obj, function(err, result) {
      if(err){
        errorUtils.errorRes(res, 'Error publishing story.');
        return;
      }
      let storyId = result.insertedIds['0'];
      userCollection.updateOne({'email': req.body.user},  { $addToSet: { stories: storyId } }, function(err, docs) {
        if(err){
          errorUtils.errorRes(res, 'Error publishing story.');
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
  const db = getDb();
  const storyCollection = db.collection('stories');
  storyCollection.find().project({'createdAt': 1, 'createdBy': 1, 'story.title': 1, 'story.category': 1, 'story.summary': 1}).sort({createdAt: -1}).limit(10).toArray(function(err, docs){
    if(err){
      errorUtils.errorRes(res, 'Error retrieving the stories.');
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
  const db = getDb();
  const storyCollection = db.collection('stories');
  let o_id = new mongo.ObjectID(req.body.storyId);
  let token = null, userId = null;
  if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
    token = req.headers.authorization.split(' ')[1];
  }
  let tokenPromise = new Promise(function(resolve, reject){
    if(token){
      jwt.verify(token, process.env.AUTH_SECRET_KEY, function(err, decoded) {
        if (err) return res.status(401).send({ status: false, message: 'Unauthorized access.' });
        let decodedUserInfo = { ...decoded };
        resolve(decodedUserInfo.id);
      });
    }
    else {
      resolve(null);
    }
  });

  tokenPromise.then((userId) => {
    storyCollection.find({_id: o_id}).toArray(function(err, docs){
      if(err) {
        errorUtils.errorRes(res, 'Error retrieving the stories.');
        return;
      } else {
        let storyObj = docs[0];
        if(userId && storyObj.upvotedBy.length > 0){
          storyObj.hasUserUpvoted = storyObj.upvotedBy.indexOf(userId) != -1;
        }
        else {
          storyObj.hasUserUpvoted = false;
        }
        res.json({
          message: "Story retrieved successfully",
          data: {
            storyData: storyObj
          },
          status: true
        });
      }
    });
  }).catch((error) => {
    errorUtils.errorRes(res, 'Error retrieving the stories.');
  });
});

router.post("/upvoteStory", JWTAuthMiddleware, function(req, res){
  const db = getDb();
  const storyCollection = db.collection('stories');
  var storyId = new mongo.ObjectID(req.body.storyId);
  storyCollection.updateOne({ _id: storyId }, { $addToSet: { upvotedBy: req.decodedUserInfo.id }, $inc: { upvotes : 1 } },function(err, docs){
    if(err) {
      errorUtils.errorRes(res, 'Error upvoting the story.');
      return;
    }
    else {
      storyCollection.find({_id: storyId}).project({upvotes: 1}).toArray(function(err, docs){
        res.json({
          message: "Upvoted successfully.",
          status: true
        });
      });
    }
  });
});

module.exports = router;
