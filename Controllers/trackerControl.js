const Tracker = require('../Models/tracker');
const Document = require('../Models/document');
const Contact = require('../Models/contact');
const Log = require('../Models/log');
const User = require('../Models/user');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const { Types } = require('mongoose');
const Note = require('../Models/note');
const mongoose = require('mongoose');
const Performance = require('../Models/performance');
const Task = require('../Models/task');

const print = console.log

// Currency Formater

let currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

// console.log(`The formated version of ${price} is ${}`);



const uploadDocument = async (req, res) => {333
  try {
    const { documentTitle } = req.body;
    const userId = req.user._id;
    const { id: customerRefId } = req.params;
print(req.file)
    // Extract the original document name
    const documentPath = req.file.path;
    const originalname = req.file.originalname;

    // Create a new document instance
    const document = new Document({
      userId,
      documentTitle,
      documentPath,
      originalname,
      customerRefId
    });

    await document.save();

    // Find the tracker associated with the customerRefId
    const tracker = await Tracker.findOne({ _id: customerRefId });

    if (!tracker) {
      req.flash('tracker_404','Client not found');
      return res.status(404).redirect('/track/tracker/'+id);
    }

    // Add the documentId to the tracker's documents field
    tracker.documents.push(document._id);

    await tracker.save();

    if (req.user.role != "Admin" ||req.user.role != "Management" || req.user.role != "HoIT" || req.user.role != "NOC-TL"){
      req.flash('update_success','Document Uploaded');

      return res.status(200).redirect('/client/' + customerRefId);
    } else if (req.user.role != "HoIT" || req.user.role != "NOC-TL"){
      req.flash('update_success','Document Uploaded');

      return res.status(200).redirect('/track/tracker/' + customerRefId);
    }else {
      req.flash('update_success','Document Uploaded');

      return res.status(200).redirect('/mm/tracker/' + customerRefId);
    }
  } catch (error) {
    console.error('Error uploading document:', error);
    req.flash('server_error','A server error occured. Try Again');
    res.status(500).redirect('/500') ;
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
      return res.status(404).redirect('/track/tracker/'+document.customerRefId);
    }

    // Check if the user is the uploader or has "Read_Update" permission in the tags
    const isUploader = document.userId.equals(req.user._id);
    const hasPermission = document.tags.some(tag => tag.user.equals(req.user._id) && tag.permission === 'Read_Update');

    if (!isUploader && !hasPermission) {
      req.flash('unauthorized', 'You\'re not authorized to perform this action. Contact Admin.')
      return res.status(404).redirect('/track/tracker/' + document.customerRefId);
      // return res.status(404).redirect('/track/tracker/' + document.customerRefId);

      // throw new Error('t');
    }
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

    if (req.user.role != "Admin"){
      req.flash('update_success', "Document has been updated sucessfully.")
      res.status(200).redirect('/client/' + customerRefId);
    } else {
      req.flash('update_success', "Document has been updated sucessfully.")
      res.status(200).redirect('/track/tracker/' + customerRefId);
    }
  });
  } catch (error) {
    console.error(error);
    // req.flash('server-error', 'Your document has not been updated. Please Try Again.')
    // return res.status(500).json({ error: 'Internal server error' });
    req.flash('server_error','A server error occured. Try Again')
    res.status(500).redirect('/track/tracker/' + customerRefId)  
  }
  
};

// **************** Start document delete function 

async function deleteDocument(id, userId) {
    try {
        const document = await Document.findById(id);

        if (!document) {
            throw new Error('Document not found');
        }

        // Check if the user is the uploader or has "Read_Update" permission in the tags
        const isUploader = document.userId.equals(userId);
        const hasPermission = document.tags.some(tag => tag.user.equals(userId) && tag.permission === 'Read_Update');

        if (!isUploader && !hasPermission) {
            throw new Error('Unauthorized');
        }

        // Delete the document file from the local folder
        fs.unlink(document.documentPath, async (err) => {
            if (err) {
                throw err;
            }

            console.log('Deleted file successfully.');

            // Remove the document from the database
            await Document.findByIdAndDelete(id);
        });
    } catch (error) {
        throw error;
    }
}

// Usage
async function deleteAndUpdateDocument(req, res) {
    const { id, carrierId, userId } = req.params;
    // const userId = req.user._id;
print("Delete files: ", req.params);
    try {
        // await deleteDocument(id, userId);
        // Perform any additional actions or redirects here
        res.redirect('/track/tracker/'+carrierId)
    } catch (error) {
        console.error(error);
        // Handle error, possibly show a flash message and redirect
    }
};
// *******************End of Delete document


// Grant Document Permission
 
// const mongoose = require('mongoose');

const grantDocumentPermission = async (req, res) => {
  try {
    const id = req.params.id || req.body.document;
    const { userId, permission } = req.body;

    const document = await Document.findById(id);

    // console.log('This is the document ID: ', id);
    // console.log('This is the BODY: ', req.body);
    // console.log('This is the document : ', document);


    if (!document) {
      req.flash('tracker_404', 'Document not found');
      print('NO SUCH DOCUMENT')
      return res.status(404).redirect('/track/tracker/' + id);
    }

    // Check if the user has permission to grant document permission
    const loggedInUserId = req.user._id;

    if (req.user.role !== 'Admin' && document.userId.toString() !== loggedInUserId.toString() ) {
      req.flash('unauthorized', 'Not Authorized!');
      console.log('UNAUTHORIZED')
      return res.status(403).redirect('/track/tracker/' + document.customerRefId);
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
    res.status(200).redirect('/track/tracker/' + document.customerRefId);
  } catch (error) {
    console.error('Error granting document permission:', error);
    req.flash('server_error', 'A server error occurred. Try again');
    res.status(500).redirect('/500');
  }
};





// Assign Account manager

const assignTaskToUser = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
print('ASSIGN BODY: ', req.body)
  try {
    // Find the user by userId
    const user = await User.findById(userId);

    // Check if the user is already assigned the task
    if (user.assignedTasks.includes(id)) {
      req.flash('task_already_assigned', 'This task is already assigned to the user.');
      console.log("Already assigned")
      return res.status(400).redirect('/track/tracker/' + id);
    }

    // Find the tracker by id
    const tracker = await Tracker.findById(id);

    // Check if the tracker already has an account_manager
    if (tracker.account_manager) {
      req.flash('account_manager_assigned', 'This tracker already has an account manager.');
      return res.status(400).redirect('/track/tracker/' + id);
    }

    // Assign the tracker to the user's assignedTasks field
    user.assignedTasks.push(id);
    await user.save();

    // Update the tracker's account_manager field
    tracker.account_manager = user._id;
    await tracker.save();

    req.flash('update_success', 'Account Manager Successfully Assigned!');
    res.status(200).redirect('/track/tracker/'+id);
  } catch (error) {
    console.error('Error assigning task to user:', error);
    req.flash('server_error', 'A server error occurred. Try Again');
    res.status(500).redirect('/track/tracker/' + id);
  }
};


