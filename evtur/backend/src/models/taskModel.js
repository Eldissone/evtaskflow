const db = require('./db');

// Removido código de criação manual de tabela tasks

module.exports = {
  async createTask(titulo, descricao, user_id) {
    const { rows } = await db.query(
      'INSERT INTO tasks (titulo, descricao, user_id) VALUES ($1, $2, $3) RETURNING *',
      [titulo, descricao, user_id]
    );
    return rows[0];
  },
  async getTasksByUser(user_id, status) {
    let query = 'SELECT * FROM tasks WHERE user_id = $1';
    let params = [user_id];
    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }
    const { rows } = await db.query(query, params);
    return rows;
  },
  async updateTask(id, titulo, descricao) {
    const { rows } = await db.query(
      'UPDATE tasks SET titulo = $1, descricao = $2 WHERE id = $3 RETURNING *',
      [titulo, descricao, id]
    );
    return rows[0];
  },
  async markAsCompleted(id) {
    const { rows } = await db.query(
      "UPDATE tasks SET status = 'concluida', data_conclusao = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
      [id]
    );
    return rows[0];
  },
  async deleteTask(id) {
    await db.query('DELETE FROM tasks WHERE id = $1', [id]);
  },
}; 