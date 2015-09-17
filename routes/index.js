var express = require('express');
var router = express.Router();


require('./../models/file.js');
require('./../models/folder.js');
var main = require('./../controllers/main.js');

/* GET home page. */
router.get('/', main.index);
router.get('/files', main.listFiles);
router.post('/files', main.parseFiles, main.upload);
router.get('/files/:fileId', main.fileExists, main.getFile);

router.get('/folders', main.listFolders);
router.post('/folders', main.createFolder);

module.exports = router;
