import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-white border-t border-gray-200 py-4 mt-8 text-start p-8 text-sm text-gray-500">
      <span>TaskFlow &copy; {new Date().getFullYear()} &middot; Desenvolvido por Eldissone Vilonga</span>
      <span className="mx-2">|</span>
      <a
        href="https://github.com/seuusuario/taskflow"
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 hover:underline"
      >
        GitHub
      </a>
    </footer>
  );
};

export default Footer; 