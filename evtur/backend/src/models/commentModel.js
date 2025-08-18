const db = require('./db');

module.exports = {
  async createComment(post_id, user_id, user_name, content) {
    const { rows } = await db.query(
      'INSERT INTO "PostComment" ("postId", "userId", "user_name", "content") VALUES ($1, $2, $3, $4) RETURNING *',
      [post_id, user_id, user_name, content]
    );
    return rows[0];
  },
  async getCommentsByPost(post_id) {
    const { rows } = await db.query(
      'SELECT * FROM "PostComment" WHERE "postId" = $1 ORDER BY "createdAt" DESC',
      [post_id]
    );
    return rows;
  },
}; 