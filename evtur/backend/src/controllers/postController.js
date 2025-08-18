const Post = require('../models/postModel');
const PostReaction = require('../models/postReactionModel');
const Comment = require('../models/commentModel');

exports.createPost = async (req, res) => {
  try {
    const { title, content, imageUrl } = req.body;
    const userId = req.user.id;
    if (!title || !content) {
      return res.status(400).json({ error: 'Título e conteúdo são obrigatórios.' });
    }
    const post = await Post.createPost(title, content, imageUrl, userId);
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar post', details: error.message });
  }
};

exports.listAllPosts = async (req, res) => {
  try {
    const posts = await Post.listAllPosts();
    // Buscar reações e comentários para cada post
    const postsWithExtras = await Promise.all(posts.map(async post => {
      const { imageUrl, user_nome, id, ...rest } = post;
      const reactions = await PostReaction.getReactionsByPost(id);
      const comments = await Comment.getCommentsByPost(id);
      return {
        ...rest,
        id,
        user: { nome: user_nome },
        imageUrl,
        reactions,
        comments // lista de comentários do post
      };
    }));
    res.status(200).json(postsWithExtras);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar posts', details: error.message });
  }
};

exports.reactToPost = async (req, res) => {
  const { id } = req.params;
  const { type } = req.body;
  const userId = req.user.id;
  if (!type) return res.status(400).json({ error: 'Tipo de reação obrigatório.' });
  try {
    await PostReaction.addOrUpdateReaction(id, userId, type);
    // Retorna as reações atualizadas do post
    const reactions = await PostReaction.getReactionsByPost(id);
    res.status(200).json({ reactions });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao reagir ao post', details: err.message });
  }
}; 