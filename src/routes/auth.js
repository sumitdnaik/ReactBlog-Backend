const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const getDb = require('../utils/db').getDb;
const errorUtils = require('../utils/errorUtils');
const regex  = require('../constants/regex');

router.post('/login',function (req,res) {
  const userCollection = getDb().collection('users');
  let authenticationObj = req.body;
  res.setHeader('Content-Type', 'application/json');
  if(regex.email.test(authenticationObj.email) && authenticationObj.password.length > 0) {
    userCollection.find({'email': authenticationObj.email}).project({'email': 1, 'password':1, 'name': 1}).toArray(function(err, docs) {
      console.log('user data is '+JSON.stringify(docs));
      if(err){
        errorUtils.loginError(res);
        return;
      }
      if(docs.length == 0){
        errorUtils.loginError(res);
        return;
      }
      let isPasswordValid = bcrypt.compareSync(authenticationObj.password, docs[0].password);
      if( isPasswordValid ) {
        let obj = {...docs[0]};
        delete obj.password;
        delete obj._id;
        let token = jwt.sign({ id: docs[0]._id}, process.env.AUTH_SECRET_KEY, {
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
    errorUtils.loginError(res);
  }
});

//Signing Up the new user
router.post("/signup", function(req, res){
  const userCollection = getDb().collection('users');
  res.setHeader('Content-Type', 'application/json');
  if(regex.name.test(req.body.name) && regex.email.test(req.body.email) && req.body.password.length > 0) {
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
        errorUtils.errorRes(res, `User with email ${req.body.email} already exists.`);
      }
    });
  }
  else {
    errorUtils.errorRes(res, "Field has incorrect or empty value");
  }
});

module.exports = router;
