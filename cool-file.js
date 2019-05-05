const MongoClient = require('mongodb').MongoClient;

const url = process.env.MONGO_URI;

MongoClient.connect(url,{userNewUrlParser:true}, function(err,db) {
  if (err) throw err;
  console.log("You have connected to the database");
  db.collection('counters').findOneAndUpdate({_id:'name'},{$set: {_id:'name',seq:0}},{new:true},function(err,result) {
      if (err) throw err;
      console.log(result);
  })
  db.collection('urls').deleteMany({},function(err,result) {
    if (err) throw err;
    console.log(result);
  })
  
  })


                    