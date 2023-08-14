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
      req.flash('not_found', "User not found")
      return res.status(401).redirect('/auth/login');
    }
    // Set req.user as the authenticated user object
    req.user = {
      _id: user._id,
      name: user.name,
      username: user.username,
      role: user.role,
      department:user.role,
      designation: user.designation,
      assignedTasks: user.assignedTasks,
    };
    // console.log("USER: ", user)

    req.user.isLoggedIn = true;
    // const { role } = req.user;
    // console.log('YOUR ROLE IS LOGGED: ', role)
    // if (role == 'Admin') {
    //   return res.redirect('/track/home');
    // }
  
    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.error('Error authenticating user:', error);
    res.status(401).redirect('/auth/login');
  }

};

module.exports = [
  authenticateUser
]