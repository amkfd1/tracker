const express = require('express');
const router = express.Router();
const adminController = require('../Controllers/taskController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Replace with your desired upload destination
const isAuth = require('../middleware/verifyAuth');

router.put('/users/:userId/lock', isAuth, adminController.lockUserAccess);

router.post('/password-reset-link', isAuth, adminController.resetUserPassword);

router.put('/users/:userId/profile', isAuth, upload.single('image'), adminController.updateUserProfile);

module.exports = router;
