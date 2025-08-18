const Comment = require('../models/commentModel');

module.exports = {
  async createComment(req, res) {
    const { post_id } = req.params;
    const { content } = req.body;
    const user_id = req.user.id;
    const user_name = req.user.nome;
    if (!content) return res.status(400).json({ error: 'Comentário não pode ser vazio' });
    try {
      const comment = await Comment.createComment(post_id, user_id, user_name, content);
      res.status(201).json(comment);
    } catch (err) {
      console.error('Erro ao criar comentário:', err);
      res.status(500).json({ error: 'Erro ao criar comentário', details: err.message });
    }
  },
  async getCommentsByPost(req, res) {
    const { post_id } = req.params;
    try {
      const comments = await Comment.getCommentsByPost(post_id);
      res.json(comments);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao buscar comentários' });
    }
  },
}; 