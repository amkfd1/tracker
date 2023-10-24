const Tracker = require('../Models/tracker');
const Document = require('../Models/document');
const Contact = require('../Models/contact');
const Log = require('../Models/log');
const Note = require('../Models/note');
const User = require('../Models/user');
const Performance = require('../Models/performance');

const fs = require('fs');
const PasswordResetToken = require('../Models/PasswordResetToken'); // Assuming you have a PasswordResetToken model

const path = require('path');
const print = console.log

const Task = require('../Models/task');

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
      print("COMPLETED PERCENTILE:  ", completedPercentile )
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
        console.log("COMPLETION PERCENTILE: ",overallCompletion )
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
      res.status(200).render('mm-task', {
          pageTitle: task.title,
          tasks: task,
          isAuthenticated: req.user.isLoggedIn,
          message: flash,
          error,
          user: req.user,
          stages: ['Close', 'Complete'], 
          isManagement: false,
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
     
      return res.status(200).redirect('/mm/dashboard')
      
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


  module.exports = 
{ 
   
    getManagementDash,
    getAddTask,
    getTasks,
    getSingleTask
};