const db = require('./db');

exports.addOrUpdateReaction = async (postId, userId, type) => {
  // Verifica se já existe reação desse tipo para o usuário e post
  const check = await db.query(
    'SELECT * FROM "PostReaction" WHERE "postId" = $1 AND "userId" = $2 AND type = $3',
    [postId, userId, type]
  );
  if (check.rows.length > 0) {
    // Se já existe, remove (toggle off)
    await db.query(
      'DELETE FROM "PostReaction" WHERE "postId" = $1 AND "userId" = $2 AND type = $3',
      [postId, userId, type]
    );
    return { removed: true };
  } else {
    // Se não existe, adiciona (toggle on)
    const result = await db.query(
      'INSERT INTO "PostReaction" ("postId", "userId", type) VALUES ($1, $2, $3) RETURNING *',
      [postId, userId, type]
    );
    return result.rows[0];
  }
};

exports.getReactionsByPost = async (postId) => {
  const result = await db.query(
    'SELECT type, COUNT(*) as count FROM "PostReaction" WHERE "postId" = $1 GROUP BY type',
    [postId]
  );
  // Retorna no formato { like: 2, love: 1, ... }
  const reactions = {};
  result.rows.forEach(r => { reactions[r.type] = parseInt(r.count, 10); });
  return reactions;
}; 