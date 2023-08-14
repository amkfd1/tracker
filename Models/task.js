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
    description: String,
    status: String,
    files: [{
        filename: String,
        filePath: String,
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User' // Reference to the User model
        },
        date: {
            type: Date,
            default: Date.now
        }
    }],
    notes: [String], // Array of notes
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Reference to the User model
    },
    reference: {
        tracker: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tracker' // Reference to the Tracker model
        },
        document: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Document' // Reference to the Tracker model
        }
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
