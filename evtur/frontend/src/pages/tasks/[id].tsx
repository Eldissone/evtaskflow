import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import TaskComments from '../../components/TaskComments';
import ProtectedRoute from '../../components/ProtectedRoute';
import SubTaskManager from '../../components/SubTaskManager';
import CheckpointManager from '../../components/CheckpointManager';
import LessonsLearned from '../../components/LessonsLearned';

interface SubTask {
  id?: number;
  titulo: string;
  descricao?: string;
  status: 'pendente' | 'em_andamento' | 'concluida';
  ordem: number;
}

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

interface Task {
  id: number;
  titulo: string;
  descricao: string;
  status: string;
  createdAt: string;
  completedAt?: string;
  prioridade?: string;
  prazo?: string;
  creator?: { id: number; nome: string };
  assignees?: Array<{ user: { id: number; nome: string } }>;
  subtasks?: SubTask[];
  checkpoints?: Checkpoint[];
  lessons?: TaskLesson[];
}

export default function TaskDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const fetchTask = async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) return;
          
          const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/tasks/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (res.ok) {
            const data = await res.json();
            setTask(data);
          } else if (res.status === 404) {
            setTask(null);
          } else {
            console.error('Erro ao buscar tarefa:', res.status);
          }
        } catch (error) {
          console.error('Erro ao conectar ao backend:', error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchTask();
    }
  }, [id]);

  const handleSubtasksUpdate = (subtasks: SubTask[]) => {
    if (task) {
      setTask({ ...task, subtasks });
      console.log('Sub-tarefas atualizadas:', subtasks);
    }
  };

  const handleCheckpointsUpdate = (checkpoints: Checkpoint[]) => {
    if (task) {
      setTask({ ...task, checkpoints });
      console.log('Checkpoints atualizados:', checkpoints);
    }
  };

  const handleLessonsUpdate = (lessons: TaskLesson[]) => {
    if (task) {
      setTask({ ...task, lessons });
      console.log('Lições aprendidas atualizadas:', lessons);
    }
  };

  if (loading) return <div className="text-center mt-8">Carregando...</div>;
  if (!task) return <div className="text-center mt-8 text-red-500">Tarefa não encontrada.</div>;

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'baixa': return 'bg-gray-100 text-gray-800';
      case 'media': return 'bg-blue-100 text-blue-800';
      case 'alta': return 'bg-orange-100 text-orange-800';
      case 'urgente': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-2xl font-bold">{task.titulo}</h1>
          {task.prioridade && (
            <span className={`px-2 py-1 text-xs rounded-full ${getPrioridadeColor(task.prioridade)}`}>
              {task.prioridade.charAt(0).toUpperCase() + task.prioridade.slice(1)}
            </span>
          )}
        </div>
        <p className="mb-2 text-gray-700">{task.descricao}</p>
        
        <div className="text-xs text-gray-500 mb-2">
          <p>Criada por: <span className="font-medium text-blue-600">{task.creator?.nome || 'N/A'}</span></p>
          <p>Para: <span className="font-medium text-green-600">
            {task.assignees && task.assignees.length > 0 
              ? task.assignees.map((a, index) => (
                  <span key={a.user.id}>
                    {a.user.nome}
                    {index < task.assignees!.length - 1 ? ', ' : ''}
                  </span>
                ))
              : 'N/A'
            }
          </span></p>
          {task.prazo && (
            <p>Prazo: <span className="font-medium text-orange-600">
              {new Date(task.prazo).toLocaleString('pt-BR')}
            </span></p>
          )}
        </div>
        
        <p className="text-xs text-gray-400 mb-1">Criada em: {new Date(task.createdAt).toLocaleString()}</p>
        {task.status === 'concluida' && (
          <p className="text-green-600 text-xs mb-1">Concluída em: {task.completedAt && new Date(task.completedAt).toLocaleString()}</p>
        )}
        <p className="text-xs text-gray-500 mb-4">Status: {task.status}</p>
        
        {/* Microetapas */}
        <div className="mb-6">
          <SubTaskManager
            taskId={task.id}
            subtasks={task.subtasks || []}
            onUpdateSubtasks={handleSubtasksUpdate}
            assignees={task.assignees}
          />
        </div>
        
        {/* Checkpoints */}
        <div className="mb-6">
          <CheckpointManager
            taskId={task.id}
            checkpoints={task.checkpoints || []}
            onUpdateCheckpoints={handleCheckpointsUpdate}
            assignees={task.assignees}
          />
        </div>
        
        {/* Lições Aprendidas */}
        <div className="mb-6">
          <LessonsLearned
            taskId={task.id}
            lessons={task.lessons || []}
            onUpdateLessons={handleLessonsUpdate}
          />
        </div>
        
        {/* Comentários */}
        <div className="border-t pt-4 mt-4">
          <h2 className="text-xl font-semibold mb-2">Comentários</h2>
          <TaskComments taskId={task.id} assignees={task.assignees} />
        </div>
      </div>
    </ProtectedRoute>
  );
} 