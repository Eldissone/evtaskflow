const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');
const auth = require('../middlewares/authMiddleware');

// Rotas para histórico
router.get('/:taskId', auth, historyController.getTaskHistory);
router.get('/:taskId/report', auth, historyController.generateTaskReport);

// Rotas para lições aprendidas
router.post('/:taskId/lessons', auth, historyController.createLesson);
router.get('/:taskId/lessons', auth, historyController.getTaskLessons);
router.put('/lessons/:id', auth, historyController.updateLesson);
router.delete('/lessons/:id', auth, historyController.deleteLesson);
router.get('/lessons', auth, historyController.getLessonsByCategory);

module.exports = router;
