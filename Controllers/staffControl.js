const Tracker = require('../Models/tracker');
const Document = require('../Models/document');
const Contact = require('../Models/contact');
const Log = require('../Models/log');
const Note = require('../Models/note');
const User = require('../Models/user');
const fs = require('fs');
const Task = require('../Models/task');
const WeeklyReport = require('../Models/weeklyReport');
const Ticket = require('../Models/ticket');
const Rate = require('../Models/rate');
const multer = require('multer')

const Update = require('../Models/update');
const Performance = require('../Models/performance');

const path = require('path');
const print = console.log


const today = new Date();
const lastMonday = new Date(today);
lastMonday.setDate(today.getDate() - ((today.getDay() - 1 + 7) % 7));
lastMonday.setHours(0, 0, 0, 0); // Set to midnight
 // Format lastMonday and today to display date and time (without seconds)
 const options = {
   year: 'numeric',
   month: '2-digit',
   day: '2-digit',
   hour: '2-digit',
   minute: '2-digit'
 };
 const startR = {
   year: 'numeric',
   month: '2-digit',
   day: '2-digit',
   
 };





// End of Variables
const updateTech = async (req, res) => {
    try {
      const { id } = req.params; // Get the tracker ID from the request params
      const { TI_service_name, signalling_Ip, media_Ip, prefix, port, codices, status } = req.body; // Get the updated address from the request body
      // Find the Tracker document by ID
      const tracker = await Tracker.findById(id);
  
      if (!tracker) {
        req.flash('tracker_404','Client not found');
        return res.status(404).redirect('/client/'+id);
      }
  
      // Update the address fields
      tracker.Tech_info.TI_service_name = TI_service_name;
      tracker.Tech_info.signalling_Ip = signalling_Ip;
      tracker.Tech_info.media_Ip = media_Ip;
      tracker.Tech_info.prefix = prefix;
      tracker.Tech_info.port = port;
      tracker.Tech_info.codices = codices;
      tracker.Tech_info.status = status;
  
  
      // Save the updated Tracker document
      await tracker.save();
      // console.log("Changing: ", req.body)
      print("Tracker updated: ", tracker)
      req.flash('update_success','Technical Info Updated')
      res.status(200).redirect('/client/'+req.params.id);
    } catch (error) {
      console.error('Error updating Technical Info:', error);
      req.flash('server_error','A server error occured. Try Again')
      res.status(500).redirect('/client/'+id);
    }
  
  };



