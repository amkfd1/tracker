const Tracker = require('../Models/tracker');
const Document = require('../Models/document');
const Contact = require('../Models/contact');
const Log = require('../Models/log');
const Note = require('../Models/note');
const fs = require('fs');

const path = require('path');
const print = console.log

const updateTech = async (req, res) => {
    try {
      const { id } = req.params; // Get the tracker ID from the request params
      const { TI_service_name, signalling_Ip, media_Ip, prefix, port, codices, status } = req.body; // Get the updated address from the request body
      // Find the Tracker document by ID
      const tracker = await Tracker.findById(id);
  
      if (!tracker) {
        req.flash('tracker_404','Client not found');
        return res.status(404).redirect('/404');
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
      res.status(500).redirect('/500')
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
        return res.status(404).redirect('/404');
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
      res.status(500).redirect('/500')
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
        return res.status(404).redirect('/404');
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
      res.status(500).redirect('/500')
    }
  };
  


  const getAllCustomerTrackers = async (req, res) => {
    try {
      let totalStages = 0;
      let completedStages = 0;
      let completionPercentage = 0;
      let mytasks = [];
      let completedPercentile = 0;
      let incompletePercentile = 0;
      const trackers = await Tracker.find();
      const myClients = [];
      const voip = [];
      const sms = [];
      const stages = ['Overall Completion', 'Service Subscription', 'Technical Info', 'Registration & Testing'];
  
      for (const tracker of trackers) {
        const serviceName = tracker.service_interest.service_name.toLowerCase();
  
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
  


        completionPercentage = (completedStages / totalStages) * 100;
        completedPercentile = (completedStages / trackers.length) * 100;
        incompletePercentile = 100 - completedPercentile;

        if (serviceName === 'voip') {
          tracker.completionPercentage = completionPercentage.toFixed(2);
          voip.push(tracker);
        } else if (serviceName === 'sms') {
          tracker.completionPercentage = completionPercentage.toFixed(2);
          sms.push(tracker);
        }
  
        if (tracker.account_manager === req.user._id) {
          mytasks.push(tracker);
          
        }
      }
  
      // Retrieve all notes associated with the user ID
      const userId = req.user._id;
      
      let userNotes = await Note.find({ user: userId }).populate('tracker').populate('user');
      let myNotes = []
      console.log("MY TASKS: ", mytasks);
      res.status(200).render('staff-home', {
        stages,
        pageTitle: "Home",
        user: await req.user,
        isAuthenticated: req.user.isLoggedIn,
        message: await req.flash('Login-success')[0],
        mytasks,
        trackers,
        userNotes, // Add the userNotes array to the response
        completedPercentile,
        incompletePercentile,
        userNotes

      });
    } catch (error) {
      console.error('Error retrieving trackers:', error);
      res.status(500).json({ error: 'Failed to retrieve trackers' });
    }
  };
  
  
  

  const getSingleTracker = async (req, res) => {
    const { id } = req.params;
  
    try {
      const tracker = await Tracker.findById(id)
        .populate('documents')
        .populate('alternative_contact')
        .populate('notes');
  
      if (!tracker) {
        return res.status(404).json({ error: 'Tracker not found' });
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
        const extension = documentPath.split('.').pop().toLowerCase();
        const documentType = documentTypes[extension] || 'none';
  
        return { documentId, documentPath, documentType, documentTitle };
      });
  
      let isPermitted = false;
  
      if (
        req.user &&
        req.user._id &&
        tracker.userId &&
        (tracker.userId.equals(req.user._id) ||
          tracker.tags.some(
            (tag) =>
              tag.user &&
              tag.user.equals &&
              tag.user.equals(req.user._id) &&
              tag.permission === 'Read_Update'
          ))
      ) {
        isPermitted = true;
      }
  
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
      const notes = tracker.notes;
  
      let flash =
        (await req.flash('update_success')) ||
        req.flash('unauthorized') ||
        req.flash('permission');
  
      console.log("User is Permitted: ", isPermitted)
      res.render('staff-single', {
        pageTitle: tracker.Customer_Name,
        Tracker: tracker,
        documents: documents,
        more_contacts: tracker.alternative_contact,
        user: req.user,
        isAuthenticated: req.user && req.user.isLoggedIn,
        isLegal: isLegal,
        isAccountManager: isAccountManager,
        mytasks: mytasks,
        role: role,
        isStaff: false,
        flash,
        notes,
        isPermitted,
      });
    } catch (error) {
      console.log(error)
      res.status(500).redirect('/500');
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
      return res.status(404).redirect('/track/tracker/'+id);

    }

    tracker.notes.push(savedNote._id); // Add the note ID to the tracker's notes array

    await tracker.save(); // Save the updated tracker

    req.flash('update_success','Note has been added successfully')
    res.status(200).redirect('/client/' + clientId);
  } catch (error) {
    console.error('Error adding note to tracker:', error);
    req.flash('server_error','A server error occured. Try Again')
    res.status(500).redirect('/500')
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
      console.log("YOU DON'T HAVE PERMISSION")
      req.flash('unauthorized', 'You\'re not authorized to perform this action. Contact Admin.')
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

  module.exports = 
{ 
    updateTesting,
    addContact,
    updateTech,
    getAllCustomerTrackers,
    getSingleTracker,
    addNote,
    updateDocument
    
    
};