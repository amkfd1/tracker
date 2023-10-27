const express = require('express');
const router = express.Router();
const customerTrackerController = require('../Controllers/trackerControl');
const fs = require('fs');
const isAuth = require('../middleware/verifyAuth');
const isAdmin = require('../middleware/isAdmin');
const ismm = require('../middleware/ismm');
const User = require('../Models/user');
const Tracker = require('../Models/tracker');
const adminsettings = require('../Controllers/adminsettings');

const isManagement = require('../middleware/isManagement');
isPass = isAdmin | ismm
const multer = require('multer');

// const storage = multer.memoryStorage();
// const upload = multer({
//   storage,
// });
// Set up the storage strategy
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads'); // Specify the destination folder
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use the original file name
  }
});

// Create the Multer instance with the custom storage
const upload = multer({ storage: storage });


router.post('/upload/:id', isAuth, upload.single('document'),customerTrackerController.uploadDocument)
router.post('/newClient',isAdmin, customerTrackerController.addCustomerTracker);

// Update an existing customer tracker
router.post('/updateTracker/:id', customerTrackerController.updateTracker);

// update User Info
router.post('/update-user/:id', isAdmin, customerTrackerController.updateUser);

// Get all customer trackers
router.get('/home', isAdmin, customerTrackerController.getAllCustomerTrackers);
router.get('/management', isAdmin,  customerTrackerController.getManagementDash);

router.get('/search', customerTrackerController.searchCustomerByName);
// router.get('/openpdf', customerTrackerController.openPDF);



// Get all customer trackers
router.get('/tracker/:id', isAdmin, customerTrackerController.getSingleTracker);

// cREATE OR ADD NEW SECTIONS
router.post('/updateAddress/:id', isAuth, customerTrackerController.updateAddress);
router.post('/updateService/:id', isAuth, customerTrackerController.updateService);
router.post('/updateTechnical/:id', isAuth, customerTrackerController.updateTech);
router.post('/updateTesting/:id', isAuth, customerTrackerController.updateTesting);
router.post('/addContact/:id', isAuth, customerTrackerController.addContact);
router.post('/addNote/', isAuth, customerTrackerController.addNote);


router.post('/add-stats',  customerTrackerController.addPerformance);

// update stage
router.post('/updateStage/:id', isAdmin, customerTrackerController.updateTrackerStage);



router.get('/newClient/', isAdmin, async function (req, res) {
  
  let flash = await req.flash('update_success')[0] || req.flash('permission')[0] || req.flash('register-success')[0];
  let error = req.flash('tracker_404' )[0] || req.flash('unauthorized')[0] || req.flash('server_error')[0]; 

    console.log(error, flash)
    res.render('edit-add', {
        pageTitle: "Add New Tracker",
        new: true,
        error,
        user: req.user,
        message: flash,
        isAuthenticated: req.user.isLoggedIn,
        isManagement: req.user.designation,
        designation: req.user.designation
    });
});

router.get('/sms/carriers', isAdmin, customerTrackerController.getSmsCarriers);
router.get('/voip/carriers', isAdmin, customerTrackerController.getVoipCarriers);

router.get('/tasks', isAdmin, customerTrackerController.getTasks);

router.get('/tasks/new-task', isAdmin, async function (req, res) {

  const trackers = await Tracker.find().populate('account_manager');
  const users = await User.find().populate('assignedTasks');

  let flash = await req.flash('update_success')[0] || req.flash('permission')[0] || req.flash('register-success')[0];
  let error = req.flash('tracker_404' )[0] || req.flash('unauthorized')[0] || req.flash('server_error')[0]; 

    console.log(error, flash)
    res.render('new-task', {
        pageTitle: "Add New Tracker",
        trackers,
        users,
        error,
        user: req.user,
        message: flash,
        isAuthenticated: req.user.isLoggedIn,
        isManagement: req.user.designation,
        designation: req.user.designation
    });
});

// Use the upload middleware in your route handler
router.post('/upload/:id', isAuth, upload.single('document'), customerTrackerController.uploadDocument);
// Use the upload middleware in your route handler
router.post('/upload/update/:id', isAuth, upload.single('document'), customerTrackerController.updateDocument);

router.post('/document/send/:id', isAuth, customerTrackerController.grantDocumentPermission);
router.post('/assign/account-manager/:id', isAdmin, customerTrackerController.assignTaskToUser);

router.get('/delete-document/:id/:carrierId/:userId', isAdmin, customerTrackerController.deleteAndUpdateDocument);


router.post('/document/grant-access/', isAuth, customerTrackerController.grantDocumentPermission);

const Document = require('../Models/document');

router.get('/admin/user/user-record', isAdmin, adminsettings.getUserById)

// open Pdf
router.get("/:id", async (req, res) => {
  var docId = req.query.doc;
  const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
  console.log("This is your receipt Id: ", docId)
  var stream = fs.createReadStream(document.documentPath);
  var filename = "samsple.pdf"; 
  // Be careful of special characters
  filename = encodeURIComponent(filename);
  // Ideally this should strip them

  res.setHeader('Content-disposition', 'inline; filename="' + filename + '"');
  res.setHeader('Content-type', 'application/pdf');

  stream.pipe(res);
  console.log( "hello there it works")
  });


module.exports = router;

