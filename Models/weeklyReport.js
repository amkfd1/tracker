const mongoose = require('mongoose');

const { Schema } = mongoose;

// Define the Updates schema
const updatesSchema = new Schema({
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Assuming you have a User model for the postedBy field
    
  },
  update: {
    type: String,
    
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

// Define the Tickets schema
const ticketsSchema = new Schema({
  ticketId: {
    type: String,
    
    // type: mongoose.Schema.Types.ObjectId,
    // ref: 'Ticket', // Assuming you have a Ticket model
  },
  raisedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Assuming you have a User model for the raisedBy field
  },
  tUpdates: String,
  Status: String,
  raisedOn: Date,
  resolvedOn: Date,
});

// Define the cWeeklyActivity schema
const cWeeklyActivitySchema = new Schema({
  carrierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tracker', // Assuming you have a Tracker model
  },
  CB: Boolean,
  CL: Boolean,
  WKM: Boolean,
  alertActive: {
    type: Boolean,
    default: false,
  },
  tickets: [ticketsSchema], // Array of ticket objects
  bestRoute: String,
  totalMins: Number,
  totalRevenue: Number,
  files: [
    {
      fileName: String,
      docFile: String, // You can use a String to store the file path or URL
    },
  ],
});

// Define the weeklyReport schema
const weeklyReportSchema = new Schema({
  updates: [updatesSchema], // Array of update objects
  cWeeklyActivities: [cWeeklyActivitySchema], // Array of cWeeklyActivity objects
});

// Create the WeeklyReport model
const WeeklyReport = mongoose.model('WeeklyReport', weeklyReportSchema);

module.exports = WeeklyReport;
