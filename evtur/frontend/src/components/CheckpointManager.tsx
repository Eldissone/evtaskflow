import React, { useState, useEffect } from 'react';

interface Checkpoint {
  id?: number;
  titulo: string;
  descricao?: string;
  prazo?: string;
  tipo: 'manual' | 'automatico';
  status: 'pendente' | 'aprovado' | 'reprovado';
  createdAt: string;
  criadoPor?: { id: number; nome: string };
  aprovacoes?: Array<{
    id: number;
    aprovado: boolean;
    observacoes?: string;
    dataAprovacao: string;
    user: { id: number; nome: string };
  }>;
}

interface CheckpointManagerProps {
  taskId: number;
  checkpoints: Checkpoint[];
  onUpdateCheckpoints: (checkpoints: Checkpoint[]) => void;
  assignees?: Array<{ user: { id: number; nome: string } }>;
}

const CheckpointManager: React.FC<CheckpointManagerProps> = ({ 
  taskId, 
  checkpoints, 
  onUpdateCheckpoints, 
  assignees 
}) => {
  const [localCheckpoints, setLocalCheckpoints] = useState<Checkpoint[]>(checkpoints);
  const [newCheckpoint, setNewCheckpoint] = useState({ titulo: '', descricao: '', prazo: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState<number | null>(null);
  const [approvalData, setApprovalData] = useState({ aprovado: true, observacoes: '' });

  useEffect(() => {
    setLocalCheckpoints(checkpoints);
  }, [checkpoints]);

  const addCheckpoint = async () => {
    if (!newCheckpoint.titulo.trim()) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/checkpoints/${taskId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          titulo: newCheckpoint.titulo,
          descricao: newCheckpoint.descricao,
          prazo: newCheckpoint.prazo || undefined,
          tipo: 'manual'
        }),
      });

      if (res.ok) {
        const newCheckpointData = await res.json();
        const updatedCheckpoints = [...localCheckpoints, newCheckpointData];
        setLocalCheckpoints(updatedCheckpoints);
        onUpdateCheckpoints(updatedCheckpoints);
        setNewCheckpoint({ titulo: '', descricao: '', prazo: '' });
      } else {
        console.error('Erro ao criar checkpoint');
      }
    } catch (error) {
      console.error('Erro ao conectar ao backend:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAutoCheckpoints = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/checkpoints/${taskId}/generate-auto`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        // Recarregar checkpoints
        fetchCheckpoints();
      } else {
        console.error('Erro ao gerar checkpoints automáticos');
      }
    } catch (error) {
      console.error('Erro ao conectar ao backend:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCheckpoints = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/checkpoints/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        setLocalCheckpoints(data);
        onUpdateCheckpoints(data);
      }
    } catch (error) {
      console.error('Erro ao buscar checkpoints:', error);
    }
  };

  const updateCheckpoint = async (id: number, updates: Partial<Checkpoint>) => {
    if (!id) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/checkpoints/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        const updatedCheckpoint = await res.json();
        const updatedCheckpoints = localCheckpoints.map(cp => 
          cp.id === id ? { ...cp, ...updatedCheckpoint } : cp
        );
        setLocalCheckpoints(updatedCheckpoints);
        onUpdateCheckpoints(updatedCheckpoints);
      } else {
        console.error('Erro ao atualizar checkpoint');
      }
    } catch (error) {
      console.error('Erro ao conectar ao backend:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteCheckpoint = async (id: number) => {
    if (!id) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/checkpoints/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const updatedCheckpoints = localCheckpoints.filter(cp => cp.id !== id);
        setLocalCheckpoints(updatedCheckpoints);
        onUpdateCheckpoints(updatedCheckpoints);
      } else {
        console.error('Erro ao deletar checkpoint');
      }
    } catch (error) {
      console.error('Erro ao conectar ao backend:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveCheckpoint = async (checkpointId: number) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/checkpoints/${checkpointId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(approvalData),
      });

      if (res.ok) {
        setShowApprovalModal(null);
        setApprovalData({ aprovado: true, observacoes: '' });
        fetchCheckpoints(); // Recarregar para ver as mudanças
      } else {
        console.error('Erro ao aprovar checkpoint');
      }
    } catch (error) {
      console.error('Erro ao conectar ao backend:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'aprovado': return 'bg-green-100 text-green-800';
      case 'reprovado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'manual': return 'bg-blue-100 text-blue-800';
      case 'automatico': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Checkpoints de Revisão</h3>
        <button
          onClick={generateAutoCheckpoints}
          disabled={loading}
          className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? 'Gerando...' : 'Gerar Automáticos'}
        </button>
      </div>
      
      {/* Adicionar novo checkpoint */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Título do checkpoint"
          className="flex-1 border rounded px-3 py-2"
          value={newCheckpoint.titulo}
          onChange={(e) => setNewCheckpoint(prev => ({ ...prev, titulo: e.target.value }))}
        />
        <input
          type="text"
          placeholder="Descrição (opcional)"
          className="flex-1 border rounded px-3 py-2"
          value={newCheckpoint.descricao}
          onChange={(e) => setNewCheckpoint(prev => ({ ...prev, descricao: e.target.value }))}
        />
        <input
          type="datetime-local"
          className="border rounded px-3 py-2"
          value={newCheckpoint.prazo}
          onChange={(e) => setNewCheckpoint(prev => ({ ...prev, prazo: e.target.value }))}
        />
        <button
          onClick={addCheckpoint}
          disabled={loading || !newCheckpoint.titulo.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Adicionando...' : 'Adicionar'}
        </button>
      </div>

      {/* Lista de checkpoints */}
      <div className="space-y-3">
        {localCheckpoints.map((checkpoint) => (
          <div
            key={checkpoint.id || Math.random()}
            className="border rounded p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-1 text-xs rounded-full ${getTipoColor(checkpoint.tipo)}`}>
                {checkpoint.tipo === 'automatico' ? '🔄' : '✋'} {checkpoint.tipo}
              </span>
              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(checkpoint.status)}`}>
                {checkpoint.status}
              </span>
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              {editingId === checkpoint.id ? (
                <input
                  type="text"
                  value={checkpoint.titulo}
                  onChange={(e) => updateCheckpoint(checkpoint.id!, { titulo: e.target.value })}
                  className="flex-1 border rounded px-2 py-1"
                  onBlur={() => setEditingId(null)}
                  autoFocus
                />
              ) : (
                <span 
                  className="flex-1 font-medium cursor-pointer"
                  onClick={() => setEditingId(checkpoint.id || null)}
                >
                  {checkpoint.titulo}
                </span>
              )}
            </div>
            
            {checkpoint.descricao && (
              <p className="text-sm text-gray-600 mb-2">{checkpoint.descricao}</p>
            )}
            
            {checkpoint.prazo && (
              <p className="text-xs text-gray-500 mb-2">
                Prazo: {new Date(checkpoint.prazo).toLocaleString('pt-BR')}
              </p>
            )}
            
            {checkpoint.criadoPor && (
              <p className="text-xs text-gray-500 mb-2">
                Criado por: {checkpoint.criadoPor.nome}
              </p>
            )}
            
            {/* Aprovações */}
            {checkpoint.aprovacoes && checkpoint.aprovacoes.length > 0 && (
              <div className="mb-2">
                <p className="text-xs text-gray-600 mb-1">Aprovações:</p>
                <div className="space-y-1">
                  {checkpoint.aprovacoes.map((aprovacao) => (
                    <div key={aprovacao.id} className="flex items-center gap-2 text-xs">
                      <span className={`px-2 py-1 rounded ${aprovacao.aprovado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {aprovacao.aprovado ? '✅' : '❌'} {aprovacao.user.nome}
                      </span>
                      {aprovacao.observacoes && (
                        <span className="text-gray-600">"{aprovacao.observacoes}"</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              {checkpoint.status === 'pendente' && (
                <button
                  onClick={() => setShowApprovalModal(checkpoint.id!)}
                  disabled={loading}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  Aprovar/Reprovar
                </button>
              )}
              
              <button
                onClick={() => deleteCheckpoint(checkpoint.id!)}
                disabled={loading}
                className="ml-auto text-red-500 hover:text-red-700 text-sm disabled:opacity-50"
              >
                Excluir
              </button>
            </div>
          </div>
        ))}
        
        {localCheckpoints.length === 0 && (
          <p className="text-gray-500 text-center py-4">
            Nenhum checkpoint criado ainda. Adicione o primeiro ou gere automaticamente!
          </p>
        )}
      </div>

      {/* Modal de aprovação */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Aprovar Checkpoint</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Decisão:</label>
              <select
                value={approvalData.aprovado.toString()}
                onChange={(e) => setApprovalData(prev => ({ ...prev, aprovado: e.target.value === 'true' }))}
                className="w-full border rounded px-3 py-2"
              >
                <option value="true">✅ Aprovar</option>
                <option value="false">❌ Reprovar</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Observações (opcional):</label>
              <textarea
                value={approvalData.observacoes}
                onChange={(e) => setApprovalData(prev => ({ ...prev, observacoes: e.target.value }))}
                className="w-full border rounded px-3 py-2"
                rows={3}
                placeholder="Adicione observações sobre sua decisão..."
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => approveCheckpoint(showApprovalModal)}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Processando...' : 'Confirmar'}
              </button>
              <button
                onClick={() => setShowApprovalModal(null)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckpointManager;
