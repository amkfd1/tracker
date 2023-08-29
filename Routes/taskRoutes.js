const express = require('express');
const router = express.Router();
const taskController = require('../Controllers/taskController');
const isAdmin = require('../middleware/isAdmin');
const isAuth = require('../middleware/verifyAuth');
const multer = require('multer');
const Task = require('../Models/task');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads'); // Specify the destination folder
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname); // Use the original file name
    }
  });
  
  // Create the Multer instance with the custom storage
  const upload = multer({ storage: storage });

   

router.post('/tasks', isAdmin, taskController.createTask);
router.post('/tasks/:taskId/files', isAuth, upload.single('document'), taskController.addFileToTask);
router.post('/tasks/:taskId/notes', isAdmin, taskController.addNoteToTask);
router.put('/tasks/:taskId', taskController.editTask);
router.post('/tasks/:taskId', taskController.deleteTask);
router.post('/tasks/close/:id', taskController.editTaskStatus);
router.delete('/tasks/:taskId/notes/:noteIndex', taskController.deleteNoteFromTask);
router.post('/tasks/:taskId/files/:fileIndex', taskController.deleteFileFromTask);
router.get('/tasks', taskController.getAllTasks);
// router.get('/tasks/task/:taskId', isAuth, taskController.getSingleTask);
router.get('/tasks/user/:userId', taskController.getTasksForUser);


router.get('/admin/task/:taskId', isAdmin, taskController.getAdminSingleTask);



router.get("/tasks/doc/:id", async (req, res) => {
  // var docId = req.query.doc;
console.log("Task Id: ", req.params.id)
  const document = await Task.findById(req.params.id);
  let dpath = 'uploads/'+document.files[0].filename
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
  console.log("This is your receipt Id: ", dpath)
  var stream = fs.createReadStream(dpath);
  var filename = "samsple.pdf";  
  // Be careful of special characters
  filename = encodeURIComponent(filename);
  // Ideally this should strip them

  res.setHeader('Content-disposition', 'inline; filename="' + filename + '"');
  res.setHeader('Content-type', 'application/pdf');

  stream.pipe(res);
  console.log( "Opening file from tasks: ", document.filename)
  });
module.exports = router;
