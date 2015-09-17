var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Folder = new Schema({
  name: {
    type: String
  },
  parent: {
    type: Schema.ObjectId,
    ref: 'Folder'
  },
  created: {
    type: Date,
    default: Date.now
  }
});


mongoose.model("Folder", Folder);
