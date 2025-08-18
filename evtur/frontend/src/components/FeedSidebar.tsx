import { useEffect, useState } from 'react';
import { CheckCircleIcon, ChatBubbleLeftRightIcon, PaperClipIcon, UserIcon, BellIcon, CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

export type FeedEvent = {
  id: number;
  type: 'created' | 'updated' | 'completed' | 'comment' | 'status' | 'priority' | 'assigned' | 'deadline' | 'reminder' | 'checklist' | 'attachment' | 'deleted';
  message: string;
  user?: string;
  timestamp: number;
  extra?: {
    taskId?: number;
    url?: string;
    imageUrl?: string;
  };
};

const iconMap: Record<string, JSX.Element> = {
  created: <CheckCircleIcon className="w-5 h-5 text-green-500" />,
  updated: <CheckCircleIcon className="w-5 h-5 text-blue-500" />,
  completed: <CheckCircleIcon className="w-5 h-5 text-green-700" />,
  comment: <ChatBubbleLeftRightIcon className="w-5 h-5 text-gray-500" />,
  status: <CheckCircleIcon className="w-5 h-5 text-yellow-500" />,
  priority: <CheckCircleIcon className="w-5 h-5 text-pink-500" />,
  assigned: <UserIcon className="w-5 h-5 text-indigo-500" />,
  deadline: <CalendarIcon className="w-5 h-5 text-orange-500" />,
  reminder: <BellIcon className="w-5 h-5 text-red-500" />,
  checklist: <CheckCircleIcon className="w-5 h-5 text-lime-600" />,
  attachment: <PaperClipIcon className="w-5 h-5 text-gray-700" />,
  deleted: <CheckCircleIcon className="w-5 h-5 text-red-400" />,
};

function DateClient({ timestamp }: { timestamp: number }) {
  const [date, setDate] = useState('');
  useEffect(() => {
    setDate(new Date(timestamp).toLocaleString());
  }, [timestamp]);
  return <span>{date}</span>;
}

export default function FeedSidebar({ events }: { events: FeedEvent[] }) {
  const [open, setOpen] = useState(true);

  return (
    <>
      <button
        className={`fixed right-0 top-1/2 z-50 bg-blue-600 text-white p-2 rounded-l shadow-md transition-transform duration-300 ${open ? 'translate-x-80' : ''}`}
        style={{ transform: 'translateY(-50%)' }}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Ocultar feed' : 'Mostrar feed'}
      >
        {open ? <ChevronRightIcon className="w-6 h-6" /> : <ChevronLeftIcon className="w-6 h-6" />}
      </button>
      <aside
        className={`fixed right-0 top-20 h-full w-80 bg-white border-l border-gray-200 shadow-lg p-4 overflow-y-auto z-40 transition-transform duration-300
        ${open ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg">Feed de Atividades</h2>
          <button
            className="text-gray-400 hover:text-blue-600 transition"
            onClick={() => setOpen(false)}
            aria-label="Ocultar feed"
          >
            <ChevronRightIcon className="w-6 h-6" />
          </button>
        </div>
        <ul className="space-y-3">
          {events.map(ev => (
            <li key={ev.id} className="flex items-start gap-2">
              {iconMap[ev.type] || <CheckCircleIcon className="w-5 h-5 text-gray-400" />}
              <div>
                <div className="text-sm flex items-center gap-2">
                  {ev.user && (
                    <span className="w-7 h-7 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-200 to-blue-500 text-white font-bold text-xs shadow">
                      {ev.user.charAt(0).toUpperCase()}
                    </span>
                  )}
                  {ev.message}
                  {/* Link para tarefa, se houver */}
                  {ev.extra?.taskId && (
                    <a
                      href={`/tarefas/${ev.extra.taskId}`}
                      className="text-blue-600 underline text-xs ml-2"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ver tarefa
                    </a>
                  )}
                  {/* Preview de anexo, se houver */}
                  {ev.type === 'attachment' && ev.extra?.url && (
                    <a href={ev.extra.url} className="text-blue-600 underline text-xs ml-2" target="_blank" rel="noopener noreferrer">
                      Ver anexo
                    </a>
                  )}
                  {/* Preview de imagem, se houver */}
                  {ev.extra?.imageUrl && (
                    <img src={ev.extra.imageUrl} alt="Preview" className="w-16 h-16 object-cover rounded mt-1" />
                  )}
                </div>
                {ev.user && <div className="text-xs text-gray-500">por {ev.user}</div>}
                <div className="text-xs text-gray-400"><DateClient timestamp={ev.timestamp} /></div>
              </div>
            </li>
          ))}
        </ul>
      </aside>
    </>
  );
} 