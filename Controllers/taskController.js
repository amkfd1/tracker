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
// const { Console } = require('console');

exports.createTask = async (req, res) => {
    try {
        let { title, description,  reference, taskFor, deadline } = req.body;
        if(reference){
            reference = req.body.reference;
        }else {
            reference = null;
        }
        let assignedBy = req.user._id;
        const newTask = new Task({
            title,
            description,
            assignedBy,
            reference,
            taskFor,
            deadline,
            status: 'Active'
        });
        
        const savedTask = await newTask.save();
        print('Body: ', newTask)
        print('USER', assignedBy)
        req.flash('update_success', "Task Successfully created ")
        // res.status(201).redirect('/track/home');
        // res.status(201).json(savedTask);
        if (req.user.designation === "Admin" || req.user.designation === "Management"){
            return res.status(200).redirect('/track/home')
          }else {
            return res.status(200).redirect('/mm/dashboard')
          }
    } catch (error) {
        print({ message: 'Error creating task', error: error.message });
        req.flash('server_error', "Error creating task. Try Again")
        if (req.user.designation === "Admin" || req.user.designation === "Management"){
            return res.status(500).redirect('/track/home')
          }else {
            return res.status(500).redirect('/mm/dashboard')
          }
    }
};


exports.addFileToTask = async (req, res) => {
    try {
        const taskId = req.params.taskId;
        const { filename } = req.file;
        let uploadedBy = req.user.name;
        const task = await Task.findById(taskId);
        console.log("This is the task: ", task)
        if (!task) {
            print({ message: 'Task not found' });
            req.flash('server_error', "Error adding file to task. Try Again")
            return res.status(201).redirect('/track/home');
        }
        
        task.files.push({ filename, uploadedBy });
        const updatedTask = await task.save();
        print("This is File: ", filename, "\nPath: ", filePath)
        req.flash('update_success', "File Successfully added ")
        // res.status(201).redirect('/track/home');
        if (req.user.designation === "Admin" || req.user.designation === "Management"){
            return res.status(200).redirect('/track/home')
          }else {
            return res.status(200).redirect('/mm/task'+req.params.taskId)
          }
    } catch (error) {
        print({ message: 'Error adding file to task', error: error.message });
        req.flash('server_error', "Error adding file to task. Try Again")
        // res.status(201).redirect('/track/home');
        if (req.user.designation === "Admin" || req.user.designation === "Management"){
            return res.status(500).redirect('/track/home')
          }else {
            return res.status(200).redirect('/mm/task'+req.params.taskId)

          }
    }
};
 

exports.addNoteToTask = async (req, res) => {
    try {
        const taskId = req.params.id;
        const { note } = req.body;
        let postedBy = req.user.name
        
        const task = await Task.findById(taskId);
        if (!task) {
            print({ message: 'Task not found' });
            req.flash('server_error', "Error adding file to task. Try Again")
            return res.status(201).redirect('/track/home');
        }
        
        task.notes.push({note,postedBy});
        const updatedTask = await task.save();
        req.flash('update_success', "Note Successfully added ")
        // res.status(201).redirect('/track/home');
        // res.json(updatedTask);
        print('The body: ', postedBy, "\n Body: ", req.body)
        if (req.user.designation === "Admin" || req.user.designation === "Management"){
            return res.status(200).redirect('/track/home')
          }else if (req.user.designation === "HoIT" || req.user.designation === "NOC-TL"){
            return res.status(200).redirect('/mm/tasks/'+req.params.taskId)

          }else {
            return res.status(200).redirect('/ss/tasks/task/'+req.params.taskId)
          }

    } catch (error) {
        print({ message: 'Error adding note to task', error: error.message });
        req.flash('server_error', "Error adding note to task. Try Again")
        // res.status(201).redirect('/track/home');
        if (req.user.designation === "Admin" || req.user.designation === "Management"){
            return res.status(200).redirect('/track/home')
          }else if (req.user.designation === "HoIT" || req.user.designation === "NOC-TL"){
            return res.status(200).redirect('/mm/tasks/'+req.params.taskId)

          }else {
            return res.status(200).redirect('/ss/tasks/task/'+req.params.taskId)
          }
    }
};


exports.editTask = async (req, res) => {
    let {status} = req.body;

    try {
        const taskId = req.params.taskId;
        
        const task = await Task.findByIdAndUpdate(taskId, { status: status });
        if (!task) {
            print({ message: 'Task not found' });
            req.flash('server_error', "Error adding file to task. Try Again")
            return res.status(201).redirect('/track/home');
        }
        
        // res.json(task);
        if (req.user.designation === "Admin" || req.user.designation === "Management"){
            return res.status(200).redirect('/track/home')
          }else {
            return res.status(200).redirect('/mm/dashboard')
          }
    } catch (error) {
        print({ message: 'Error editing task', error: error.message });
        req.flash('server_error', "Error adding note to task. Try Again")
        // res.status(201).redirect('/track/home');
        if (req.user.designation === "Admin" || req.user.designation === "Management"){
            return res.status(500).redirect('/track/home')
          }else {
            return res.status(500).redirect('/mm/dashboard')
          }
    }
};

