var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var File = new Schema({
  actualName: String,
  nameOnDisk: String,
  uploaded: {
    type: Date,
    default: Date.now
  },
  numberOfDownloads: {
    type: Number,
    default: 0
  },
  lastDownload: Date,
  size: Number,
  folder: {
    type: Schema.ObjectId,
    ref: "Folder"
  }
});


File.static('getFolders', function(callback){
  this.distinct("folder", function(err, folders){
    if (err){ return callback(err); }

    return callback(null, folders);
  });
});


mongoose.model("File", File);
