const mongoose = require('mongoose');

const { Schema } = mongoose;

const ticketSchema = new mongoose.Schema({
  ticketId: {
    type: String,

  },
  date: {
    type: Date,
    default: Date.now()

  },
  priority: {
    type: String,
    // You can adjust the enum values as needed
  },
  type: {
    type: String,

  }, 
  status: {
    type: String,

  },
  contact: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  subject: {
    type: String,

  },
  note: {
    type: String,

  },
  client: {
    type: Schema.Types.ObjectId,
    ref: 'Tracker',

  },
  assignee: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    
  },
  company_name: {
    type: String,
  },
  
});

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;
