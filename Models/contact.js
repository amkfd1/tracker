const mongoose = require('mongoose');

const { Schema } = mongoose;


const ContactSchema = new Schema({
    customerRefId: {
        type: Schema.Types.ObjectId,
        ref: 'Tracker'
    },
    platform: String,
    contact_link: String,

})

const Contact = mongoose.model('Contact', ContactSchema);
module.exports = Contact;