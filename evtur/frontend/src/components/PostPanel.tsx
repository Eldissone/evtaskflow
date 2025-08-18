"use client";
import React, { useEffect, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

export type Post = { id: number; title: string; content: string; imageUrl?: string; reactions?: Record<string, string[]>; user?: { id: number; nome: string }; comments?: any[] };

const reactionTypes = [
  { key: 'like', emoji: '👍' },
  { key: 'love', emoji: '❤️' },
  { key: 'funny', emoji: '😂' },
];

function getUserId() {
  if (typeof window === 'undefined') return '';
  let userId = localStorage.getItem('post_user_id');
  if (!userId) {
    userId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('post_user_id', userId);
  }
  return userId;
}

export default function PostPanel() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState('');
  const [commentsVisible, setCommentsVisible] = useState<{ [postId: number]: boolean }>({});
  const [commentInputs, setCommentInputs] = useState<{ [postId: number]: string }>({});
  const [showForm, setShowForm] = useState(false);
  const [showPanel, setShowPanel] = useState(true);

  useEffect(() => {
    setUserId(getUserId());
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;
    fetch('http://localhost:3001/api/posts', {
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPosts(data);
        } else {
          setPosts([]);
          console.error('Resposta inesperada da API:', data);
        }
      });
  }, []);

  useEffect(() => {
    if (!image) {
      setImagePreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = e => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(image);
  }, [image]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    let imageUrl = '';
    try {
      if (image) {
        const formData = new FormData();
        formData.append('file', image);
        // Enviar upload para o backend Express
        const res = await fetch('http://localhost:3001/api/upload', {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) throw new Error('Erro ao fazer upload da imagem');
        const data = await res.json();
        imageUrl = data.url;
      }
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) throw new Error('Usuário não autenticado');
      const res = await fetch('http://localhost:3001/api/posts', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, content, imageUrl })
      });
      if (!res.ok) {
        console.log('Status:', res.status);
        const data = await res.json();
        console.log('Resposta:', data);
        throw new Error(data.error || 'Erro ao criar post');
      }
      const newPost = await res.json();
      setPosts([newPost, ...posts]);
      setTitle('');
      setContent('');
      setImage(null);
      setImagePreview(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleReact(postId: number, type: string) {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`http://localhost:3001/api/posts/${postId}/react`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ type, userId })
      });
      if (!res.ok) return;
      const updated = await res.json();
      setPosts(posts => posts.map(post => post.id === postId ? { ...post, reactions: updated.reactions } : post));
    } catch {
      // erro silencioso
    }
  }

  async function handleAddComment(postId: number) {
    const content = commentInputs[postId]?.trim();
    if (!content) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) throw new Error('Usuário não autenticado');
      const res = await fetch(`http://localhost:3001/api/comments/${postId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ content })
      });
      if (!res.ok) throw new Error('Erro ao comentar');
      const newComment = await res.json();
      setPosts(posts => posts.map(post => post.id === postId ? { ...post, comments: [newComment, ...(post.comments || [])] } : post));
      setCommentInputs(inputs => ({ ...inputs, [postId]: '' }));
    } catch (err) {
      // erro silencioso ou exibir mensagem
    }
  }

  if (!showPanel) {
    return (
      <button
        className="fixed left-0 top-1/2 z-50 bg-blue-600 text-white p-2 rounded-r shadow-md transition-transform duration-300"
        style={{ transform: 'translateY(-50%)' }}
        onClick={() => setShowPanel(true)}
        aria-label="Mostrar painel de posts"
      >
        <ChevronRightIcon className="w-6 h-6" />
      </button>
    );
  }
  return (
    <aside className="fixed left-0 top-20 h-full w-80 bg-white border-l border-gray-200 shadow-lg p-4 overflow-y-auto z-40 transition-transform duration-300">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-lg">Posts Recentes</h2>
        <button
          className="text-gray-400 hover:text-blue-600 transition text-2xl font-bold ml-2"
          onClick={() => setShowPanel(false)}
          aria-label="Ocultar painel de posts"
        >
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
      </div>
      <button
        className="bg-blue-600 text-white px-4 py-1 rounded mb-4"
        onClick={() => setShowForm(f => !f)}
      >
        {showForm ? 'Ocultar formulário' : 'Novo Post'}
      </button>
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 space-y-2">
          <input
            className="w-full border rounded px-2 py-1"
            placeholder="Título"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
          <textarea
            className="w-full border rounded px-2 py-1"
            placeholder="Conteúdo"
            value={content}
            onChange={e => setContent(e.target.value)}
            required
          />
          <input
            type="file"
            accept="image/*"
            onChange={e => setImage(e.target.files?.[0] || null)}
            className="w-full"
          />
          {imagePreview && (
            <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover rounded mb-2" />
          )}
          <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded" disabled={loading}>
            {loading ? 'Enviando...' : 'Criar Post'}
          </button>
          {error && <div className="text-red-500 text-sm">{error}</div>}
        </form>
      )}
      <ul className="space-y-4">
        {(Array.isArray(posts) ? posts : []).map(post => (
          <li key={post.id} className="border-b pb-2">
            <div className="font-semibold text-blue-700">{post.title}</div>
            {post.user?.nome && (
              <div className="text-xs text-gray-500 mb-1">por {post.user.nome}</div>
            )}
            <div className="text-sm text-gray-600 mb-1">{post.content}</div>
            {post.imageUrl && (
              <img src={`http://localhost:3001${post.imageUrl}`} alt="Imagem do post" className="w-full h-32 object-cover rounded mb-2" />
            )}
            <div className="flex gap-2 mt-1">
              {reactionTypes.map(r => {
                const reacted = false;
                return (
                  <button
                    key={r.key}
                    className="text-xl hover:scale-125 transition-transform"
                    type="button"
                    onClick={() => handleReact(post.id, r.key)}
                    aria-label={`Reagir com ${r.emoji}`}
                  >
                    {r.emoji} <span className="text-xs">{post.reactions?.[r.key] || 0}</span>
                  </button>
                );
              })}
            </div>
            {/* Botão de comentários */}
            <button
              className="text-blue-600 text-xs mt-2 underline"
              type="button"
              onClick={() => setCommentsVisible(v => ({ ...v, [post.id]: !v[post.id] }))}
            >
              {commentsVisible[post.id] ? 'Ocultar comentários' : `Ver comentários (${post.comments?.length || 0})`}
            </button>
            {/* Lista de comentários */}
            {commentsVisible[post.id] && (
              <>
                {/* Formulário de novo comentário */}
                <form
                  className="flex gap-2 mt-2"
                  onSubmit={e => { e.preventDefault(); handleAddComment(post.id); }}
                >
                  <input
                    type="text"
                    className="flex-1 border rounded px-2 py-1 text-xs"
                    placeholder="Adicionar comentário..."
                    value={commentInputs[post.id] || ''}
                    onChange={e => setCommentInputs(inputs => ({ ...inputs, [post.id]: e.target.value }))}
                  />
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
                  >Comentar</button>
                </form>
                {/* Lista de comentários */}
                <ul className="mt-2 space-y-1 text-xs text-gray-700">
                  {post.comments && post.comments.length > 0 ? (
                    post.comments.map((c: any) => (
                      <li key={c.id} className="border-l-2 border-blue-200 pl-2">
                        <span className="font-semibold">{c.user_name || 'Usuário'}:</span> {c.content}
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-400">Nenhum comentário ainda.</li>
                  )}
                </ul>
              </>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
} 