// *****************end ******************************



// Create Note 
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
      return res.status(404).redirect('/track/tracker/'+id);

    }

    tracker.notes.push(savedNote._id); // Add the note ID to the tracker's notes array

    await tracker.save(); // Save the updated tracker

    req.flash('update_success','Note has been added successfully')
    res.status(200).redirect('/track/tracker/' + clientId);
  } catch (error) {
    console.error('Error adding note to tracker:', error);
    req.flash('server_error','A server error occured. Try Again')
    res.status(500).redirect('/track/tracker/'+clientId)
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
      return res.status(404).redirect('/track/tracker/'+id);
    }

    // Add the uploaded document to the documents array in the Tracker document
    tracker.alternative_contact.push(savedContact._id);

    // Save the updated Tracker document
    await tracker.save();
    req.flash('update_success','New contact has been added successfully')
    // res.status(200).redirect('/track/tracker/'+customerRefId);
    if (req.user.designation === "Admin" || req.user.designation === "Management"){
      return res.status(200).redirect('/track/tracker/'+customerRefId)
    }else {
      return res.status(200).redirect('/mm/tracker/'+customerRefId)
    }
  } catch (error) {
    console.error('Error uploading document:', error);
    req.flash('server_error','A server error occured. Try Again')
    // res.status(500).redirect('/track/tracker/'+customerRefId)
    if (req.user.designation === "Admin" || req.user.designation === "Management"){
      return res.status(200).redirect('/track/tracker/'+customerRefId)
    }else {
      return res.status(200).redirect('/mm/tracker/'+customerRefId)
    }
  }
};



const updateTracker = async (req, res) => {
  let trackerId = req.params.id
  try {
      const {
        Customer_Name,
        building_number,
        street,
        city,
        zip,
        country,
        platform,
        contact_link,
        service_name,
        routes,
        rates_offered,
        currency,
        SI_status,
        TI_service_name,
        signalling_Ip,
        media_Ip,
        prefix,
        port,
        codices,
        routes_to_test,
        trunk,
        date_started,
        date_finished,
        testing_status,
        TI_status
      } = req.body;
  
console.log("This is your input: ", req.body);


      const address = {
        building_number,
        street,
        city,
        zip,
        country
      };
  
      const contact_point = {
        platform,
        contact_link
      };
  
      const service_interest = {
        service_name,
        routes,
        rates_offered,
        currency,
        status:SI_status
      };
  
      const Tech_info = {
        TI_service_name,
        signalling_Ip,
        media_Ip,
        prefix,
        port,
        codices, 
        status: TI_status
      };
  
      const testing = {
        routes_to_test,
        trunk,
        date_started,
        date_finished,
        testing_status
      };
  
      const updatedTracker = await Tracker.findByIdAndUpdate(
        trackerId,
        {
          Customer_Name,
          address,
          contact_point,
          service_interest,
          Tech_info,
          testing
        },
        
      );
  
      if (!updatedTracker) {
        // throw new Error('Tracker not found');
        req.flash('update_error', 'Cannot update client')
        res.redirect('/client/'+trackerId)
      }
      req.flash('update_success', 'The client\'s info has been updated');
      res.status(201).redirect('/client/'+trackerId)
    } catch (error) {
      console.error(error);
      // throw new Error('Failed to update customer tracker');
      req.flash('server_error','A server error occured. Try Again')
      res.status(500).redirect('/client/'+trackerId)
    }
};






// Add a new customer tracker
const addCustomerTracker = async (req, res) => {
  
 try{
    const {
      Customer_Name,building_number, street, city,zip, country, platform, contact_link, service_name, routes,rates_offered, currency,  SI_status,
      TI_service_name, signalling_Ip,  media_Ip,   prefix,  port, codices, routes_to_test,  trunk,  date_started,  date_finished,  testing_status
    } = req.body;
    const address = {building_number, street, city, zip, country };

    const contact_point = { platform, contact_link};

    const service_interest = { service_name,  routes, rates_offered,  currency, SI_status};

    const Tech_info = {TI_service_name, signalling_Ip, media_Ip, prefix, port, codices };

    const testing = {routes_to_test, trunk, date_started, date_finished, testing_status};

    const customerTracker = new Tracker({Customer_Name,  address, contact_point, service_interest, Tech_info, testing});
    
    const savedTracker = await customerTracker.save();
    req.flash('update_success', 'Client registered successfully');
    if (req.user.designation === "Admin" || req.user.designation === "Management"){
      return res.redirect('/track/home')
    }else {
      return res.redirect('/mm/dashboard')
    }
} catch (error) {
    console.error(error);
    // throw new Error('Failed to add customer tracker');
    req.flash('server_error','One or more field(s) are required. Try Again')
    if (req.user.designation === "Admin" || req.user.designation === "Management"){
      return res.status(500).redirect('/track/Newclient')
    }else {
      return res.redirect('/mm/dashboard')
    }
}
};

const updateCustomerTracker = async (req, res) => {
    const trackerId = req.params.id; // The actual tracker ID
    const updateData = req.body; // Assuming the update data is coming from the request body
    const updatedTracker = await updateTracker(trackerId, updateData);
    res.json(updatedTracker);

};




