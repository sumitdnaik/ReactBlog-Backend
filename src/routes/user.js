const express = require('express');
const router = express.Router();
const getDb = require('../utils/db').getDb;
const errorUtils = require('../utils/errorUtils');
const JWTAuthMiddleware = require("../middlewares/JWTAuthentication");


router.post("/getProfile", function(req, res){
      const db = getDb();
      const userCollection = db.collection('users');
      let userProfileObj = req.body;
      console.log('user email '+userProfileObj.email);
      res.setHeader('Content-Type', 'application/json');
      userCollection.find({'email': userProfileObj.email}).toArray(function(err, docs){
        console.log('user data '+docs);
        console.log('user data '+err);
      if(err){
        errorUtils.errorRes(res, 'Error fetching user data');
        return;
      }
      else {
        res.json({
          message: "Profile retrieved successfully",
          stories: docs,
          status: true
        });
      }
  });
});

router.post('/saveProfile', JWTAuthMiddleware, function (req,res) {
      const db = getDb();
      const userCollection = db.collection('users');
      let userProfileObj = req.body;
      res.setHeader('Content-Type', 'application/json');
      //if(regexForEmail.test(userProfileObj.email) && userProfileObj.password.length > 0) {
        userCollection.updateOne({'email': userProfileObj.email},{ $set : userProfileObj} , function(err, docs) {

          if(err){
            errorUtils.errorRes(res);
            return;
          }
          if(docs.length == 0){
            errorUtils.errorRes(res);
            return;
          }

        });
      // }
      // else {
      //   console.log('Incorrect Email or Password');
      //   errorResponse(res);
      // }
    });

module.exports = router;
