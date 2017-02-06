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

const APImessages = {
  0: "Success",  // @TODO: Success msg to user
  5: "Insufficient credit", // @TODO: Top-up msg to Admin
  10: "Invalid username or password",  // @TODO: Check Setup details msg to Admin
  15: "Invalid destination or destination not covered", // @TODO: Check destination msg to user
  20: "System error, please retry",  // @TODO: Retry and send System ERR msg to user after ?10 retry
  25: "Bad request; check parameters",  // @TODO: Check parameters
  30: "Throughput exceeded"  // @TODO: Err msg to Admin
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
      // console.log(url)
    return url
  }

  function APIresult(body) {
    // returns error code or 0 if no error. Example: body = "ERR -25" => 25
    var pattern = /(-\d+)/
    return pattern.test(body) ? - Number(pattern.exec(body)[0]) : 0
  }

  function sendSMS(destination, sender, body) {
    msgDetails.destinationAddress = destination
    msgDetails.sourceAddress = sender
    msgDetails.messageBody = body

    request.get(buildURL(msgDetails), (err, res, body) => {
      // return APIresult(body)
      console.log(APImessages[APIresult(body)])
    })
  }

  // sendSMS(2, 23, "TEXT+msg+test+from+node.js")

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

  // listenSMS()
