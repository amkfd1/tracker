const express = require('express');
const router = express.Router();
const taskController = require('../Controllers/taskController');
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

  

router.post('/tasks', taskController.createTask);
router.post('/tasks/:taskId/files', upload.single('document'), taskController.addFileToTask);
router.post('/tasks/:taskId/notes', taskController.addNoteToTask);
router.put('/tasks/:taskId', taskController.editTask);
router.delete('/tasks/:taskId', taskController.deleteTask);
router.delete('/tasks/:taskId/notes/:noteIndex', taskController.deleteNoteFromTask);
router.delete('/tasks/:taskId/files/:fileIndex', taskController.deleteFileFromTask);
router.get('/tasks', taskController.getAllTasks);
router.get('/tasks/:taskId', taskController.getSingleTask);
router.get('/tasks/user/:userId', taskController.getTasksForUser);


module.exports = router;
