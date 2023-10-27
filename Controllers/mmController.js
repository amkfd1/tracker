const Tracker = require('../Models/tracker');
const Document = require('../Models/document');
const Contact = require('../Models/contact');
const Log = require('../Models/log');
const Note = require('../Models/note');
const User = require('../Models/user');
const Performance = require('../Models/performance');
const WeeklyReport = require('../Models/weeklyReport');
const Update = require('../Models/update');
const Ticket = require('../Models/ticket');
const Rate = require('../Models/rate');
const fs = require('fs');
const PasswordResetToken = require('../Models/PasswordResetToken'); // Assuming you have a PasswordResetToken model

const path = require('path');
const print = console.log

const Task = require('../Models/task');


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









function formatDateToDdMmYyyy(date) {
    // Ensure 'date' is a valid Date object
    if (!(date instanceof Date) || isNaN(date)) {
      throw new Error('Invalid date');
    }
  
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is zero-based
    const year = date.getFullYear();
  
    return `${day}/${month}/${year}`;
  }

// Function to get the sum of 'terminatedminutes' for the same day
async function dailyMinutes() {
    // ... Implement the dailyMinutes function as shown in the previous response ...
    const currentDate = new Date();
    try {
      const sumForSameDay = await Performance.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0),
              $lte: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59),
            },
          },
        },
        {
          $group: {
            _id: null,
            totalTerminatedMinutes: {
              $sum: '$minutesRoutesTerminated',
            },
          },
        },
      ]);
      return sumForSameDay.length ? sumForSameDay[0].totalTerminatedMinutes : 0;
    } catch (error) {
      console.error('Error while calculating daily minutes:', error);
      throw error;
    }
  }
  
  // Function to get the sum of 'terminatedminutes' for the entire week
  async function weeklyMinutes() {
    const endDate = new Date(); // Current date
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
  
    const performances = await Performance.find({
      date: { $gte: startDate, $lte: endDate }
    }).populate({
      path: 'tracker',
      match: { 'service_interest.service_name': 'VoIP' }
    });
  
    let totalMinutes = 0;
    let totalASR = 0;
    let totalACD = 0;
    let voipPerformanceCount = 0;
  
    performances.forEach(performance => {
      if (performance.tracker) {
        totalMinutes += performance.minutesRoutesTerminated;
        totalASR += performance.asr;
        totalACD += performance.acd;
        voipPerformanceCount++;
      }
    });
  
    const weeklyAverageASR = totalASR / voipPerformanceCount;
    const weeklyAverageACD = totalACD / voipPerformanceCount;
  
    return {
      totalMinutes,
      weeklyAverageASR,
      weeklyAverageACD
    };
  }
  
  
  // Function to get the sum of 'terminatedminutes' for the entire week
  async function weeklySMSCount() {
    const endDate = new Date(); // Current date
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
  
    const performances = await Performance.find({
      date: { $gte: startDate, $lte: endDate }
    }).populate({
      path: 'tracker',
      match: { 'service_interest.service_name': 'SMS' }
    });
  
    let totalSms = 0;
    let smsPerformanceCount = 0;
  
    performances.forEach(performance => {
      if (performance.tracker) {
        totalSms+= performance.totalSMS;
        
        smsPerformanceCount++;
      }
    });
  
  
  
    return {
      totalSms,
     
    };
  }
  
  async function dailySMSCount() {
    const currentDate = new Date(); // Current date
  
    const performances = await Performance.find({
      date: {
        $gte: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0),
        $lte: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59)
      }
    }).populate({
      path: 'tracker',
      match: { 'service_interest.service_name': 'SMS' }
    });
  
    let smsCount = 0;
    let totalSms = 0;
    performances.forEach(performance => {
      if (performance.tracker) {
        totalSms+= performance.totalSMS;
        smsCount++;
      }
    });
  
    return totalSms;
  }

