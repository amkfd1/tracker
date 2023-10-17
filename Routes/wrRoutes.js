const express = require('express');
const router = express.Router();
const isAuth = require('../middleware/verifyAuth');

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
  submitWeeklyReport
} = require('../Controllers/weeklyReportsControl');
const {
  createUpdate,
  getUpdates,
  getUpdateById,
  updateUpdate,
  deleteUpdate1,
  updateUserUpdate
}= require("../Controllers/UpdatesController");
//get report
router.get('/reports', isAuth, fetchLastMondayData);

router.get('/reports/:id', renderWReportSingle);

router.post('/wr/reports/report/submission/:id', submitWeeklyReport);

// Create a new WeeklyReport
router.post('/create', createWeeklyReport);

// Update a WeeklyReport by ID
router.get('/wr/reports/report/:id', renderWReport);

// Update Updates schema within a WeeklyReport
router.put('/update-updates/:weeklyReportId', updateUpdates);

// Delete an update within a WeeklyReport
router.delete('/delete-update/:weeklyReportId/:updateId', deleteUpdate);

// Delete a WeeklyReport by ID
router.delete('/delete/:id', deleteWeeklyReport);

// Update the status of a WeeklyReport
router.put('/update-status/:id', updateStatus);


// Staff Updates functions

// Create a new update
router.post('/w/updates', isAuth, createUpdate);

// Get all updates
router.get('/w/updates', getUpdates);

// Get a single update by its ID
router.get('/w/updates/:id', getUpdateById);

// Update an existing update by its ID
router.post('/w/updates/:id', isAuth, updateUserUpdate);

// Delete an update by its ID
router.delete('/w/updates/:id', deleteUpdate);

module.exports = router;
