var mongoose = require('mongoose');
var Schema = mongoose.Schema

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
  size: Number
});


mongoose.model("File", File);
