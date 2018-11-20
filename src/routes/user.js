const express = require('express');
const router = express.Router();
const getDb = require('../utils/db').getDb;
const errorUtils = require('../utils/errorUtils');
const JWTAuthMiddleware = require("../middlewares/JWTAuthentication");


router.post("/getProfile", function(req, res){
      const db = getDb();
      const userCollection = db.collection('users');
      let userProfileObj = req.body;
      console.log('user email '+ JSON.stringify(userProfileObj));
      res.setHeader('Content-Type', 'application/json');
      userCollection.find({'email': userProfileObj.email}).toArray(function(err, docs){
        console.log('user data '+JSON.stringify(docs));
        console.log('user error '+err);
      if(err){
        errorUtils.errorRes(res, 'Error fetching user data');
        return;
      }
      else {
        res.json({
          message: "Profile retrieved successfully",
          profile: docs,
          status: true
        });
      }
  });
});

router.post('/saveProfile', function (req,res) {
      const db = getDb();
      const userCollection = db.collection('users');
      let userProfileObj = req.body;
      res.setHeader('Content-Type', 'application/json');
      console.log('save profile '+ JSON.stringify(userProfileObj));
      //if(regexForEmail.test(userProfileObj.email) && userProfileObj.password.length > 0) {
        userCollection.updateOne({'email': userProfileObj.email},{ $set : userProfileObj} , function(err, docs) {
          console.log('response '+JSON.stringify(docs));
          console.log('response '+JSON.stringify(err));
          if(err){
            errorUtils.errorRes(res);
            return;
          }
          if(docs.length == 0){
            errorUtils.errorRes(res);
            return;
          }else {
            res.json({
              message: "Profile saved successfully",
              profile: docs,
              status: true
            });
          }

        });
   
    });

module.exports = router;
