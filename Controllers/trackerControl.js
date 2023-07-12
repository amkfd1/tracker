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

const print = console.log

const uploadDocument = async (req, res) => {
  try {
    const { documentTitle } = req.body;
    const userId = req.user._id;
    const { id: customerRefId } = req.params;

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

    if (req.user.role != "Admin"){
      res.status(200).redirect('/client/' + customerRefId);
    } else {
      
      res.status(200).redirect('/track/tracker/' + customerRefId);
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
  
}


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
      req.flash('tracker_404', 'Client not found');
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
  print("ID: ", id, "/n UserId: ", userId);

  try {
    // Find the user by userId
    const user = await User.findById(userId);
    // console.log("User: ", user)
    // Assign the tracker to the user's assignedTasks field
    user.assignedTasks.push(id);
    await user.save();

    // Update the tracker's account_manager field
    const tracker = await Tracker.findById(id);
    tracker.account_manager = user._id;
    await tracker.save();
    console.log("CLIENT IS ASSIGNED AN ACCOUNT MANAGER: ", tracker.account_manager)
    req.flash('update_success', "Account Manager Successfully Assigned!")
    res.status(200).redirect('/track/home');
  } catch (error) {
    console.error('Error assigning task to user:', error);
    req.flash('server_error','A server error occured. Try Again')
    res.status(500).redirect('/track/home/'+id)
  }
};

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
    res.status(200).redirect('/track/tracker/'+customerRefId);
  } catch (error) {
    console.error('Error uploading document:', error);
    req.flash('server_error','A server error occured. Try Again')
    res.status(500).redirect('/track/tracker/'+customerRefId)
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
        testing_status
      } = req.body;
  
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
        SI_status
      };
  
      const Tech_info = {
        TI_service_name,
        signalling_Ip,
        media_Ip,
        prefix,
        port,
        codices
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
        { new: true }
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
    res.redirect('/track/home')
} catch (error) {
    console.error(error);
    // throw new Error('Failed to add customer tracker');
    req.flash('server_error','One or more field(s) are required. Try Again')
    res.status(500).redirect('/track/Newclient')
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
    console.log("Body: ", req.body.street)
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
    res.status(200).redirect('/track/tracker/'+req.params.id);
  } catch (error) {
    console.error('Error updating address:', error);
    req.flash('server_error','A server error occured. Try Again')
    res.status(500).redirect('/track/tracker'+id);
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
    res.status(200).redirect('/track/tracker/'+req.params.id);
    } catch (error) {
    console.error('Error updating Service Info:', error);
    req.flash('server_error','A server error occured. Try Again')
    res.status(500).redirect('/track/tracker'+id);
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


    // Save the updated Tracker document
    await tracker.save();
    // console.log("Changing: ", req.body)
    req.flash('update_success','Technical Info Updated')
    res.status(200).redirect('/track/tracker/'+req.params.id);
  } catch (error) {
    console.error('Error updating Technical Info:', error);
    req.flash('server_error','A server error occured. Try Again')
    res.status(500).redirect('/track/tracker'+id);
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
    res.status(200).redirect('/track/tracker/'+req.params.id);
  } catch (error) {
    console.error('Error updating Technical Info:', error);
    req.flash('server_error','A server error occured. Try Again');
    res.status(500).redirect('/track/tracker/'+id);
  }

};
    
  // Get all customer trackers
// Get all customer trackers
const getAllCustomerTrackers = async (req, res) => {
  try {
    const trackers = await Tracker.find();

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

    const overallCompletion = (completedStages / totalStages) * 100;

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
      tracker.overallCompletion = trackerCompletionPercentage;

      if (serviceName === 'VoIP') {
        voip.push(tracker);
      } else if (serviceName === 'SMS') {
        sms.push(tracker);
      }
    }

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

    const completedPercentile = (trackers.filter(tracker => tracker.overallCompletion === 100).length / trackers.length) * 100;

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

    let flash = await req.flash('update_success')[0] || req.flash('permission')[0] || req.flash('register-success')[0] ;
    let error = req.flash('tracker_404' )[0] || req.flash('server_error')[0] || req.flash('unauthorized')[0] 
    // console.log("SERVER ERROR FLASH: ", req.flash('server_error'), "\nEntire FLASH: ", flash[0])
    res.status(200).render('home', {
      voip,
      sms,
      stages,
      pageTitle: "Home",
      logs: logs,
      users,
      flash: req.flash('Login-success'),
      completionPercentage: overallCompletion.toFixed(2),
      assignedClients,
      unassignedClients,
      completedPercentile: completedPercentile.toFixed(2),
      incompletePercentile: (100 - completedPercentile).toFixed(2),
      assignedTrackers,
      unassignedTrackers,
      message: flash,
      isAuthenticated: req.user.isLoggedIn,
      error,
    });
  } catch (error) {
    console.error('Error retrieving trackers:', error);
    res.status(500).redirect('/500');
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
        return res.status(404).redirect('/track/tracker/'+trackerId );
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
      res.status(200).redirect('/track/home');
    } catch (error) {
      console.error('Error updating tracker stage process:', error);
      req.flash('server_error','A server error occured. Try Again');
      res.status(500).redirect('/track/tracker/'+trackerId);    }
};



const getSingleTracker = async (req, res) => {
  const { id } = req.params; // Assuming the tracker ID is passed as a parameter in the request
  // print('GET SOINGLE TRACKERiD ',id)
  try {
    const tracker = await Tracker.findById(id).populate('documents').populate('alternative_contact').populate('notes');
    
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
      const documentId = doc._id
      const extension = documentPath.split('.').pop().toLowerCase();
      const documentType = documentTypes[extension] || 'none';
      
      return { documentPath, documentType, documentTitle, documentId };
    });

    const notes = tracker.notes;
     
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
    let error = req.flash('tracker_404' )[0] || req.flash('server_error')[0] || req.flash('unauthorized')[0];
    res.render('single-tracker', {
      pageTitle: tracker.Customer_Name,
      Tracker: tracker,
      documents: documents,
      more_contacts: tracker.alternative_contact,
      users: users,
      notes,
      message: flash,
      error,
      isAuthenticated: req.user.isLoggedIn
    });
  } catch (error) {
    req.flash('server_error','A server error occured. Try Again')
    res.status(500).redirect('/track/home')
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



    
    
module.exports = 
{ addCustomerTracker, 
    updateTracker, 
    getAllCustomerTrackers,
    updateAddress,
    getSingleTracker,
    uploadDocument,
    updateService,
    updateTech,
    updateTesting,
    addContact,
    updateTrackerStage,
    searchCustomerByName,
    updateDocument,
    grantDocumentPermission,
    assignTaskToUser,
    addNote
    
};