const updateAddress = async (req, res) => {
  try {
    const { id } = req.params; // Get the tracker ID from the request params
    const { building_number, street, city, zip, country } = req.body; // Get the updated address from the request body
    console.log("This ", req.user.designation, "Updating: ", req.body)
    // Find the Tracker document by ID
    const tracker = await Tracker.findById(id);

    if (!tracker) {
      req.flash('tracker_404','Client not found')
      return res.status(404).redirect('/track/tracker'+id);
    }

    // Update the address fields
    tracker.address.building_number = building_number;
    tracker.address.street = street;
    tracker.address.city = city;
    tracker.address.zip = zip;
    tracker.address.country = country;

    // Save the updated Tracker document
    await tracker.save();
    // console.log("Changing: ", req.body)
    req.flash('update_success','Address Updated')
    // res.status(200).redirect('/track/tracker/'+req.params.id);
    if (req.user.designation == "Admin" || req.user.designation == "Management"){
      return res.status(200).redirect('/track/tracker/'+req.params.id)
    }else {
      return res.status(200).redirect('/mm/tracker/'+req.params.id)
    }
  } catch (error) {
    console.error('Error updating address:', error);
    req.flash('server_error','A server error occured. Try Again')
    if (req.user.designation === "Admin" || req.user.designation === "Management"){
      return res.status(500).redirect('/track/tracker/'+req.params.id)
    }else {
      return res.status(500).redirect('/mm/tracker/'+req.params.id)
    }
  }

};


const updateService = async (req, res) => {
  try {
    const { id } = req.params; // Get the tracker ID from the request params
    const { service_name, routes, rates_offered, currency, status } = req.body; // Get the updated address from the request body
    console.log("Body: ", req.body.street)
    // Find the Tracker document by ID
    const tracker = await Tracker.findById(id);

    if (!tracker) {
      req.flash('tracker_404','Client not found')
      return res.status(404).redirect('/track/tracker'+id);
    }

    // Update the address fields
    tracker.service_interest.service_name = service_name;
    tracker.service_interest.routes = routes;
    tracker.service_interest.rates_offered = rates_offered;
    tracker.service_interest.currency = currency;
    tracker.service_interest.status = status;

    // Save the updated Tracker document
    await tracker.save(); 
    // console.log("Changing: ", req.body)
    req.flash('update_success','Services Updated')
    // res.status(200).redirect('/track/tracker/'+req.params.id);
    print("Redirecting you back Home");

    if (req.user.designation === "Admin" || req.user.designation === "Management"){
      return res.status(200).redirect('/track/tracker/'+req.params.id)
    }else if (req.user.designation === "Admin" ) {
      return res.status(200).redirect('/mm/tracker/'+req.params.id)
    }

    } catch (error) {
    console.error('Error updating Service Info:', error);
    req.flash('server_error','A server error occured. Try Again')
    // res.status(500).redirect('/track/tracker'+id);
    if (req.user.designation === "Admin" || req.user.designation === "Management"){
      return res.status(500).redirect('/track/tracker/'+req.params.id)
    }else {
      return res.status(500).redirect('/mm/tracker/'+req.params.id)
    }
  }

};

const updateTech = async (req, res) => {
  try {
    const { id } = req.params; // Get the tracker ID from the request params
    const { TI_service_name, signalling_Ip, media_Ip, prefix, port, codices, status } = req.body; // Get the updated address from the request body
    // Find the Tracker document by ID
    const tracker = await Tracker.findById(id);

    if (!tracker) {
      req.flash('tracker_404','Client not found')
      return res.status(404).redirect('/track/tracker'+id);
    }

    // Update the address fields
    tracker.Tech_info.TI_service_name = TI_service_name;
    tracker.Tech_info.signalling_Ip = signalling_Ip;
    tracker.Tech_info.media_Ip = media_Ip;
    tracker.Tech_info.prefix = prefix;
    tracker.Tech_info.port = port;
    tracker.Tech_info.codices = codices;
    tracker.Tech_info.status = status;


    // Save the updated Tracker document ++++++++++++
    await tracker.save();
    // console.log("Changing: ", req.body)
    req.flash('update_success','Technical Info Updated')
    // res.status(200).redirect('/track/tracker/'+req.params.id);
    if (req.user.designation === "Admin" || req.user.designation === "Management"){
      return res.status(200).redirect('/track/tracker/'+req.params.id)
    }else {
      return res.status(200).redirect('/mm/tracker/'+req.params.id)
    }
  } catch (error) {
    console.error('Error updating Technical Info:', error);
    req.flash('server_error','A server error occured. Try Again')
    // res.status(500).redirect('/track/tracker'+id);
    if (req.user.designation === "Admin" || req.user.designation === "Management"){
      return res.status(500).redirect('/track/tracker/'+req.params.id)
    }else {
      return res.status(500).redirect('/mm/tracker/'+req.params.id)
    }
  }

};

