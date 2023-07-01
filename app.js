const path = require('path');
const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const trackerRoutes = require('./Routes/trackerRoutes');
const staffRoutes = require('./Routes/staffRoutes');
const Log = require('./Models/log');
const Permission = require('./Models/permission');
const authControl = require('./Controllers/authControl');
const cookieParser = require('cookie-parser');
var flash = require('connect-flash');
const session = require('express-session');
const isAuth = require('./middleware/verifyAuth');
 

const fs = require('fs');
const MONGODB_URI =
    'mongodb+srv://adamahmad:Malammadorikfada123@cluster0.2svvk.mongodb.net/Tracker'
    

const app = express();
app.use(cors());
app.use(cookieParser());



app.set('view engine', 'ejs');
app.set('views', 'views'); 




app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  key: 'keyin',
  secret:'Mkel_Secret',
  saveUninitialized: true,
  resave: false
}));

app.use(flash());
// app.use(
//   multer({ storage: fileStorage, fileFilter: fileFilter }).array('image')
// );
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
// console.log('images destination');


app.use('/auth', authControl);
app.get('404', async (req, res) => {
  // res.render('')
  res.send({Message: '404 Page not found' })
});
app.get('500', async (req, res) => {
  // res.render('')
  res.send({Message: ' Server Error' })
});

// Global middleware for logging
app.use(isAuth, (req, res, next) => {
  const timestamp = new Date().toISOString();
  const userName = req.user.name || 'Anonymous';
  const route = `${req.method} ${req.url}`;

  // Check if the page is being refreshed
  const isPageRefreshed = req.get('Cache-Control') === 'max-age=0' || req.get('Pragma') === 'no-cache';

  // Log the accessed route and user name
  console.log(`${timestamp} - User: ${userName} - Route: ${route}`);

  // Save logs into the database if the page is not being refreshed
  if (!isPageRefreshed) {
    const log = new Log({
      timestamp,
      userName,
      route,
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


app.use('/track', trackerRoutes);

// app.use('/auth', authControl);

app.use('/', staffRoutes);





  mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(result => {
    app.listen(3000);
    console.log('Server opened on port 3000');
  })
  .catch(err => {
    console.error('Error connecting to the database:', err);
    // Handle the error and perform any necessary actions
    // For example, you can gracefully terminate the application or show an error page
    // res.render('500')
  });

//  app.listen(3003);
//  console.log('Server opened on port 3003');