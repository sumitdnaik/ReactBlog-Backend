const mongo = require('mongodb');
const MongoClient = mongo.MongoClient;
let mongoConnectionPromise = new Promise(function(resolve, reject){
  //Connect to the DB server
  MongoClient.connect(encodeURI(process.env.SERVER_URL), { useNewUrlParser : true }, function(err, client) {
    if(err){
      console.log("Error:" + err);
      reject("Error connecting to database");
    }
    else {
      console.log("Connected successfully to server");
      const db = client.db(process.env.DATABASE);
      resolve(db);
    }
  });
});

module.exports = mongoConnectionPromise;
