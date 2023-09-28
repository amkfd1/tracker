const express = require('express');
const router = express.Router();
const mmController = require('../Controllers/mmController');
const taskController = require('../Controllers/taskController');
const customerTrackerController = require('../Controllers/trackerControl');
const fs = require('fs');
const isAuth = require('../middleware/verifyAuth');
const isAdmin = require('../middleware/isAdmin');
const ismm = require('../middleware/ismm');

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




// Use the upload middleware in your route handler
router.post('/upload/:id', ismm, upload.single('document'), customerTrackerController.uploadDocument);
// Use the upload middleware in your route handler
router.post('/upload/update/:id', ismm, upload.single('document'), customerTrackerController.updateDocument);

router.post('/document/send/:id', ismm, customerTrackerController.grantDocumentPermission);
router.post('/assign/account-manager/:id', ismm, customerTrackerController.assignTaskToUser);


module.exports = router;