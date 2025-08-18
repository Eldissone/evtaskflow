const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Criar sub-tarefa
exports.createSubTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { titulo, descricao, ordem } = req.body;
    const userId = req.user.id;

    // Verificar se o usuário tem acesso à tarefa (criador ou destinatário)
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

    // Se não foi especificada ordem, usar a próxima disponível
    let finalOrdem = ordem;
    if (ordem === undefined) {
      const lastSubtask = await prisma.subTask.findFirst({
        where: { taskId: Number(taskId) },
        orderBy: { ordem: 'desc' }
      });
      finalOrdem = lastSubtask ? lastSubtask.ordem + 1 : 0;
    }

    const subTask = await prisma.subTask.create({
      data: {
        titulo,
        descricao,
        ordem: finalOrdem,
        taskId: Number(taskId)
      },
      include: {
        task: {
          include: {
            creator: { select: { id: true, nome: true } },
            assignees: { include: { user: { select: { id: true, nome: true } } } }
          }
        }
      }
    });

    // Emitir evento via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('subTaskCreated', {
        id: subTask.id,
        titulo: subTask.titulo,
        taskId: subTask.taskId,
        user_id: userId
      });
    }

    res.status(201).json(subTask);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar sub-tarefa', details: error.message });
  }
};

// Listar sub-tarefas de uma tarefa
exports.listSubTasks = async (req, res) => {
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

    const subTasks = await prisma.subTask.findMany({
      where: { taskId: Number(taskId) },
      orderBy: { ordem: 'asc' }
    });

    res.status(200).json(subTasks);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar sub-tarefas', details: error.message });
  }
};

// Atualizar sub-tarefa
exports.updateSubTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descricao, status, ordem } = req.body;
    const userId = req.user.id;

    // Verificar se o usuário tem acesso à sub-tarefa
    const subTask = await prisma.subTask.findFirst({
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

    if (!subTask) {
      return res.status(404).json({ error: 'Sub-tarefa não encontrada ou acesso negado' });
    }

    const updateData = {};
    if (titulo !== undefined) updateData.titulo = titulo;
    if (descricao !== undefined) updateData.descricao = descricao;
    if (status !== undefined) updateData.status = status;
    if (ordem !== undefined) updateData.ordem = ordem;

    const updatedSubTask = await prisma.subTask.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        task: {
          include: {
            creator: { select: { id: true, nome: true } },
            assignees: { include: { user: { select: { id: true, nome: true } } } }
          }
        }
      }
    });

    // Emitir evento via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('subTaskUpdated', {
        id: updatedSubTask.id,
        titulo: updatedSubTask.titulo,
        status: updatedSubTask.status,
        taskId: updatedSubTask.taskId,
        user_id: userId
      });
    }

    res.status(200).json(updatedSubTask);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar sub-tarefa', details: error.message });
  }
};

// Deletar sub-tarefa
exports.deleteSubTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verificar se o usuário tem acesso à sub-tarefa
    const subTask = await prisma.subTask.findFirst({
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

    if (!subTask) {
      return res.status(404).json({ error: 'Sub-tarefa não encontrada ou acesso negado' });
    }

    await prisma.subTask.delete({
      where: { id: Number(id) }
    });

    // Emitir evento via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('subTaskDeleted', {
        id: Number(id),
        taskId: subTask.taskId,
        user_id: userId
      });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar sub-tarefa', details: error.message });
  }
};

// Reordenar sub-tarefas
exports.reorderSubTasks = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { subTaskIds } = req.body; // Array com IDs na nova ordem
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

    // Atualizar ordem de todas as sub-tarefas
    const updates = subTaskIds.map((subTaskId, index) => 
      prisma.subTask.update({
        where: { id: Number(subTaskId) },
        data: { ordem: index }
      })
    );

    await prisma.$transaction(updates);

    // Emitir evento via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('subTasksReordered', {
        taskId: Number(taskId),
        user_id: userId
      });
    }

    res.status(200).json({ message: 'Sub-tarefas reordenadas com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao reordenar sub-tarefas', details: error.message });
  }
};