const getManagementDash = async (req, res) => {
    try {
      const trackers = await Tracker.find().populate('account_manager');
  
      let totalStages = 0;
      let completedStages = 0;
      let assignedClients = 0;
      let unassignedClients = 0;
  
      for (const tracker of trackers) {
        const serviceName = tracker.service_interest.service_name;
  
        if (tracker.service_interest && tracker.service_interest.status === 'Complete') {
          completedStages++;
        }
  
        if (tracker.Tech_info && tracker.Tech_info.status === 'Complete') {
          completedStages++;
        }
  
        if (tracker.testing && tracker.testing.testing_status === 'Completed') {
          completedStages++;
        }
  
        totalStages += 3;
  
        if (tracker.account_manager) {
          assignedClients++;
        } else {
          unassignedClients++;
        }
      }
  
      const overallCompletion = ((completedStages / totalStages) * 100).toFixed(2);
  
      const voip = [];
      const sms = [];
      const stages = ['Overall Completion', 'Service Subscription', 'Technical Info', 'Registration & Testing'];
  
      for (const tracker of trackers) {
        const serviceName = tracker.service_interest.service_name;
        const trackerCompletedStages = (tracker.service_interest?.status === 'Complete' ? 1 : 0) +
          (tracker.Tech_info?.status === 'Complete' ? 1 : 0) +
          (tracker.testing?.testing_status === 'Completed' ? 1 : 0);
        const trackerTotalStages = 3;
        const trackerCompletionPercentage = (trackerCompletedStages / trackerTotalStages) * 100;
  
        tracker.completionPercentage = trackerCompletionPercentage.toFixed(2);
        tracker.overallCompletion = trackerCompletionPercentage.toFixed(2);
  
        if (serviceName === 'VoIP') {
          voip.push(tracker);
        } else if (serviceName === 'SMS') {
          sms.push(tracker);
        }
      }
      // console.log("This is SMS: ", sms)
      let assignedTrackers = [];
      let unassignedTrackers = [];
  
      for (const tracker of trackers) {
        if (tracker.account_manager) {
          assignedTrackers.push(tracker);
        } else {
          unassignedTrackers.push(tracker);
        }
      }
  
      const completedPercentile = (trackers.filter(tracker => tracker.overallCompletion == 100).length / trackers.length) * 100;
      // print("COMPLETED PERCENTILE:  ", completedPercentile )
      // Fetch data from the Performance schema
      const performances = await Performance.find().populate('tracker');
      // console.log("PERFORMANCES: ", performances)
      minutesGraph = []
     for (i in performances){
      let performance = [
        performances[i].tracker.Customer_Name,
        performances[i].minutesRoutesTerminated
        
      ]
      minutesGraph.push(performance)
     }
  
    //  console.log("THIS IS THE CARRIER AND THE PERFORMANCE: ", minutesGraph)
      // Calculate average ASR, ACD, and weekly minutes
      let carrier = ''
      let totalASR = 0;
      let totalACD = 0;
      let totalWeeklyMinutes = 0;
  
      performances.forEach(performance => {
        totalASR += performance.asr;
        totalACD += performance.acd;
        totalWeeklyMinutes += performance.minutesRoutesTerminated;
      });
  
  
       // Call the dailyMinutes and weeklyMinutes functions
       const dailyMinutesSum = await dailyMinutes();
       const weeklyMinutesSum = (await weeklyMinutes()).totalMinutes;
       const weeklyResult = await weeklyMinutes();
       const weeklyAverageASR = weeklyResult.weeklyAverageASR;
       const weeklyAverageACD = weeklyResult.weeklyAverageACD;
  
        const weeklySMS = await weeklySMSCount()
        const dailySMS = await dailySMSCount()
  
      //  console.log("this is your Daily SMS data: ",dailySMS )
      let users = [];
      const reqUsers = await User.find().populate('assignedTasks');
  
      for (const reqUser of reqUsers) {
        let user = {
          name: reqUser.name,
          id: reqUser._id,
          username: reqUser.username,
          designation: reqUser.designation,
          role: reqUser.role,
          assignedTasks: reqUser.assignedTasks.length,
          myaccounts: reqUser.assignedTasks,
          profile: reqUser.profile
        };
        users.push(user);
        // console.log("COMPLETION PERCENTILE: ",overallCompletion )
      }

      let tasks = []
      const tasks_ = await Task.find().populate('taskFor');
      tasks_.forEach(task => {
        let tsk = {
            _id: task._id,
            title : task.title,
            taskFor: task.taskFor.name,
            date: formatDateToDdMmYyyy(task.date),
            description: task.description,
            status: task.status,
            files: task.files,
            notes: task.notes,
            assignedBy: task.assignedBy,
            reference: task.reference,
            deadline: formatDateToDdMmYyyy(task.deadline)

        }
        tasks.push(tsk);
      })
      // console.log("GET YOUR WEEKLY SUM: ", weeklyMinutesSum)
      // Render the management dashboard view
      res.status(200).render('mmDash', {
        voip,
        sms,
        trackers,
        stages,
        pageTitle: "Dashboard",
        completionPercentage: overallCompletion,
        assignedClients,
        unassignedClients,
        completedPercentile: completedPercentile.toFixed(2),
        incompletePercentile: (100 - completedPercentile).toFixed(2),
        assignedTrackers,
        unassignedTrackers,
        isManagement: true,
        isAuthenticated: req.user.isLoggedIn,
        message: null,
        error: null,
        tasks,
        mytasks: [],
        userNotes:[],
        users,
        user: req.user,
        designation: req.user.designation,
        dailyMinutesSum: dailyMinutesSum.toLocaleString("en-US"),
        weeklyMinutesSum: weeklyMinutesSum.toLocaleString("en-US"),
        averageWeeklyMinutes: weeklyResult,
        weeklyAverageASR: weeklyAverageASR.toFixed(2),
        weeklyAverageACD: weeklyAverageACD.toFixed(2),
        weeklyResult, 
        weeklySMS: weeklySMS.totalSms.toLocaleString("en-US"),
        dailySMS: dailySMS.toLocaleString("en-US"),
        
      });
    } catch (error) {
      console.error('Error retrieving trackers:', error);
      res.status(500).redirect('/500');
    }
  };
 
  // Get all Tasks for MM
  const getTasks = async (req, res) => {
    const atasks = await Task.find().populate('reference').populate('assignedBy').populate('taskFor');
   print("This is one task: ", atasks[0].assignedBy.name)
    let tasks = []
    atasks.forEach(task => {
      let taskk = {
        _id: task._id,
        title: task.title,
        taskFor: task.taskFor.name,
        date: (task.date).toISOString().split('T')[0],
        description: task.description,
        status: task.status,
        files: task.files,
        notes: task.notes,
        assignedBy: task.assignedBy.name,
        reference: task.reference,
        deadline: (task.deadline).toISOString().split('T')[0],
      }
      tasks.push(taskk)
    })
  
    console.log(" tasks: ", tasks)
    res.render('tasks', {
      tasks,
      pageTitle: "MM | Tasks",
      user: req.user,
      designation: req.user.designation
  
    })
  }

  const getSingleTask = async (req, res) => {
    try {
      const _id = req.params.id;
      const tasks = await Task.find({ _id}).populate('taskFor').populate('assignedBy');
      let task ={
              _id: tasks[0]._id,
              title: tasks[0].title,
              description: tasks[0].description,
              taskFor: tasks[0].taskFor.name,
              assignedBy: tasks[0].assignedBy.name,
              designation:req.user.designation,
              notes: tasks[0].notes,
              files: tasks[0].files,
              deadline: (tasks[0].deadline).toISOString().slice([0],[10]),
              status: tasks[0].status
          }
     
      
      // console.log("Getting Task Notes: ", task)
      let flash = await req.flash('update_success')[0] || req.flash('permission')[0] || req.flash('register-success')[0];
      let error = req.flash('tracker_404' )[0] || req.flash('server_error')[0] || req.flash('unauthorized')[0]
      console.log('This is your task ', task)
      return res.status(200).render('mm-task', {
          pageTitle: task.title,
          tasks: task,
          isAuthenticated: req.user.isLoggedIn,
          message: flash,
          error,
          user: req.user, 
          designation: req.user.designation

      });
      } catch (error) {
      print({ message: 'Error fetching tasks for user', error: error.message });
      req.flash('server_error', "Error fetching Task. Try Again")
      res.status(201).redirect('/mm/dashboard');
  }
};

