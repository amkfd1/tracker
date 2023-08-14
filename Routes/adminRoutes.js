const express = require('express');
const router = express.Router();
const adminController = require('../Controllers/taskController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Replace with your desired upload destination


router.put('/users/:userId/lock', adminController.lockUserAccess);

router.post('/password-reset-link', adminController.resetUserPassword);

router.put('/users/:userId/profile', upload.single('image'), adminController.updateUserProfile);

module.exports = router;
