const express = require('express');
const router = express.Router();
const customerTrackerController = require('../Controllers/trackerControl');
const fs = require('fs');
const isAuth = require('../middleware/verifyAuth');
const isAdmin = require('../middleware/isAdmin');

const multer = require('multer');

// const storage = multer.memoryStorage();
// const upload = multer({
//   storage,
// });
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '/uploads')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix)
  }
})

const upload = multer({ storage: storage })

router.post('/upload/:id', isAuth, upload.single('document'),customerTrackerController.uploadDocument)
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
  let flash = await req.flash('update_success')[0] || req.flash('permission')[0] || req.flash('register-success')[0];
  let error = req.flash('tracker_404' )[0] || req.flash('unauthorized')[0] || req.flash('server_error')[0]; 

    console.log(error, flash)
    res.render('edit-add', {
        pageTitle: "Add New Tracker",
        new: true,
        error,
        message: flash,
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