const updateTesting = async (req, res) => {
    try {
      const { id } = req.params; // Get the tracker ID from the request params
      const { active, routes_to_test, trunk, date_started, testing_status, notes } = req.body; // Get the updated address from the request body
      console.log("Updating Testing-Body: ", req.body.street)
      // Find the Tracker document by ID
      const tracker = await Tracker.findById(id);
  
      if (!tracker) {
        req.flash('tracker_404','Client not found');
        return res.status(404).redirect('/client/'+req.params.id);
      }
  
      // Update the address fields
      tracker.testing.active = active;
      tracker.testing.routes_to_test = routes_to_test;
      tracker.testing.trunk = trunk;
      tracker.testing.date_finished = new Date();
      tracker.testing.testing_status = testing_status;
      tracker.testing.notes = notes;
  
  
      // Save the updated Tracker document
      await tracker.save();
      // console.log("Changing: ", req.body)
      req.flash('update_success','Testing stage has been successfully updated')
      res.status(200).redirect('/client/'+req.params.id);
    } catch (error) {
      console.error('Error updating Technical Info:', error);
      req.flash('server_error','A server error occured. Try Again')
      res.status(500).redirect('/client/'+req.params.id);
    }
  
  };

  const grantDocumentPermission = async (req, res) => {
    try {
      const id = req.params.id || req.body.document;
      const { userId, permission } = req.body;
  
      const document = await Document.findById(id);
  
      // console.log('This is the document ID: ', id);
      // console.log('This is the BODY: ', req.body);
      // console.log('This is the document : ', document);
  
  
      if (!document) {
        req.flash('tracker_404', 'Client not found');
        print('NO SUCH DOCUMENT')
        return res.status(404).redirect('/client/' + id);
      }
  
      // Check if the user has permission to grant document permission
      const loggedInUserId = req.user._id;
  
      if (document.userId.toString() !== loggedInUserId.toString() ) {
        
        console.log('YOU ARE UNAUTHORIZED')
        req.flash('unauthorized', 'Not Authorized!');
        return res.status(403).redirect('/client/' + document.customerRefId);
      }
  
      // Grant permission to the user
      const tag = {
        user: userId,
        permission: permission,
      };
  
      document.tags.push(tag);
      await document.save();
      print('PRINTING DOCUMENT FROM GA: ', tag)
      req.flash('permission', 'Access to document is granted!');
      res.status(200).redirect('/client/' + document.customerRefId);
    } catch (error) {
      console.error('Error granting document permission:', error);
      req.flash('server_error', 'A server error occurred. Try again');
      res.status(500).redirect('/500');
    }
  };
  

  const addContact = async (req, res) => {
    try {
      const { platform, contact_link } = req.body; // Assuming you are sending the title field in the request body
      const customerRefId = req.params.id; // Assuming the customer ID is retrieved from the request params
  
  
      // Create a new document instance
      const contact = new Contact({
        platform,
        contact_link,
        customerRefId,
      });
  
      // Save the document to the database
      const savedContact = await contact.save();
  
      // Find the corresponding Tracker document by customer ID
      const tracker = await Tracker.findOne({ _id: customerRefId });
  
      if (!tracker) {
        req.flash('tracker_404','Client not found');
        return res.status(404).redirect('/client/'+customerRefId);
      }
  
      // Add the uploaded document to the documents array in the Tracker document
      tracker.alternative_contact.push(savedContact._id);
  
      // Save the updated Tracker document
      await tracker.save();
      req.flash('update_success','New contact has been added successfully')
      res.status(200).redirect('/client/'+customerRefId);
    } catch (error) {
      console.error('Error uploading document:', error);
      // res.status(500).json({ error: 'Failed to upload document' });
      req.flash('server_error','A server error occured. Try Again')
      res.status(500).redirect('/client/'+customerRefId)
    }
  };
  
  const updateTrackerStage = async (req, res) => {
    const trackerId = req.params.id;
    const newProcessStage = req.body.stage;
    let totalStages = 0;
    let completedStages = 0;
    let completionPercentage = 0;
    console.log("Stage: ", newProcessStage)
    try {
      const tracker = await Tracker.findById(trackerId);
  
      // update the overall percentage\
      if (tracker.service_interest && tracker.service_interest.status === 'Complete') {
        totalStages++;
        completedStages++;
      } else { 
        totalStages++;
      }
    
      if (tracker.Tech_info && tracker.Tech_info.status === 'Complete') {
        totalStages++;
        completedStages++;
      } else {
        totalStages++;
      }
    
      if (tracker.testing && tracker.testing.testing_status === 'Completed') {
        totalStages++;
        completedStages++;
      } else {
        totalStages++;
      }
    
      completionPercentage = (completedStages / totalStages) * 100;
      console.log("Overall Completion: ", completionPercentage.toFixed(2));
    


      if (!tracker) {
        req.flash('tracker_404','Client not found');
        return res.status(404).redirect('/client/'+trackerId );
      }
      let stageStatus = tracker.stage.status
      tracker.stage.process_stage = newProcessStage;
      if (tracker.stage.process_stage === 'Service Subscription'){
        tracker.stage.status = tracker.service_interest.status
      } else if (tracker.stage.process_stage === 'Technical Info'){
        tracker.stage.status = tracker.Tech_info.status
      }else if (tracker.stage.process_stage === 'Registration & Testing'){
        tracker.stage.status = tracker.testing.testing_status
      }else{
        tracker.stage.status = completionPercentage;
        console.log("this is overall percentage: ", completionPercentage)
      }
      const stage = await tracker.save();
      console.log("Updates: ", stage.stage)
      req.flash('update_success','Stage status Updated')
      res.status(200).redirect('/');
    } catch (error) {
      console.error('Error updating tracker stage process:', error);
      req.flash('server_error','A server error occured. Try Again');
      res.status(500).redirect('/client/'+trackerId);    }
};

  const getAllCustomerTrackers = async (req, res) => {
    try {
      let totalStages = 0;
      let completedStages = 0;
      let completionPercentage = 0;
      let mytasks = [];
      let incompletePercentile = 0;
      const trackers = await Tracker.find().populate('account_manager');
      const myClients = [];
      const voip = [];
      const sms = [];
      const stages = ['Overall Completion', 'Service Subscription', 'Technical Info', 'Registration & Testing'];
  
      // console.log('TRACKERS: ', trackers)

      const overallCompletion = (completedStages / totalStages) * 100;

    // const voip = [];
    // const sms = [];
    // const stages = ['Overall Completion', 'Service Subscription', 'Technical Info', 'Registration & Testing'];

    for (const tracker of trackers) {
      const serviceName = tracker.service_interest.service_name;
      const trackerCompletedStages = (tracker.service_interest?.status === 'Complete' ? 1 : 0) +
        (tracker.Tech_info?.status === 'Complete' ? 1 : 0) +
        (tracker.testing?.testing_status === 'Completed' ? 1 : 0);
      const trackerTotalStages = 3;
      const trackerCompletionPercentage = (trackerCompletedStages / trackerTotalStages) * 100;

      tracker.completionPercentage = trackerCompletionPercentage.toFixed(2);
      tracker.overallCompletion = trackerCompletionPercentage;

      if (tracker.account_manager === req.user._id.toString()) {
        mytasks.push(tracker);
        
      }
    }
// get all user tasks
const task = await Task.find({taskFor:req.user._id}).populate('taskFor').populate('assignedBy').populate('reference')
    let tasks =[]
    let notes = []
    let referencet = {}
    task.forEach(task => {
      // if (req.user._id == task.taskFor._id) {
        if(task.reference){
          referencet = {
            id: task.reference._id,
            name: task.reference.CustomerName
          }
        }else { referencet = null}
        let task_ = {
          _id: task._id,
          title: task.title,
          description: task.description,
          taskFor: task.taskFor.name,
          assignedBy: task.assignedBy.name,
          reference: referencet,
          deadline: (task.deadline).toISOString().slice(0, 10),
          status: task.status,
          notes: task.notes
          ,
          files: task.files,
          date: task.date
        }
      tasks.push(task_)

      // } else {
        // console.log("User doesn't have any Task: ",req.user._id, " And Task: ", task[0].taskFor.name )
      
     
    })

    // console.log("THis is my tasks: ", tasks)
      // Retrieve all notes associated with the user ID
      const userId = req.user._id;
      const completedPercentile = (trackers.filter(tracker => tracker.overallCompletion === 100).length / trackers.length) * 100;
      
      let userNotes = await Note.find({ user: userId }).populate('tracker').populate('user');
      let myNotes = []
      // console.log("MY TASKS: ", mytasks);
      let flash = await req.flash('update_success')[0] || req.flash('permission')[0] || req.flash('register-success')[0];
      let error = req.flash('tracker_404' )[0] || req.flash('server_error')[0] || req.flash('unauthorized')[0]
  
      res.status(200).render('staff-home', {
        stages,
        pageTitle: "Home",
        user: await req.user,
        isAuthenticated: req.user.isLoggedIn,
        message: flash,
        error,
        mytasks,
        trackers,
        designation: req.user.designation,
        userNotes, // Add the userNotes array to the response
        completedPercentile: completedPercentile.toFixed(2),
        incompletePercentile: (100 - completedPercentile).toFixed(2),
        userNotes,
        tasks

      });
    } catch (error) {
      console.error('Error retrieving trackers:', error);
      res.status(500).redirect('/500');
    }
  };
  
  
  

  const getSingleTracker = async (req, res) => {
    const { id } = req.params;
  
    try {
      const tracker = await Tracker.findById(id)
        .populate('documents')
        .populate('alternative_contact')
        .populate('notes');
      const Notes = await Note.find({tracker:id}).populate('user')
  
      if (!tracker) {
        req.flash('tracker_404', 'Client not found!')
        return res.status(404).redirect('/')
      }
  
      const documentTypes = {
        pdf: 'pdf',
        xls: 'excel',
        doc: 'docs',
        png: 'png',
        jpg: 'jpg',
      };
  
      const documents = tracker.documents.map((doc) => {
        const documentPath = doc.documentPath;
        const documentId = doc._id;
        const documentTitle = doc.documentTitle;
        const tags = doc.tags;
        const userId = doc.userId;
        const extension = documentPath.split('.').pop().toLowerCase();
        const documentType = documentTypes[extension] || 'none';
  
        let isPermitted = false;
        for (const tag of tags) {
          if (
            tag.user &&
            tag.user.equals(req.user._id) &&
            tag.permission === 'Read_Update'
          ) {
            isPermitted = true;
            break;
          }
        }
       
        return { documentId, documentPath, documentType, documentTitle, tags, isPermitted, userId };
      });
  
      let isLegal = false;
      if (req.user && req.user.role && req.user.role == 'Legal') {
        isLegal = true;
      }
  
      let isAccountManager = false;
      if (req.user && req.user._id && tracker.account_manager == req.user._id.toString()) {
        isAccountManager = true;
      }
  
      let mytasks = [];
      if (req.user && req.user._id && tracker.account_manager == req.user._id) {
        mytasks.push(tracker);
      }
  
      let role = req.user && req.user.role;
  
      let users = [] 
      const reqUsers = await User.find();
      for (i in reqUsers){
          let user = {
          name: reqUsers[i].name,
          id: reqUsers[i]._id,
          designation: reqUsers[i].designation
        }
        users.push(user)
      }
      const notes = [];
      for (const note of Notes) {
        let message = {
          createdAt: (note.createdAt).toISOString().slice(0, 19).replace('T', ' '),
          id: note._id,
          user: note.user.name,
          note: note.note,
        };
        notes.push(message)
    }
     print("THIS IS TRACKER NOTES: ", notes)
      
      let flash = await req.flash('update_success')[0] || req.flash('permission')[0] || req.flash('register-success')[0];
      let error = req.flash('tracker_404' )[0] || req.flash('unauthorized')[0] || req.flash('server_error')[0]; 
      // console.log("unauthorized message: ", error);
      // console.log('Tracker: ', tracker)
      const userId = req.user._id;
      const tasks = await Task.find({ taskFor: userId }).populate('taskFor');
      res.render('staff-single', {
        pageTitle: tracker.Customer_Name,
        Tracker: tracker,
        documents: documents,
        more_contacts: tracker.alternative_contact,
        user: req.user,
        isAuthenticated: req.user && req.user.isLoggedIn,
        isLegal: isLegal,
        designation: req.user.designation, 
        isAccountManager: isAccountManager,
        mytasks: mytasks,
        role: role,
        tasks,
        isStaff: false,
        message:flash,
        error: error,
        notes,
        users,
      
      });
    } catch (error) {
      console.log(error);
      req.flash('server_error', "Server error has occured. Please try again.")
      res.status(500).redirect('/');
    }
  };
  
  
  // GET USER SINGLE TASK
  const getSingleTask = async (req, res) => {
    try {
        const _id = req.params.taskId;
        const task = await Task.find({ _id}).populate('taskFor').populate('assignedBy').populate('reference');
        let taskss =[]
        let notes = []
        let referencet = {}
        task.forEach(task => {
          if(task.reference){
            referencet = {
              id: task.reference._id,
              name: task.reference.CustomerName
            }
          }else { referencet = null}
          let task_ = {
            _id: task._id,
            title: task.title,
            description: task.description,
            taskFor: task.taskFor.name,
            assignedBy: task.assignedBy.name,
            reference: referencet,
            deadline: (task.deadline).toISOString().slice(0, 10),
            status: task.status,
            notes: task.notes
            ,
            files: task.files,
            date: task.date,

          }
          taskss.push(task_)
        })
        // print(req.user)
        let flash = await req.flash('update_success')[0] || req.flash('permission')[0] || req.flash('register-success')[0];
        let error = req.flash('tracker_404' )[0] || req.flash('server_error')[0] || req.flash('unauthorized')[0]
        // console.log('This is your task ', task)
        const userId = req.user._id;
    const tasks = await Task.find({ taskFor: userId }).populate('taskFor');
        res.status(200).render('task', {
            pageTitle: tasks[0].title,
            task: taskss[0],
            isAuthenticated: req.user.isLoggedIn,
            message: flash,
            error,
            designation: req.user.designation,
            user: req.user,
            tasks,
            stages: ['Received', 'Ongoing', 'Complete']


        });
    } catch (error) {
        print({ message: 'Error fetching tasks for user', error: error.message });
        req.flash('server_error', "Error fetching Task. Try Again")
        res.status(201).redirect('/');
    }
};

  

