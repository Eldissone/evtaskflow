import React from 'react';

type Props = {
  filter: string;
  setFilter: (f: string) => void;
  typeFilter: string;
  setTypeFilter: (f: string) => void;
};

const TaskFilter: React.FC<Props> = ({ filter, setFilter, typeFilter, setTypeFilter }) => (
  <div className="Filtros flex flex-col gap-4 justify-center mt-4 mb-4">
    {/* Filtros de tipo */}
    <div className="flex gap-4 justify-center">
      <button
        className={`px-3 py-1 rounded ${typeFilter === '' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
        onClick={() => setTypeFilter('')}
      >
        Todas as tarefas
      </button>
      <button
        className={`px-3 py-1 rounded ${typeFilter === 'assigned' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
        onClick={() => setTypeFilter('assigned')}
      >
        Atribuídas para mim
      </button>
      <button
        className={`px-3 py-1 rounded ${typeFilter === 'created' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
        onClick={() => setTypeFilter('created')}
      >
        Criadas por mim
      </button>
    </div>
    
    {/* Filtros de status */}
    <div className="flex gap-4 justify-center">
      <button
        className={`px-3 py-1 rounded ${filter === '' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        onClick={() => setFilter('')}
      >
        Todos os status
      </button>
      <button
        className={`px-3 py-1 rounded ${filter === 'pendente' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        onClick={() => setFilter('pendente')}
      >
        Pendentes
      </button>
      <button
        className={`px-3 py-1 rounded ${filter === 'concluida' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        onClick={() => setFilter('concluida')}
      >
        Concluídas
      </button>
    </div>
  </div>
);

export default TaskFilter; 