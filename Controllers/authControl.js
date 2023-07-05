const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../Models/user.js');
const Permission = require('../Models/permission');
const jwt = require('jsonwebtoken');
const print = console.log;
const crypto = require('crypto');
const PasswordResetToken = require('../Models/PasswordResetToken'); // Assuming you have a PasswordResetToken model
const router = express.Router();

// Register route
router.post('/register', async (req, res) => {
  try {
    const { name, username, role, designation } = req.body;
    let password = username+"123"
    print("Password: ",password, "\n body: ", req.body)
    // Check if the username is already taken
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      // return res.status(400).json({ error: 'Username already exists' });
      req.flash('register_error', 'username already registered');
      return res.status(401).redirect('/auth/login');
    }

    // Generate a salt and hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user
    const newUser = new User({
      name,
      username,
      role,
      designation,
      password: hashedPassword,
    });

    // Save the user to the database
    await newUser.save();

    req.flash('register-success', 'User successfully registered');
    res.status(200).redirect('/track/home');
  } catch (error) {
    console.error('Error registering user:', error);
    req.flash('server_error','A server error occured. Try Again')
    res.status(500).redirect('/500')
  }
});


router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if the username exists in the database
    const user = await User.findOne({ username });
    if (!user) {
      req.flash('login_error', 'Invalid username or password');
      return res.status(401).redirect('/auth/login');
    }

    // Compare the provided password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      req.flash('login_error', 'Invalid username or password')
      return res.status(401).redirect('/auth/login');
    }

    // Generate a JSON Web Token (JWT)
    const token = jwt.sign({ userId: user._id }, 'mkel_networks', { expiresIn: '1h' });

    // Save the JWT as a cookie
    res.cookie('token', token, { httpOnly: true });
    

    

    // print("User: ", await req.user)
    // const { role } = req.user;
    // console.log('YOUR ROLE IS LOGGED: ', role)
    // if (role == 'Admin') {
    //   req.flash('Login-success', 'You are succesfully logged in!');
    //   return res.redirect('/track/home');
    // }else {
      req.flash('Login-success', 'You are succesfully logged in!');
      res.status(200).redirect('/track/home');
    // }
    
  } catch (error) {
    console.error('Error logging in:', error);
    req.flash('server_error','A server error occured. Try Again')
    res.status(500).redirect('/500')
  }
});

 
router.get('/password-reset', async (req, res) => {
  res.render('Auth/reset-password',{
    isAuthenticated: false,
    pageTitle: "Reset Password"
  })
})

router.get('/login', async (req, res) => {
  try {
    // Check if the user is already logged in
    if (req.user) {
      return res.redirect('/track/home');
    }

    // User is not logged in, render the login page
    let flash = req.flash('login_error') 

    res.render('Auth/login', {
      isAuthenticated: false,
      flash: flash,
      pageTitle: "Login"
    });
  } catch (error) {
    console.error('Error rendering login page:', error);
    req.flash('server_error','A server error occured. Try Again')
    res.status(500).redirect('/500')
  }
});

// Change Password
router.get('/change-password', async (req, res) => {
  try {
    const { token } = req.query;

    // Find the password reset token in the database
    const passwordResetToken = await PasswordResetToken.findOne({ token });

    if (!passwordResetToken) {
      return res.status(404).json({ error: 'Invalid or expired password reset token' });
    }

    // Check if the token has expired
    if (passwordResetToken.expiresAt < Date.now()) {
      return res.status(401).json({ error: 'Password reset token has expired' });
    }

    // Retrieve the user associated with the password reset token
    const user = await User.findById(passwordResetToken.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Proceed with the password reset process
    // For example, you can render a password reset form and pass the token to it

    res.render('Auth/change-password', { token, isAuthenticated:false, pageTitle:'Forget Password'});
  } catch (error) {
    console.error('Error generating password reset link:', error);
    res.status(500).json({ error: 'Failed to generate password reset link' });
  }
});

router.post('/change-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    // Find the password reset token in the database
    const passwordResetToken = await PasswordResetToken.findOne({ token });

    if (!passwordResetToken) {
      return res.status(404).json({ error: 'Invalid or expired token' });
    }

    // Check if the token has expired
    if (Date.now() > passwordResetToken.expiresAt) {
      // Remove the expired token from the database
      await PasswordResetToken.deleteOne({ token });

      return res.status(401).json({ error: 'Token has expired' });
    }

    // Find the user associated with the password reset token
    const user = await User.findById(passwordResetToken.userId);

    if (!user) {
      req.flash('tracker_404','User not found');
      return res.status(404).redirect('/auth/change-password');
    }

    // Update the user's password
    user.password = await bcrypt.hash(password, 10);
    await user.save();

    // Remove the password reset token from the database
    await PasswordResetToken.deleteOne({ token });

    res.status(200).redirect('/');
  } catch (error) {
    console.error('Error saving password:', error);
    req.flash('server_error','A server error occured. Try Again')
    res.status(500).redirect('/500')
  }
});



// Reset Password
// Router handler for generating a password reset link
router.post('/password-reset-link', async (req, res) => {
  try {
    const { username } = req.body;

    // Check if the user exists in your database
    // For example, you can use your User model to find the user by their username
    const user = await User.findOne({ username });

    if (!user) {
      req.flash('tracker_404','User not found');
      return res.status(404).redirect('/404');
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
    req.flash('server_error','A server error occured. Try Again')
    res.status(500).redirect('/500')
  }
});



router.get('/logout', (req, res) => {
  try {
    // Clear the token cookie
    res.clearCookie('token');

    // Redirect to the login page or any other desired destination
    res.redirect('/auth/login');
  } catch (error) {
    console.error('Error logging out:', error);
    req.flash('server_error','A server error occured. Try Again')
    res.status(500).redirect('/500')
  }
});

module.exports = router;