const addNote = async (req, res) => {
  const { clientId, userId, note } = req.body;
  console.log("Adding notes to user: ", req.body);

  try {
    const trackerNote = new Note({
      tracker: clientId,
      user: userId || req.user._id,
      note,
    });

    const savedNote = await trackerNote.save();

    // Update the tracker's notes array
    const tracker = await Tracker.findById(clientId);

    if (!tracker) {
      req.flash('tracker_404','Client not found');
      return res.status(404).redirect('/client/'+id);

    }

    tracker.notes.push(savedNote._id); // Add the note ID to the tracker's notes array

    await tracker.save(); // Save the updated tracker

    req.flash('update_success','Note has been added successfully')
    res.status(200).redirect('/client/' + clientId);
  } catch (error) {
    console.error('Error adding note to tracker:', error);
    req.flash('server_error','A server error occured. Try Again')
    res.status(500).redirect('/client/'+id)
  }
};

// Update Document

// Controller function to update date and document path
async function updateDocument(req, res) {
  const {  path, originalname, customerRefId } = req.body;
  const {id} = req.params
print("UPDATING FUNCTION HERE: ", id)
print("UPDATING FUNCTION HERE, FILE;: ", req.user._id)

  try {
    // Find the document by ID
    const document = await Document.findById(id);

    if (!document) {
      // req.flash('not-found', 'Document Not Found')
      // return res.status(404).redirect('/track/tracker/' + document.customerRefId);
      req.flash('tracker_404','Client not found');
      return res.status(404).redirect('/client/'+customerRefId);
    }

    // Check if the user is the uploader or has "Read_Update" permission in the tags
    const isUploader = document.userId.equals(req.user._id);
    const hasPermission = document.tags.some(tag => tag.user.equals(req.user._id) && tag.permission === 'Read_Update');

    if (!isUploader && !hasPermission) {
      console.log("YOU DON'T HAVE PERMISSION");
      req.flash('unauthorized', 'You\'re not authorized to perform this action. Contact Admin.');
      return res.status(402).redirect('/client/' + customerRefId);
      // return res.status(404).redirect('/client/' + document.customerRefId);

      // throw new Error('t');
    }
    // 649181d06c54fadcfd174783
    // Update the document fields
    
    const oldDocument = document.documentPath;
    document.documentPath = req.file.path;
    document.dateUploaded = Date.now();
    fs.unlink(oldDocument, async (err) => {
  if (err) {
      throw err;
  }

  console.log("Delete File successfully.");

    // Save the updated document
    print('NEW RefId: ', document.customerRefId)
    await document.save();
    req.flash('update_success', "Document has been updated sucessfully.")
    return res.status(200).redirect('/client/'+ customerRefId);
  });
  } catch (error) {
    console.error(error);
    // req.flash('server-error', 'Your document has not been updated. Please Try Again.')
    // return res.status(500).json({ error: 'Internal server error' });
    req.flash('server_error','A server error occured. Try Again')
    res.status(500).redirect('/500')  
  }
  
}

