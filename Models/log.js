const mongoose = require('mongoose');

const { Schema } = mongoose;

const logSchema = new Schema(
  {
    timestamp: {
      type: Date,
      default: Date.now,
    },
    userName: String,
    route: String,
  },
  { versionKey: false }
);

const Log = mongoose.model('Log', logSchema);

module.exports = Log;
