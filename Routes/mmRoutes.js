const express = require('express');
const router = express.Router();
const mmController = require('../Controllers/mmController');
const taskController = require('../Controllers/taskController');
const weeklyReport = require('../Controllers/weeklyReportsControl');
const performanceControl = require('../Controllers/performanceControl');
const customerTrackerController = require('../Controllers/trackerControl');
const staffController = require('../Controllers/staffControl');

const fs = require('fs');
const isAuth = require('../middleware/verifyAuth');
const isAdmin = require('../middleware/isAdmin');
const ismm = require('../middleware/ismm');
const Tracker = require('../Models/tracker');
const User = require('../Models/user');

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


router.get('/dashboard', ismm, mmController.getManagementDash);

router.get('/task/:taskId', ismm, taskController.getAdminSingleTask);

// update stage
router.post('/updateStage/:id', ismm, customerTrackerController.updateTrackerStage);
router.get('/tracker/:id', ismm, customerTrackerController.getSingleTracker);
router.post('/add-stats', ismm, performanceControl.addPerformanceAdmin);
router.get('/all/tasks', ismm, mmController.getTasks);
router.get('/tasks/:id', ismm, mmController.getSingleTask);

// cREATE OR ADD NEW SECTIONS
router.post('/updateAddress/:id', ismm, customerTrackerController.updateAddress);
router.post('/updateService/:id', ismm, customerTrackerController.updateService);
router.post('/updateTechnical/:id', ismm, customerTrackerController.updateTech);
router.post('/updateTesting/:id', ismm, customerTrackerController.updateTesting);
router.post('/addContact/:id', ismm, customerTrackerController.addContact);
router.post('/addNote/', ismm, customerTrackerController.addNote);
router.post('/tasks', ismm, mmController.createTask);
router.post('/tasks/task/del/:id', ismm, mmController.deleteTask);

router.post('/tasks/:taskId/file', ismm, upload.single('document'), mmController.addFileToTask);
router.post('/tasks/:id/add-note', ismm, mmController.addNoteToTask);
// router.put('/tasks/:taskId',ismm, taskController.editTask);
// router.post('/tasks/:id', ismm, taskController.deleteTask);
router.post('/tasks/close/:id', ismm, taskController.editTaskStatus);

router.get('/newClient/', ismm, async function (req, res) {
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
router.post('/newClient',ismm, customerTrackerController.addCustomerTracker);

router.get('/wr/reports/generate', isAuth, mmController.fetchLastMondayData);
// router.get('/wr/reports/report/:id', isAuth, mmController.renderWReport);
router.get('/wr/reports', ismm, mmController.getAllWeeklyReports);


// Use the upload middleware in your route handler
router.post('/upload/:id', ismm, upload.single('document'), customerTrackerController.uploadDocument);
// Use the upload middleware in your route handler
router.post('/upload/update/:id', ismm, upload.single('document'), customerTrackerController.updateDocument);

router.post('/document/send/:id', ismm, customerTrackerController.grantDocumentPermission);
router.post('/assign/account-manager/:id', ismm, customerTrackerController.assignTaskToUser);

router.get('/tasks/new-task/create', ismm, mmController.getAddTask);

router.get('/sms/carriers', ismm, customerTrackerController.getSmsCarriers);
router.get('/voip/carriers', ismm, customerTrackerController.getVoipCarriers);
// router.get('/reports', ismm, weeklyReport.getAllWeeklyReports);
// router.get('/reports/generate', ismm, weeklyReport.fetchLastMondayData);
router.get('/client/:id',ismm, customerTrackerController.getSingleTracker);

router.get('/register/newClient/', ismm, async function (req, res) {
  
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
module.exports = router;