const mongoose = require('mongoose');
const { Schema } = mongoose;

const performanceSchema = new Schema({
  tracker: {
    type: Schema.Types.ObjectId,
    ref: 'Tracker',
    required: true,
  },
  date: {
    type: Date,
  },
  asr: {
    type: Number,
    required: false,
  },
  acd: {
    type: Number,
    required: false,
  },
  minutesRoutesTerminated: {
    type: Number,
    required: false,
  },
  totalSMS: {
    type: Number,
    required: false
  }
});

const Performance = mongoose.model('Performance', performanceSchema);

module.exports = Performance;