// Create Task
createTask = async (req, res) => {
  try {
      let { title, description,  reference, taskFor, deadline } = req.body;
      if(reference){
          reference = req.body.reference;
      }else {
          reference = null;
      }
      let assignedBy = req.user._id;
      const newTask = new Task({
          title,
          description,
          assignedBy,
          reference,
          taskFor,
          deadline,
          status: 'Active'
      });
      
      const savedTask = await newTask.save();
      print('Body: ', newTask)
      print('USER', assignedBy)
      req.flash('update_success', "Task Successfully created ")
      // res.status(201).redirect('/track/home');
      // res.status(201).json(savedTask);
     
      return res.status(200).redirect('/mm/tasks/'+savedTask._id)
      
  } catch (error) {
      print({ message: 'Error creating task', error: error.message });
      req.flash('server_error', "Error creating task. Try Again")
      if (req.user.designation === "Admin" || req.user.designation === "Management"){
          return res.status(500).redirect('/track/home')
        }else {
          return res.status(500).redirect('/mm/dashboard')
        }
  }
};

const getAddTask = async function (req, res) {
  try {
    const trackers = await Tracker.find().populate('account_manager');
    const users = await User.find().populate('assignedTasks');
    console.log('Trackers: ', trackers);
    console.log('Users: ', users);

   

    res.status(200).render('new-task', {
      pageTitle: "Add New Task",
      trackers,
      users,
      // error: error,
      user: req.user,
      // message: flash,
      isAuthenticated: req.user.isLoggedIn,
      designation: req.user.designation
    });
  } catch (error) {
    console.error(error);
    res.redirect('/mm/dashboard');
  }
};

