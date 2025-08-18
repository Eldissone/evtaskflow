const express = require('express');
const router = express.Router();
const subTaskController = require('../controllers/subTaskController');
const auth = require('../middlewares/authMiddleware');

// Rotas para sub-tarefas
router.post('/:taskId', auth, subTaskController.createSubTask);
router.get('/:taskId', auth, subTaskController.listSubTasks);
router.put('/:id', auth, subTaskController.updateSubTask);
router.delete('/:id', auth, subTaskController.deleteSubTask);
router.post('/:taskId/reorder', auth, subTaskController.reorderSubTasks);

module.exports = router;
