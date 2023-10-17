const Tracker = require('../Models/tracker');
const Document = require('../Models/document');
const Contact = require('../Models/contact');
const Ticket = require('../Models/ticket');
const User = require('../Models/user');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const { Types } = require('mongoose');
const Activity = require('../Models/activity');
const mongoose = require('mongoose');
const Performance = require('../Models/performance');
const Task = require('../Models/task');

const print = console.log


// Function to format date as "YYYY-MM-DD HH:MM:SS"
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Add 1 to month since it's zero-based
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
  
    return `${year}-${month}-${day}`;
  }

// Create a new ticket entry
const createTicket = async (req, res) => {
    try {
      // Extract ticket data from the request body
    //   const {
    //     date,
    //     priority,
    //     type,
    //     status,
    //     contact,
    //     subject,
    //     note,
    //     client,
    //     assignee,
    //     company_name,
    //   } = req.body;
    let status = "Ticket Received";
      let client = '652414077961d760b4f81f55' //req.cookies.user.company_name;
      let contact = "64e87f6a797988027a4570fe" //req.cookies.user.name;
    let {priority, nop, type, department, subject, note } = req.body;
      // Create a new Ticket instance with the extracted data
      const newTicket = new Ticket({
        
        date: new Date(),
        priority,
        type,
        contact,
        subject,
        department,
        nop,
        note,
        client,
        status,
        // company_name,
      });
      
      
      // Save the new ticket entry to the database

      await newTicket.save();
      print("Ticket created: ", newTicket)

      req.flash('update_success', "Ticket posted")
      res.status(201).redirect('/tickets');
    } catch (error) {
      console.error('Error creating ticket:', error);
      res.status(500).redirect('/tickets');
    }
  };
  


// Controller method to fetch all data from Tracker, Tick, and Performances
async function getAllData(req, res) {
  try {
    const trackerData = await Tracker.find({}).exec();
    const tickData = await Ticket.find({}).exec();
    const performanceData = await Performance.find({}).exec();

    // console.log(tickData)
    // You can return the data in the response
    return res.status(200).render("main/helpdesk",{
      trackerData,
      tickets: tickData,
      performanceData,
      designation: 'NOC',
      isAuthenticated: true,
      pageTitle: 'Tickets',
      user: {}
    });
  } catch (error) {
    // Handle any errors that occur during the fetch
    return res.status(500).json({ error: 'An error occurred while fetching data.' });
  }
}


async function getNewTicket(req, res) {
    try {
      const trackerData = await Tracker.find({}).exec();
      const tickData = await Ticket.find({}).exec();
      const performanceData = await Performance.find({}).exec();
  
      const priority = { //Priority of the ticket 
        Lev1: 'L1 - A minor incident with low impact',
        Lev2: 'L2 - A major incident with significant impact',
        Lev3: 'L3 - A critical incident with very high impact',
    }
    
    const type = { //Type of the ticket 
        type1: 'IDA',
        type2: 'ICx',
        type3: 'Financial',
    }

    const nop = { //Nature of the Problem
        nop1: 'Operational Issues',
        nop2: 'Configurations Assistance',
        nop3: 'Advice and Guidance',
        nop4: 'RFC'
        
    }

    const department = { //  Department to relay thhe ticket to
        IT: 'IT Support',
        noc: 'NOC Team',
        finance: 'FINANCE',
        designs: 'DESIGNS',
    }






      // You can return the data in the response
      return res.status(200).render("main/ticket-form",{
        trackerData,
        tickets: tickData,
        performanceData,
        designation: 'NOC',
        isAuthenticated: true,
        pageTitle: 'Tickets',
        user: {},
        department: department,
        priority: priority,
        type: type,
        nop: nop

      });
    } catch (error) {
      // Handle any errors that occur during the fetch
      return res.status(500).json({ error: 'An error occurred while fetching data.' });
    }
  }


  async function getTicket(req, res) {
    try {
      //Get the ticket ID from the request parameters
      const { id } = req.params;
  
      // Use the Ticket model to find the ticket by its ID
      const ticket = await Ticket.findById(id).populate('client').populate('assignee');
      const activity = await Activity.find({ticketId:id}).populate('ticketId');
  
      console.log('Tickets')
      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }
  
      // Format the date to display only date and time
      const formattedDate = formatDate(ticket.date);
  
      // Replace the original ticket.date with the formatted date
      ticket.date = (ticket.date).toISOString().slice(0, 19).replace('T', ' ');;
  
      res.render('main/ticket-details', {
        ticket,
        designation: 'NOC',
        isAuthenticated: true,
        pageTitle: 'Tickets',
        user: {},
        activities: activity,
  


        })

      } catch (error) {
      // Handle any errors that occur during the fetch
      return res.status(500).json({ error: 'An error occurred while fetching data.' });
    }
  }
  

  async function postActivity(req, res) {
    const { id } = req.params;

    try {
      // Extract the ticket ID from the request parameters
      const { ticketId, note, activity_File, date } = req.body;

      // Use the Ticket model to find the ticket by its ID
      const ticket = await Ticket.findById(id);
  
      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }
  
      
        let file ;
        if (!req.file){
            file = " "
        } else {file = req.file.filename;}
        let contact = req.user.name;
        // const date = new Date().toISOString().slice(0, 19).replace('T', ' ');

        // Extract data from the request body

    // Create a new Activity document
    const activity = new Activity({
      ticketId: id,
      note,
      activity_File,
      date,
      contact,
    });

    // Save the activity to the database
    const savedActivity = await activity.save();
    console.log("This is activity: ", savedActivity)
  
      res.redirect(`/ticket/${id}`)

      } catch (error) {
      // Handle any errors that occur during the fetch
      return res.status(500).json({ error: 'An error occurred while fetching data.' });
    }
  }

module.exports = { 
getAllData,
getNewTicket,
createTicket,
getTicket,
postActivity
};