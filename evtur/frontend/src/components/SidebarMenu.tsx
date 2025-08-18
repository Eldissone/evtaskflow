import React from 'react';
import Link from 'next/link';
import { HomeIcon, ClipboardDocumentListIcon, FolderIcon, UsersIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

const menu = [
  { label: 'Dashboard', href: '/', icon: <HomeIcon className="w-6 h-6" /> },
  { label: 'Tarefas', href: '/tasks', icon: <ClipboardDocumentListIcon className="w-6 h-6" /> },
  { label: 'Projetos', href: '/projetos', icon: <FolderIcon className="w-6 h-6" /> },
  { label: 'Equipe', href: '/equipe', icon: <UsersIcon className="w-6 h-6" /> },
  { label: 'Configurações', href: '/configuracoes', icon: <Cog6ToothIcon className="w-6 h-6" /> },
];

export default function SidebarMenu() {
  return (
    <nav className="fixed left-0 top-0 h-full w-56 bg-white border-r border-gray-200 shadow-lg p-4 flex flex-col z-50">
      <div className="mb-8">
        <span className="font-bold text-xl text-blue-700">EVTUR</span>
      </div>
      <ul className="flex-1 space-y-4">
        {menu.map(item => (
          <li key={item.href}>
            <Link href={item.href} className="flex items-center gap-3 p-2 rounded hover:bg-blue-50 transition text-gray-700">
              {item.icon}
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
} 