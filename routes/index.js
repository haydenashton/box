var express = require('express');
var router = express.Router();


require('./../models/file.js');
var main = require('./../controllers/main.js');

/* GET home page. */
router.get('/', function(req, res, next){
  res.redirect('/files');
});

router.get('/files', main.index);
router.post('/files', main.parseFiles, main.upload);
router.get('/files/:fileId', main.fileExists, main.getFile);

module.exports = router;
