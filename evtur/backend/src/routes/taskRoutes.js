const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const auth = require('../middlewares/authMiddleware');

router.use(auth);

router.post('/', taskController.createTask);
router.get('/', taskController.listUserTasks);
router.get('/:id', taskController.getTaskById);
router.put('/:id', taskController.updateTask);
router.patch('/:id/complete', taskController.markAsCompleted);
router.delete('/:id', taskController.deleteTask);

module.exports = router; 