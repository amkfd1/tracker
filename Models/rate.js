const mongoose = require('mongoose');

const ratesSchema = new mongoose.Schema({
  // Reference to the carrier (using ObjectId and referencing the 'Tracker' model)
  carrier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tracker',
    required: true,
  },
  wklReport: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WeeklyReport',
    required: true,
  },
  // Date when the rate was received
  dateReceived: {
    type: Date,
    required: true,
  },
  // Date when the rate was accepted
  dateAccepted: {
    type: Date,
  },
  // Path to the document
  documentPath: {
    type: String,
   
  },
  documentTitle:{
    type: String
  }
});

const Rates = mongoose.model('Rates', ratesSchema);

module.exports = Rates;
