const express = require('express');
const router = express.Router();
const tController = require('../Controllers/ticketController');
const isAdmin = require('../middleware/isAdmin');
const isAuth = require('../middleware/verifyAuth');
const multer = require('multer');
const Task = require('../Models/task');
const fs = require('fs');


router.get('/tickets', tController.getAllData);

router.get('/tickets/form', tController.getNewTicket);

router.post('/tickets/new-ticket', isAuth, tController.createTicket);

router.get('/ticket/:id', tController.getTicket);

router.post('/tickets/new-activity/:id', isAuth, tController.postActivity);



module.exports = router;