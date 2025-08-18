const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const gerarToken = (user) => {
  return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

module.exports = {
  async register(req, res) {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) return res.status(400).json({ error: 'Preencha todos os campos' });
    if (!nome.trim()) return res.status(400).json({ error: 'O nome é obrigatório' });
    try {
      const existe = await prisma.user.findUnique({ where: { email } });
      if (existe) return res.status(400).json({ error: 'E-mail já cadastrado' });
      const hash = await bcrypt.hash(senha, 10);
      const user = await prisma.user.create({ data: { nome, email, senha: hash } });
      const token = gerarToken(user);
      res.json({ token });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao cadastrar usuário' });
    }
  },
  async login(req, res) {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ error: 'Preencha todos os campos' });
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return res.status(400).json({ error: 'Usuário não encontrado' });
      const ok = await bcrypt.compare(senha, user.senha);
      if (!ok) return res.status(400).json({ error: 'Senha incorreta' });
      const token = gerarToken(user);
      res.json({ token });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao fazer login' });
    }
  },
  async me(req, res) {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json({ id: user.id, nome: user.nome, email: user.email });
  },
}; 