const express = require('express');
const app = express();
const bodyParser = require('body-parser');
require('dotenv').config();
const dbUtil = require('./src/utils/db');
const authRoutes = require('./src/routes/auth');
const storyRoutes = require('./src/routes/story');
const userRoutes = require('./src/routes/user');

//For Testing purpose. This middleware should be removed in case of PROD
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//USE STATUS = TRUE FOR SUCCESS RESPONSE, USE FALSE FOR ERROR - SENDING RESPONSE

app.use('/auth', authRoutes);
app.use('/story', storyRoutes);
app.use('/user', userRoutes);

dbUtil.connectToDb.then(() => {
    console.log("Connected successfully to DB server");
    app.listen(8000);
}).
catch((err) => console.log(err))
