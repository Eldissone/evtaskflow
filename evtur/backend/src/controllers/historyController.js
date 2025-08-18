const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Registrar mudança no histórico
exports.recordChange = async (taskId, userId, changeData) => {
  try {
    const { campo, valorAnterior, valorNovo, tipoMudanca, descricao } = changeData;
    
    await prisma.taskHistory.create({
      data: {
        campo,
        valorAnterior,
        valorNovo,
        tipoMudanca,
        descricao,
        taskId: Number(taskId),
        userId: Number(userId)
      }
    });
  } catch (error) {
    console.error('Erro ao registrar mudança no histórico:', error);
  }
};

// Listar histórico de uma tarefa
exports.getTaskHistory = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    // Verificar se o usuário tem acesso à tarefa
    const task = await prisma.task.findFirst({
      where: { 
        id: Number(taskId), 
        OR: [
          { creatorId: userId }, 
          { assignees: { some: { userId } } }
        ] 
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada ou acesso negado' });
    }

    const history = await prisma.taskHistory.findMany({
      where: { taskId: Number(taskId) },
      include: {
        user: { select: { id: true, nome: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar histórico', details: error.message });
  }
};

// Criar lição aprendida
exports.createLesson = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { titulo, descricao, categoria, impacto, aplicabilidade } = req.body;
    const userId = req.user.id;

    // Verificar se o usuário tem acesso à tarefa
    const task = await prisma.task.findFirst({
      where: { 
        id: Number(taskId), 
        OR: [
          { creatorId: userId }, 
          { assignees: { some: { userId } } }
        ] 
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada ou acesso negado' });
    }

    const lesson = await prisma.taskLesson.create({
      data: {
        titulo,
        descricao,
        categoria,
        impacto,
        aplicabilidade,
        taskId: Number(taskId),
        criadoPor: userId
      },
      include: {
        criadoPor: { select: { id: true, nome: true } }
      }
    });

    // Emitir evento via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('lessonCreated', {
        id: lesson.id,
        titulo: lesson.titulo,
        taskId: lesson.taskId,
        user_id: userId
      });
    }

    res.status(201).json(lesson);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar lição aprendida', details: error.message });
  }
};

// Listar lições aprendidas de uma tarefa
exports.getTaskLessons = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    // Verificar se o usuário tem acesso à tarefa
    const task = await prisma.task.findFirst({
      where: { 
        id: Number(taskId), 
        OR: [
          { creatorId: userId }, 
          { assignees: { some: { userId } } }
        ] 
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada ou acesso negado' });
    }

    const lessons = await prisma.taskLesson.findMany({
      where: { taskId: Number(taskId) },
      include: {
        criadoPor: { select: { id: true, nome: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json(lessons);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar lições aprendidas', details: error.message });
  }
};

// Atualizar lição aprendida
exports.updateLesson = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descricao, categoria, impacto, aplicabilidade } = req.body;
    const userId = req.user.id;

    // Verificar se o usuário tem acesso à lição
    const lesson = await prisma.taskLesson.findFirst({
      where: { 
        id: Number(id),
        task: {
          OR: [
            { creatorId: userId }, 
            { assignees: { some: { userId } } }
          ]
        }
      }
    });

    if (!lesson) {
      return res.status(404).json({ error: 'Lição aprendida não encontrada ou acesso negado' });
    }

    const updateData = {};
    if (titulo !== undefined) updateData.titulo = titulo;
    if (descricao !== undefined) updateData.descricao = descricao;
    if (categoria !== undefined) updateData.categoria = categoria;
    if (impacto !== undefined) updateData.impacto = impacto;
    if (aplicabilidade !== undefined) updateData.aplicabilidade = aplicabilidade;

    const updatedLesson = await prisma.taskLesson.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        criadoPor: { select: { id: true, nome: true } }
      }
    });

    // Emitir evento via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('lessonUpdated', {
        id: updatedLesson.id,
        titulo: updatedLesson.titulo,
        taskId: updatedLesson.taskId,
        user_id: userId
      });
    }

    res.status(200).json(updatedLesson);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar lição aprendida', details: error.message });
  }
};

// Deletar lição aprendida
exports.deleteLesson = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verificar se o usuário tem acesso à lição
    const lesson = await prisma.taskLesson.findFirst({
      where: { 
        id: Number(id),
        task: {
          OR: [
            { creatorId: userId }, 
            { assignees: { some: { userId } } }
          ]
        }
      }
    });

    if (!lesson) {
      return res.status(404).json({ error: 'Lição aprendida não encontrada ou acesso negado' });
    }

    await prisma.taskLesson.delete({
      where: { id: Number(id) }
    });

    // Emitir evento via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('lessonDeleted', {
        id: Number(id),
        taskId: lesson.taskId,
        user_id: userId
      });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar lição aprendida', details: error.message });
  }
};

// Buscar lições aprendidas por categoria
exports.getLessonsByCategory = async (req, res) => {
  try {
    const { categoria } = req.query;
    const userId = req.user.id;

    let whereClause = {
      OR: [
        { task: { creatorId: userId } }, 
        { task: { assignees: { some: { userId } } } }
      ]
    };

    if (categoria) {
      whereClause.categoria = categoria;
    }

    const lessons = await prisma.taskLesson.findMany({
      where: whereClause,
      include: {
        criadoPor: { select: { id: true, nome: true } },
        task: { select: { id: true, titulo: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json(lessons);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar lições aprendidas', details: error.message });
  }
};

// Gerar relatório de histórico da tarefa
exports.generateTaskReport = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    // Verificar se o usuário tem acesso à tarefa
    const task = await prisma.task.findFirst({
      where: { 
        id: Number(taskId), 
        OR: [
          { creatorId: userId }, 
          { assignees: { some: { userId } } }
        ] 
      },
      include: {
        creator: { select: { id: true, nome: true } },
        assignees: { include: { user: { select: { id: true, nome: true } } } },
        subtasks: true,
        checkpoints: { include: { aprovacoes: true } },
        history: { include: { user: { select: { id: true, nome: true } } } },
        lessons: { include: { criadoPor: { select: { id: true, nome: true } } } }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada ou acesso negado' });
    }

    // Calcular estatísticas
    const totalSubtasks = task.subtasks.length;
    const completedSubtasks = task.subtasks.filter(st => st.status === 'concluida').length;
    const progressPercentage = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;
    
    const totalCheckpoints = task.checkpoints.length;
    const approvedCheckpoints = task.checkpoints.filter(cp => cp.status === 'aprovado').length;
    
    const totalLessons = task.lessons.length;
    const lessonsByImpact = task.lessons.reduce((acc, lesson) => {
      acc[lesson.impacto] = (acc[lesson.impacto] || 0) + 1;
      return acc;
    }, {});

    const report = {
      task: {
        id: task.id,
        titulo: task.titulo,
        status: task.status,
        prioridade: task.prioridade,
        prazo: task.prazo,
        createdAt: task.createdAt,
        completedAt: task.completedAt,
        creator: task.creator,
        assignees: task.assignees
      },
      statistics: {
        progress: {
          totalSubtasks,
          completedSubtasks,
          percentage: Math.round(progressPercentage)
        },
        checkpoints: {
          total: totalCheckpoints,
          approved: approvedCheckpoints,
          pending: totalCheckpoints - approvedCheckpoints
        },
        lessons: {
          total: totalLessons,
          byImpact: lessonsByImpact
        }
      },
      history: task.history,
      lessons: task.lessons
    };

    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao gerar relatório', details: error.message });
  }
};
