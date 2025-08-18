const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const historyController = require('./historyController');

// Criar tarefa
exports.createTask = async (req, res) => {
  try {
    const { titulo, descricao, status = 'pendente', assigneeIds, prioridade = 'media', prazo } = req.body;
    const creatorId = req.user.id;

    if (!assigneeIds || !Array.isArray(assigneeIds) || assigneeIds.length === 0) {
      return res.status(400).json({ error: 'assigneeIds é obrigatório e deve ser um array não vazio' });
    }

    // Verificar se todos os usuários destinatários existem
    const assignees = await prisma.user.findMany({ 
      where: { id: { in: assigneeIds.map(id => Number(id)) } },
      select: { id: true, nome: true }
    });

    if (assignees.length !== assigneeIds.length) {
      return res.status(404).json({ error: 'Um ou mais usuários destinatários não encontrados' });
    }

    // Criar a tarefa
    const task = await prisma.task.create({
      data: { 
        titulo, 
        descricao, 
        status, 
        prioridade,
        prazo: prazo ? new Date(prazo) : null,
        creatorId,
        assignees: {
          create: assigneeIds.map(id => ({ userId: Number(id) }))
        }
      },
      include: {
        creator: { select: { id: true, nome: true } },
        assignees: { 
          include: { user: { select: { id: true, nome: true } } }
        }
      }
    });

    // Registrar criação no histórico
    await historyController.recordChange(task.id, creatorId, {
      campo: 'tarefa',
      valorAnterior: null,
      valorNovo: titulo,
      tipoMudanca: 'criado',
      descricao: `Tarefa "${titulo}" criada com prioridade ${prioridade}`
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('taskCreated', {
        id: task.id,
        titulo: task.titulo,
        user_id: creatorId,
        assignee_ids: assigneeIds,
        prioridade: task.prioridade,
        prazo: task.prazo,
      });
    }

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar tarefa', details: error.message });
  }
};

// Listar tarefas atribuídas ao usuário autenticado
exports.listUserTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, type } = req.query;
    
    let whereClause = {};
    
    if (type === 'created') {
      // Tarefas criadas pelo usuário
      whereClause.creatorId = userId;
    } else if (type === 'assigned') {
      // Tarefas atribuídas ao usuário
      whereClause.assignees = { some: { userId } };
    } else {
      // Padrão: tarefas atribuídas ao usuário (comportamento anterior)
      whereClause.assignees = { some: { userId } };
    }
    
    if (status) {
      whereClause.status = String(status);
    }
    
    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        creator: { select: { id: true, nome: true } },
        assignees: { 
          include: { user: { select: { id: true, nome: true } } }
        }
      },
      orderBy: { id: 'desc' }
    });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar tarefas', details: error.message });
  }
};

