const express = require('express');
const router = express.Router();
const customerTrackerController = require('../Controllers/trackerControl');
const fs = require('fs');
const isAuth = require('../middleware/verifyAuth');
const isAdmin = require('../middleware/isAdmin');

const multer = require('multer');

// Set up Multer storage and file upload configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads'); // Specify the destination folder for storing uploaded files
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix+ '-' + file.originalname ); // Set the filename for the uploaded file
  },
});

const upload = multer({ storage: storage });

// Add a new customer tracker
router.post('/newClient',isAdmin, customerTrackerController.addCustomerTracker);

// Update an existing customer tracker
router.post('/updateTracker/:id', customerTrackerController.updateTracker);

// Get all customer trackers
router.get('/home', isAdmin, customerTrackerController.getAllCustomerTrackers);

router.get('/search', customerTrackerController.searchCustomerByName);
// router.get('/openpdf', customerTrackerController.openPDF);


// Get all customer trackers
router.get('/tracker/:id', isAdmin, customerTrackerController.getSingleTracker);

// cREATE OR ADD NEW SECTIONS
router.post('/updateAddress/:id', isAdmin, customerTrackerController.updateAddress);
router.post('/updateService/:id', isAdmin, customerTrackerController.updateService);
router.post('/updateTechnical/:id', isAdmin, customerTrackerController.updateTech);
router.post('/updateTesting/:id', isAdmin, customerTrackerController.updateTesting);
router.post('/addContact/:id', isAdmin, customerTrackerController.addContact);
router.post('/addNote/', isAdmin, customerTrackerController.addNote);


// update stage
router.post('/updateStage/:id', isAdmin, customerTrackerController.updateTrackerStage);



router.get('/newClient/', isAdmin, async function (req, res) {
    res.render('edit-add', {
        pageTitle: "Add New Tracker",
        new: true,
        isAuthenticated: req.user.isLoggedIn
    });
});




// Use the upload middleware in your route handler
router.post('/upload/:id', isAuth, upload.single('document'), customerTrackerController.uploadDocument);
// Use the upload middleware in your route handler
router.post('/upload/update/:id', isAuth, upload.single('document'), customerTrackerController.updateDocument);

router.post('/document/send/:id', isAuth, customerTrackerController.grantDocumentPermission);
router.post('/assign/account-manager/:id', isAdmin, customerTrackerController.assignTaskToUser);


router.post('/document/grant-access/', isAuth, customerTrackerController.grantDocumentPermission);

const Document = require('../Models/document');


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

