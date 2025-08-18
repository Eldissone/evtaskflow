require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const uploadRoutes = require('./src/routes/uploadRoutes');
const authRoutes = require('./src/routes/authRoutes');
const postRoutes = require('./src/routes/postRoutes');
const taskRoutes = require('./src/routes/taskRoutes');
const commentRoutes = require('./src/routes/commentRoutes');
const subTaskRoutes = require('./src/routes/subTaskRoutes');
const checkpointRoutes = require('./src/routes/checkpointRoutes');
const historyRoutes = require('./src/routes/historyRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Rotas
app.use('/api', uploadRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', postRoutes); // POST /api/posts, GET /api/posts
app.use('/api/tasks', taskRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/subtasks', subTaskRoutes);
app.use('/api/checkpoints', checkpointRoutes);
app.use('/api/history', historyRoutes);
app.use('/uploads', express.static('uploads'));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
app.set('io', io);

server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
}); 