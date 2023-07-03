const express = require('express');
const router = express.Router();
const staffController = require('../Controllers/staffControl');
const fs = require('fs');
const isAuth = require('../middleware/verifyAuth');
const customerTrackerController = require('../Controllers/trackerControl');


router.get('/', isAuth, staffController.getAllCustomerTrackers);

// Update an existing customer tracker
router.post('/updateTracker/:id', customerTrackerController.updateTracker); 

router.get('/client/:id',isAuth, staffController.getSingleTracker);

const Document = require('../Models/document');
router.post('/addNote', isAuth, staffController.addNote);
// router.post('/updateAddress/:id', isAuth, customerTrackerController.updateAddress);
// router.post('/updateService/:id', isAuth, customerTrackerController.updateService);
router.post('/updateTechnical/:id', isAuth, staffController.updateTech);
router.post('/updateTesting/:id', isAuth, staffController.updateTesting);
// router.post('/addContact/:id', isAuth, customerTrackerController.addContact);
// router.post('/addNote/', isAuth, customerTrackerController.addNote);
// open Pdf
router.get("/client/doc/:id", async (req, res) => {
  var docId = req.query.doc;
  const document = await Document.findById(req.params.id);
    console.log("This is the document ", document)
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
  console.log("This is your receipt Id: ", docId)
  var stream = fs.createReadStream(document.documentPath);
  var filename = "samsple.pdf"; 
  // Be careful of special characters
  filename = encodeURIComponent(filename);
  // Ideally this should strip them

  res.setHeader('Content-disposition', 'inline; filename="' + filename + '"');
  res.setHeader('Content-type', 'application/pdf');

  stream.pipe(res);
  console.log( "hello there it works")
  });

module.exports = router;