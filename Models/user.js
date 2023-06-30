const mongoose = require('mongoose');

const { Schema } = mongoose;

const UserSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
        
    },
    permissionsId: [{
        type: Schema.Types.ObjectId,
        ref: 'Permission',
    }],
    role: {
        type: String,
        required: true,
    },
    designation: {
        type: String
    },
    password: {
        type: String,
        required: true,
    },
    assignedTasks: [{
        type: Schema.Types.ObjectId,
        ref: 'Tracker'
    }]
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
