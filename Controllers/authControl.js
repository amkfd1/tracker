const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../Models/user.js');
const Permission = require('../Models/permission');
const jwt = require('jsonwebtoken');
const print = console.log;
const isAdmin = require('../middleware/isAdmin');
const isAuth = require('../middleware/verifyAuth');
const multer = require('multer');
const crypto = require('crypto');
const PasswordResetToken = require('../Models/PasswordResetToken'); // Assuming you have a PasswordResetToken model
const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/assets/images/'); // Specify the destination folder for storing uploaded files
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filePath = uniqueSuffix + '-' + file.originalname.replace(/\\/g, '/');
    cb(null, filePath); // Set the filename for the uploaded file with forward slashes
  },
});

const upload = multer({ storage: storage });




// Register route
router.post('/register', isAdmin, async (req, res) => {
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

    let emergency_contact = {
      name: '',
      relationship: '',
      phone: '',
      alternative: '',
      Address: ''

    }

    let profile = {
      phone: '',
      image: '',
      dob: '',
      emergency_contact
    }
    // Create a new user
    const newUser = new User({
      name,
      username,
      role,
      designation,
      password: hashedPassword,
      profile
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

router.get('/admin/reset/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    // Check if the username is already taken
    const existingUser = await User.findOne({ _id:id });
    if (!existingUser) {
      // return res.status(400).json({ error: 'Username already exists' });
      req.flash('register_error', 'User not found');
      return res.status(401).redirect('/track/home');
    }
    console.log("This is the user: ", existingUser.password)
    let password = existingUser.username+"123"

    // Generate a salt and hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

   existingUser.password = hashedPassword;
    // Save the user to the database
    await existingUser.save();
    print("Password: ",existingUser.password, "\n Hashed Password: ", hashedPassword)

    req.flash('register-success', 'User password successfully reset');
    res.status(200).redirect('/track/home');
  } catch (error) {
    console.error('Error registering user:', error);
    req.flash('server_error','A server error occured. Try Again')
    res.status(500).redirect('/500')
  }
});

router.post('/reset-password/:userId', isAuth, async (req, res) => {
  const userId = req.params.userId;
  try {
      const userId = req.params.userId;
      let password = req.body.password;
      let cPassword = req.body.cPassword;

      // Validate password and confirm password
      if (password !== cPassword) {
          // return res.status(400).json({ message: 'Passwords do not match' });
          req.flash('server_error', 'Passwords do not match')
          return res.redirect('/user/user-record/'+userId)
      }

      // Find the user by ID
      const user = await User.findById(userId);
      if (!user) {
          // return res.status(404).json({ message: 'User not found' });
          req.flash('server_error', 'User not found')
          return res.redirect('/user/user-record/'+userId)
      }

      // Update the user's password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      user.password = hashedPassword;
      console.log('Password: ', password)
      // Save the updated user
      await user.save();
      req.flash('update_success', 'Password changed')
      return res.redirect('/user/user-record/'+userId)
  } catch (error) {
      // res.status(500).json({ message: 'Error resetting password', error: error.message });
          req.flash('server_error', 'Error resetting password')
          console.log('Error: ', error)
          return res.redirect('/user/user-record/'+userId)
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
    

    let isManagement = false;

    if (user.designation == 'Management') {
      return res.status(401).redirect('/track/management');
    }

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

// Route for uploading profile image
router.post('/change-profile/image/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
      // Find the user by ID
      const user = await User.findById(userId);
      if (!user) {
          req.flash('server_error', 'User not found');
          return res.redirect('/user/user-record/' + userId);
      }

      // Update the user's profile image URL
      user.profile.image = req.file.filename; // Assuming multer has provided the file path
      console.log('')
      upload.single('profile'),
      // Save the updated user
      await user.save();

      req.flash('update_success', 'Profile image uploaded successfully');
      return res.redirect('/user/user-record/' + userId);
  } catch (error) {
      req.flash('server_error', 'Error uploading profile image');
      return res.redirect('/user/user-record/' + userId);
  }
});


 
router.get('/password-reset', async (req, res) => {
  res.render('Auth/reset-password',{
    isAuthenticated: false,
    pageTitle: "Reset Password",
    user: {},

  })
});

router.get('/login', async (req, res) => {
  try {
    // Check if the user is already logged in
    if (req.user) {
      return res.redirect('/track/home');
    }

    // User is not logged in, render the login page
    // let flash = req.flash('login_error') 
    let error = req.flash('tracker_404' )[0] || req.flash('server_error')[0] || req.flash('login_error')[0] 
    console.log("ERROR: ", error)
    res.render('Auth/login', {
      isAuthenticated: false,
      // flash: flash,
      pageTitle: "Login",
      user:{},
      error
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

    res.render('Auth/change-password', { token, isAuthenticated:false, pageTitle:'Forget Password', user: {},});
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
    const resetLink = `https://m-kel-tech-tracker.onrender.com/auth/change-password?token=${token}`;

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
