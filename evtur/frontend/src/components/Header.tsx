'use client';
import { useUser } from "../context/UserContext";
import { BellIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';
import { useEffect, useState } from 'react';

const Header = () => {
  const { userName } = useUser();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handler = (e: any) => setUnreadCount(e.detail);
    window.addEventListener('chat-unread', handler);
    return () => window.removeEventListener('chat-unread', handler);
  }, []);

  return (
    <header className="flex justify-between items-center mb-4 px-6 pt-4">
      <h1 className="text-2xl font-bold text-center">EV TaskFlow</h1>
      <div className="flex items-center gap-4">
        <button
          className="relative focus:outline-none"
          onClick={() => {
            window.dispatchEvent(new CustomEvent('toggle-chat-panel'));
          }}
          aria-label="Mensagens"
        >
          <ChatBubbleLeftRightIcon className="w-8 h-8 text-blue-700" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          className="relative focus:outline-none"
          aria-label="Notificações"
        >
          <BellIcon className="w-8 h-8 text-blue-700" />
        </button>
        {userName && (
          <span className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-700 text-white font-bold text-lg shadow">
            {userName.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
    </header>
  );
};

export default Header; 