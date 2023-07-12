const express = require('express');
const router = express.Router();
const customerTrackerController = require('../Controllers/trackerControl');
const fs = require('fs');
const isAuth = require('../middleware/verifyAuth');
const isAdmin = require('../middleware/isAdmin');

const multer = require('multer');
const AWS = require('aws-sdk');
const multerS3 = require('multer-s3');

// Configure the AWS SDK with your credentials and region
// AWS.config.update({
//   accessKeyId: 'ASIARCWQKHW3QSWZOGEM',
//   secretAccessKey: '6BXn+sKng2vYHivOelptSJS9tWPxiNz8mS21/GpW',
//   region: 'us-east-2'
// });

// Create an instance of the S3 service
// const s3 = new AWS.S3();

// Set up Multer storage and file upload configuration
// const upload = multer({
//   storage: multerS3({
//     s3: s3,
//     bucket: 'cyclic-jittery-pullover-crow-us-east-2',
//     key: function (req, file, cb) {
//       const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
//       const filePath = uniqueSuffix + '-' + file.originalname.replace(/\\/g, '/');
//       cb(null, filePath);
//     },
//   }),
// });

// router.post('/upload/:id', isAuth, upload.single('document'), async (req, res) => {
//   try {
//     // Retrieve the uploaded file information
//     const { originalname } = req.file;
//     const { id: customerRefId } = req.params;

//     // Construct the S3 key for the uploaded file
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
//     const key = uniqueSuffix + '-' + originalname.replace(/\\/g, '/');

//     // Upload the file to S3
//     const uploadParams = {
//       Bucket: 'cyclic-jittery-pullover-crow-us-east-2',
//       Key: key,
//       Body: req.file.buffer, // Assuming the file data is stored in the buffer
//     };

//     await s3.upload(uploadParams).promise();

//     // Save the document information to your database or perform other operations

//     res.status(200).json({ message: 'File uploaded successfully' });
//   } catch (error) {
//     console.error('Error uploading document:', error);
//     res.status(500).json({ error: 'Failed to upload document' });
//   }
// });


// Use the upload middleware in your route handler
// router.post('/upload/:id', isAuth, upload.single('document'), customerTrackerController.uploadDocument);

// Add a new customer tracker
const storage = multer.memoryStorage();
const upload = multer({
  storage,
});

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

