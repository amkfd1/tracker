const WeeklyReport = require('../Models/weeklyReport');
const Tracker = require('../Models/tracker');
const Document = require('../Models/document');
const Contact = require('../Models/contact');
const Log = require('../Models/log');
const Note = require('../Models/note');
const User = require('../Models/user');
const fs = require('fs');
const Ticket = require('../Models/ticket');
const Rate = require('../Models/rate');
const multer = require('multer')
const Task = require('../Models/task');

const Update = require('../Models/update');
const Performance = require('../Models/performance');

const path = require('path');
const print = console.log

 // Calculate the date of the last Monday
//  const today =rs new Date();
//  const monday = new Date(today);

 const today = new Date();
 const lastMonday = new Date(today);
 lastMonday.setDate(today.getDate() - ((today.getDay() - 1 + 7) % 7));
 lastMonday.setHours(0, 0, 0, 0); // Set to midnight
  // Format lastMonday and today to display date and time (without seconds)
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  };
  const startR = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    
  };

// Define the controller function
async function fetchLastMondayData(req, res) {
  try {
     
      // 88888888888888888888888888888888888

      // Calculate the date range for the current week (from Monday)
      //  const today = new Date();
      //  const monday = new Date(today);
      //  monday.setDate(today.getDate() - ((today.getDay() - 1 + 7) % 7));

      // Check if a report already exists for the current week
      const existingReport = await WeeklyReport.findOne({
        dateGenerated: { $gte: lastMonday, $lt: new Date() }
      });
      console.log("This Is last Monday's report: ", existingReport)
      if (existingReport) {
          // Redirect to the existing report if it exists
          return res.redirect(`/wr/reports/report/${existingReport._id}`);
          // return console.log("Report Found: ")
      }

      // Create a new report for the current week
      const newReport = new WeeklyReport({ date: monday });
      console.log("Creating new Report: ", newReport)
      // Fetch performances from last Monday
      const performances = await Performance.find({
        date: { $gte: lastMonday, $lt: today }
      }).populate('tracker', 'Customer_Name CB CL _id');

      // Initialize an object to store carrier performances
      const carrierPerformances = {};

      // Iterate through performances and organize them by carrier
      performances.forEach((performance) => {
        const carrierId = performance.tracker._id.toString();

        // Initialize carrier if it doesn't exist in the object
        if (!carrierPerformances[carrierId]) {
            carrierPerformances[carrierId] = {
                carrier: {
                    _id: carrierId,
                    Customer_Name: performance.tracker.Customer_Name,
                    CB: performance.tracker.CB,
                    CL: performance.tracker.CL,
                },
                totalMinutesRoutesTerminated: 0,
            };
        }

        // Add the minutesRoutesTerminated to the carrier's total
        carrierPerformances[carrierId].totalMinutesRoutesTerminated += performance.minutesRoutesTerminated;
      });

      // Convert the object of carrier performances to an array
      const carrierPerformanceArray = Object.values(carrierPerformances);

      // console.log("Performances from Active carriers: ", carrierPerformanceArray)
      // Fetch tickets from last Monday
      const tickets = await Ticket.find({
        date: { $gte: lastMonday, $lt: today }
      }).populate('client', '_id Customer_Name').populate('assignee', '_id name');

      // console.log("TICKETS: ", tickets)
      // Fetch all weekly reports from the database
   

      const formattedLastMonday = lastMonday.toLocaleString(undefined, startR);
      const formattedToday = today.toLocaleString(undefined, options);

      // Combine the formatted dates into ReportDateRange
      const ReportDateRange = `${formattedLastMonday} - ${formattedToday}`;

      const updates = await Update.find({
        dateCreated: { $gte: lastMonday, $lt: new Date() }
      }).populate('postedBy', 'name _id');

      // print("Performance: ", performances)
      // print("Tickets: ", tickets)
      // print("weeklyReports: ", weeklyReports)

      // console.log("Updates: ", updates)

      newReport.update = updates/* Add the updates data */;
      newReport.dateGenerated = new Date();
      newReport.tickets = tickets/* Add the tickets data */;

      print("Your Weekly Report Performances: ", performances)
      // Save the newReport to the database
      await newReport.save();

        return res.redirect(`/wr/reports/report/${newReport._id}`);


      // Respond with the fetched data
      // return res.status(200).render('wReport',{
      //     performances: carrierPerformanceArray,
      //     tickets,
      //     updates,
      //     report: newReport,
      //     pageTitle: "Reports",
      //     designation: 'NOC-TL',
      //     isAuthenticated: true,
      //     user: req.user,
      //     ReportDateRange
      // });
  } catch (error) {
      console.error('Error fetching data:', error);
      return res.status(500).json({ error: 'Server error' });
  }
}



