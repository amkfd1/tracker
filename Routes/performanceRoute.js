const express = require('express');
const router = express.Router();
const performanceControl = require('../Controllers/performanceControl');
const fs = require('fs');
const isAuth = require('../middleware/verifyAuth');
const isAdmin = require('../middleware/isAdmin');


router.get('/management-summary',  performanceControl.getVoipPerformances);

router.get('/management-summary-sms',  performanceControl.getSMSPerformances);

router.get('/monthly-summary',  performanceControl.getMonthlyPerformances);

router.get('/carrier-stats',  performanceControl.getTotalCarrierVoip);

router.post('/admin/add-stats', isAdmin, performanceControl.addPerformanceAdmin);

router.post('/add-stats', isAuth, performanceControl.addPerformanceStaff);

module.exports = router;