import React, { useState, useEffect } from 'react';

interface TaskLesson {
  id?: number;
  titulo: string;
  descricao: string;
  categoria: string;
  impacto: 'baixo' | 'medio' | 'alto';
  aplicabilidade: 'tarefa_atual' | 'proximas_tarefas' | 'geral';
  createdAt: string;
  criadoPor?: { id: number; nome: string };
}

interface LessonsLearnedProps {
  taskId: number;
  lessons: TaskLesson[];
  onUpdateLessons: (lessons: TaskLesson[]) => void;
}

const LessonsLearned: React.FC<LessonsLearnedProps> = ({ taskId, lessons, onUpdateLessons }) => {
  const [localLessons, setLocalLessons] = useState<TaskLesson[]>(lessons);
  const [newLesson, setNewLesson] = useState({
    titulo: '',
    descricao: '',
    categoria: '',
    impacto: 'medio' as const,
    aplicabilidade: 'tarefa_atual' as const
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const categories = [
    'processo', 'tecnologia', 'comunicacao', 'planejamento', 
    'qualidade', 'tempo', 'recursos', 'outros'
  ];

  useEffect(() => {
    setLocalLessons(lessons);
  }, [lessons]);

  const addLesson = async () => {
    if (!newLesson.titulo.trim() || !newLesson.descricao.trim() || !newLesson.categoria) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/history/${taskId}/lessons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newLesson),
      });

      if (res.ok) {
        const newLessonData = await res.json();
        const updatedLessons = [...localLessons, newLessonData];
        setLocalLessons(updatedLessons);
        onUpdateLessons(updatedLessons);
        setNewLesson({
          titulo: '',
          descricao: '',
          categoria: '',
          impacto: 'medio',
          aplicabilidade: 'tarefa_atual'
        });
        setShowForm(false);
      } else {
        console.error('Erro ao criar lição aprendida');
      }
    } catch (error) {
      console.error('Erro ao conectar ao backend:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateLesson = async (id: number, updates: Partial<TaskLesson>) => {
    if (!id) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/history/lessons/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        const updatedLesson = await res.json();
        const updatedLessons = localLessons.map(lesson => 
          lesson.id === id ? { ...lesson, ...updatedLesson } : lesson
        );
        setLocalLessons(updatedLessons);
        onUpdateLessons(updatedLessons);
        setEditingId(null);
      } else {
        console.error('Erro ao atualizar lição aprendida');
      }
    } catch (error) {
      console.error('Erro ao conectar ao backend:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteLesson = async (id: number) => {
    if (!id) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/history/lessons/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const updatedLessons = localLessons.filter(lesson => lesson.id !== id);
        setLocalLessons(updatedLessons);
        onUpdateLessons(updatedLessons);
      } else {
        console.error('Erro ao deletar lição aprendida');
      }
    } catch (error) {
      console.error('Erro ao conectar ao backend:', error);
    } finally {
      setLoading(false);
    }
  };

  const getImpactColor = (impacto: string) => {
    switch (impacto) {
      case 'baixo': return 'bg-green-100 text-green-800';
      case 'medio': return 'bg-yellow-100 text-yellow-800';
      case 'alto': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAplicabilidadeColor = (aplicabilidade: string) => {
    switch (aplicabilidade) {
      case 'tarefa_atual': return 'bg-blue-100 text-blue-800';
      case 'proximas_tarefas': return 'bg-purple-100 text-purple-800';
      case 'geral': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (categoria: string) => {
    const icons: { [key: string]: string } = {
      processo: '⚙️',
      tecnologia: '💻',
      comunicacao: '💬',
      planejamento: '📋',
      qualidade: '✅',
      tempo: '⏰',
      recursos: '💰',
      outros: '📝'
    };
    return icons[categoria] || '📝';
  };

  return (
    <div className="bg-white rounded-lg p-4 border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Lições Aprendidas</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
        >
          {showForm ? 'Cancelar' : '+ Nova Lição'}
        </button>
      </div>
      
      {/* Formulário para nova lição */}
      {showForm && (
        <div className="bg-gray-50 rounded p-4 mb-4">
          <h4 className="font-medium mb-3">Nova Lição Aprendida</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <input
              type="text"
              placeholder="Título da lição"
              className="border rounded px-3 py-2"
              value={newLesson.titulo}
              onChange={(e) => setNewLesson(prev => ({ ...prev, titulo: e.target.value }))}
            />
            
            <select
              value={newLesson.categoria}
              onChange={(e) => setNewLesson(prev => ({ ...prev, categoria: e.target.value }))}
              className="border rounded px-3 py-2"
            >
              <option value="">Selecione a categoria</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {getCategoryIcon(cat)} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          <textarea
            placeholder="Descreva a lição aprendida..."
            className="w-full border rounded px-3 py-2 mb-3"
            rows={3}
            value={newLesson.descricao}
            onChange={(e) => setNewLesson(prev => ({ ...prev, descricao: e.target.value }))}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <select
              value={newLesson.impacto}
              onChange={(e) => setNewLesson(prev => ({ ...prev, impacto: e.target.value as TaskLesson['impacto'] }))}
              className="border rounded px-3 py-2"
            >
              <option value="baixo">Baixo Impacto</option>
              <option value="medio">Médio Impacto</option>
              <option value="alto">Alto Impacto</option>
            </select>
            
            <select
              value={newLesson.aplicabilidade}
              onChange={(e) => setNewLesson(prev => ({ ...prev, aplicabilidade: e.target.value as TaskLesson['aplicabilidade'] }))}
              className="border rounded px-3 py-2"
            >
              <option value="tarefa_atual">Tarefa Atual</option>
              <option value="proximas_tarefas">Próximas Tarefas</option>
              <option value="geral">Geral</option>
            </select>
          </div>
          
          <button
            onClick={addLesson}
            disabled={loading || !newLesson.titulo.trim() || !newLesson.descricao.trim() || !newLesson.categoria}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar Lição'}
          </button>
        </div>
      )}

      {/* Lista de lições aprendidas */}
      <div className="space-y-3">
        {localLessons.map((lesson) => (
          <div
            key={lesson.id || Math.random()}
            className="border rounded p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{getCategoryIcon(lesson.categoria)}</span>
              <span className={`px-2 py-1 text-xs rounded-full ${getImpactColor(lesson.impacto)}`}>
                {lesson.impacto.charAt(0).toUpperCase() + lesson.impacto.slice(1)} Impacto
              </span>
              <span className={`px-2 py-1 text-xs rounded-full ${getAplicabilidadeColor(lesson.aplicabilidade)}`}>
                {lesson.aplicabilidade.replace('_', ' ').split(' ').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
              </span>
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              {editingId === lesson.id ? (
                <input
                  type="text"
                  value={lesson.titulo}
                  onChange={(e) => updateLesson(lesson.id!, { titulo: e.target.value })}
                  className="flex-1 border rounded px-2 py-1"
                  onBlur={() => setEditingId(null)}
                  autoFocus
                />
              ) : (
                <span 
                  className="flex-1 font-medium cursor-pointer"
                  onClick={() => setEditingId(lesson.id || null)}
                >
                  {lesson.titulo}
                </span>
              )}
            </div>
            
            <p className="text-sm text-gray-600 mb-2">{lesson.descricao}</p>
            
            {lesson.criadoPor && (
              <p className="text-xs text-gray-500 mb-2">
                Aprendido por: {lesson.criadoPor.nome}
              </p>
            )}
            
            <p className="text-xs text-gray-400 mb-2">
              {new Date(lesson.createdAt).toLocaleString('pt-BR')}
            </p>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => deleteLesson(lesson.id!)}
                disabled={loading}
                className="ml-auto text-red-500 hover:text-red-700 text-sm disabled:opacity-50"
              >
                Excluir
              </button>
            </div>
          </div>
        ))}
        
        {localLessons.length === 0 && (
          <p className="text-gray-500 text-center py-4">
            Nenhuma lição aprendida registrada ainda. Adicione a primeira!
          </p>
        )}
      </div>
    </div>
  );
};

export default LessonsLearned;