const addNoteToTask = async (req, res) => {
  const taskId = req.params.id;

  try {
      const { note } = req.body;
      let postedBy = req.user.name
      
      const task = await Task.findById(taskId);
      if (!task) {
          print({ message: 'Task not found' });
          req.flash('server_error', "Error adding file to task. Try Again")
          return res.status(201).redirect('/track/home');
      }
      
      task.notes.push({note,postedBy});
      const updatedTask = await task.save();
      req.flash('update_success', "Note Successfully added ")
      // res.status(201).redirect('/track/home');
      // res.json(updatedTask);
      print('The body: ', postedBy, "\n Body: ", req.body)
      
      return res.status(200).redirect('/mm/tasks/'+req.params.id)

      

  } catch (error) {
      print({ message: 'Error adding note to task', error: error.message });
      req.flash('server_error', "Error adding note to task. Try Again")
      // res.status(201).redirect('/track/home');
      
          return res.status(500).redirect('/mm/task/'+req.params.taskId)

       
  }
};



const addFileToTask = async (req, res) => {
  try {
      const taskId = req.params.taskId;
      const { filename } = req.file;
      let uploadedBy = req.user.name;
      const task = await Task.findById(taskId);
      console.log("This is the task: ", task)
      if (!task) {
          print({ message: 'Task not found' });
          req.flash('server_error', "Error adding file to task. Try Again")
          return res.status(201).redirect('/track/home');
      }
      
      task.files.push({ filename, uploadedBy });
      const updatedTask = await task.save();
      print("This is File: ", filename, "\nPath: ", filePath)
      req.flash('update_success', "File Successfully added ")
      // res.status(201).redirect('/track/home');
      
          return res.status(200).redirect('/mm/task'+req.params.taskId)
       
  } catch (error) {
      print({ message: 'Error adding file to task', error: error.message });
      req.flash('server_error', "Error adding file to task. Try Again")
      // res.status(201).redirect('/track/home');
      
          return res.status(200).redirect('/mm/task'+req.params.taskId)

    
  }
};

