const jwt = require('jsonwebtoken');
const User = require('../Models/user.js');

const authenticateUser = async (req, res, next) => {
  try {
    // Check if the user is logged in
    if (!req.cookies.token) {
      console.log("Sending you Back!")
      return res.redirect('/auth/login');
    }
    // Get the JWT token from the cookie
    const token = req.cookies.token;

    // Verify the token
    const decoded = jwt.verify(token, 'mkel_networks');

    // Get the user ID from the token payload
    const userId = decoded.userId;

    // Find the user in the database
    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Set req.user as the authenticated user object
    req.user = {
      _id: user._id,
      name: user.name,
      username: user.username,
      role: user.role,
      department: user.role,
      designation: user.designation,
      assignedTasks: user.assignedTasks,
    //   isManagement
    };

    req.user.isLoggedIn = true;

    const { designation, role } = req.user; // Assuming the user object is available in the request

    // console.log("CURRENT USER: ", req.user)
    if (designation !== 'NOC-TL' && designation !== 'NOC-TL') {
      return res.redirect('/');
    }
  
    // console
    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.error('Error authenticating user:', error);
    res.redirect('/auth/login');
  }

};

module.exports = [
  authenticateUser
]