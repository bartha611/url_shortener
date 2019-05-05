'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var promise = require('promise');
var dns = require('dns');
var MongoClient = require('mongodb').MongoClient;
const opn = require('open');

var cors = require('cors');

var app = express();


// Basic Configuration 
var port = process.env.PORT || 3000;

// mongoose.connect(process.env.MONGOLAB_URI);

app.use(cors());
app.use(bodyParser.urlencoded({extended: true}))

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use('/public', express.static(process.cwd() + '/public'));

// connect to database
mongoose.connection.on("open", function() {
  console.log("you are connected to the database");
})
mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true});

//create new schema for url
var Schema = mongoose.Schema;

var urlSchema = new Schema({
  seq: Number,
  url: String
});

var counterSchema = new Schema({
  _id: {type: String, required: true, default:'name'},
  seq: {type: Number, default: 0}
});



var Counter = mongoose.model('counters',counterSchema);

var Url = mongoose.model('Url',urlSchema, 'urls');

//function to determine if url is valid
function isValid(url) {
  return new Promise((resolve, reject) => {
    dns.lookup(url, function(err,result) {
      if (err) {
        return reject(err)
      }
      resolve(result);
  })
})};

//function to get next sequence in counter collection
function getNextSequence(name) {
  return new Promise((resolve,reject) => {
    Counter.findOneAndUpdate({_id: 'name'},{$inc: {seq:1}},
                             {new:true,useFindAndModify:false},
                             function(err,result) {
      if (err) {
        return reject(err)
      }
      resolve(result.seq);
    }) 
  })
}



//routes

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.post("/api/shorturl/new", function(req,res) {
  var old_url = req.body.url;
  var REGEX_URL = /^https?:\/\//;
  var url = old_url.replace(REGEX_URL, '');
  isValid(url)
  .then(response => {
    url = "https://" + url;
    Url.findOne({url: url}, (err,result) => {
      if (err) throw err;
      if(result) {
        console.log(result);
        console.log("url in database"); 
      }
      else {
        getNextSequence('name')
        .then(seq => {
          var new_url = new Url({
            seq: seq,
            url: url
          });
          new_url.save();
          return res.json({url:url,seq:seq})
        })
        .catch(err => console.log(err));
      }
    })
  })
  .catch(err => {
    return res.json({error: 'invalid url'});
  })
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});

app.get("/urllist", function(req,res) {
  Url.findOne({url: "freecodecamp.com"}, function(err,urls) {
   res.json({url: urls});
 })
});

app.get("/api/shorturl/[0-9]+/", function(req,res) {
  var url = req.originalUrl;
  var integer = url.split("/")[3];
  Url.findOne({seq:integer},function(err,result) {
    if(result) {
      var route = result.url;
      console.log(result.url);
      res.redirect(route);
    }
    else {
      res.json({url:'does not exist'});
    }
  })
})