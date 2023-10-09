const WeeklyReport = require('../Models/weeklyReport');
const Tracker = require('../Models/tracker');
const Document = require('../Models/document');
const Contact = require('../Models/contact');
const Log = require('../Models/log');
const Note = require('../Models/note');
const User = require('../Models/user');
const fs = require('fs');
const Task = require('../Models/task');

const path = require('path');
const print = console.log

// Controller function to render the "wReport" HTML template and fetch all weekly reports
const renderWReport = async (req, res) => {
    try {
      // Fetch all weekly reports from the database
      const weeklyReports = await WeeklyReport.find();
  
      // Render the "wReport" template with the fetched data
      res.render('wReport', { 
        weeklyReports,
        pageTitle: "Reports",
        designation: 'NOC-TL',
        isAuthenticated: true,
        user: req.user,
     });
    } catch (error) {
      // Handle errors, e.g., database connection issues
      console.error('Error fetching weekly reports:', error);
      res.status(500).send('Server Error');
    }
  };
  
  // Controller function to render the "wReport-Single" HTML template for a specific report by ID
  const renderWReportSingle = async (req, res) => {
    const { id } = req.params;
  
    try {
      // Fetch the specific weekly report by ID from the database
      const weeklyReport = await WeeklyReport.findById(id);
  
      if (!weeklyReport) {
        // Report not found, handle this case as needed
        return res.status(404).send('Report not found');
      }
  
      // Render the "wReport-Single" template with the fetched data
      res.render('wReport-Single', { weeklyReport });
    } catch (error) {
      // Handle errors, e.g., database connection issues
      console.error('Error fetching weekly report:', error);
      res.status(500).send('Server Error');
    }
  };





// Create a new WeeklyReport
const createWeeklyReport = async (req, res) => {
  try {
    const { updates, cWeeklyActivities } = req.body;

    const newWeeklyReport = new WeeklyReport({
      updates,
      cWeeklyActivities,
    });

    const savedWeeklyReport = await newWeeklyReport.save();

    res.status(201).json(savedWeeklyReport);
  } catch (error) {
    console.error('Error creating WeeklyReport:', error);
    res.status(500).json({ error: 'Server error' });
  }
};


// Update a WeeklyReport by ID
const updateWeeklyReport = async (req, res) => {
    try {
      const { id } = req.params;
      const { updates, cWeeklyActivities } = req.body;
  
      const updatedWeeklyReport = await WeeklyReport.findByIdAndUpdate(
        id,
        { updates, cWeeklyActivities },
        { new: true }
      );
  
      res.json(updatedWeeklyReport);
    } catch (error) {
      console.error('Error updating WeeklyReport:', error);
      res.status(500).json({ error: 'Server error' });
    }
  };
  
// Update Updates schema within a WeeklyReport
const updateUpdates = async (req, res) => {
    try {
      const { weeklyReportId } = req.params;
      const { updateData } = req.body;
  
      const updatedWeeklyReport = await WeeklyReport.findByIdAndUpdate(
        weeklyReportId,
        { $push: { updates: updateData } },
        { new: true }
      );
  
      res.json(updatedWeeklyReport);
    } catch (error) {
      console.error('Error updating Updates schema:', error);
      res.status(500).json({ error: 'Server error' });
    }
  };
  
 // Delete an update within a WeeklyReport
const deleteUpdate = async (req, res) => {
    try {
      const { weeklyReportId, updateId } = req.params;
  
      const updatedWeeklyReport = await WeeklyReport.findByIdAndUpdate(
        weeklyReportId,
        { $pull: { updates: { _id: updateId } } },
        { new: true }
      );
  
      res.json(updatedWeeklyReport);
    } catch (error) {
      console.error('Error deleting update:', error);
      res.status(500).json({ error: 'Server error' });
    }
  };
  


  // Delete a WeeklyReport by ID
const deleteWeeklyReport = async (req, res) => {
    try {
      const { id } = req.params;
  
      await WeeklyReport.findByIdAndRemove(id);
  
      res.json({ message: 'WeeklyReport deleted' });
    } catch (error) {
      console.error('Error deleting WeeklyReport:', error);
      res.status(500).json({ error: 'Server error' });
    }
  };
  

  // Update the status of a WeeklyReport
const updateStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
  
      const updatedWeeklyReport = await WeeklyReport.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );
  
      res.json(updatedWeeklyReport);
    } catch (error) {
      console.error('Error updating status:', error);
      res.status(500).json({ error: 'Server error' });
    }
  };
  
  
  
  
  

module.exports = { 
    createWeeklyReport,
    updateWeeklyReport,
    updateUpdates,
    deleteUpdate,
    deleteWeeklyReport,
    updateStatus,
    renderWReport,
    renderWReportSingle

};



