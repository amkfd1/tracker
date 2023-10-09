const express = require('express');
const router = express.Router();
const isAuth = require('../middleware/verifyAuth');

const {
  createWeeklyReport,
  updateWeeklyReport,
  updateUpdates,
  deleteUpdate,
  deleteWeeklyReport,
  updateStatus,
  renderWReport,
  renderWReportSingle
} = require('../Controllers/weeklyReportsControl');

//get report
router.get('/reports', isAuth, renderWReport);

router.get('/reports/:id', renderWReportSingle);


// Create a new WeeklyReport
router.post('/create', createWeeklyReport);

// Update a WeeklyReport by ID
router.put('/update/:id', updateWeeklyReport);

// Update Updates schema within a WeeklyReport
router.put('/update-updates/:weeklyReportId', updateUpdates);

// Delete an update within a WeeklyReport
router.delete('/delete-update/:weeklyReportId/:updateId', deleteUpdate);

// Delete a WeeklyReport by ID
router.delete('/delete/:id', deleteWeeklyReport);

// Update the status of a WeeklyReport
router.put('/update-status/:id', updateStatus);

module.exports = router;
