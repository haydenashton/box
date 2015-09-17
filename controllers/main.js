'use_strict';

var mongoose = require('mongoose');
var FileModel = mongoose.model("File");
var FolderModel = mongoose.model("Folder");
var fs = require('fs');
var path = require('path');

module.exports.index = function (req, res, next) {
  FolderModel.find({}, function(err, folders){
    if(err) { return next(err); }

    res.render('index', {folders: folders});
  });
};

module.exports.listFolders = function(req, res, next){
  FolderModel.find({}, function(err, folders){
    if(err) { return next(err); }

    res.json({"folders": folders});
  });
};

module.exports.createFolder = function(req, res, next){
  var newFolder = new FolderModel(req.body);
  newFolder.parent = null;
  newFolder.save(function(err){
    if (err) { return next(err); }

    res.json(newFolder);
  });
};


module.exports.listFiles = function(req, res, next){
  var folder  = req.query.folder ? req.query.folder : null;

  if(folder){
    console.log(folder);
    FileModel.find({"folder": folder}, function (err, filesInFolder) {
      if (err) { return next(err); }

      res.json({"files": filesInFolder});
    });
  }
  else {
    res.json({"files": []});
  }
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
  fileDoc.folder = req.query.folder;

  fileDoc.save(function(err){
    if(err) return next(err);

    var actualFileName = String(fileDoc._id) + path.extname(req.filename);
    var saveTo = path.join('./files/', path.basename(actualFileName));
    console.log("Saving to " + saveTo);
    var fsStream = fs.createWriteStream(saveTo);
    req.file.pipe(fsStream);

    fsStream.on('finish', function(){
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
    next();
  });
  return req.pipe(req.busboy);
};
