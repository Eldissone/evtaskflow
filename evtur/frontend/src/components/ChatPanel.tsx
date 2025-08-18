'use client';
import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUser } from '../context/UserContext';

interface ChatPanelProps {
  userName?: string;
}

interface Message {
  user: string;
  text: string;
  timestamp: number;
}

interface User {
  id: string;
  name: string;
}

const ChatPanel: React.FC = () => {
  const { userName } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [animating, setAnimating] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userName) return;
    const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001');
    socketRef.current = socket;
    socket.emit('join-chat', { name: userName });
    socket.on('chat-message', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      if (!isOpen) {
        setUnreadCount((c) => {
          const next = c + 1;
          window.dispatchEvent(new CustomEvent('chat-unread', { detail: next }));
          return next;
        });
      }
    });
    socket.on('chat-history', (msgs: Message[]) => {
      setMessages(msgs);
    });
    socket.on('online-users', (users: User[]) => {
      setOnlineUsers(users);
    });
    return () => {
      socket.disconnect();
    };
  }, [userName, isOpen]);

  // Escuta evento global para abrir/fechar o chat
  useEffect(() => {
    const handler = () => setIsOpen((v) => !v);
    window.addEventListener('toggle-chat-panel', handler);
    return () => window.removeEventListener('toggle-chat-panel', handler);
  }, []);

  // Zera contador ao abrir
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      window.dispatchEvent(new CustomEvent('chat-unread', { detail: 0 }));
    }
  }, [isOpen]);

  // Animação de abertura/fechamento
  useEffect(() => {
    if (isOpen) setAnimating(true);
    else if (animating) {
      const timeout = setTimeout(() => setAnimating(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socketRef.current) return;
    socketRef.current.emit('chat-message', { user: userName, text: input });
    setInput('');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 max-w-full">
      <div className="bg-white rounded-t-lg shadow-lg border border-gray-300">
        <button
          className="w-full flex justify-between items-center px-4 py-2 bg-blue-600 text-white rounded-t-lg focus:outline-none"
          onClick={() => setIsOpen((v) => !v)}
        >
          <span>Chat em tempo real</span>
          <span className="text-xs">{isOpen ? '▼' : '▲'}</span>
        </button>
        {(isOpen || animating) && (
          <div
            className={`flex flex-col h-96 transition-all duration-300 ease-in-out
              ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}
          >
            <div className="flex-1 overflow-y-auto p-2 bg-gray-50">
              <div className="mb-2 text-xs text-gray-500">Usuários online: {onlineUsers.length}</div>
              <div className="flex flex-wrap gap-1 mb-2">
                {onlineUsers.map((u) => (
                  <span key={u.id} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">{u.name}</span>
                ))}
              </div>
              <div>
                {messages.map((msg, i) => (
                  <div key={i} className={`mb-1 text-sm ${msg.user === userName ? 'text-blue-700 font-semibold' : 'text-gray-700'}`}>
                    <span className="mr-2">{msg.user}:</span>
                    <span>{msg.text}</span>
                    <span className="ml-2 text-xs text-gray-400">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>
            <form onSubmit={sendMessage} className="flex border-t border-gray-200">
              <input
                type="text"
                className="flex-1 px-2 py-1 rounded-bl-lg focus:outline-none"
                placeholder="Digite sua mensagem..."
                value={input}
                onChange={e => setInput(e.target.value)}
                maxLength={200}
              />
              <button type="submit" className="px-4 py-1 bg-blue-600 text-white rounded-br-lg hover:bg-blue-700">Enviar</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPanel; 