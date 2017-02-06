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
  password: "tAgCob2i", // pwd: tAgCob2i
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

function APIresultCode(body) {
  // returns error code or 0 if no error. Example: body = "ERR -25" => 25
  var pattern = /(-\d+)/
  return pattern.test(body) ? - Number(pattern.exec(body)[0]) : 0
}

function processQueuedSMS() {
  var destination = "",
      sender = "",
      body = ""

  db("system_sms_log")
  .where("delivered", 0)
  .then((smsListQuery) => {
    for (var smsidx in smsListQuery) {
      smsID =  smsListQuery[smsidx].id
      destination = smsListQuery[smsidx].destinationAddress
      sender = smsListQuery[smsidx].sourceAddress
      body = smsListQuery[smsidx].messageBody

      sendSMS(smsID, destination, sender, body)
    }
  })
}

function sendSMS(id, destination, sender, SMSbody) {
  msgDetails.destinationAddress = destination
  msgDetails.sourceAddress = sender
  msgDetails.messageBody = SMSbody

  request.get(buildURL(msgDetails), (err, res, body) => {
    // handleAPIresponse(APIresult(body))
    logAPIresponse(id, body)
    handleAPIresponse(id, body)
  })
}

function logAPIresponse(id, result) {
  db('system_sms_api_response_log')
  .insert({
    smsID: id,
    APIresponse: result,
    responseCode: APIresultCode(result),
    responseMessage: APImessages[APIresultCode(result)]
  })
  .then()
}

function handleAPIresponse(id, result) {
  var responseCode = APIresultCode(result)

  switch(responseCode) {
    case 0:
      logSuccess(smsID) // @TODO: Success msg to user
      break
    case 5:
      // logOnHold(smsID, result)
      SMSretrySend(smsID, result)
      // @TODO: Top-up msg to Admin
      break
    case 10:
      SMSretrySend(smsID, result)
      // @TODO: Check Setup details msg to Admin
      break
    case 15:
      SMSretrySend(smsID, result)
      // @TODO: Check destination msg to user
      break
    case 20:
      SMSretrySend(smsID, result)
      // @TODO: Retry and send System ERR msg to user after ?10 retry
      break
    case 25:
      SMSretrySend(smsID, result)
      // @TODO: Check parameters
      break
    default:
        console.log("unexpected result Please contact Administrator")
  }
}

function logSuccess(smsID) {
  db("system_sms_log")
  .where('id', '=', smsID)
  .update({
    delivered: 1
  })
  .then(() => {
    console.log("SMS sent and logged in DB");
  })
}

function logOnHold(smsID, result) {
  db("system_sms_log")
  .where('id', '=', smsID)
  .update({
    delivered: 2
  })
  .then(() => {
    console.log("SMS sending failed and put onhold", "err: ", result);
  })
}

function SMSretrySend(smsID, result) {
  db("system_sms_api_response_log")
  .where('smsID', '=', smsID)
  .then((query) => {
    if (query.length < 3) {
      console.log("SMS sending failed, retrying");
    } else {
      logOnHold(smsID, result)
    }
  })
}

function listenSMS() {
  setInterval(function(){
    processQueuedSMS()
  }, 5000)
}

// SMSAPIsuccess(35)
listenSMS()