const updateEmergencyContact = async (req, res) => {
  const userId = req.params.id;

  try {
      const {ecname, pNUmber, relationship, Address} = req.body;

        let updatedEmergencyContact = {
          name: ecname,
          relationship: relationship,
          phone: pNUmber,
          Address: Address
        }
      // Find the user by ID
      const user = await User.findById(userId);
      if (!user) {
        req.flash('server_error', "User not found")
        return res.status(404).redirect('/user/user-record/'+userId );
      }

      // Update the emergency contact fields
      user.profile.emergency_contact = updatedEmergencyContact;

      // Save the updated user
      await user.save();

      req.flash('update_success', "Emergency contact successfully updated")
      // return res.status(404).redirect('/user/user-record/' );

      if (req.user.designation === "Admin" || req.user.designation === "Management"){
        return res.status(200).redirect('/track/admin/user/user-record');
      }else if (req.user.designation === "HoIT" || req.user.designation === "NOC-TL") {
        return res.status(200).redirect('/mm/user/user-record/')
      } else {
        return res.status(201).redirect('/ss/user/user-record/');
      }
    
  } catch (error) {
      res.status(500).json({ message: 'Error updating emergency contact', error: error.message });
  }
};


const addFileToTask = async (req, res) => {
  const taskId = req.params.taskId;
console.log("We're getting to add file", req.file)
  try {
      const { filename, originalname } = req.file;
      let uploadedBy = req.user.name;
      const task = await Task.findById(taskId);
      if (!task) {
          print({ message: 'Task not found' });
          req.flash('server_error', "Error adding file to task. Try Again")
          return res.status(201).redirect('/mm/task/'+taskId);
      } 
      
      task.files.push({ filename:originalname, uploadedBy });
      const updatedTask = await task.save();
      print("This is File: ", filename,)
      req.flash('update_success', "File Successfully added ")
      res.status(201).redirect('/tasks/task/'+taskId);
  } catch (error) {
      print({ message: 'Error adding file to task', error: error.message });
      req.flash('server_error', "Error adding file to task. Try Again")
      res.status(201).redirect('/tasks/task/'+taskId);
  }
};


