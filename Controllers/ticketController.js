const Tracker = require('../Models/tracker');
const Document = require('../Models/document');
const Contact = require('../Models/contact');
const Ticket = require('../Models/ticket');
const User = require('../Models/user');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const { Types } = require('mongoose');
const Note = require('../Models/note');
const mongoose = require('mongoose');
const Performance = require('../Models/performance');
const Task = require('../Models/task');

const print = console.log


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
      print(req.body)
      // Create a new Ticket instance with the extracted data
      const newTicket = new Ticket({
        
        date: '10/10/2023',
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
  

module.exports = { 
getAllData,
getNewTicket,
createTicket
};