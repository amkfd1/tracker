const express = require('express');
const router = express.Router();
const staffController = require('../Controllers/staffControl');
const fs = require('fs');
const isAuth = require('../middleware/verifyAuth');
const customerTrackerController = require('../Controllers/trackerControl');
const adminsettings = require('../Controllers/adminsettings');

const multer = require('multer');

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

// Staff Task Management
router.get('/tasks/task/:taskId', isAuth, staffController.getSingleTask);
router.post('/tasks/:taskId/file', isAuth, upload.single('document'), staffController.addFileToTask);
router.post('/tasks/:taskId/note', isAuth, staffController.addNoteToTask);
router.post('/tasks/:taskId/file/:fileIndex', staffController.deleteFileFromTask);
router.post('/tasks/update-status/:taskId', isAuth, staffController.editTaskStatus);


router.post('/update-profile/:id', isAuth, staffController.updateEmergencyContact);

// open Pdf
const uploadDirectory = 'upload';


const path = require('path');

router.get("/client/doc/:id", async (req, res) => {
  var docId = req.query.doc;
  const document = await Document.findById(req.params.id);

  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }

  console.log("This is your receipt Id: ", docId);

  const filePath = path.join(__dirname, '..', document.documentPath);
  const fileName = path.basename(filePath);

  // Be careful of special characters
  const encodedFileName = encodeURIComponent(fileName);

  res.setHeader('Content-disposition', 'inline; filename="' + encodedFileName + '"');
  res.setHeader('Content-type', 'application/pdf');

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);

  console.log("File streaming has started.");
});

 router.get('/user/user-record/:userId', isAuth, adminsettings.getUserById)
module.exports = router;