const addNoteToTask = async (req, res) => {
  try {
      const taskId = req.params.taskId;
      const { note } = req.body;
      let postedBy = req.user.name
      
      const task = await Task.findById(taskId);
      if (!task) {
          print({ message: 'Task not found' });
          req.flash('server_error', "Error adding file to task. Try Again")
          return res.status(201).redirect('/tasks/task/'+taskId);
      }
      
      task.notes.push({note,postedBy});
      const updatedTask = await task.save();
      req.flash('update_success', "Note Successfully added ")
      res.status(201).redirect('/ss/tasks/task/'+taskId);
      // res.json(updatedTask);
      print('The body: ', postedBy, "\n Body: ", req.body)

  } catch (error) {
      print({ message: 'Error adding note to task', error: error.message });
      req.flash('server_error', "Error adding note to task. Try Again")
      res.status(201).redirect('/ss/tasks/task/'+taskId);
  }
};

const deleteFileFromTask = async (req, res) => {
  const taskId = req.params.taskId;

  try {
      const fileIndex = req.params.fileIndex;
      
      const task = await Task.findById(taskId);
      if (!task) {
          print({ message: 'Task not found' });
          req.flash('server_error', "Error adding file to task. Try Again")
          return res.status(201).redirect('/tasks/task/'+taskId);
      }
      let filePath = './uploads/'+task.files[0].filename
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
      req.flash('update_success', "File Deleted Successfully ")
      return res.status(201).redirect('/tasks/task/'+taskId);
      // res.json(updatedTask);
      // console.log("This the file being deleted: ", fileIndex, " from: ", taskId)
      // req.flash('update_success', "File Deleted Successfully ")
      // res.status(201).redirect('/tasks/task/'+taskId);
  } catch (error) {
      print({ message: 'Error deleting file from task', error: error.message });
      req.flash('server_error', "Error deleting note. Try Again")
      res.status(201).redirect('/tasks/task/'+taskId);
  }
};


