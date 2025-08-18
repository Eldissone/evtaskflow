const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const auth = require('../middlewares/authMiddleware');

router.use(auth);

router.post('/:post_id', commentController.createComment);
router.get('/:post_id', commentController.getCommentsByPost);

module.exports = router; 