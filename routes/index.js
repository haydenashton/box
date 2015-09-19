var express = require('express');
var router = express.Router();
require('./../models/file.js');
require('./../models/folder.js');
var folders = require('./../controllers/folders.js');
var files = require('./../controllers/files.js');

/* GET home page. */
router.get('/', folders.index);
router.get('/folders', folders.listFolders);
router.post('/folders', folders.createFolder);


router.get('/files', folders.getFolder, files.listFiles);
router.post('/files', files.parseFiles, files.upload);
router.get('/files/:fileId', files.fileExists, files.getFile);

module.exports = router;
