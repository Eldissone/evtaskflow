const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Criar checkpoint para uma tarefa
exports.createCheckpoint = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { titulo, descricao, prazo, tipo = 'manual' } = req.body;
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

    const checkpoint = await prisma.checkpoint.create({
      data: {
        titulo,
        descricao,
        prazo: prazo ? new Date(prazo) : null,
        tipo,
        status: 'pendente',
        taskId: Number(taskId),
        criadoPor: userId
      },
      include: {
        task: {
          include: {
            creator: { select: { id: true, nome: true } },
            assignees: { include: { user: { select: { id: true, nome: true } } } }
          }
        },
        criadoPor: { select: { id: true, nome: true } }
      }
    });

    // Emitir evento via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('checkpointCreated', {
        id: checkpoint.id,
        titulo: checkpoint.titulo,
        taskId: checkpoint.taskId,
        user_id: userId
      });
    }

    res.status(201).json(checkpoint);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar checkpoint', details: error.message });
  }
};

// Listar checkpoints de uma tarefa
exports.listCheckpoints = async (req, res) => {
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

    const checkpoints = await prisma.checkpoint.findMany({
      where: { taskId: Number(taskId) },
      include: {
        criadoPor: { select: { id: true, nome: true } },
        aprovacoes: { include: { user: { select: { id: true, nome: true } } } }
      },
      orderBy: { prazo: 'asc' }
    });

    res.status(200).json(checkpoints);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar checkpoints', details: error.message });
  }
};

// Atualizar checkpoint
exports.updateCheckpoint = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descricao, prazo, status } = req.body;
    const userId = req.user.id;

    // Verificar se o usuário tem acesso ao checkpoint
    const checkpoint = await prisma.checkpoint.findFirst({
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

    if (!checkpoint) {
      return res.status(404).json({ error: 'Checkpoint não encontrado ou acesso negado' });
    }

    const updateData = {};
    if (titulo !== undefined) updateData.titulo = titulo;
    if (descricao !== undefined) updateData.descricao = descricao;
    if (prazo !== undefined) updateData.prazo = prazo ? new Date(prazo) : null;
    if (status !== undefined) updateData.status = status;

    const updatedCheckpoint = await prisma.checkpoint.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        task: {
          include: {
            creator: { select: { id: true, nome: true } },
            assignees: { include: { user: { select: { id: true, nome: true } } } }
          }
        },
        criadoPor: { select: { id: true, nome: true } }
      }
    });

    // Emitir evento via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('checkpointUpdated', {
        id: updatedCheckpoint.id,
        titulo: updatedCheckpoint.titulo,
        status: updatedCheckpoint.status,
        taskId: updatedCheckpoint.taskId,
        user_id: userId
      });
    }

    res.status(200).json(updatedCheckpoint);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar checkpoint', details: error.message });
  }
};

// Aprovar checkpoint
exports.approveCheckpoint = async (req, res) => {
  try {
    const { id } = req.params;
    const { aprovado, observacoes } = req.body;
    const userId = req.user.id;

    // Verificar se o usuário tem acesso ao checkpoint
    const checkpoint = await prisma.checkpoint.findFirst({
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

    if (!checkpoint) {
      return res.status(404).json({ error: 'Checkpoint não encontrado ou acesso negado' });
    }

    // Verificar se já aprovou
    const existingApproval = await prisma.checkpointApproval.findFirst({
      where: { checkpointId: Number(id), userId }
    });

    if (existingApproval) {
      return res.status(400).json({ error: 'Usuário já aprovou este checkpoint' });
    }

    // Criar aprovação
    const approval = await prisma.checkpointApproval.create({
      data: {
        checkpointId: Number(id),
        userId,
        aprovado,
        observacoes,
        dataAprovacao: new Date()
      },
      include: {
        user: { select: { id: true, nome: true } }
      }
    });

    // Verificar se todos os assignees aprovaram
    const task = await prisma.task.findUnique({
      where: { id: checkpoint.taskId },
      include: { assignees: true }
    });

    const totalAssignees = task.assignees.length;
    const approvals = await prisma.checkpointApproval.findMany({
      where: { checkpointId: Number(id) }
    });

    let checkpointStatus = 'pendente';
    if (approvals.length >= totalAssignees) {
      const allApproved = approvals.every(a => a.aprovado);
      checkpointStatus = allApproved ? 'aprovado' : 'reprovado';
      
      // Atualizar status do checkpoint
      await prisma.checkpoint.update({
        where: { id: Number(id) },
        data: { status: checkpointStatus }
      });
    }

    // Emitir evento via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('checkpointApproved', {
        id: Number(id),
        taskId: checkpoint.taskId,
        user_id: userId,
        aprovado,
        status: checkpointStatus
      });
    }

    res.status(200).json({ 
      approval, 
      checkpointStatus,
      message: 'Checkpoint aprovado com sucesso' 
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao aprovar checkpoint', details: error.message });
  }
};

// Deletar checkpoint
exports.deleteCheckpoint = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verificar se o usuário tem acesso ao checkpoint
    const checkpoint = await prisma.checkpoint.findFirst({
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

    if (!checkpoint) {
      return res.status(404).json({ error: 'Checkpoint não encontrado ou acesso negado' });
    }

    await prisma.checkpoint.delete({
      where: { id: Number(id) }
    });

    // Emitir evento via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('checkpointDeleted', {
        id: Number(id),
        taskId: checkpoint.taskId,
        user_id: userId
      });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar checkpoint', details: error.message });
  }
};

// Gerar checkpoints automáticos baseados no progresso
exports.generateAutoCheckpoints = async (req, res) => {
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
      include: { subtasks: true }
    });

    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada ou acesso negado' });
    }

    // Gerar checkpoints baseados no número de sub-tarefas
    const subtasks = task.subtasks || [];
    const totalSubtasks = subtasks.length;
    
    if (totalSubtasks === 0) {
      return res.status(400).json({ error: 'Tarefa não possui sub-tarefas para gerar checkpoints' });
    }

    // Calcular pontos de checkpoint (25%, 50%, 75%, 100%)
    const checkpointPoints = [0.25, 0.5, 0.75, 1.0];
    const createdCheckpoints = [];

    for (const point of checkpointPoints) {
      const targetSubtasks = Math.ceil(totalSubtasks * point);
      
      // Verificar se já existe checkpoint para este ponto
      const existingCheckpoint = await prisma.checkpoint.findFirst({
        where: { 
          taskId: Number(taskId), 
          tipo: 'automatico',
          titulo: { contains: `${Math.round(point * 100)}%` }
        }
      });

      if (!existingCheckpoint) {
        const checkpoint = await prisma.checkpoint.create({
          data: {
            titulo: `Checkpoint ${Math.round(point * 100)}%`,
            descricao: `Revisão automática quando ${targetSubtasks} de ${totalSubtasks} sub-tarefas estiverem concluídas`,
            tipo: 'automatico',
            status: 'pendente',
            taskId: Number(taskId),
            criadoPor: userId
          }
        });
        createdCheckpoints.push(checkpoint);
      }
    }

    res.status(200).json({ 
      message: `${createdCheckpoints.length} checkpoints automáticos criados`,
      checkpoints: createdCheckpoints
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao gerar checkpoints automáticos', details: error.message });
  }
};
