const mongoose = require('mongoose');

const { Schema } = mongoose;

// Define the Updates schema
const weeklyReportSchema = new Schema({
 dateGenerated: {
  type: Date
 },
  update: [
  ],    
  isSubmitted:
  {
    submitted: {
      type: Boolean,
      default: false
    },
    dateSubmitted: Date
  },


  alertActive: {
    type: Boolean,
    default: true,
  },
  tickets: []
});



// Create the WeeklyReport model
const WeeklyReport = mongoose.model('WeeklyReport', weeklyReportSchema);

module.exports = WeeklyReport;
