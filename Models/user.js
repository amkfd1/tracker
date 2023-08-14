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
    }],
    settings: {
        isLocked:{
            type: Boolean,
            default: false
        },

        maxAttempts: {
            type: Number,
            default: 5
        }
        
    },

    profile: {
        dob: {
            type: String
        },
        phone: String,
        emergency_contact: {
            name: String,
            relationship: String,
            phone: String,
            alternative: String,
            Address: String
        },

        image: {
            type: String
        }
    },

    tasks:[{
        type: Schema.Types.ObjectId,
        ref: 'Task',
    }]
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
