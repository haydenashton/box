'use_strict';

var FileModel = require('mongoose').model("File");
var fs = require('fs');
var path = require('path');

module.exports.index = function (req, res, next) {
  FileModel.find(function (err, files) {
    if (err) { return next(err); }

    if ('json' in req.query) {
      res.json(files);
    }
    else {
      res.render('index', {files: files});
    }
  });
};


module.exports.fileExists = function(req, res, next){
  console.log("Checking file exists.");
  FileModel.findById(req.params.fileId, function(err, file){
    if(err) return next(err);

    if(!file){
      res.status(404).send('Not found');
    }
    else {
      fs.exists('./files/' + file.nameOnDisk, function(exists){
        if(exists){
          req.file = file;
          return next();
        }
        else {
          res.status(404).send('Not found');
        }
      });
    }
  });
};


module.exports.getFile = function(req, res, next){
  req.file.lastDownload = new Date();
  req.file.numberOfDownloads = req.file.numberOfDownloads + 1;
  req.file.save(function(err){
    if(err) return next(err);
    res.download('./files/' + req.file.nameOnDisk, req.file.actualName);
  });
};


module.exports.upload = function(req, res, next){
  fileDoc = new FileModel();
  fileDoc.actualName = req.filename;

  fileDoc.save(function(err){
    if(err) return next(err);

    var actualFileName = String(fileDoc._id) + path.extname(req.filename);
    var saveTo = path.join('./files/', path.basename(actualFileName));
    console.log("Saving to " + saveTo);
    var fsStream = fs.createWriteStream(saveTo);
    req.file.pipe(fsStream);

    fsStream.on('finish', function(){
      console.log("Stream finish");
      fs.stat(saveTo, function(err, stats){
        if(err) return next(err);

        fileDoc.size = stats.size;
        fileDoc.nameOnDisk = actualFileName;
        fileDoc.save(function(err){
          res.json(fileDoc);
        });
      });
    });
  });
};


module.exports.parseFiles = function(req, res, next){
  req.busboy.on('file', function(fieldName, file, filename, encoding, mimetype){
    req.file = file;
    req.filename = filename;
    console.log(file);
    next();
  });
  return req.pipe(req.busboy);
};
