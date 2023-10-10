const mongoose = require('mongoose');

const { Schema } = mongoose;

const ticketSchema = new mongoose.Schema({
  ticketId: {
    type: String,

  },
  date: {
    type: Date,

  },
  priority: {
    type: String,
    required: true,
    enum: ['Low', 'Medium', 'High'], // You can adjust the enum values as needed
  },
  type: {
    type: String,

  }, 
  status: {
    type: String,

  },
  contact: {
    type: String,

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
    type: Schema.Types.ObjectId,
    ref: 'Tracker',

  },
  
});

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;