const updateTesting = async (req, res) => {
  try {
    const { id } = req.params; // Get the tracker ID from the request params
    const { active, routes_to_test, trunk, date_started, testing_status, notes } = req.body; // Get the updated address from the request body
    console.log("Body: ", req.body.street)
    // Find the Tracker document by ID
    const tracker = await Tracker.findById(id);

    if (!tracker) {
      req.flash('tracker_404','Client not found')
      return res.status(404).redirect('/track/tracker'+id);
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
    req.flash('update_success','Testing Updated')
    // res.status(200).redirect('/track/tracker/'+req.params.id);
    if (req.user.designation === "Admin" || req.user.designation === "Management"){
      return res.status(200).redirect('/track/tracker/'+req.params.id)
    }else {
      return res.status(200).redirect('/mm/tracker/'+req.params.id)
    }
  } catch (error) {
    console.error('Error updating Technical Info:', error);
    req.flash('server_error','A server error occured. Try Again');
    // res.status(500).redirect('/track/tracker/'+id);
    if (req.user.designation === "Admin" || req.user.designation === "Management"){
      return res.status(500).redirect('/track/tracker/'+req.params.id)
    }else {
      return res.status(500).redirect('/mm/tracker/'+req.params.id)
    }
  }

};
    
  // Get all customer trackers
// Get all customer trackers
const getAllCustomerTrackers = async (req, res) => {
  try {
    // let identify =req.user.cid;
    const trackers = await Tracker.find().populate('account_manager');
    const task = await Task.find().populate('taskFor').populate('assignedBy').populate('reference')
    let tasks =[]
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
        date: task.date
      }
      tasks.push(task_)
    })

    let totalStages = 0;
    let completedStages = 0;
    let assignedClients = 0;
    let unassignedClients = 0;

    for (const tracker of trackers) {
      const serviceName = tracker.service_interest.service_name;

      if (tracker.service_interest && tracker.service_interest.status === 'Complete') {
        completedStages++;
      }

      if (tracker.Tech_info && tracker.Tech_info.status === 'Complete') {
        completedStages++;
      }

      if (tracker.testing && tracker.testing.testing_status === 'Completed') {
        completedStages++;
      }

      totalStages += 3;

      if (tracker.account_manager) {
        assignedClients++;
      } else {
        unassignedClients++;
      }
    }

    const overallCompletion = ((completedStages / totalStages) * 100).toFixed(2);

    const voip = [];
    const sms = [];
    const stages = ['Overall Completion', 'Service Subscription', 'Technical Info', 'Registration & Testing'];

    for (const tracker of trackers) {
      const serviceName = tracker.service_interest.service_name;
      const trackerCompletedStages = (tracker.service_interest?.status === 'Complete' ? 1 : 0) +
        (tracker.Tech_info?.status === 'Complete' ? 1 : 0) +
        (tracker.testing?.testing_status === 'Completed' ? 1 : 0);
      const trackerTotalStages = 3;
      const trackerCompletionPercentage = (trackerCompletedStages / trackerTotalStages) * 100;

      tracker.completionPercentage = trackerCompletionPercentage.toFixed(2);
      tracker.overallCompletion = trackerCompletionPercentage.toFixed(2);

      if (serviceName === 'VoIP') {
        voip.push(tracker);
      } else if (serviceName === 'SMS') {
        sms.push(tracker);
      }
    }
    // console.log("This is SMS: ", sms)
    let assignedTrackers = [];
    let unassignedTrackers = [];

    for (const tracker of trackers) {
      if (tracker.account_manager) {
        assignedTrackers.push(tracker);
      } else {
        unassignedTrackers.push(tracker);
      }
    }

    let users = [];
    const reqUsers = await User.find().populate('assignedTasks');

    for (const reqUser of reqUsers) {
      let user = {
        name: reqUser.name,
        id: reqUser._id,
        designation: reqUser.designation,
        role: reqUser.role,
        assignedTasks: reqUser.assignedTasks.length,
        myaccounts: reqUser.assignedTasks,
        profile: reqUser.profile,
        username: reqUser.username
      };
      users.push(user);
      // console.log("THIS IS MY ACCOUNTS: ", user.myaccounts)
    }
    // console.log("THIS IS COMPARING TRACKERID AND USER ID: ", users[0].myaccounts[0].Customer_Name)
    const completedPercentile = (trackers.filter(tracker => tracker.overallCompletion == 100).length / trackers.length) * 100;
    // print("un Assigned: ", unassigned Trackers )
    const logs = await Log.aggregate([
      { $sort: { timestamp: -1 } },
      {
        $project: {
          _id: 0,
          route: 1,
          userName: 1,
          timestamp: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
          },
        },
      },
    ]);
    // let isManagement = false;
    // if (req.user.designation == 'Management'){
    //   isManagement = true
    // }
// Get all tasks


    // print("TASKS: ", tasks)
    let flash = await req.flash('update_success')[0] || req.flash('permission')[0] || req.flash('register-success')[0] ;
    let error = req.flash('tracker_404' )[0] || req.flash('server_error')[0] || req.flash('unauthorized')[0] 
    // console.log("USERS: ", users)
    res.status(200).render('home', {
      voip,
      sms,
      stages,
      pageTitle: "Home",
      logs: logs,
      users,
      user: req.user,
      flash: req.flash('Login-success'),
      completionPercentage: overallCompletion,
      assignedClients,
      unassignedClients,
      completedPercentile: completedPercentile.toFixed(2),
      incompletePercentile: (100 - completedPercentile).toFixed(2),
      assignedTrackers,
      unassignedTrackers,
      message: flash,
      isAuthenticated: req.user.isLoggedIn,
      error,
      trackers,
      reqUsers,
      isManagement: false,
      tasks,
      designation: req.user.designation
    });
  } catch (error) {
    console.error('Error retrieving trackers:', error);
    res.status(500).redirect('/track/home');
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
    
      completionPercentage = ((completedStages / totalStages) * 100).toFixed(2);
      console.log("Overall Completion: ", completionPercentage);
    


      if (!tracker) {
        req.flash('tracker_404','Client not found');
        return res.status(404).redirect('/track/home');
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
      // res.status(200).redirect('/track/home');
      if (req.user.designation === "Admin" || req.user.designation === "Management"){
        return res.status(200).redirect('/track/home/')
      }else {
        return res.status(200).redirect('/mm/dashboard/')
      }
    } catch (error) {
      console.error('Error updating tracker stage process:', error);
      req.flash('server_error','A server error occured. Try Again');
      // res.status(500).redirect('/track/home/');    
      if (req.user.designation === "Admin" || req.user.designation === "Management"){
        return res.status(500).redirect('/track/home/')
      }else {
        return res.status(500).redirect('/mm/dashboard/')
      }
    }
};



const getSingleTracker = async (req, res) => {
  const { id } = req.params; // Assuming the tracker ID is passed as a parameter in the request
  // print('GET SOINGLE TRACKERiD ',id)
  try {
    const tracker = await Tracker.findById(id).populate('documents').populate('alternative_contact').populate('notes');
    const Notes = await Note.find({tracker:id}).populate('user')
    if (!tracker) {
      req.flash('tracker_404', 'Client not found. Try Again.')
      return res.status(404).redirect('/track/home');
    }
    
    // console.log("Tracker: ", tracker)

    const documentTypes = {
      pdf: 'pdf',
      xls: 'excel',
      doc: 'docs',
      png: 'png',
      jpg: 'jpg',
      // Add more extensions and their corresponding types as needed
    };
    
    const documents = tracker.documents.map((doc) => {
      const documentPath = doc.documentPath;
      const documentTitle = doc.documentTitle;
      const documentId = doc._id;
      const userId = doc.userId;
      let extension = documentPath.split('.').pop().toLowerCase();
      // if(!'undefined') {
      //   extension = documentPath.split('.').pop().toLowerCase();
      // }
      const documentType = documentTypes[extension] || 'none';
      
      return { documentPath, documentType, documentTitle, documentId, userId };
    });

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
    let users = [];
    const reqUsers = await User.find();

    for (const reqUser of reqUsers) {
      let user = {
        name: reqUser.name,
        id: reqUser._id,
        designation: reqUser.designation,
        role: reqUser.role,
        assignedTasks: reqUser.assignedTasks.length,
      };
      users.push(user);
    }
    // console.log("Notes: ", users)
    let flash = await req.flash('update_success')[0] || req.flash('permission')[0] || req.flash('register-success')[0];
    let error = req.flash('tracker_404' )[0] || req.flash('server_error')[0] || req.flash('unauthorized')[0] || req.flash('task_already_assigned')[0] || req.flash('account_manager_assigned')[0];
    res.render('single-tracker', {
      pageTitle: tracker.Customer_Name,
      Tracker: tracker,
      documents: documents,
      more_contacts: tracker.alternative_contact,
      users: users,
      user: req.user,
      notes,
      message: flash,
      error,
      user: req.user,
      designation: req.user.designation,
      isAuthenticated: req.user.isLoggedIn,
      isManagement: req.user.isManagement || false
    });
  } catch (error) {
    console.log(error)
    req.flash('server_error','A server error occured. Try Again')
    // res.status(500).redirect('/track/home')
    if (req.user.designation === "Admin" || req.user.designation === "Management"){
      return res.status(200).redirect('/track/home/')
    }else {
      return res.status(200).redirect('/mm/dashboard/')
    }
  }
};