const deleteTask = async (req, res) => {
  const taskId = req.params.id;
  try {
      
      
      const deletedTask = await Task.findByIdAndDelete(taskId);
      
      if (!deletedTask) {
          print({ message: 'Task not found' });
          req.flash('server_error', "Error adding file to task. Try Again")
          return res.status(201).redirect('/track/home');
      }
      
    if(deletedTask.files.length > 0){
      deletedTask.files.forEach(file => {
          fs.unlink('uploads/'+file.filename, async (err) => {
              if (err) {
                  throw err;
              }
  
              console.log('Deleted file successfully.');
          const updatedTask = await deletedTask.save();
  
          });
      });
    }else {
      console.log("There is no files in the document")
    }
      // res.json({ message: 'Task deleted successfully' });
      req.flash('update_success', "Task deleted successfully")

      return res.status(201).redirect('/mm/all/tasks');

  } catch (error) {
      print({ message: 'Error deleting task', error: error.message });
      req.flash('server_error', "Error deleting task. Try Again")
      res.status(201).redirect('/mm/tasks/'+taskId);
  }
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
      return performanceDate >= lastMonday && performanceDate <= new Date();
    
      });
      // console.log('This is unfiltered Performance: ', performancesFromLastMonday)
      // Initialize an object to store carrier performances
      const carrierPerformances = {};

      // Iterate through performances and organize them by carrier
      pperformances.forEach((performance) => {
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
      // print("Performances: ", pperformances)
      
      res.render('wReport-mm', { 
        weeklyReports,
        performance: carrierPerformanceArray,
        tickets: ticks,
        updates: weeklyReports.update,
        pageTitle:"WR |" + weeklyReports.date        ,
        designation: req.user.designation,
        isAuthenticated: req.user.isLoggedIn,
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
    // console.log("REPORTS: ", weeklyReports)
    return res.render('WeeklyReportsList', {
      pageTitle: 'Weekly Reports',
      user: req.user,
      wkReports: wklr,
      designation: req.user.designation,
      isAuthenticated: req.user.isLoggedin

    });
  } catch (error) {
    console.error(error); // Log the error for debugging
    return res.status(500).json({ error: 'An error occurred while fetching weekly reports.' });
  }
}

const updateCreditProfile = async (req, res) => {
  const { id } = req.params; // Get the tracker ID from the request params

  try {
    const { CB, CL} = req.body; // Get the updated address from the request body
    console.log("Body: ", req.body.street)
    // Find the Tracker document by ID
    const tracker = await Tracker.findById(id);

    if (!tracker) {
      req.flash('tracker_404','Client not found')
      return res.status(404).redirect('/track/tracker'+id);
    }

    // Update the address fields
    tracker.CB = CB;
    tracker.CL= CL;
   


    // Save the updated Tracker document
    await tracker.save();
    // console.log("Changing: ", req.body)
    req.flash('update_success','Testing Updated')
    // res.status(200).redirect('/track/tracker/'+req.params.id);
    if (req.user.designation === "Admin" || req.user.designation === "Management"){
      return res.status(200).redirect('/track/tracker/'+req.params.id)
    }else {
      return res.status(200).redirect('/mm/tracker/'+req.params.id)
    }
  } catch (error) {
    console.error('Error updating Technical Info:', error);
    req.flash('server_error','A server error occured. Try Again');
    // res.status(500).redirect('/track/tracker/'+id);
    if (req.user.designation === "Admin" || req.user.designation === "Management"){
      return res.status(500).redirect('/track/tracker/'+req.params.id)
    }else {
      return res.status(500).redirect('/mm/tracker/'+req.params.id)
    }
  }

};



// Tracker Updates






// End tracker Updates

  module.exports = 
{ 
   
    getManagementDash,
    getAddTask,
    getTasks,
    getSingleTask,
    createTask,
    addFileToTask,
    addNoteToTask,
    deleteTask,
    fetchLastMondayData,
    renderWReport,
    getAllWeeklyReports,
    updateCreditProfile
    
};