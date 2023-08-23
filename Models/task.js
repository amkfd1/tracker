const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    taskFor:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Reference to the User model
    },
    date: {
        type: Date,
        default: Date.now
    },
    description:{
        type: String
    },
    status: {
        type: String
    },
    files: [{
        filename: String,
        filePath: String,
        uploadedBy: {
            type: String,
        },
        date: {
            type: Date,
            default: Date.now
        }
    }],
    notes: [{
        postedBy: String,
        note: String,
        date: {
           type: Date,
           default: Date.now
        },
    }], // Array of notes
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Reference to the User model
    },
    reference: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tracker' // Reference to the Tracker model
    },
    deadline:{
        type: Date
    }
});

// Method to add a file to the task
taskSchema.methods.addFile = function(filename, filePath, uploadedBy) {
    this.files.push({
        filename: filename,
        filePath: filePath,
        uploadedBy: uploadedBy
    });
    return this.save();
};

// Method to add a note to the task
taskSchema.methods.addNote = function(noteText) {
    this.notes.push(noteText);
    return this.save();
};

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
