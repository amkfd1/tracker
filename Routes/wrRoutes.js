const express = require('express');
const router = express.Router();
const isAuth = require('../middleware/verifyAuth');
const ismm = require('../middleware/ismm');

const path = require('path');
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
const {
  createUpdate,
  getUpdates,
  getUpdateById,
  updateUpdate,
  deleteUpdate1,
  updateUserUpdate
}= require("../Controllers/UpdatesController");
//get report
router.get('/reports', isAuth, getAllWeeklyReports);

router.get('/reports/generate', ismm, fetchLastMondayData);

router.get('/reports/:id', isAuth, fetchLastMondayData); 

router.post('/wr/reports/report/submission/:id', ismm, submitWeeklyReport);

// Create a new WeeklyReport
router.post('/create', createWeeklyReport);

// Update a WeeklyReport by ID
router.get('/wr/reports/report/:id', isAuth, renderWReport);

// Update Updates schema within a WeeklyReport
router.put('/update-updates/:id', updateUpdates);

// Delete an update within a WeeklyReport
router.delete('/delete-update/:weeklyReportId/:updateId', deleteUpdate);

// Delete a WeeklyReport by ID
router.delete('/delete/:id', deleteWeeklyReport);

// Update the status of a WeeklyReport
router.put('/update-status/:id', updateStatus);

router.post('/wr/report/update/create', isAuth, createUpdate);



// upload Rates 
// Define a route for uploading Excel documents
router.post('/upload-rates/:id', uploadRates, processRatesUpload);

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
