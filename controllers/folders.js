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

module.exports.getFolder = function(req, res, next) {
  var folder  = req.query.folder ? req.query.folder : null;

  if(folder) {
    FolderModel.find({"_id": folder}, function(err, folders){
      if(err) { return next(err); }
      if(!folders.length) { return next(); }
      
      req.folder = folders[0];
      next();
    });
  }
  else {
    next();
  }
};
