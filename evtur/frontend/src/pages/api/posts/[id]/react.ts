import type { NextApiRequest, NextApiResponse } from 'next';
import { postsData } from '../../postsData';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }
  const { type, userId } = req.body;
  if (!type || !userId) {
    return res.status(400).json({ error: 'Tipo de reação e userId são obrigatórios.' });
  }
  const post = postsData.find(p => p.id === Number(id));
  if (!post) {
    return res.status(404).json({ error: 'Post não encontrado.' });
  }
  if (!post.reactions) post.reactions = {};
  if (!post.reactions[type]) post.reactions[type] = [];
  if (!post.reactions[type].includes(userId)) {
    post.reactions[type].push(userId);
  }
  res.status(200).json(post);
} 