exports. editTaskStatus = async (req, res) => {
    const taskId = req.params.id;
  
    try {
    //   const { status } = req.body;
  
      console.log("THIS IS THE STATUS: ", taskId);
      
      const updatedTask = await Task.findByIdAndUpdate(taskId, { status:"Close" }, { new: true });
      
      if (!updatedTask) {
        req.flash('server_error', "Error updating task status. Task not found");
        return res.status(404).redirect('/admin/task/'+taskId);
      } 
  
      req.flash('update_success', "Task status updated successfully");
    //   return res.status(200).redirect('/admin/task/'+taskId);
    if (req.user.designation === "Admin" || req.user.designation === "Management"){
        return res.status(200).redirect('/admin/task/'+taskId)
      }else if (req.user.designation === "HoIT" || req.user.designation === "NOC-TL") {
        return res.status(200).redirect('/mm/task/'+taskId)
      } else {
        return res.status(201).redirect('/ss/tasks/task/'+taskId);
      }
    } catch (error) {
      console.error("Error editing task status:", error.message);
      req.flash('server_error', "Error updating task status. Please try again");
    //   return res.status(500).redirect('/admin/task/'+taskId);
    if (req.user.designation === "Admin" || req.user.designation === "Management"){
        return res.status(200).redirect('/admin/task/'+taskId)
      }else if (req.user.designation === "HoIT" || req.user.designation === "NOC-TL") {
        return res.status(200).redirect('/mm/task/'+taskId)
      } else {
        return res.status(201).redirect('/ss/tasks/task/'+taskId);
      }
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
        
      if(deletedTask.files.length > 0){
        deletedTask.files.forEach(file => {
            fs.unlink('uploads/'+file.filename, async (err) => {
                if (err) {
                    throw err;
                }
    
                console.log('Deleted file successfully.');
            const updatedTask = await deletedTask.save();
    
            });
        });
      }else {
        console.log("There is no files in the document")
      }
        // res.json({ message: 'Task deleted successfully' });
        req.flash('update_success', "Task deleted successfully")

        return res.status(201).redirect('/track/home');

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
    const taskId = req.params.taskId;

    try {
        const fileIndex = req.params.fileIndex;
        
        const task = await Task.findById(taskId);
        if (!task) {
            print({ message: 'Task not found' });
            req.flash('server_error', "Error adding file to task. Try Again")
            return res.status(201).redirect('/admin/task/'+taskId);
        }
        let filePath = 'uploads/'+task.files[fileIndex].filename
        task.files.splice(fileIndex, 1);
         // Delete the document file from the local folder
         console.log("This is file Path: ", filePath )
         fs.unlink(filePath, async (err) => {
            if (err) {
                throw err;
            }

            console.log('Deleted file successfully.');
        const updatedTask = await task.save();

        });
        req.flash('update_success', "Task Deleted Successfully ")
        res.status(201).redirect('/admin/task/'+taskId);
        // res.json(updatedTask);
        console.log("This the file being deleted: ", fileIndex, " from: ", taskId)
        req.flash('update_success', "File Deleted Successfully ")
        res.status(201).redirect('/admin/task/'+taskId);
    } catch (error) {
        print({ message: 'Error deleting file from task', error: error.message });
        req.flash('server_error', "Error deleting note. Try Again")
        res.status(201).redirect('/admin/task/'+taskId);
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


exports.getSingleTask = async (req, res) => {
    try {
        const _id = req.params.taskId;
        const task = await Task.find({ _id});
        task.isOpened = true;
        task.save();
        print("Getting task: ", task)
        let flash = await req.flash('update_success')[0] || req.flash('permission')[0] || req.flash('register-success')[0];
        let error = req.flash('tracker_404' )[0] || req.flash('server_error')[0] || req.flash('unauthorized')[0]
        console.log('This is your task ', task)
        res.status(200).render('task', {
            pageTitle: task.title,
            task: task,
            isAuthenticated: req.user.isLoggedIn,
            message: flash,
            error,
            designation: req.user.designation,
            user: {_id:''},
            stages: ['Ongoing', 'Complete']

        });
    } catch (error) {
        print({ message: 'Error fetching tasks for user', error: error.message });
        req.flash('server_error', "Error fetching Task. Try Again")
        res.status(201).redirect('/');
    }
};

exports.getAdminSingleTask = async (req, res) => {
    try {
        const _id = req.params.taskId;
        const tasks = await Task.find({ _id}).populate('taskFor').populate('assignedBy');
        let task ={
                _id: tasks[0]._id,
                title: tasks[0].title,
                description: tasks[0].description,
                taskFor: tasks[0].taskFor.name,
                assignedBy: tasks[0].assignedBy.name,
                designation:req.user.designation,
                notes: tasks[0].notes,
                files: tasks[0].files,
                deadline: (tasks[0].deadline).toISOString().slice([0],[10]),
                status: tasks[0].status
            }
       
        
        console.log("Getting Task Notes: ", task)
        let flash = await req.flash('update_success')[0] || req.flash('permission')[0] || req.flash('register-success')[0];
        let error = req.flash('tracker_404' )[0] || req.flash('server_error')[0] || req.flash('unauthorized')[0]
        console.log('This is your task ', task)
        res.status(200).render('a-task', {
            pageTitle: task.title,
            tasks: task,
            isAuthenticated: req.user.isLoggedIn,
            message: flash,
            error,
            user: req.user,
            stages: ['Close', 'Complete'], 
            isManagement: false,
            designation: req.user.designation

        });
        } catch (error) {
        print({ message: 'Error fetching tasks for user', error: error.message });
        req.flash('server_error', "Error fetching Task. Try Again")
        res.status(201).redirect('/track/home');
    }
};


