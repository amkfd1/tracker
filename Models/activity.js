const mongoose = require('mongoose');

const { Schema } = mongoose;

const activitySchema = new mongoose.Schema({
  ticketId: {
    type: Schema.Types.ObjectId,
    ref: 'Ticket', // Reference the 'Ticket' model
    required: true,
  },
  note: {
    type: String,
    required: true,
  },
  activity_File: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now, // You can change the default date value as needed
  },
  contact: {
    Type: String
    // type: Schema.Types.ObjectId,
    // ref: 'Cuser', // Reference the 'Ticket' model
    // required: true,
  },
});

const Activity = mongoose.model('Activity', activitySchema);

module.exports = Activity;
