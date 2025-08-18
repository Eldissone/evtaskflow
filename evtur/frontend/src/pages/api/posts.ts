import type { NextApiRequest, NextApiResponse } from 'next';
import { postsData } from './postsData';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return res.status(200).json(postsData);
  }
  if (req.method === 'POST') {
    const { title, content, imageUrl } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Título e conteúdo são obrigatórios.' });
    }
    const newPost = { id: Date.now(), title, content, imageUrl, reactions: {} };
    postsData.unshift(newPost);
    return res.status(201).json(newPost);
  }
  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
} 