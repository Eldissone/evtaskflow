import React, { useState, useEffect } from 'react';

type Task = {
  id?: number;
  titulo: string;
  descricao: string;
  assigneeIds?: number[];
  prioridade?: string;
  prazo?: string;
};

type Props = {
  onSave: (task: Task) => void;
  editingTask: Task | null;
  onCancel: () => void;
};

const TaskForm: React.FC<Props> = ({ onSave, editingTask, onCancel }) => {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [assigneeIds, setAssigneeIds] = useState<number[]>([]);
  const [prioridade, setPrioridade] = useState('media');
  const [prazo, setPrazo] = useState('');
  const [users, setUsers] = useState<Array<{ id: number; nome: string }>>([]);
  const [currentUser, setCurrentUser] = useState<{ id: number; nome: string } | null>(null);

  useEffect(() => {
    if (editingTask) {
      setTitulo(editingTask.titulo);
      setDescricao(editingTask.descricao);
      setAssigneeIds(editingTask.assigneeIds || []);
      setPrioridade(editingTask.prioridade || 'media');
      setPrazo(editingTask.prazo || '');
    } else {
      setTitulo('');
      setDescricao('');
      setAssigneeIds([]);
      setPrioridade('media');
      setPrazo('');
    }
  }, [editingTask]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        // Buscar usuário atual
        const meRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (meRes.ok) {
          const meData = await meRes.json();
          setCurrentUser(meData);
        }
        
        // Buscar lista de usuários
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/auth/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUsers(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        // noop
      }
    };
    fetchUsers();
  }, []);

  const handleAssigneeChange = (userId: number, checked: boolean) => {
    if (checked) {
      setAssigneeIds(prev => [...prev, userId]);
    } else {
      setAssigneeIds(prev => prev.filter(id => id !== userId));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ id: editingTask?.id, titulo, descricao, assigneeIds, prioridade, prazo });
    setTitulo('');
    setDescricao('');
    setAssigneeIds([]);
    setPrioridade('media');
    setPrazo('');
  };

  return (
    <form onSubmit={handleSubmit} className="Form-Task bg-white p-4 rounded mb-4 flex flex-col gap-2 ">
      {currentUser && (
        <div className="text-sm text-gray-600 mb-2">
          Criando tarefa como: <span className="font-semibold text-blue-600">{currentUser.nome}</span>
        </div>
      )}
      
      <input
        type="text"
        placeholder="Título da tarefa"
        className="border p-2 rounded"
        value={titulo}
        onChange={e => setTitulo(e.target.value)}
        required
      />
      
      <textarea
        placeholder="Descrição"
        className="border p-2 rounded"
        value={descricao}
        onChange={e => setDescricao(e.target.value)}
      />
      
      {/* Campos de prazo e prioridade */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Prioridade</label>
          <select
            className="border p-2 rounded w-full"
            value={prioridade}
            onChange={e => setPrioridade(e.target.value)}
          >
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
            <option value="urgente">Urgente</option>
          </select>
        </div>
        
        <div>
          <label className="block text-xs text-gray-600 mb-1">Prazo</label>
          <input
            type="datetime-local"
            className="border p-2 rounded w-full"
            value={prazo}
            onChange={e => setPrazo(e.target.value)}
          />
        </div>
      </div>
      
      <div className="border p-2 rounded">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Selecione os amigos (destinatários): 
          <span className="ml-2 text-xs text-gray-500">
            {assigneeIds.length} selecionado{assigneeIds.length !== 1 ? 's' : ''}
          </span>
        </label>
        <div className="max-h-32 overflow-y-auto space-y-2">
          {users.map(u => (
            <label key={u.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
              <input
                type="checkbox"
                checked={assigneeIds.includes(u.id)}
                onChange={(e) => handleAssigneeChange(u.id, e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">{u.nome}</span>
            </label>
          ))}
        </div>
        {assigneeIds.length === 0 && (
          <p className="text-xs text-red-500 mt-1">Selecione pelo menos um destinatário</p>
        )}
        {assigneeIds.length > 0 && (
          <p className="text-xs text-green-600 mt-1">
            Destinatários: {assigneeIds.map(id => users.find(u => u.id === id)?.nome).join(', ')}
          </p>
        )}
      </div>
      
      <div className="flex gap-2">
        <button 
          type="submit" 
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
          disabled={assigneeIds.length === 0}
        >
          {editingTask ? 'Salvar Alterações' : 'Adicionar Tarefa'}
        </button>
        {editingTask && (
          <button type="button" onClick={onCancel} className="bg-gray-400 text-white px-4 py-2 rounded">Cancelar</button>
        )}
      </div>
    </form>
  );
};

export default TaskForm; 