const Tracker = require('../Models/tracker');
const Document = require('../Models/document');
const Contact = require('../Models/contact');
const Log = require('../Models/log');
const Note = require('../Models/note');
const User = require('../Models/user');
const fs = require('fs');

const path = require('path');
const print = console.log

const Task = require('../Models/task');


exports.createTask = async (req, res) => {
    try {
        const { title, description,  reference, taskFor } = req.body;
        let assignedBy = req.user.name;
        const newTask = new Task({
            title,
            description,
            assignedBy,
            reference,
            taskFor
        });
        
        const savedTask = await newTask.save();
        
        req.flash('update_success', "Task Successfully created ")
        res.status(201).redirect('/track/home');
        // res.status(201).json(savedTask);
    } catch (error) {
        // res.status(500).json({ message: 'Error creating task', error: error.message });
        req.flash('server_error', "Error creating task. Try Again")
        res.status(201).redirect('/track/home');
    }
};


exports.addFileToTask = async (req, res) => {
    try {
        const taskId = req.params.taskId;
        const { filename, filePath } = req.body;
        let uploadedBy = req.user.name;
        const task = await Task.findById(taskId);
        if (!task) {
            print({ message: 'Task not found' });
            req.flash('server_error', "Error adding file to task. Try Again")
            return res.status(201).redirect('/track/home');
        }
        
        task.files.push({ filename, filePath, uploadedBy });
        const updatedTask = await task.save();
        
        req.flash('update_success', "File Successfully added ")
        res.status(201).redirect('/track/home');
    } catch (error) {
        print({ message: 'Error adding file to task', error: error.message });
        req.flash('server_error', "Error adding file to task. Try Again")
        res.status(201).redirect('/track/home');
    }
};


exports.addNoteToTask = async (req, res) => {
    try {
        const taskId = req.params.taskId;
        const { note } = req.body;
        
        const task = await Task.findById(taskId);
        if (!task) {
            print({ message: 'Task not found' });
            req.flash('server_error', "Error adding file to task. Try Again")
            return res.status(201).redirect('/track/home');
        }
        
        task.notes.push(note);
        const updatedTask = await task.save();
        
        res.json(updatedTask);
    } catch (error) {
        print({ message: 'Error adding note to task', error: error.message });
        req.flash('server_error', "Error adding note to task. Try Again")
        res.status(201).redirect('/track/home');
    }
};


exports.editTask = async (req, res) => {
    try {
        const taskId = req.params.taskId;
        const updatedData = req.body;
        
        const task = await Task.findByIdAndUpdate(taskId, updatedData, { new: true });
        if (!task) {
            print({ message: 'Task not found' });
            req.flash('server_error', "Error adding file to task. Try Again")
            return res.status(201).redirect('/track/home');
        }
        
        res.json(task);
    } catch (error) {
        print({ message: 'Error editing task', error: error.message });
        req.flash('server_error', "Error adding note to task. Try Again")
        res.status(201).redirect('/track/home');
    }
};

exports.deleteTask = async (req, res) => {
    try {
        const taskId = req.params.taskId;
        
        const deletedTask = await Task.findByIdAndDelete(taskId);
        if (!deletedTask) {
            print({ message: 'Task not found' });
            req.flash('server_error', "Error adding file to task. Try Again")
            return res.status(201).redirect('/track/home');
        }
        
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        print({ message: 'Error deleting task', error: error.message });
        req.flash('server_error', "Error deleting task. Try Again")
        res.status(201).redirect('/track/home');
    }
};


exports.deleteNoteFromTask = async (req, res) => {
    try {
        const taskId = req.params.taskId;
        const noteIndex = req.params.noteIndex;
        
        const task = await Task.findById(taskId);
        if (!task) {
            print({ message: 'Task not found' });
            req.flash('server_error', "Error adding file to task. Try Again")
            return res.status(201).redirect('/track/home');
        }
        
        task.notes.splice(noteIndex, 1);
        const updatedTask = await task.save();
        
        res.json(updatedTask);
    } catch (error) {
        print({ message: 'Error deleting note from task', error: error.message });
        req.flash('server_error', "Error deleting note. Try Again")
        res.status(201).redirect('/track/home');
    }
};


exports.deleteFileFromTask = async (req, res) => {
    try {
        const taskId = req.params.taskId;
        const fileIndex = req.params.fileIndex;
        
        const task = await Task.findById(taskId);
        if (!task) {
            print({ message: 'Task not found' });
            req.flash('server_error', "Error adding file to task. Try Again")
            return res.status(201).redirect('/track/home');
        }
        
        task.files.splice(fileIndex, 1);
        const updatedTask = await task.save();
        
        res.json(updatedTask);
    } catch (error) {
        print({ message: 'Error deleting file from task', error: error.message });
        req.flash('server_error', "Error deleting note. Try Again")
        res.status(201).redirect('/track/home');
    }
};


exports.getAllTasks = async (req, res) => {
    try {
        const tasks = await Task.find();
        res.json(tasks);
    } catch (error) {
        print({ message: 'Error fetching tasks', error: error.message });
        req.flash('server_error', "Error fetching tasks. Try Again")
        res.status(201).redirect('/track/home');
    }
};


exports.getTasksForUser = async (req, res) => {
    try {
        const userId = req.user._id;
        const tasks = await Task.find({ taskFor: userId });
        
        res.json(tasks);
    } catch (error) {
        print({ message: 'Error fetching tasks for user', error: error.message });
        req.flash('server_error', "Error deleting note. Try Again")
        res.status(201).redirect('/');
    }
};