const searchCustomerByName = async (req, res) => {
      const searchInput = req.query.input;
    
      try {
        const customers = await Tracker.find({
          Customer_Name: { $regex: String(searchInput), $options: 'i' },
        });
    
        res.status(200).json(customers);
      } catch (error) {
        console.error('Error searching for customers:', error);
        res.status(500).json({ error: 'Failed to search for customers' });
      }
};




// const Performance = require('./path/to/performanceSchema'); // Update the path to your performance schema

// Function to get the sum of 'terminatedminutes' for the same day
async function dailyMinutes() {
  // ... Implement the dailyMinutes function as shown in the previous response ...
  const currentDate = new Date();
  try {
    const sumForSameDay = await Performance.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0),
            $lte: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59),
          },
        },
      },
      {
        $group: {
          _id: null,
          totalTerminatedMinutes: {
            $sum: '$minutesRoutesTerminated',
          },
        },
      },
    ]);
    return sumForSameDay.length ? sumForSameDay[0].totalTerminatedMinutes : 0;
  } catch (error) {
    console.error('Error while calculating daily minutes:', error);
    throw error;
  }
}

// Function to get the sum of 'terminatedminutes' for the entire week
async function weeklyMinutes() {
  const endDate = new Date(); // Current date
  const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

  const performances = await Performance.find({
    date: { $gte: startDate, $lte: endDate }
  }).populate({
    path: 'tracker',
    match: { 'service_interest.service_name': 'VoIP' }
  });

  let totalMinutes = 0;
  let totalASR = 0;
  let totalACD = 0;
  let voipPerformanceCount = 0;

  performances.forEach(performance => {
    if (performance.tracker) {
      totalMinutes += performance.minutesRoutesTerminated;
      totalASR += performance.asr;
      totalACD += performance.acd;
      voipPerformanceCount++;
    }
  });

  const weeklyAverageASR = totalASR / voipPerformanceCount;
  const weeklyAverageACD = totalACD / voipPerformanceCount;

  return {
    totalMinutes,
    weeklyAverageASR,
    weeklyAverageACD
  };
}


// Function to get the sum of 'terminatedminutes' for the entire week
async function weeklySMSCount() {
  const endDate = new Date(); // Current date
  const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

  const performances = await Performance.find({
    date: { $gte: startDate, $lte: endDate }
  }).populate({
    path: 'tracker',
    match: { 'service_interest.service_name': 'SMS' }
  });

  let totalSms = 0;
  let smsPerformanceCount = 0;

  performances.forEach(performance => {
    if (performance.tracker) {
      totalSms+= performance.totalSMS;
      
      smsPerformanceCount++;
    }
  });



  return {
    totalSms,
   
  };
}

async function dailySMSCount() {
  const currentDate = new Date(); // Current date

  const performances = await Performance.find({
    date: {
      $gte: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0),
      $lte: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59)
    }
  }).populate({
    path: 'tracker',
    match: { 'service_interest.service_name': 'SMS' }
  });

  let smsCount = 0;
  let totalSms = 0;
  performances.forEach(performance => {
    if (performance.tracker) {
      totalSms+= performance.totalSMS;
      smsCount++;
    }
  });

  return totalSms;
}