// Controller function to render the "wReport" HTML template and fetch all weekly reports
const renderWReport = async (req, res) => {
  // Fetch all weekly reports from the database
  const weeklyReports = await WeeklyReport.findById(req.params.id);
  // print("One Report: ", weeklyReports)

  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 (Sunday) to 6 (Saturday)
  const daysUntilMonday = (dayOfWeek === 0) ? 1 : (8 - dayOfWeek);

  const firstMonday = new Date(now);
  firstMonday.setDate(now.getDate() + daysUntilMonday);
    try {
      const updates = await Update.find({
        dateUpdated: { $gte: lastMonday, $lt: new Date() }
      }).populate('postedBy', 'name _id');
      
      const formattedLastMonday = lastMonday.toLocaleString(undefined, startR);
      const formattedToday = today.toLocaleString(undefined, options);

      // Combine the formatted dates into ReportDateRange
      const ReportDateRange = `${formattedLastMonday} - ${formattedToday}`;

      const tickets = await Ticket.find({
        date: { $gte: lastMonday, $lt: today }
      }).populate('client', '_id Customer_Name').populate('assignee', '_id name');
      let ticks = []
      tickets.forEach((tick) => {
        const date = new Date(tick.date);
        tick.date = date.toISOString().split('T')[0];
        // console.log("This is the date: ", tick.date);
        ticks.push(tick);
      });
      // print("This is ticket: ", ticks)
      // console.log("First Monday: ", lastMonday);
      // console.log("Now: ", today);
      // console.log("This is ticket: ", tickets);

      const performances = await Performance.find({
        date: { $gte: lastMonday, $lt: today }
      }).populate('tracker', 'Customer_Name CB CL _id');

      const pperformances = await Performance.find().populate('tracker', 'Customer_Name CB CL _id');
      
      // Filter performances that occurred from last Monday to today
    const performancesFromLastMonday = pperformances.filter((performance) => {
      const performanceDate = new Date(performance.date); // Assuming 'date' is a property in your performance object
      return performanceDate >= lastMonday && performanceDate <= currentDate;
    
      });
      console.log('This is unfiltered Performance: ', performancesFromLastMonday)
      // Initialize an object to store carrier performances
      const carrierPerformances = {};

      // Iterate through performances and organize them by carrier
      performances.forEach((performance) => {
        const carrierId = performance.tracker._id.toString();

        // Initialize carrier if it doesn't exist in the object
        if (!carrierPerformances[carrierId]) {
            carrierPerformances[carrierId] = {
                carrier: {
                    _id: carrierId,
                    Customer_Name: performance.tracker.Customer_Name,
                    CB: performance.tracker.CB,
                    CL: performance.tracker.CL,
                },
                totalMinutesRoutesTerminated: 0,
            };
        }

        // Add the minutesRoutesTerminated to the carrier's total
        carrierPerformances[carrierId].totalMinutesRoutesTerminated += performance.minutesRoutesTerminated;
      });

      // Convert the object of carrier performances to an array
      const carrierPerformanceArray = Object.values(carrierPerformances);


      weeklyReports.update = updates/* Add the updates data */;
      // weeklyReports.dateGenerated = new Date();
      weeklyReports.tickets = ticks/* Add the tickets data */;

      const mytask = await Task.find({taskFor: req.user._id}).populate('assignedBy', 'name');
      let UnopenedTask = []
      mytask.forEach( (task) => {

        if (task.isOpened){
          UnopenedTask.push(task)
        }
      })

      // get trackers to allow selection
      const trackers = await Tracker.find()

      let allRates = []
      const rates = await Rate.find({ wklReport: req.params.id }).populate('carrier', 'Customer_Name _id');
      for (i in rates ){
        let rate = {
          carrier: rates[i].carrier ,
          wklReport: rates[i].wklReport,
          dateReceived: rates[i].dateReceived.toISOString().split('T')[0], 
          documentPath: rates[i].documentPath,
          documentTitle: rates[i].documentTitle,
        }
        allRates.push(rate)
      }
      // print("Your updates: ", weeklyReports.update)
      weeklyReports.save();
      print("Performances: ", pperformances)
      
      res.render('wReport', { 
        weeklyReports,
        performance: pperformances,
        tickets: ticks,
        updates: weeklyReports.update,
        pageTitle: "Reports",
        designation: 'NOC-TL',
        isAuthenticated: true,
        user: req.user,
        ReportDateRange,
        mytask,
        UnopenedTask, 
        trackers,
        rates: allRates
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
      res.render('wReport-Single', { 
        weeklyReport,  
        user: req.user,
        pageTitle: "Weekly Report"
      
      });
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

    console.log("")
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
const submitWeeklyReport = async (req, res) => {
    try {
      const { id } = req.params;
      // const { updates, cWeeklyActivities } = req.body;
  
      const updatedWeeklyReport = await WeeklyReport.findByIdAndUpdate(
        id,
      );
      updatedWeeklyReport.isSubmitted.submitted = true
      updatedWeeklyReport.isSubmitted.dateSubmitted = new Date()
      updatedWeeklyReport.save()
      print("Your new SUB: ", updatedWeeklyReport.isSubmitted)
      res.redirect(`/wr/reports/report/${id}`)
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
  
  
  // Function to get all weekly reports
async function getAllWeeklyReports(req, res) {
  try {
    // Find all weekly reports in the collection
    const weeklyReports = await WeeklyReport.find({});
    let wklr = []
    for (i in weeklyReports){
      let report= {
        isSubmitted: weeklyReports[i].isSubmitted,
        _id: weeklyReports[i]._id,
        update: weeklyReports[i].update,
        alertActive: weeklyReports[i].alertActive,
        tickets: weeklyReports[i].tickets,
        dateGenerated: weeklyReports[i].dateGenerated.toISOString().split('T')[0],
      }
      wklr.push(report)
    }
    console.log("REPORTS: ", weeklyReports)
    return res.render('WeeklyReportsList', {
      pageTitle: 'Weekly Reports',
      user: req.user,
      wkReports: wklr

    });
  } catch (error) {
    console.error(error); // Log the error for debugging
    return res.status(500).json({ error: 'An error occurred while fetching weekly reports.' });
  }
}

// Define storage for uploaded Excel files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads'); // Change the destination folder as needed
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // Rename the file as needed
  },
});

const upload = multer({ storage: storage });

// Controller function to upload an Excel document
const uploadRates = upload.single('file'); // Assuming you have a file input named 'file' in your form

const processRatesUpload = async (req, res) => {
   let {
      carrier,
      dateReceived,
      documentTitle
    } = req.body
      let id  = req.params.id
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // The file has been uploaded to the 'uploads' folder with the specified name

    // You can save the file information to your database if needed
    const documentPath = req.file.filename;

    // Create a new Rates document and save it to the database with the file path
    const newRate = new Rate({
      documentPath,
      carrier,
      dateReceived,
      documentTitle,
      wklReport: id


    });

    await newRate.save();
// console.log("Uploading Rates: ", newRate)
    // Respond with a success message
    res.status(200).redirect('/wr/reports/report/'+id);
  } catch (error) {
    console.error('Error processing Excel file:', error);
    res.status(500).json({ error: 'An error occurred while uploading the Excel file' });
  }
};

module.exports = { 
    createWeeklyReport,
    // updateWeeklyReport,
    updateUpdates,
    deleteUpdate,
    deleteWeeklyReport,
    updateStatus,
    renderWReport,
    renderWReportSingle,
    fetchLastMondayData,
    submitWeeklyReport,
    getAllWeeklyReports,
    uploadRates,
    processRatesUpload



};



