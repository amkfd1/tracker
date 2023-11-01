const Tracker = require('../Models/tracker');
const Document = require('../Models/document');
const Contact = require('../Models/contact');
const Log = require('../Models/log');
const Note = require('../Models/note');
const User = require('../Models/user');
const fs = require('fs');
const PasswordResetToken = require('../Models/PasswordResetToken'); // Assuming you have a PasswordResetToken model

const path = require('path');
const print = console.log

const Task = require('../Models/task');


exports.lockUserAccess = async (req, res) => {
    try {
        const userId = req.params.userId;
        const {userLock} = req.body //use checkbox to send the lock command
        
        // Find the user by ID
        const user = await User.findById(userId);
        if (!user) {
            print({ message: 'User not found' });
            req.flash('server_error', "User not found")
            return res.status(201).redirect('/track/home');
        }
        
        // Update the settings to lock the user's access
        user.settings.isLocked = userLock;
        
        // Save the updated user
        await user.save();
        
        print({ message: 'User access locked successfully' });
        req.flash('update_success', "User access locked successfully ")
        res.status(201).redirect('/track/home');
    } catch (error) {
        res.status(500).json({ message: 'Error locking user access', error: error.message });
        req.flash('server_error', "Error locking user access")
        res.status(201).redirect('/track/home');
    }
};


exports.resetUserPassword = async (req, res) => {
    try {
      const { username } = req.body;
  
      // Check if the user exists in your database
      // For example, you can use your User model to find the user by their username
      const user = await User.findOne({ username });
  
      if (!user) {
        // req.flash('tracker_404','User not found');
        req.flash('server_error', "User not found")
        return res.status(201).redirect('/track/home');
      }
  
      const token = crypto.randomBytes(20).toString('hex'); // Generate a random token
      const expirationTime = Date.now() + 3600000; // Set expiration time to one hour from now
  
      // Create a new password reset token in your database
      const passwordResetToken = new PasswordResetToken({
        userId: user._id,
        token,
        expiresAt: expirationTime,
      });
  
      await passwordResetToken.save();
  
      // Construct the password reset link
      const resetLink = `http://localhost:3000/auth/change-password?token=${token}`;
  
      // Send the password reset link to the user via email or any other means
  
      res.status(200).redirect(resetLink);
    } catch (error) {
      console.error('Error generating password reset link:', error);
      req.flash('server_error','A server error occurred. Try Again')
      res.status(500).redirect('/500')
    }
  };



exports.updateUserProfile = async (req, res) => {
      try {
          const userId = req.params.userId;
          const updatedProfile = req.body;
          
          // Find the user by ID
          const user = await User.findById(userId);
          if (!user) {
              return res.status(404).json({ message: 'User not found' });
          }
          
          // Update the profile fields
          user.profile = updatedProfile;
  
          // Handle image upload if provided
          if (req.file) {
              // Assuming you're using multer for file uploads
              user.profile.image = req.file.path;
          }
          
          // Save the updated user
          await user.save();
          
          res.json(user);
      } catch (error) {
          res.status(500).json({ message: 'Error updating user profile', error: error.message });
      }
  };
  

exports.getUserById = async (req, res) => {
    try {
        const userId = req.user._id;

        // Find the user by ID
        const user = await User.findById(userId).populate('assignedTasks');
        if (!user) {
            // return res.status(404).json({ message: 'User not found' });
            req.flash('server_error', 'User not found')
            // res.redirect('/user/user-record/'+userId)
        }

        let flash = await req.flash('update_success')[0] || req.flash('permission')[0] || req.flash('register-success')[0];
        let error = req.flash('tracker_404' )[0] || req.flash('server_error')[0] || req.flash('unauthorized')[0] || req.flash('task_already_assigned')[0] || req.flash('account_manager_assigned')[0];
        console.log("image: ", user.profile.image)

        // const userId = req.user._id;
        const tasks = await Task.find({ taskFor: userId }).populate('taskFor');
    
        res.render('records',{user, pageTitle: 'My Record', designation:req.user.designation, isAuthenticated:true, tasks,  message: flash,
        error,});
    } catch (error) {
        // res.status(500).json({ message: 'Error fetching user information', error: error.message });
        
        req.flash('server_error', 'User not found')
        res.redirect('/500')

    }
};
