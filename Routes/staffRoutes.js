const express = require('express');
const router = express.Router();
const staffController = require('../Controllers/staffControl');
const fs = require('fs');
const isAuth = require('../middleware/verifyAuth');
const customerTrackerController = require('../Controllers/trackerControl');
const adminsettings = require('../Controllers/adminsettings');
const {
  createWeeklyReport,
  // updateWeeklyReport,
  updateUpdates,
  deleteUpdate,
  deleteWeeklyReport,
  updateStatus,
  renderWReport,
  renderWReportSingle,
  fetchLastMondayData,
  submitWeeklyReport,
  getAllWeeklyReports,
  processRatesUpload,
  uploadRates

} = require('../Controllers/weeklyReportsControl');
const multer = require('multer');

// Set up Multer storage and file upload configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads'); // Specify the destination folder for storing uploaded files
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filePath = uniqueSuffix + '-' + file.originalname.replace(/\\/g, '/');
    cb(null, filePath); // Set the filename for the uploaded file with forward slashes
  },
});

const upload = multer({ storage: storage });



router.get('/ss/sms/carriers', isAuth, customerTrackerController.getSmsCarriers);
router.get('/ss/voip/carriers', isAuth, customerTrackerController.getVoipCarriers);

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
router.get('/ss/tasks/task/:taskId', isAuth, staffController.getSingleTask);
router.post('/tasks/:taskId/file', isAuth, upload.single('document'), staffController.addFileToTask);
router.post('/tasks/:taskId/note', isAuth, staffController.addNoteToTask);
router.post('/tasks/:taskId/file/:fileIndex', staffController.deleteFileFromTask);
router.post('/tasks/update-status/:taskId', isAuth, staffController.editTaskStatus);


router.post('/update-profile/:id', isAuth, staffController.updateEmergencyContact);

// open Pdf

router.get('/ss/reports', isAuth, staffController.getAllWeeklyReportsStaff);

router.get('/ss/reports/generate', isAuth, staffController.fetchLastMondayData);
router.get('/ss/wr/reports/report/:id', isAuth, staffController.renderWReport);
router.get('/ss/sms/carriers', isAuth, customerTrackerController.getSmsCarriers);
router.get('/ss/voip/carriers', isAuth, customerTrackerController.getVoipCarriers);

router.get('/reports/:id', isAuth, fetchLastMondayData); 

  
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