const editTaskStatus = async (req, res) => {
  const taskId = req.params.taskId;

  try {
    const { status } = req.body;

    console.log("THIS IS THE STATUS: ", status);
    
    const updatedTask = await Task.findByIdAndUpdate(taskId, { status }, { new: true });
    
    if (!updatedTask) {
      req.flash('server_error', "Error updating task status. Task not found");
      return res.status(404).redirect('/tasks/task/' + taskId);
    }

    req.flash('update_success', "Task status updated successfully");
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
    if (req.user.designation === "Admin" || req.user.designation === "Management"){
      return res.status(200).redirect('/admin/task/'+taskId)
    }else if (req.user.designation === "HoIT" || req.user.designation === "NOC-TL") {
      return res.status(200).redirect('/mm/task/'+taskId)
    } else {
      return res.status(201).redirect('/ss/tasks/task/'+taskId);
    }
  }
};

// Function to get all weekly reports for staff
async function getAllWeeklyReportsStaff(req, res) {
  try {
    // Find all weekly reports in the collection
    const weeklyReports = await WeeklyReport.find({});
    let wklr = []
    for (i in weeklyReports){
      let report= {
        isSubmitted: weeklyReports[i].isSubmitted,
        _id: weeklyReports[i]._id,
        update: weeklyReports[i].update,
        alertActive: weeklyReports[i].alertActive,
        tickets: weeklyReports[i].tickets,
        dateGenerated: weeklyReports[i].dateGenerated.toISOString().split('T')[0],
      }
      wklr.push(report)
    }
    const userId = req.user._id;
    const tasks = await Task.find({ taskFor: userId }).populate('taskFor');
    console.log("REPORTS: ", weeklyReports)
    return res.render('WeeklyReportsList-ss', {
      pageTitle: 'Weekly Reports',
      user: req.user,
      wkReports: wklr,
      designation: req.user.designation,
      isAuthenticated: req.user.isLoggedin,
      mytasks: tasks,
      tasks,
      completedPercentile: "",
      incompletePercentile: ""


    });
  } catch (error) {
    console.error(error); // Log the error for debugging
    return res.status(500).json({ error: 'An error occurred while fetching weekly reports.' });
  }
}

