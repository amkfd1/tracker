const express = require('express');
const router = express.Router();
const Log = require('../Models/log');
const isAuth = require('../middleware/verifyAuth');

router.use(isAuth, (req, res, next) => {
  const timestamp = new Date().toISOString();
  const userName = req.user.name || 'Anonymous';
  const method = req.method;
  const url = req.url;
  let route = '';

  // Determine the natural language representation of the route
  switch (url) {
    case '/':
      route = 'Home';
      break;
    case '/dashboard':
      route = 'Dashboard';
      break;
    case '/profile':
      route = 'Profile';
      break;
    case '/updateAddress/:id':
      route = 'Update Address';
      break;
    case '/updateService/:id':
      route = 'Update Service';
      break;
    case '/updateTechnical/:id':
      route = 'Update Technical';
      break;
    case '/updateTesting/:id':
      route = 'Update Testing';
      break;
    case '/addContact/:id':
      route = 'Add Contact';
      break;
    case '/addNote/':
      route = 'Add Note';
      break;
    case '/upload/:id':
      route = 'Upload Document';
      break;
    case '/upload/update/:id':
      route = 'Update Document';
      break;
    case '/document/send/:id':
      route = 'Send Document';
      break;
    case '/assign/account-manager/:id':
      route = 'Assign Account Manager';
      break;
    case '/document/grant-access/':
      route = 'Grant Document Access';
      break;
    case '/updateStage/:id':
      route = 'Update Tracker Stage';
      break;
    case '/newClient':
      route = 'Add Customer Tracker';
      break;
    case '/updateTracker/:id':
      route = 'Update Customer Tracker';
      break;
    case '/home':
      route = 'Get All Customer Trackers';
      break;
    case '/search':
      route = 'Search Customer by Name';
      break;
    case '/client/:id':
      route = 'Get Single Tracker';
      break;
    case '/addNote':
      route = 'Add Note';
      break;
    // Add more cases for other routes as needed
    default:
      route = url;
  }

  // Check if the page is being refreshed
  const isPageRefreshed = req.get('Cache-Control') === 'max-age=0' || req.get('Pragma') === 'no-cache';

  // Log the accessed route and user name
  console.log(`${timestamp} - User: ${userName} - Route: ${route}`);

  // Save logs into the database if the page is not being refreshed
  if (!isPageRefreshed) {
    const log = new Log({
      timestamp,
      userName,
      route: `${method} ${route}`,
    });

    log.save()
      .then(() => {
        console.log('Log saved into the database');
      })
      .catch((error) => {
        console.error('Error saving log into the database:', error);
      });
  }

  next();
});

module.exports = router;
