const mongoose = require('mongoose');

const { Schema } = mongoose;

// Define the document schema
const DocumentSchema = new Schema({
  userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    originalname:{
      type: String
    },
  documentTitle: String,
  documentPath:{
    type: String
  },
  dateUploaded: {
    type: Date,
    default: Date.now
  },
  customerRefId: {
    type: String
  },
  documentPath: String,
  tags:[{
    user: {type: Schema.Types.ObjectId,
    ref: 'User'},
    permission: {
      type:String,
      enum: ['Read_Only', 'Read_Update']
    }
  },
  
]
});

// Create the Document model
const Document = mongoose.model('Document', DocumentSchema);

module.exports = Document;
