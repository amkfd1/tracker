const mongoose = require('mongoose');

const { Schema } = mongoose;


// Define the customer tracker schema
const TrackerSchema = new Schema({
  Customer_Name: String,
  address: {
    building_number: String,
    street: String,
    city: String,
    zip: String,
    country: String,
  },
  contact_point: {
    platform: String,
    contact_link: String,
  },
  stage: {
    process_stage: String,
    status: String,
  },
  service_interest: 
    {
      active: {
        type: Boolean,
        default: false
      },
      service_name: {
        type: String,
        enum:['VoIP', 'SMS']
      },
      routes: String,
      rates_offered: String,
      currency: {
        type: String,
        enum: ['USD', 'EUR', 'NGN'],
      },
      status: {
        type: String,
        enum: ['', 'NA', 'Incomplete','Complete'],

      }
    },
  Tech_info: {
    isAvailable: {
      type: Boolean,
      default: false
    },
    TI_service_name: String,
    signalling_Ip: String,
    media_Ip: String,
    prefix: String,
    port: Number,
    codices: String,
    status: {
      type: String,
      enum: ['', 'NA', 'Incomplete','Complete'],

    }
  },
  testing: {
    active: {
      type: Boolean,
      default: false
    },
    routes_to_test: String,
    trunk: String,
    date_started: String,
    date_finished: String,
    testing_status: {
      type: String,
      enum: ['', 'Initiated', 'Ongoing', 'Completed'],
    },
    notes: [{
      type: String,
      default: []
    }],
  },
  account_manager: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  documents: [{
    type: Schema.Types.ObjectId,
    ref: 'Document',
    default: [],
  }],
  alternative_contact:[{
    type: Schema.Types.ObjectId,
    ref: 'Contact',
    default: [],
  }],
  notes: [{
    type: Schema.Types.ObjectId,
    ref: 'Note',
    default: []
  }],

},{ versionKey: false } );




// Create the Tracker model
const Tracker = mongoose.model('Tracker', TrackerSchema);

module.exports = Tracker;
