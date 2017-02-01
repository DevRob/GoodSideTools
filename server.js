const express = require('express')
const request = require('request');
const session = require('express-session')
const passport = require('passport')
const bodyParser = require('body-parser')
const authRoutes = require('./routes/auth.js')
const postsRoutes = require('./routes/posts.js')
const db = require('./db')
var days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
var months = ["January","February","March","April","May","June","July","August","September","October","November","December"]
require('./passport')

var msgDetails = {
  baseurl: "http://sms1.mblox.com:9001/HTTPSMS?S=H",
  username: "goodsidebu1",
  password: "12345", // pwd: tAgCob2i
  destinationAddress: 0,
  sourceAddress: 0,
  messageBody: ""
}

express()
  .set("view engine", "hjs")
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({extended: false}))
  .use(session({ secret: "You like cats", resave: false, saveUninitialized: false }))
  .use(passport.initialize())
  .use(passport.session())
  .use(authRoutes)
  .use(postsRoutes)
  .get("/", (req, res, next) => {
    res.send({
      session: req.session,
      user: req.user,
      authenticated: req.isAuthenticated(),
    })
  })
  .listen(3033)

  function buildURL(msgDetails) {
    var url = msgDetails.baseurl +
      "&UN=" + msgDetails.username +
      "&P=" + msgDetails.password +
      "&DA=" + msgDetails.destinationAddress +
      "&SA=" + msgDetails.sourceAddress +
      "&M=" + msgDetails.messageBody
      console.log(url);
    return url
  }

  function sendSMS(destination, sender, body) {
    msgDetails.destinationAddress = destination
    msgDetails.sourceAddress = sender
    msgDetails.messageBody = body

    request.get(buildURL(msgDetails), (err, res, body) => {
      var APIerror = getAPIerror(body)
      console.log(APIerror);
    })
  }

  function getAPIerror(APIerror) {
    switch (APIerror) {
      case "ERR -5":
        // :TODO send email notification to SMS system admin
        return "Insufficient credit";
      case "ERR -10":
        // :TODO send email notification to SMS system admin
        return "Invalid username or password";
      case "ERR -15":
        // :TODO send email notification to sender(company representative)
        return "Invalid destination or destination not covered";
      case "ERR -20":
        // :TODO retry sending
        return "System error, please retry";
      case "ERR -25":
        // :TODO check parameters
        return "Bad request; check parameters";
      case "ERR -30":
        // :TODO send email notification to SMS system admin
        return "Throughput exceeded";
      case "OK 1398281822":
        // db("system_sms_log")
        // .where("id", id)
        break;
    }
  }

  sendSMS(00353879256846, 00353879256846, "TEXT+msg+test+from+node.js")

  function listenSMS() {
    var counter = 0
    var date = new Date()

    setInterval(function(){
      db("system_sms_log")
      .where("delivered", 0)
      .then((query) => {
        counter += 1
        console.log("---- Database check counter: ", counter, "----");
        for (i in query) {
          console.log("ID: ", query[i].id, ", To:", query[i].destinationAddress, ", body: ", query[i].messageBody, ", queued time: ", query[i].timestamp)
        }
      })
    }, 3000)
  }

  listenSMS()
