const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const postController = require('../controllers/postController');

// Criar post (autenticado)
router.post('/posts', auth, postController.createPost);
// Listar todos os posts (qualquer usuário autenticado pode ver)
router.get('/posts', auth, postController.listAllPosts);
router.post('/posts/:id/react', auth, postController.reactToPost);

module.exports = router; 