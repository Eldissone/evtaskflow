const express = require('express');
const router = express.Router();
const checkpointController = require('../controllers/checkpointController');
const auth = require('../middlewares/authMiddleware');

// Rotas para checkpoints
router.post('/:taskId', auth, checkpointController.createCheckpoint);
router.get('/:taskId', auth, checkpointController.listCheckpoints);
router.put('/:id', auth, checkpointController.updateCheckpoint);
router.delete('/:id', auth, checkpointController.deleteCheckpoint);
router.post('/:id/approve', auth, checkpointController.approveCheckpoint);
router.post('/:taskId/generate-auto', auth, checkpointController.generateAutoCheckpoints);

module.exports = router;
