import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import TaskList from '../components/TaskList';
import TaskForm from '../components/TaskForm';
import TaskFilter from '../components/TaskFilter';
import { CheckCircleIcon, BellIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';
import { io } from 'socket.io-client';
import FeedSidebar, { FeedEvent } from '../components/FeedSidebar';
import TaskComments from '../components/TaskComments';
import PostPanel from '../components/PostPanel';
import Spinner from '../components/Spinner';
import Footer from '../components/Footer';
import ChatPanel from '../components/ChatPanel';
import ProtectedRoute from '../components/ProtectedRoute';
import DeadlineNotification from '../components/DeadlineNotification';

// Definição do tipo de tarefa
interface Task {
    id: number;
    titulo: string;
    descricao: string;
    status: string;
    createdAt: string;
    completedAt?: string;
    assigneeIds?: number[];
    prioridade?: string;
    prazo?: string;
    creator?: { id: number; nome: string };
    assignees?: Array<{ user: { id: number; nome: string } }>;
}

interface Notification {
    id: number;
    type: 'created' | 'updated' | 'deleted';
    message: string;
    timestamp: number;
}

export default function Home() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [filter, setFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [userName, setUserName] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const router = useRouter();
    const notifRef = useRef<HTMLDivElement>(null);
    const [userId, setUserId] = useState<number | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showForm, setShowForm] = useState(false);
    const [feedEvents, setFeedEvents] = useState<FeedEvent[]>([
        {
            id: 1,
            type: 'created',
            message: 'Tarefa criada: Implementar autenticação',
            user: 'João',
            timestamp: Date.now() - 1000 * 60 * 60,
            extra: { taskId: 101 }
        },
        {
            id: 2,
            type: 'attachment',
            message: 'Arquivo anexado: contrato.pdf',
            user: 'Maria',
            timestamp: Date.now() - 1000 * 60 * 45,
            extra: { url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }
        },
        {
            id: 3,
            type: 'completed',
            message: 'Tarefa concluída: Ajustar layout mobile',
            user: 'Carlos',
            timestamp: Date.now() - 1000 * 60 * 30,
            extra: { taskId: 102 }
        },
        {
            id: 4,
            type: 'attachment',
            message: 'Imagem anexada: screenshot.png',
            user: 'Joana',
            timestamp: Date.now() - 1000 * 60 * 10,
            extra: { imageUrl: 'https://via.placeholder.com/100x60.png?text=Preview' }
        },
        {
            id: 8,
            type: 'comment',
            message: 'Comentou: "Vamos priorizar esta tarefa!"',
            user: 'Lucas',
            timestamp: Date.now() - 1000 * 60 * 5,
            extra: { taskId: 101 }
        },
        {
            id: 9,
            type: 'deadline',
            message: 'Prazo alterado para 25/07/2024',
            user: 'Maria',
            timestamp: Date.now() - 1000 * 60 * 2,
            extra: { taskId: 101 }
        }
    ]);
    const [checkingAuth, setCheckingAuth] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [loadingTasks, setLoadingTasks] = useState(false);
    const [showChat, setShowChat] = useState(false);

    // Buscar nome e id do usuário logado
    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/auth/me`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.ok) {
                const data = await res.json();
                setUserName(data.nome);
                setUserId(data.id);
            }
        };
        fetchUser();
    }, []);

    // Buscar tarefas do backend
    const fetchTasks = async () => {
        setLoadingTasks(true);
        const token = localStorage.getItem('token');
        
        let url = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/tasks`;
        const params = new URLSearchParams();
        
        if (filter) params.append('status', filter);
        if (typeFilter === 'created') params.append('type', 'created');
        if (typeFilter === 'assigned') params.append('type', 'assigned');
        
        if (params.toString()) {
            url += `?${params.toString()}`;
        }
        
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setTasks(Array.isArray(data) ? data : []);
        setLoadingTasks(false);
    };

    useEffect(() => {
        fetchTasks();
        // eslint-disable-next-line
    }, [filter, typeFilter]);

    // Função de logout
    const handleLogout = () => {
        localStorage.removeItem('token');
        router.replace('/login');
    };

    // Notificações em tempo real
    useEffect(() => {
        if (!userId) return; // Só conecta se já tiver o id do usuário
        const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001');
        console.log('Socket conectado!');

        let notifId = Date.now();

        socket.on('connect', () => {
            console.log('Socket.io conectado ao backend!');
        });

        socket.on('taskCreated', (data) => {
            if (data.user_id === userId || (data.assignee_ids && data.assignee_ids.includes(userId))) {
                setNotifications((prev) => [
                    { id: notifId++, type: 'created', message: `Tarefa criada: ${data.titulo}`, timestamp: Date.now() },
                    ...prev
                ]);
                setUnreadCount((c) => c + 1);
                setFeedEvents((prev) => [
                    { id: notifId++, type: 'created', message: `Tarefa criada: ${data.titulo}`, timestamp: Date.now() },
                    ...prev
                ]);
            }
        });
        socket.on('taskUpdated', (data) => {
            if (data.user_id === userId || (data.assignee_ids && data.assignee_ids.includes(userId))) {
                let msg = 'Tarefa atualizada';
                let type: FeedEvent['type'] = 'updated';
                if (data.status === 'concluida') {
                    msg = `Tarefa concluída: ${data.titulo}`;
                    type = 'completed';
                } else if (data.titulo) {
                    msg = `Tarefa editada: ${data.titulo}`;
                }
                setUnreadCount((c) => c + 1);
                setFeedEvents((prev) => [
                    { id: notifId++, type, message: msg, timestamp: Date.now() },
                    ...prev
                ]);
            }
            fetchTasks();
        });
        socket.on('taskDeleted', (data) => {
            if (data.user_id === userId || (data.assignee_ids && data.assignee_ids.includes(userId))) {
                setNotifications((prev) => [
                    { id: notifId++, type: 'deleted', message: `Tarefa excluída: ${data.titulo}`, timestamp: Date.now() },
                    ...prev
                ]);
                setUnreadCount((c) => c + 1);
                setFeedEvents((prev) => [
                    { id: notifId++, type: 'deleted', message: `Tarefa excluída: ${data.titulo}`, timestamp: Date.now() },
                    ...prev
                ]);
            }
            fetchTasks();
        });
        socket.on('feedEvent', (data) => {
            setFeedEvents((prev) => [data, ...prev]);
        });
        return () => { socket.disconnect(); };
    }, [userId]);

    useEffect(() => {
        const handler = (e: any) => setUnreadCount(e.detail);
        window.addEventListener('chat-unread', handler);
        return () => window.removeEventListener('chat-unread', handler);
    }, []);

    // Fechar dropdown ao clicar fora
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        }
        if (showNotifications) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showNotifications]);

    const filtered = filter ? (Array.isArray(tasks) ? tasks.filter(t => t.status === filter) : []) : (Array.isArray(tasks) ? tasks : []);

    // Criar ou editar tarefa
    const handleSave = async (task: Partial<Task>) => {
        const token = localStorage.getItem('token');
        if (task.id) {
            await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/tasks/${task.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ 
                    titulo: task.titulo, 
                    descricao: task.descricao, 
                    assigneeIds: task.assigneeIds,
                    prioridade: task.prioridade,
                    prazo: task.prazo
                }),
            });
            setSuccessMsg('Tarefa atualizada com sucesso!');
        } else {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ 
                    titulo: task.titulo, 
                    descricao: task.descricao, 
                    status: 'pendente', 
                    assigneeIds: task.assigneeIds,
                    prioridade: task.prioridade,
                    prazo: task.prazo
                }),
            });
            console.log('Status:', res.status);
            const data = await res.json();
            console.log('Resposta:', data);
            if (!res.ok) {
                setErrorMsg(data.details || data.error || 'Erro desconhecido');
                setTimeout(() => setErrorMsg(''), 3000);
                return;
            }
            setSuccessMsg('Tarefa criada com sucesso!');
        }
        setEditingTask(null);
        fetchTasks();
        setTimeout(() => setSuccessMsg(''), 2000);
    };

    // Excluir tarefa
    const handleDelete = async (id: number) => {
        const token = localStorage.getItem('token');
        await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/tasks/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });
        fetchTasks();
    };

    // Marcar como concluída
    const handleComplete = async (id: number) => {
        const token = localStorage.getItem('token');
        await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/tasks/${id}/complete`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` },
        });
        fetchTasks();
    };

    const handleToggleNotifications = () => {
        setShowNotifications((v) => {
            if (!v) setUnreadCount(0);
            return !v;
        });
    };

    if (checkingAuth) {
        return null; // ou um spinner
    }

    return (
        <ProtectedRoute>
            <>
                <PostPanel />
                <div className="min-h-screen bg-gray-100">
                    <header className="flex justify-between items-center mb-4">
                        <h1 className="text-2xl font-bold text-center">Ev TaskFlow</h1>
                        <div className="flex items-center gap-4">
                            {showNotifications && (
                                <div ref={notifRef} className="notificar absolute z-50 w-80 max-w-full bg-white border border-gray-200 rounded shadow-lg p-2 animate-fade-in-out">
                                    <div className="flex justify-between items-center mb-2">
                                        <h2 className="font-bold text-lg text-blue-700 flex items-center gap-2"><BellIcon className="w-5 h-5" /> Notificações</h2>
                                        <button onClick={() => setNotifications([])} className="text-xs text-red-500 hover:underline">Limpar tudo</button>
                                    </div>
                                    {notifications.length === 0 ? (
                                        <p className="text-gray-500 text-sm">Nenhuma notificação.</p>
                                    ) : (
                                        <ul className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                                            {notifications.map((n) => (
                                                <li key={n.id} className="flex items-center gap-2 py-2 transition-all duration-300 animate-fade-in">
                                                    {n.type === 'created' && <CheckCircleIcon className="w-5 h-5 text-green-500" />}
                                                    {n.type === 'updated' && <CheckCircleIcon className="w-5 h-5 text-blue-500" />}
                                                    {n.type === 'deleted' && <CheckCircleIcon className="w-5 h-5 text-red-500" />}
                                                    <span className="text-sm">{n.message}</span>
                                                    <span className="ml-auto text-xs text-gray-400">{new Date(n.timestamp).toLocaleTimeString()}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}

                        </div>

                        {userName && (
                            <div className="flex items-center gap-2">
                                <span className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-700 text-white font-bold text-lg shadow">
                                    {userName.charAt(0).toUpperCase()}
                                </span>
                                <span className="font-bold text-blue-800">{userName}</span>

                                <button
                                    className="relative focus:outline-none"
                                    onClick={() => {
                                        window.dispatchEvent(new CustomEvent('toggle-chat-panel'));
                                    }}
                                    aria-label="Mensagens"
                                >
                                    <ChatBubbleLeftRightIcon className="w-8 h-8 text-blue-700" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-0 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold animate-bounce">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>

                                <button
                                    className="relative focus:outline-none"
                                    onClick={handleToggleNotifications}
                                    aria-label="Notificações"
                                >
                                    <BellIcon className="w-8 h-8 ml-8 text-blue-700" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>
                                <button onClick={handleLogout} className="ml-8 px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded font-semibold transition">Sair</button>

                            </div>
                        )}

                    </header>
                    <FeedSidebar events={feedEvents} />
                    <div className="section-principal bg-gray-100 p-4 mr-0">
                        <div className="flex justify-end mb-4">
                            <button
                                onClick={() => setShowForm(true)}
                                className="bg-blue-600 text-white px-4 py-2 rounded font-semibold shadow hover:bg-blue-700 transition"
                            >
                                Nova Tarefa
                            </button>
                        </div>
                        {errorMsg && (
                            <div className="flex items-center gap-2 bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded mb-4 shadow-sm animate-fade-in">
                                <CheckCircleIcon className="w-6 h-6 text-red-500" />
                                <span className="font-semibold">{errorMsg}</span>
                            </div>
                        )}
                        {successMsg && (
                            <div className="sucess flex items-center gap-2 bg-green-100 border border-green-300 text-green-700 px-4 py-2 rounded mb-4 shadow-sm animate-fade-in">
                                <CheckCircleIcon className="w-6 h-6 text-green-500" />
                                <span className="font-semibold">{successMsg}</span>
                            </div>
                        )}
                        {showForm && (
                            <div className="form-Content bg-white rounded  p-4 mb-4 relative  mx-auto animate-fade-in">
                                <button
                                    onClick={() => setShowForm(false)}
                                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 font-bold text-lg"
                                    aria-label="Fechar formulário"
                                >
                                    ×
                                </button>
                                <TaskForm onSave={handleSave} editingTask={editingTask} onCancel={() => { setEditingTask(null); setShowForm(false); }} />
                            </div>
                        )}
                        <TaskFilter 
                            filter={filter} 
                            setFilter={setFilter} 
                            typeFilter={typeFilter}
                            setTypeFilter={setTypeFilter}
                        />
                        {loadingTasks ? (
                            <Spinner className="my-8" />
                        ) : (
                            <TaskList tasks={filtered} filter={filter} onEdit={(task) => { setEditingTask(task); setShowForm(true); }} onDelete={handleDelete} onComplete={handleComplete} />
                        )}
                        <DeadlineNotification tasks={tasks} />
                    </div>
                </div>
                <Footer />
            </>
        </ProtectedRoute>
    );
} 