async function fetchLastMondayData(req, res) {
  try {
     
      // 88888888888888888888888888888888888

      // Calculate the date range for the current week (from Monday)
      //  const today = new Date();
      //  const monday = new Date(today);
      //  monday.setDate(today.getDate() - ((today.getDay() - 1 + 7) % 7));

      // Check if a report already exists for the current week
      const existingReport = await WeeklyReport.findOne({
        dateGenerated: { $gte: lastMonday, $lt: new Date() }
      });
      console.log("This Is last Monday's report: ", existingReport)
      if (existingReport) {
          // Redirect to the existing report if it exists
          return res.redirect(`/ss/wr/reports/report/${existingReport._id}`);
          // return console.log("Report Found: ")
      }

      // Create a new report for the current week
      const newReport = new WeeklyReport({ date: lastMonday });
      console.log("Creating new Report: ", newReport)
      // Fetch performances from last Monday
      const performances = await Performance.find({
        date: { $gte: lastMonday, $lt: today }
      }).populate('tracker', 'Customer_Name CB CL _id');

      // Initialize an object to store carrier performances
      const carrierPerformances = {};

      // Iterate through performances and organize them by carrier
      performances.forEach((performance) => {
        const carrierId = performance.tracker._id.toString();

        // Initialize carrier if it doesn't exist in the object
        if (!carrierPerformances[carrierId]) {
            carrierPerformances[carrierId] = {
                carrier: {
                    _id: carrierId,
                    Customer_Name: performance.tracker.Customer_Name,
                    CB: performance.tracker.CB,
                    CL: performance.tracker.CL,
                },
                totalMinutesRoutesTerminated: 0,
            };
        }

        // Add the minutesRoutesTerminated to the carrier's total
        carrierPerformances[carrierId].totalMinutesRoutesTerminated += performance.minutesRoutesTerminated;
      });

      // Convert the object of carrier performances to an array
      const carrierPerformanceArray = Object.values(carrierPerformances);

      // console.log("Performances from Active carriers: ", carrierPerformanceArray)
      // Fetch tickets from last Monday
      const tickets = await Ticket.find({
        date: { $gte: lastMonday, $lt: today }
      }).populate('client', '_id Customer_Name').populate('assignee', '_id name');

      // console.log("TICKETS: ", tickets)
      // Fetch all weekly reports from the database
   

      const formattedLastMonday = lastMonday.toLocaleString(undefined, startR);
      const formattedToday = today.toLocaleString(undefined, options);

      // Combine the formatted dates into ReportDateRange
      const ReportDateRange = `${formattedLastMonday} - ${formattedToday}`;

      const updates = await Update.find({
        dateCreated: { $gte: lastMonday, $lt: new Date() }
      }).populate('postedBy', 'name _id');

      // print("Performance: ", performances)
      // print("Tickets: ", tickets)
      // print("weeklyReports: ", weeklyReports)

      // console.log("Updates: ", updates)

      newReport.update = updates/* Add the updates data */;
      newReport.dateGenerated = new Date();
      newReport.tickets = tickets/* Add the tickets data */;

      print("Your Weekly Report Performances: ", performances)
      // Save the newReport to the database
      await newReport.save();

        return res.redirect(`/ss/wr/reports/report/${newReport._id}`);


      // Respond with the fetched data
      // return res.status(200).render('wReport',{
      //     performances: carrierPerformanceArray,
      //     tickets,
      //     updates,
      //     report: newReport,
      //     pageTitle: "Reports",
      //     designation: 'NOC-TL',
      //     isAuthenticated: true,
      //     user: req.user,
      //     ReportDateRange
      // });
  } catch (error) {
      console.error('Error fetching data:', error);
      return res.status(500).json({ error: 'Server error' });
  }
}



