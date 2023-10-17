const mongoose = require('mongoose');

const updateSchema = new mongoose.Schema({
  // Reference to the user who posted the update
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // The update text
  update: {
    type: String,
    required: true
  },
  // Date when the update was created
  dateCreated: {
    type: Date,
    
  },
  // Date when the update was last updated
  dateUpdated: {
    type: Date,
    default: Date.now// Can be set when the update is edited
  }
});

const Update = mongoose.model('Update', updateSchema);

module.exports = Update;