// >>>>>>>>>>>>>>>>>>>>>>>>OG<<<<<<<<<<<<<<<<
const getManagementDash = async (req, res) => {
  try {
    const trackers = await Tracker.find().populate('account_manager');

    let totalStages = 0;
    let completedStages = 0;
    let assignedClients = 0;
    let unassignedClients = 0;

    for (const tracker of trackers) {
      const serviceName = tracker.service_interest.service_name;

      if (tracker.service_interest && tracker.service_interest.status === 'Complete') {
        completedStages++;
      }

      if (tracker.Tech_info && tracker.Tech_info.status === 'Complete') {
        completedStages++;
      }

      if (tracker.testing && tracker.testing.testing_status === 'Completed') {
        completedStages++;
      }

      totalStages += 3;

      if (tracker.account_manager) {
        assignedClients++;
      } else {
        unassignedClients++;
      }
    }

    const overallCompletion = ((completedStages / totalStages) * 100).toFixed(2);

    const voip = [];
    const sms = [];
    const stages = ['Overall Completion', 'Service Subscription', 'Technical Info', 'Registration & Testing'];

    for (const tracker of trackers) {
      const serviceName = tracker.service_interest.service_name;
      const trackerCompletedStages = (tracker.service_interest?.status === 'Complete' ? 1 : 0) +
        (tracker.Tech_info?.status === 'Complete' ? 1 : 0) +
        (tracker.testing?.testing_status === 'Completed' ? 1 : 0);
      const trackerTotalStages = 3;
      const trackerCompletionPercentage = (trackerCompletedStages / trackerTotalStages) * 100;

      tracker.completionPercentage = trackerCompletionPercentage.toFixed(2);
      tracker.overallCompletion = trackerCompletionPercentage.toFixed(2);

      if (serviceName === 'VoIP') {
        voip.push(tracker);
      } else if (serviceName === 'SMS') {
        sms.push(tracker);
      }
    }
    // console.log("This is SMS: ", sms)
    let assignedTrackers = [];
    let unassignedTrackers = [];

    for (const tracker of trackers) {
      if (tracker.account_manager) {
        assignedTrackers.push(tracker);
      } else {
        unassignedTrackers.push(tracker);
      }
    }

    const completedPercentile = (trackers.filter(tracker => tracker.overallCompletion == 100).length / trackers.length) * 100;
    print("COMPLETED PERCENTILE:  ", completedPercentile )
    // Fetch data from the Performance schema
    const performances = await Performance.find().populate('tracker');
    console.log("PERFORMANCES: ", performances)
    minutesGraph = []
   for (i in performances){
    let performance = [
      performances[i].tracker.Customer_Name || '',
      performances[i].minutesRoutesTerminated
      
    ]
    minutesGraph.push(performance)
   }

  //  console.log("THIS IS THE CARRIER AND THE PERFORMANCE: ", minutesGraph)
    // Calculate average ASR, ACD, and weekly minutes
    let carrier = ''
    let totalASR = 0;
    let totalACD = 0;
    let totalWeeklyMinutes = 0;

    performances.forEach(performance => {
      totalASR += performance.asr;
      totalACD += performance.acd;
      totalWeeklyMinutes += performance.minutesRoutesTerminated;
    });


     // Call the dailyMinutes and weeklyMinutes functions
     const dailyMinutesSum = await dailyMinutes();
     const weeklyMinutesSum = (await weeklyMinutes()).totalMinutes;
     const weeklyResult = await weeklyMinutes();
     const weeklyAverageASR = weeklyResult.weeklyAverageASR;
     const weeklyAverageACD = weeklyResult.weeklyAverageACD;

      const weeklySMS = await weeklySMSCount()
      const dailySMS = await dailySMSCount()


     // Fetch data from the Performance schema
    //  const performances = await Performance.find().populate('tracker');
    //  console.log("PERFORMANCES: ", performances);
     
     // Calculate the date range for this week and last week
     const today = new Date();
     const yesterday = new Date(today); // Declare 'yesterday' here
     const lastWeekStart = new Date(today);
     lastWeekStart.setDate(today.getDate() - 7);
     yesterday.setDate(today.getDate() - 1);

     const thisWeekStart = new Date(today);
     thisWeekStart.setDate(today.getDate() - today.getDay()); // Assuming Sunday is the first day of the week
 
       // Initialize variables for VoIP and SMS differences
    let lastWeekMinutesDiffVoIP = 0;
    let thisWeekMinutesDiffVoIP = 0;
    let yesterdayMinutesDiffVoIP = 0;
    let todayMinutesDiffVoIP = 0;

    let lastWeekMinutesDiffSMS = 0;
    let thisWeekMinutesDiffSMS = 0;
    let yesterdayMinutesDiffSMS = 0;
    let todayMinutesDiffSMS = 0;

    // ... (your existing code)

    // Iterate through performances and calculate differences
    for (const performance of performances) {
      const performanceDate = new Date(performance.date); // Replace 'date' with the actual date field in your Performance schema
      const minutesRoutesTerminated = performance.minutesRoutesTerminated;
      const totalSMS = performance.totalSMS; // Add this line to get the totalSMS

      if (minutesRoutesTerminated !== null && !isNaN(minutesRoutesTerminated)) {
        // Check if totalMinutes is not empty
        if (performanceDate >= lastWeekStart && performanceDate < thisWeekStart) {
          // Calculate difference for last week's VoIP minutes
          lastWeekMinutesDiffVoIP += minutesRoutesTerminated;
        } else if (performanceDate >= thisWeekStart && performanceDate <= today) {
          // Calculate difference for this week's VoIP minutes
          thisWeekMinutesDiffVoIP += minutesRoutesTerminated;
        }

        // Calculate difference for yesterday's VoIP minutes
        if (performanceDate.toDateString() === yesterday.toDateString()) {
          yesterdayMinutesDiffVoIP += minutesRoutesTerminated;
        }

        // Calculate difference for today's VoIP minutes
        if (performanceDate.toDateString() === today.toDateString()) {
          todayMinutesDiffVoIP += minutesRoutesTerminated;
        }
      }

      if (totalSMS !== null && !isNaN(totalSMS)) {
        // Check if totalSMS is not empty
        if (performanceDate >= lastWeekStart && performanceDate < thisWeekStart) {
          // Calculate difference for last week's SMS minutes
          lastWeekMinutesDiffSMS += totalSMS;
        } else if (performanceDate >= thisWeekStart && performanceDate <= today) {
          // Calculate difference for this week's SMS minutes
          thisWeekMinutesDiffSMS += totalSMS;
        }

        // Calculate difference for yesterday's SMS minutes
        if (performanceDate.toDateString() === yesterday.toDateString()) {
          yesterdayMinutesDiffSMS += totalSMS;
        }

        // Calculate difference for today's SMS minutes
        if (performanceDate.toDateString() === today.toDateString()) {
          todayMinutesDiffSMS += totalSMS;
        }
      }
    }
    

    print('Last week diff VOIP: ', lastWeekMinutesDiffVoIP)
    print('this week diff: VOIP', thisWeekMinutesDiffVoIP)
    print('yesterdays diff: VOIP', yesterdayMinutesDiffVoIP)
    print('yesterdays diff: VOIP', todayMinutesDiffVoIP)

    print('Last week diff: SMS', lastWeekMinutesDiffSMS)
    print('this week diff: SMS', thisWeekMinutesDiffSMS)
    print('yesterdays diff: SMS', yesterdayMinutesDiffSMS)
    print('yesterdays diff: SMS', todayMinutesDiffSMS)

 //do the calculation. subtract yesterday's from today to get the percent difference

    //  console.log("this is your Daily SMS data: ",dailySMS )
    let users = [];
    const reqUsers = await User.find().populate('assignedTasks');

    for (const reqUser of reqUsers) {
      let user = {
        name: reqUser.name,
        id: reqUser._id,
        username: reqUser.username,
        designation: reqUser.designation,
        role: reqUser.role,
        assignedTasks: reqUser.assignedTasks.length,
        myaccounts: reqUser.assignedTasks,
        profile: reqUser.profile
      };
      users.push(user);
      // console.log("COMPLETION PERCENTILE: ",overallCompletion )
    }

    const tasks = await Task.find().populate('reference').populate('assignedBy').populate('taskFor');
    // console.log("GET YOUR WEEKLY SUM: ", weeklyMinutesSum)
    // Render the management dashboard view
    res.status(200).render('management-dashboard', {
      voip,
      sms,
      stages,
      pageTitle: "Management Dashboard",
      completionPercentage: overallCompletion,
      assignedClients,
      unassignedClients,
      completedPercentile: completedPercentile.toFixed(2),
      incompletePercentile: (100 - completedPercentile).toFixed(2),
      assignedTrackers,
      unassignedTrackers,
      isManagement: true,
      isAuthenticated: req.user.isLoggedIn,
      message: null,
      error: null,
      mytasks: [],
      userNotes:[],
      users,
      user: req.user,
      tasks,
      trackers,
      designation: req.user.designation,
      dailyMinutesSum: dailyMinutesSum.toLocaleString("en-US"),
      weeklyMinutesSum: weeklyMinutesSum.toLocaleString("en-US"),
      averageWeeklyMinutes: weeklyResult,
      weeklyAverageASR: weeklyAverageASR.toFixed(2),
      weeklyAverageACD: weeklyAverageACD.toFixed(2),
      weeklyResult, 
      weeklySMS: weeklySMS.totalSms.toLocaleString("en-US"),
      dailySMS: dailySMS.toLocaleString("en-US"),
      
    });
  } catch (error) {
    console.error('Error retrieving trackers:', error);
    res.status(500).redirect('/500');
  }
};
// >>>>>>>>>>>>>>>>>>>>>>OG END <<<<<<<<<<<<<<<<<