const renderWReport = async (req, res) => {
  // Fetch all weekly reports from the database
  const weeklyReports = await WeeklyReport.findById(req.params.id);
  // print("One Report: ", weeklyReports)

  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 (Sunday) to 6 (Saturday)
  const daysUntilMonday = (dayOfWeek === 0) ? 1 : (8 - dayOfWeek);

  const firstMonday = new Date(now);
  firstMonday.setDate(now.getDate() + daysUntilMonday);
    try {
      const updates = await Update.find({
        dateUpdated: { $gte: lastMonday, $lt: new Date() }
      }).populate('postedBy', 'name _id');
      
      const formattedLastMonday = lastMonday.toLocaleString(undefined, startR);
      const formattedToday = today.toLocaleString(undefined, options);

      // Combine the formatted dates into ReportDateRange
      const ReportDateRange = `${formattedLastMonday} - ${formattedToday}`;

      const tickets = await Ticket.find({
        date: { $gte: lastMonday, $lt: today }
      }).populate('client', '_id Customer_Name').populate('assignee', '_id name');
      let ticks = []
      tickets.forEach((tick) => {
        const date = new Date(tick.date);
        tick.date = date.toISOString().split('T')[0];
        // console.log("This is the date: ", tick.date);
        ticks.push(tick);
      });
      // print("This is ticket: ", ticks)
      // console.log("First Monday: ", lastMonday);
      // console.log("Now: ", today);
      // console.log("This is ticket: ", tickets);

      const performances = await Performance.find({
        date: { $gte: lastMonday, $lt: today }
      }).populate('tracker', 'Customer_Name CB CL _id');

      const pperformances = await Performance.find().populate('tracker', 'Customer_Name CB CL _id');
      
      // Filter performances that occurred from last Monday to today
    const performancesFromLastMonday = pperformances.filter((performance) => {
      const performanceDate = new Date(performance.date); // Assuming 'date' is a property in your performance object
      return performanceDate >= lastMonday && performanceDate <= new Date();
    
      });
      console.log('This is unfiltered Performance: ', performancesFromLastMonday)
      // Initialize an object to store carrier performances
      const carrierPerformances = {};

      // Iterate through performances and organize them by carrier
      pperformances.forEach((performance) => {
        const carrierId = performance.tracker._id.toString();

        // Initialize carrier if it doesn't exist in the object
        if (!carrierPerformances[carrierId]) {
            carrierPerformances[carrierId] = {
                carrier: {
                    _id: carrierId,
                    Customer_Name: performance.tracker.Customer_Name,
                    CB: performance.tracker.CB,
                    CL: performance.tracker.CL,
                },
                totalMinutesRoutesTerminated: 0,
            };
        }

        // Add the minutesRoutesTerminated to the carrier's total
        carrierPerformances[carrierId].totalMinutesRoutesTerminated += performance.minutesRoutesTerminated;
      });

      // Convert the object of carrier performances to an array
      const carrierPerformanceArray = Object.values(carrierPerformances);


      weeklyReports.update = updates/* Add the updates data */;
      // weeklyReports.dateGenerated = new Date();
      weeklyReports.tickets = ticks/* Add the tickets data */;

      const mytask = await Task.find({taskFor: req.user._id}).populate('assignedBy', 'name');
      let UnopenedTask = []
      mytask.forEach( (task) => {

        if (task.isOpened){
          UnopenedTask.push(task)
        }
      })

      // get trackers to allow selection
      const trackers = await Tracker.find()

      let allRates = []
      const rates = await Rate.find({ wklReport: req.params.id }).populate('carrier', 'Customer_Name _id');
      for (i in rates ){
        let rate = {
          carrier: rates[i].carrier ,
          wklReport: rates[i].wklReport,
          dateReceived: rates[i].dateReceived.toISOString().split('T')[0], 
          documentPath: rates[i].documentPath,
          documentTitle: rates[i].documentTitle,
        }
        allRates.push(rate)
      }
      // print("Your updates: ", weeklyReports.update)
      weeklyReports.save();
      print("Performances: ", pperformances)
      const userId = req.user._id;
    const tasks = await Task.find({ taskFor: userId }).populate('taskFor');
     if(req.user.desgination == 'Admin' || req.user.designation == 'Management'){
      res.render('wReport', { 
        weeklyReports,
        performance: carrierPerformanceArray,
        tickets: ticks,
        updates: weeklyReports.update,
        pageTitle: "Report |" + new Date(),
        designation: req.user.designation,
        isAuthenticated: req.user.isLoggedin,
        user: req.user,
        ReportDateRange,
        mytask: tasks,
        tasks: tasks,
        UnopenedTask, 
        trackers,
        rates: allRates
     });
    }else {
      res.render('wReport-mm', { 
        weeklyReports,
        performance: carrierPerformanceArray,
        tickets: ticks,
        updates: weeklyReports.update,
        pageTitle: "Reports | " + new Date(),
        designation: req.user.designation,
        isAuthenticated: req.user.isLoggedin,
        user: req.user,
        ReportDateRange,
        mytask: tasks,
        tasks: tasks,
        UnopenedTask, 
        trackers,
        rates: allRates
     });
    }

    } catch (error) {
      // Handle errors, e.g., database connection issues
      console.error('Error fetching weekly reports:', error);
      res.status(500).send('Server Error');
    }
  };
  
  // Controller function to render the "wReport-Single" HTML template for a specific report by ID
  const renderWReportSingle = async (req, res) => {
    const { id } = req.params;
  
    try {
      // Fetch the specific weekly report by ID from the database
      const weeklyReport = await WeeklyReport.findById(id);
  
      if (!weeklyReport) {
        // Report not found, handle this case as needed
        return res.status(404).send('Report not found');
      }
  
      // Render the "wReport-Single" template with the fetched data
      res.render('wReport-Single', { 
        weeklyReport,  
        user: req.user,
        pageTitle: "Weekly Report",
        designation: req.user.designation,
        isAuthenticated: req.user.isLoggedin,
        user: req.user,
        ReportDateRange: "",
      
      });
    } catch (error) {
      // Handle errors, e.g., database connection issues
      console.error('Error fetching weekly report:', error);
      res.status(500).send('Server Error');
    }
  };


  module.exports = 
{ 
    updateTesting,
    addContact,
    updateTech,
    getAllCustomerTrackers,
    getSingleTracker,
    addNote,
    updateDocument,
    updateTrackerStage,
    grantDocumentPermission,
    updateEmergencyContact,
    getSingleTask,
    addNoteToTask,
    addFileToTask,
    deleteFileFromTask,
    editTaskStatus,
    getAllWeeklyReportsStaff,
    fetchLastMondayData,
    renderWReportSingle,
    renderWReport
    
    
};