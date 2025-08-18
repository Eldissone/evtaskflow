import React from 'react';
import Link from 'next/link';
import TaskComments from './TaskComments';

type Task = {
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
};

type Props = {
  tasks: Task[];
  filter: string;
  onEdit: (task: Task) => void;
  onDelete?: (id: number) => void;
  onComplete?: (id: number) => void;
};

const getPrioridadeColor = (prioridade: string) => {
  switch (prioridade) {
    case 'baixa': return 'bg-gray-100 text-gray-800';
    case 'media': return 'bg-blue-100 text-blue-800';
    case 'alta': return 'bg-orange-100 text-orange-800';
    case 'urgente': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const TaskList: React.FC<Props> = ({ tasks, filter, onEdit, onDelete, onComplete }) => {
  const filtered = filter ? tasks.filter(t => t.status === filter) : tasks;
  if (filtered.length === 0) return <p className="text-center mt-4">Nenhuma tarefa encontrada.</p>;
  return (
    <ul className="space-y-2 mt-4">
      {filtered.map(task => (
        <li key={task.id} className="bg-white p-4 rounded shadow flex flex-col md:flex-row md:items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-semibold text-lg">{task.titulo}</h2>
              {task.prioridade && (
                <span className={`px-2 py-1 text-xs rounded-full ${getPrioridadeColor(task.prioridade)}`}>
                  {task.prioridade.charAt(0).toUpperCase() + task.prioridade.slice(1)}
                </span>
              )}
            </div>
            <p className="text-gray-600">{task.descricao}</p>
            <div className="text-xs text-gray-500 mt-1">
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
            <p className="text-xs text-gray-400">Criada em: {new Date(task.createdAt).toLocaleString()}</p>
            {task.status === 'concluida' && <p className="text-green-600 text-xs">Concluída em: {task.completedAt && new Date(task.completedAt).toLocaleString()}</p>}
            <Link href={`/tasks/${task.id}`} className="text-blue-500 hover:underline text-sm mt-2 inline-block">Ver detalhes</Link>
            {/* Comentários dinâmicos colapsáveis */}
            <details className="mt-2">
              <summary className="cursor-pointer text-gray-700 text-sm">Comentários</summary>
              <TaskComments taskId={task.id} />
            </details>
          </div>
          <div className="flex gap-2 mt-2 md:mt-0 md:ml-4">
            {task.status !== 'concluida' && onComplete && (
              <button onClick={() => onComplete(task.id)} className="px-2 py-1 bg-green-500 text-white rounded">Concluir</button>
            )}
            <button onClick={() => onEdit(task)} className="px-2 py-1 bg-blue-500 text-white rounded">Editar</button>
            {onDelete && <button onClick={() => onDelete(task.id)} className="px-2 py-1 bg-red-500 text-white rounded">Excluir</button>}
          </div>
        </li>
      ))}
    </ul>
  );
};

export default TaskList; 