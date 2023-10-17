const WeeklyReport = require('../Models/weeklyReport');
const Tracker = require('../Models/tracker');
const Document = require('../Models/document');
const Contact = require('../Models/contact');
const Log = require('../Models/log');
const Note = require('../Models/note');
const User = require('../Models/user');
const fs = require('fs');
const Ticket = require('../Models/ticket');
const Performance = require('../Models/performance');
const Update = require('../Models/update');

const path = require('path');
const print = console.log


// Create a new update
const createUpdate = async (req, res) => {
  console.log("USER", req.user)
  try {
    const {  update } = req.body;
    const newUpdate = new Update({
      postedBy: req.user._id,
      update,
      dateCreated: new Date(),
      dateUpdated: new Date()
    });

    const savedUpdate = await newUpdate.save();

    // res.status(201).json(savedUpdate);
    res.redirect('/reports')
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
    print(error)
  }
};


// Get all updates
const getUpdates = async (req, res) => {
    try {
      const updates = await Update.find().populate('postedBy');
      res.status(200).json(updates);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  };
  
  // Get a single update by its ID
  const getUpdateById = async (req, res) => {
    try {
      const update = await Update.findById(req.params.id).populate('postedBy');
      if (!update) {
        return res.status(404).json({ error: 'Update not found' });
      }
      res.status(200).json(update);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  };

  
  // Update an existing update by its ID
const updateUpdate = async (req, res) => {
    try {
      const { update } = req.body;
      const updatedUpdate = await Update.findByIdAndUpdate(
        req.params.id,
        { update, dateUpdated: Date.now() }, // Update the text and set dateUpdated
        { new: true }
      );
  
      if (!updatedUpdate) {
        return res.status(404).json({ error: 'Update not found' });
      }
  
      res.status(200).json(updatedUpdate);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  };


// Update an update by ID
const updateUserUpdate = async (req, res) => {
  try {
    const updateId = req.params.id;
    const userId = req.user._id; // Assuming req.user contains the logged-in user's information

    // Find the update by ID and check if the postedBy matches the logged-in user's ID
    const update = await Update.findOne({ _id: updateId, postedBy: userId });

    if (!update) {
      return res.status(404).json({ message: 'Update not found or unauthorized' });
    }

    // Update the update content
    update.update = req.body.update; // Assuming the update content is sent in the request body

    // Save the updated update
    await update.save();

    res.status(200).json({ message: 'Update updated successfully', update });
  } catch (error) {
    console.error('Error updating update:', error);
    res.status(500).json({ error: 'Server error' });
  }
};



  
  // Delete an update by its ID
const deleteUpdate1 = async (req, res) => {
    try {
      const deletedUpdate = await Update.findByIdAndRemove(req.params.id);
      if (!deletedUpdate) {
        return res.status(404).json({ error: 'Update not found' });
      }
      res.status(204).end(); // 204 No Content
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  };
  
  module.exports = {
    createUpdate,
    getUpdates,
    getUpdateById,
    updateUpdate,
    deleteUpdate1,
    updateUserUpdate
  };
  