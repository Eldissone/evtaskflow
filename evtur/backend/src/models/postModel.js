const db = require('./db');

// Criar post
exports.createPost = async (title, content, imageUrl, userId) => {
  const result = await db.query(
    'INSERT INTO "Post" (title, content, "imageUrl", "userId") VALUES ($1, $2, $3, $4) RETURNING *',
    [title, content, imageUrl, userId]
  );
  return result.rows[0];
};

// Listar todos os posts com nome do usuário
exports.listAllPosts = async () => {
  const result = await db.query(
    `SELECT p.*, u.nome as user_nome
     FROM "Post" p
     JOIN "User" u ON p."userId" = u.id
     ORDER BY p."createdAt" DESC`
  );
  return result.rows;
}; 