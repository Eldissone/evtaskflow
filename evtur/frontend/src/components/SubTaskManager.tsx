import React, { useState, useEffect } from 'react';

interface SubTask {
  id?: number;
  titulo: string;
  descricao?: string;
  status: 'pendente' | 'em_andamento' | 'concluida';
  ordem: number;
}

interface SubTaskManagerProps {
  taskId: number;
  subtasks: SubTask[];
  onUpdateSubtasks: (subtasks: SubTask[]) => void;
  assignees?: Array<{ user: { id: number; nome: string } }>;
}

const SubTaskManager: React.FC<SubTaskManagerProps> = ({ taskId, subtasks, onUpdateSubtasks, assignees }) => {
  const [localSubtasks, setLocalSubtasks] = useState<SubTask[]>(subtasks);
  const [newSubtask, setNewSubtask] = useState({ titulo: '', descricao: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLocalSubtasks(subtasks);
  }, [subtasks]);

  const addSubtask = async () => {
    if (!newSubtask.titulo.trim()) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/subtasks/${taskId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          titulo: newSubtask.titulo,
          descricao: newSubtask.descricao,
          ordem: localSubtasks.length
        }),
      });

      if (res.ok) {
        const newSubtaskData = await res.json();
        const updatedSubtasks = [...localSubtasks, newSubtaskData];
        setLocalSubtasks(updatedSubtasks);
        onUpdateSubtasks(updatedSubtasks);
        setNewSubtask({ titulo: '', descricao: '' });
      } else {
        console.error('Erro ao criar sub-tarefa');
      }
    } catch (error) {
      console.error('Erro ao conectar ao backend:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSubtask = async (id: number, updates: Partial<SubTask>) => {
    if (!id) return; // Sub-tarefa ainda não foi salva no backend
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/subtasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        const updatedSubtask = await res.json();
        const updatedSubtasks = localSubtasks.map(st => 
          st.id === id ? { ...st, ...updatedSubtask } : st
        );
        setLocalSubtasks(updatedSubtasks);
        onUpdateSubtasks(updatedSubtasks);
      } else {
        console.error('Erro ao atualizar sub-tarefa');
      }
    } catch (error) {
      console.error('Erro ao conectar ao backend:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteSubtask = async (id: number) => {
    if (!id) return; // Sub-tarefa ainda não foi salva no backend
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/subtasks/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const updatedSubtasks = localSubtasks.filter(st => st.id !== id);
        setLocalSubtasks(updatedSubtasks);
        onUpdateSubtasks(updatedSubtasks);
      } else {
        console.error('Erro ao deletar sub-tarefa');
      }
    } catch (error) {
      console.error('Erro ao conectar ao backend:', error);
    } finally {
      setLoading(false);
    }
  };

  const moveSubtask = async (fromIndex: number, toIndex: number) => {
    const updatedSubtasks = [...localSubtasks];
    const [movedItem] = updatedSubtasks.splice(fromIndex, 1);
    updatedSubtasks.splice(toIndex, 0, movedItem);
    
    // Atualizar ordem
    updatedSubtasks.forEach((st, index) => {
      st.ordem = index;
    });
    
    setLocalSubtasks(updatedSubtasks);
    onUpdateSubtasks(updatedSubtasks);

    // Sincronizar com backend se todas as sub-tarefas têm ID
    if (updatedSubtasks.every(st => st.id)) {
      try {
        const token = localStorage.getItem('token');
        await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/subtasks/${taskId}/reorder`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            subTaskIds: updatedSubtasks.map(st => st.id)
          }),
        });
      } catch (error) {
        console.error('Erro ao sincronizar ordem:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-gray-100 text-gray-800';
      case 'em_andamento': return 'bg-blue-100 text-blue-800';
      case 'concluida': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const processMentions = (text: string) => {
    if (!assignees) return text;
    
    return text.replace(/@(\w+)/g, (match, username) => {
      const assignee = assignees.find(a => 
        a.user.nome.toLowerCase().includes(username.toLowerCase())
      );
      if (assignee) {
        return `<span class="text-blue-600 font-medium">@${assignee.user.nome}</span>`;
      }
      return match;
    });
  };

  return (
    <div className="bg-white rounded-lg p-4 border">
      <h3 className="text-lg font-semibold mb-4">Microetapas</h3>
      
      {/* Adicionar nova sub-tarefa */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Título da microetapa"
          className="flex-1 border rounded px-3 py-2"
          value={newSubtask.titulo}
          onChange={(e) => setNewSubtask(prev => ({ ...prev, titulo: e.target.value }))}
        />
        <input
          type="text"
          placeholder="Descrição (opcional) - Use @nome para mencionar"
          className="flex-1 border rounded px-3 py-2"
          value={newSubtask.descricao}
          onChange={(e) => setNewSubtask(prev => ({ ...prev, descricao: e.target.value }))}
        />
        <button
          onClick={addSubtask}
          disabled={loading || !newSubtask.titulo.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Adicionando...' : 'Adicionar'}
        </button>
      </div>

      {/* Dica sobre menções */}
      {assignees && assignees.length > 0 && (
        <div className="text-xs text-gray-500 mb-3">
          💡 Use @nome para mencionar: {assignees.map(a => a.user.nome).join(', ')}
        </div>
      )}

      {/* Lista de sub-tarefas */}
      <div className="space-y-2">
        {localSubtasks.map((subtask, index) => (
          <div
            key={subtask.id || index}
            className="border rounded p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-gray-500">#{index + 1}</span>
              
              {editingId === subtask.id ? (
                <input
                  type="text"
                  value={subtask.titulo}
                  onChange={(e) => updateSubtask(subtask.id!, { titulo: e.target.value })}
                  className="flex-1 border rounded px-2 py-1"
                  onBlur={() => setEditingId(null)}
                  autoFocus
                />
              ) : (
                <span 
                  className="flex-1 font-medium cursor-pointer"
                  onClick={() => setEditingId(subtask.id || null)}
                >
                  {subtask.titulo}
                </span>
              )}
              
              <select
                value={subtask.status}
                onChange={(e) => updateSubtask(subtask.id!, { status: e.target.value as SubTask['status'] })}
                className={`px-2 py-1 rounded text-xs ${getStatusColor(subtask.status)}`}
                disabled={loading}
              >
                <option value="pendente">Pendente</option>
                <option value="em_andamento">Em andamento</option>
                <option value="concluida">Concluída</option>
              </select>
            </div>
            
            {subtask.descricao && (
              <div 
                className="text-sm text-gray-600 mb-2"
                dangerouslySetInnerHTML={{ 
                  __html: processMentions(subtask.descricao) 
                }}
              />
            )}
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => moveSubtask(index, Math.max(0, index - 1))}
                disabled={index === 0 || loading}
                className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                ↑
              </button>
              <button
                onClick={() => moveSubtask(index, Math.min(localSubtasks.length - 1, index + 1))}
                disabled={index === localSubtasks.length - 1 || loading}
                className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                ↓
              </button>
              
              <button
                onClick={() => deleteSubtask(subtask.id!)}
                disabled={loading}
                className="ml-auto text-red-500 hover:text-red-700 text-sm disabled:opacity-50"
              >
                Excluir
              </button>
            </div>
          </div>
        ))}
        
        {localSubtasks.length === 0 && (
          <p className="text-gray-500 text-center py-4">
            Nenhuma microetapa criada ainda. Adicione a primeira!
          </p>
        )}
      </div>
    </div>
  );
};

export default SubTaskManager;
