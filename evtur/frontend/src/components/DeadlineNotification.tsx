import React, { useEffect, useState } from 'react';

interface Task {
  id: number;
  titulo: string;
  prazo?: string;
  status: string;
}

interface DeadlineNotificationProps {
  tasks: Task[];
}

const DeadlineNotification: React.FC<DeadlineNotificationProps> = ({ tasks }) => {
  const [notifications, setNotifications] = useState<Task[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const urgentTasks = tasks.filter(task => {
      if (!task.prazo || task.status === 'concluida') return false;
      
      const deadline = new Date(task.prazo);
      const timeDiff = deadline.getTime() - now.getTime();
      const daysDiff = timeDiff / (1000 * 3600 * 24);
      
      // Mostrar notificação para tarefas com prazo em 24h ou vencidas
      return daysDiff <= 1 && daysDiff >= -1;
    });
    
    setNotifications(urgentTasks);
  }, [tasks]);

  if (notifications.length === 0) return null;

  const getDeadlineStatus = (prazo: string) => {
    const now = new Date();
    const deadline = new Date(prazo);
    const timeDiff = deadline.getTime() - now.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);
    
    if (daysDiff < 0) {
      return { text: 'VENCIDA', color: 'text-red-600', bgColor: 'bg-red-100' };
    } else if (daysDiff < 1) {
      return { text: 'HOJE', color: 'text-orange-600', bgColor: 'bg-orange-100' };
    } else {
      return { text: 'AMANHÃ', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors"
      >
        <span className="text-sm font-bold">{notifications.length}</span>
        <span className="ml-1">⏰</span>
      </button>
      
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border max-h-96 overflow-y-auto">
          <div className="p-3 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-800">Prazos Urgentes</h3>
            <p className="text-xs text-gray-600">{notifications.length} tarefa(s) precisam de atenção</p>
          </div>
          
          <div className="p-2">
            {notifications.map(task => {
              const status = getDeadlineStatus(task.prazo!);
              return (
                <div key={task.id} className="p-2 border rounded mb-2 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm text-gray-800">{task.titulo}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${status.bgColor} ${status.color}`}>
                      {status.text}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Prazo: {new Date(task.prazo!).toLocaleString('pt-BR')}
                  </p>
                </div>
              );
            })}
          </div>
          
          <div className="p-2 border-t bg-gray-50">
            <button
              onClick={() => setShowNotifications(false)}
              className="w-full text-xs text-gray-600 hover:text-gray-800"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeadlineNotification;
