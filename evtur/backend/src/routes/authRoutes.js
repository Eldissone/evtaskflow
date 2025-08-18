const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middlewares/authMiddleware');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', auth, authController.me);

// Listar usuários para seleção de amigos
router.get('/users', auth, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { NOT: { id: req.user.id } },
      select: { id: true, nome: true, email: true },
      orderBy: { nome: 'asc' }
    });
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
});

module.exports = router; 