const addPerformance = async (req, res) => {
  const { trackerId, asr, acd, minutesRoutesTerminated, smsSent, date } = req.body;
console.log("This is body input: ", req.body)
  try {

      // Get the current date in 'YYYY-MM-DD' format
      const currentDate = new Date().toISOString().slice(0, 10);

      // Check if a performance record with the same trackerId and current date already exists
      let existingPerformance = await Performance.findOne({
          tracker: trackerId,
          date
          // date: { $gte: new Date(currentDate), $lt: new Date(currentDate).setDate(new Date(currentDate).getDate() + 1) },
      });

      print("Existing: ")
      if (!existingPerformance) {
          // Create a new performance record using the 'Performance' model
          existingPerformance = new Performance({
              tracker: trackerId,
              date,
          });
      }

      // Update the performance record based on the request body
      if (!req.body.sms) {
          existingPerformance.asr = asr;
          existingPerformance.acd = acd;
          existingPerformance.minutesRoutesTerminated = minutesRoutesTerminated;
      } else if (req.body.sms) {
          existingPerformance.totalSMS = smsSent;
      }

      // Save the performance record to the database
      const savedPerformance = await existingPerformance.save();
      console.log("Performance Saved/Updated: ", savedPerformance);
      req.flash('server_error', "Today's Carrier minutes are already uploaded")
      // res.status(201).redirect('/client/' + trackerId);
      if (req.user.designation === "Admin" || req.user.designation === "Management"){
        return res.status(200).redirect('/track/'+trackerId)
      }else {
        return res.status(200).redirect('/mm/track/'+trackerId)
      }
  } catch (error) {
      console.error('Error creating/updating performance:', error);
      res.status(500).json({ error: 'Error creating/updating performance' });
      if (req.user.designation === "Admin" || req.user.designation === "Management"){
        return res.status(500).redirect('/track/tracker/'+trackerId)
      }else {
        return res.status(500).redirect('/mm/track/'+trackerId)
      }
  }
};


const generateDummyPerformanceData = async () => {
  try {
    const dummyData = [
      {
        tracker: '6123456789abcdef12345678', // Replace with an existing tracker ID
        asr: 0.85,
        acd: 120,
        minutesRoutesTerminated: [50, 60, 70],
      },
      {
        tracker: 'abcdef123456789012345678', // Replace with an existing tracker ID
        asr: 0.78,
        acd: 100,
        minutesRoutesTerminated: [40, 55, 80],
      },
      {
        tracker: '789012345678abcdef123456', // Replace with an existing tracker ID
        asr: 0.92,
        acd: 150,
        minutesRoutesTerminated: [60, 70, 85],
      },
      {
        tracker: '456789012345678abcdef123', // Replace with an existing tracker ID
        asr: 0.67,
        acd: 110,
        minutesRoutesTerminated: [35, 45, 65],
      },
      {
        tracker: '23456789abcdef1234567890', // Replace with an existing tracker ID
        asr: 0.76,
        acd: 130,
        minutesRoutesTerminated: [70, 80, 90],
      },
    ];

    const performanceData = await Performance.insertMany(dummyData);
    console.log('Dummy performance data created:', performanceData);
  } catch (error) {
    console.error('Error generating dummy performance data:', error);
  }
};

// Call the method to generate dummy data
// generateDummyPerformanceData();

