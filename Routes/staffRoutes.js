const express = require('express');
const router = express.Router();
const staffController = require('../Controllers/staffControl');
const fs = require('fs');
const isAuth = require('../middleware/verifyAuth');
const customerTrackerController = require('../Controllers/trackerControl');

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


router.get('/', isAuth, staffController.getAllCustomerTrackers);
router.post('/document/grant-access/', isAuth, staffController.grantDocumentPermission);

// Update an existing customer tracker
router.post('/updateTracker/:id', customerTrackerController.updateTracker); 

router.get('/client/:id',isAuth, staffController.getSingleTracker);
router.post('/upload/update/:id', isAuth, upload.single('document'), staffController.updateDocument);

const Document = require('../Models/document');
router.post('/addNote', isAuth, staffController.addNote);
// router.post('/updateAddress/:id', isAuth, customerTrackerController.updateAddress);
// router.post('/updateService/:id', isAuth, customerTrackerController.updateService);
router.post('/updateTechnical/:id', isAuth, staffController.updateTech);
router.post('/updateTesting/:id', isAuth, staffController.updateTesting);
// router.post('/addContact/:id', isAuth, customerTrackerController.addContact);
router.post('/updateStage/:id', isAuth, staffController.updateTrackerStage);
// open Pdf
const uploadDirectory = 'upload';

router.get("/client/doc/:id", async (req, res) => {
  var docId = req.query.doc;
  const document = await Document.findById(req.params.id);
  console.log("This is the document ", document)
  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }
  console.log("This is your receipt Id: ", docId)
  
  // Construct the file path
  const filename = "sample.pdf";
  const filePath = path.join(__dirname, '..', uploadDirectory, filename);

  var stream = fs.createReadStream(filePath);
  
  // Be careful of special characters
  const encodedFilename = encodeURIComponent(filename);
  
  // Set the response headers for the file
  res.setHeader('Content-disposition', 'inline; filename="' + encodedFilename + '"');
  res.setHeader('Content-type', 'application/pdf');

  stream.pipe(res);
  console.log("Hello, it works!");
});


module.exports = router;