// Obter tarefa por ID (somente se o usuário for criador ou destinatário)
exports.getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const task = await prisma.task.findFirst({
      where: { 
        id: Number(id), 
        OR: [
          { creatorId: userId }, 
          { assignees: { some: { userId } } }
        ] 
      },
      include: {
        creator: { select: { id: true, nome: true } },
        assignees: { 
          include: { user: { select: { id: true, nome: true } } }
        },
        subtasks: {
          orderBy: { ordem: 'asc' }
        }
      },
    });
    if (!task) return res.status(404).json({ error: 'Tarefa não encontrada' });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar tarefa', details: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descricao, status, assigneeIds, prioridade, prazo } = req.body;
    const userId = req.user.id;
    
    // Verificar se o usuário é o criador da tarefa
    const existingTask = await prisma.task.findFirst({
      where: { id: Number(id), creatorId: userId }
    });
    
    if (!existingTask) {
      return res.status(404).json({ error: 'Tarefa não encontrada ou não pertence ao usuário.' });
    }

    // Registrar mudanças no histórico
    if (titulo !== existingTask.titulo) {
      await historyController.recordChange(id, userId, {
        campo: 'titulo',
        valorAnterior: existingTask.titulo,
        valorNovo: titulo,
        tipoMudanca: 'atualizado',
        descricao: `Título alterado de "${existingTask.titulo}" para "${titulo}"`
      });
    }

    if (descricao !== existingTask.descricao) {
      await historyController.recordChange(id, userId, {
        campo: 'descricao',
        valorAnterior: existingTask.descricao,
        valorNovo: descricao,
        tipoMudanca: 'atualizado',
        descricao: 'Descrição da tarefa foi atualizada'
      });
    }

    if (status !== existingTask.status) {
      await historyController.recordChange(id, userId, {
        campo: 'status',
        valorAnterior: existingTask.status,
        valorNovo: status,
        tipoMudanca: 'status_mudou',
        descricao: `Status alterado de "${existingTask.status}" para "${status}"`
      });
    }

    if (prioridade !== existingTask.prioridade) {
      await historyController.recordChange(id, userId, {
        campo: 'prioridade',
        valorAnterior: existingTask.prioridade,
        valorNovo: prioridade,
        tipoMudanca: 'atualizado',
        descricao: `Prioridade alterada de "${existingTask.prioridade}" para "${prioridade}"`
      });
    }

    // Atualizar a tarefa
    const updateData = { titulo, descricao, status, prioridade };
    if (prazo !== undefined) {
      updateData.prazo = prazo ? new Date(prazo) : null;
      
      if (prazo !== existingTask.prazo) {
        await historyController.recordChange(id, userId, {
          campo: 'prazo',
          valorAnterior: existingTask.prazo ? existingTask.prazo.toISOString() : null,
          valorNovo: prazo,
          tipoMudanca: 'atualizado',
          descricao: `Prazo alterado para ${new Date(prazo).toLocaleString('pt-BR')}`
        });
      }
    }
    
    if (assigneeIds && Array.isArray(assigneeIds)) {
      // Remover todos os assignees existentes
      await prisma.taskAssignee.deleteMany({
        where: { taskId: Number(id) }
      });
      
      // Adicionar novos assignees
      if (assigneeIds.length > 0) {
        await prisma.taskAssignee.createMany({
          data: assigneeIds.map(assigneeId => ({
            taskId: Number(id),
            userId: Number(assigneeId)
          }))
        });
      }

      // Registrar mudança de assignees
      await historyController.recordChange(id, userId, {
        campo: 'assignees',
        valorAnterior: existingTask.assignees?.length?.toString() || '0',
        valorNovo: assigneeIds.length.toString(),
        tipoMudanca: 'atualizado',
        descricao: `Número de responsáveis alterado para ${assigneeIds.length}`
      });
    }

    const task = await prisma.task.updateMany({
      where: { id: Number(id), creatorId: userId },
      data: updateData
    });

    if (task.count === 0) {
      return res.status(404).json({ error: 'Tarefa não encontrada ou não pertence ao usuário.' });
    }

    // Emitir evento
    const updated = await prisma.task.findUnique({ 
      where: { id: Number(id) },
      include: {
        assignees: { include: { user: { select: { id: true, nome: true } } } }
      }
    });
    
    const io = req.app.get('io');
    if (io && updated) {
      io.emit('taskUpdated', {
        id: updated.id,
        titulo: updated.titulo,
        status: updated.status,
        prioridade: updated.prioridade,
        prazo: updated.prazo,
        user_id: updated.creatorId,
        assignee_ids: updated.assignees.map(a => a.userId),
      });
    }
    
    res.status(200).json({ message: 'Tarefa atualizada com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar tarefa', details: error.message });
  }
};

exports.markAsCompleted = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Buscar tarefa atual para comparar status
    const currentTask = await prisma.task.findUnique({
      where: { id: Number(id) }
    });

    if (!currentTask) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    const task = await prisma.task.updateMany({
      where: { 
        id: Number(id), 
        OR: [
          { creatorId: userId }, 
          { assignees: { some: { userId } } }
        ] 
      },
      data: { status: 'concluida', completedAt: new Date() }
    });
    
    if (task.count === 0) {
      return res.status(404).json({ error: 'Tarefa não encontrada ou não pertence ao usuário.' });
    }

    // Registrar conclusão no histórico
    if (currentTask.status !== 'concluida') {
      await historyController.recordChange(id, userId, {
        campo: 'status',
        valorAnterior: currentTask.status,
        valorNovo: 'concluida',
        tipoMudanca: 'status_mudou',
        descricao: 'Tarefa marcada como concluída'
      });
    }
    
    const updated = await prisma.task.findUnique({ 
      where: { id: Number(id) },
      include: {
        assignees: { include: { user: { select: { id: true, nome: true } } } }
      }
    });
    
    const io = req.app.get('io');
    if (io && updated) {
      io.emit('taskUpdated', {
        id: updated.id,
        titulo: updated.titulo,
        status: updated.status,
        user_id: updated.creatorId,
        assignee_ids: updated.assignees.map(a => a.userId),
      });
    }
    
    res.status(200).json({ message: 'Tarefa marcada como concluída.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao concluir tarefa', details: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const toDelete = await prisma.task.findFirst({ 
      where: { id: Number(id), creatorId: userId },
      include: {
        assignees: { include: { user: { select: { id: true, nome: true } } } }
      }
    });
    
    if (!toDelete) {
      return res.status(404).json({ error: 'Tarefa não encontrada ou não pertence ao usuário.' });
    }

    // Registrar exclusão no histórico
    await historyController.recordChange(id, userId, {
      campo: 'tarefa',
      valorAnterior: toDelete.titulo,
      valorNovo: null,
      tipoMudanca: 'deletado',
      descricao: `Tarefa "${toDelete.titulo}" foi excluída`
    });
    
    await prisma.task.delete({ where: { id: Number(id) } });
    
    const io = req.app.get('io');
    if (io) {
      io.emit('taskDeleted', {
        id: Number(id),
        titulo: toDelete.titulo,
        user_id: toDelete.creatorId,
        assignee_ids: toDelete.assignees.map(a => a.userId),
      });
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar tarefa', details: error.message });
  }
}; 