const getPerformances = async (req, res) => {
  try {
    const allPerformances = await Performance.find().populate('tracker');
   let minutesGraph = []
    for (i in allPerformances){
     let performance = {
       carrier: allPerformances[i].tracker.Customer_Name,
       minutes: allPerformances[i].minutesRoutesTerminated
       
    }
     minutesGraph.push(performance)
    }
    console.log("find your stats: ", minutesGraph)
    res.status(200).json(minutesGraph);
  } catch (error) {
    // console.error('Error retrieving all performances:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateUser = async (req, res) => {
  const userId = req.params.id;

  try {
      const {name, designation, department, username} = req.body;

        let updateUser = {
          name,
          designation,
          department,
          username
        }
      // Find the user by ID
      console.log("UPDATING USER INFOR: ",updateUser )
      const user = await User.findById(userId);
      if (!user) {
        req.flash('server_error', "User not found")
        return res.status(404).redirect('/track/home' );
      }

      // Update the emergency contact fields
      user.name = name;
      user.username = username;
      user.designation = designation;
      user.department = department;



      // Save the updated user
      await user.save();

      req.flash('update_success', "Emergency contact successfully updated")
      return res.status(404).redirect('/track/home');
  } catch (error) {
      res.status(500).json({ message: 'Error updating emergency contact', error: error.message });
  }
}; 
    

const getVoipCarriers = async (req, res) => {

  try {
      
    const trackers = await Tracker.find().populate('account_manager');

    let totalStages = 0;
    let completedStages = 0;
    let assignedClients = 0;
    let unassignedClients = 0;

    for (const tracker of trackers) {
      const serviceName = tracker.service_interest.service_name;

      if (tracker.service_interest && tracker.service_interest.status === 'Complete') {
        completedStages++;
      }

      if (tracker.Tech_info && tracker.Tech_info.status === 'Complete') {
        completedStages++;
      }

      if (tracker.testing && tracker.testing.testing_status === 'Completed') {
        completedStages++;
      }

      totalStages += 3;

      if (tracker.account_manager) {
        assignedClients++;
      } else {
        unassignedClients++;
      }
    }

    const overallCompletion = ((completedStages / totalStages) * 100).toFixed(2);

    const voip = [];
    const sms = [];
    const stages = ['Overall Completion', 'Service Subscription', 'Technical Info', 'Registration & Testing'];

    for (const tracker of trackers) {
      const serviceName = tracker.service_interest.service_name;
      const trackerCompletedStages = (tracker.service_interest?.status === 'Complete' ? 1 : 0) +
        (tracker.Tech_info?.status === 'Complete' ? 1 : 0) +
        (tracker.testing?.testing_status === 'Completed' ? 1 : 0);
      const trackerTotalStages = 3;
      const trackerCompletionPercentage = (trackerCompletedStages / trackerTotalStages) * 100;

      tracker.completionPercentage = trackerCompletionPercentage.toFixed(2);
      tracker.overallCompletion = trackerCompletionPercentage.toFixed(2);

      if (serviceName === 'VoIP') {
        voip.push(tracker);
      } else if (serviceName === 'SMS') {
        sms.push(tracker);
      }
    }
    const userId = req.user._id;
    const tasks = await Task.find({ taskFor: userId }).populate('taskFor');
    console.log("VOIP: ", voip)
      return res.render('voip-carriers', {
        pageTitle: 'List | Carriers',
        user: req.user,
        voip: voip,
        // sms,
        stages,
        users:[],
        tasks,
        trackers,
        designation: req.user.designation,
        isAuthenticated: req.user.isAuthenticated,
        // overallCompletion
      });
  } catch (error) {
      res.status(500).json({ message: 'Error updating emergency contact', error: error.message });
  }
}; 
const getSmsCarriers = async (req, res) => {

  try {
      
    const trackers = await Tracker.find().populate('account_manager');

    let totalStages = 0;
    let completedStages = 0;
    let assignedClients = 0;
    let unassignedClients = 0;

    for (const tracker of trackers) {
      const serviceName = tracker.service_interest.service_name;

      if (tracker.service_interest && tracker.service_interest.status === 'Complete') {
        completedStages++;
      }

      if (tracker.Tech_info && tracker.Tech_info.status === 'Complete') {
        completedStages++;
      }

      if (tracker.testing && tracker.testing.testing_status === 'Completed') {
        completedStages++;
      }

      totalStages += 3;

      if (tracker.account_manager) {
        assignedClients++;
      } else {
        unassignedClients++;
      }
    }

    const overallCompletion = ((completedStages / totalStages) * 100).toFixed(2);

    const voip = [];
    const sms = [];
    const stages = ['Overall Completion', 'Service Subscription', 'Technical Info', 'Registration & Testing'];

    for (const tracker of trackers) {
      const serviceName = tracker.service_interest.service_name;
      const trackerCompletedStages = (tracker.service_interest?.status === 'Complete' ? 1 : 0) +
        (tracker.Tech_info?.status === 'Complete' ? 1 : 0) +
        (tracker.testing?.testing_status === 'Completed' ? 1 : 0);
      const trackerTotalStages = 3;
      const trackerCompletionPercentage = (trackerCompletedStages / trackerTotalStages) * 100;

      tracker.completionPercentage = trackerCompletionPercentage.toFixed(2);
      tracker.overallCompletion = trackerCompletionPercentage.toFixed(2);

      if (serviceName === 'VoIP') {
        voip.push(tracker);
      } else if (serviceName === 'SMS') {
        sms.push(tracker);
      }
    }
    const userId = req.user._id;
    const tasks = await Task.find({ taskFor: userId }).populate('taskFor');

      return res.render('sms-carriers', {
        pageTitle: 'List | Carriers',
        user: req.user,
        voip,
        sms,
        stages,
        users:[],
        tasks,
        // trackers,
        designation: req.user.designation,
        isAuthenticated: req.user.isAuthenticated,
        // overallCompletion
      });
  } catch (error) {
      res.status(500).json({ message: 'Error updating emergency contact', error: error.message });
  }
}; 

const getTasks = async (req, res) => {
  const atasks = await Task.find().populate('reference').populate('assignedBy').populate('taskFor');
 print("This is one task: ", atasks[0].assignedBy.name)
  let tasks = []
  atasks.forEach(task => {
    let taskk = {
      _id: task._id,
      title: task.title,
      taskFor: task.taskFor.name,
      date: (task.date).toISOString().split('T')[0],
      description: task.description,
      status: task.status,
      files: task.files,
      notes: task.notes,
      assignedBy: task.assignedBy.name,
      reference: task.reference,
      deadline: (task.deadline).toISOString().split('T')[0],
    }
    tasks.push(taskk)
  })

  console.log(" tasks: ", tasks)
  res.render('tasks', {
    tasks,
    pageTitle: "Admin | Tasks",
    user: req.user,
    designation: req.user.designation

  })
}

module.exports = 
{ addCustomerTracker, 
    updateTracker, 
    updateCustomerTracker,
    getAllCustomerTrackers,
    updateAddress,
    getSingleTracker,
    uploadDocument,
    updateService,
    getSmsCarriers,
    getVoipCarriers,
    updateTech,
    updateTesting,
    addContact,
    updateTrackerStage,
    searchCustomerByName,
    updateDocument,
    grantDocumentPermission,
    assignTaskToUser,
    addNote,
    getManagementDash,
    getPerformances,
    addPerformance,
    updateUser,
    deleteAndUpdateDocument,
    getTasks
    
};




