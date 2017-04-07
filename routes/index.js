var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {
    name: 'OrdoriteTools',
    options: ['Periscope Link Generator', 'other tools']
  });
});

module.exports = router;
