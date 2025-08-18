import { useEffect, useState } from 'react';

interface Comment {
  id: number;
  user_name: string;
  content: string;
  created_at: string;
}

interface TaskCommentsProps {
  taskId: number;
  assignees?: Array<{ user: { id: number; nome: string } }>;
}

export default function TaskComments({ taskId, assignees }: TaskCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchComments = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/comments/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        setComments(Array.isArray(data) ? data : []);
      } else {
        console.error('Erro ao buscar comentários:', res.status);
      }
    } catch (error) {
      console.error('Erro ao conectar ao backend:', error);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [taskId]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ task_id: taskId, content: newComment }),
      });

      if (res.ok) {
        setNewComment('');
        fetchComments();
      } else {
        console.error('Erro ao adicionar comentário');
      }
    } catch (error) {
      console.error('Erro ao conectar ao backend:', error);
    } finally {
      setLoading(false);
    }
  };

  const processMentions = (text: string) => {
    if (!assignees) return text;
    
    return text.replace(/@(\w+)/g, (match, username) => {
      const assignee = assignees.find(a => 
        a.user.nome.toLowerCase().includes(username.toLowerCase())
      );
      if (assignee) {
        return `<span class="text-blue-600 font-medium">@${assignee.user.nome}</span>`;
      }
      return match;
    });
  };

  return (
    <div className="bg-gray-50 rounded p-4 mt-4">
      <h3 className="font-bold mb-2 text-gray-700">Comentários</h3>
      
      {/* Dica sobre menções */}
      {assignees && assignees.length > 0 && (
        <div className="text-xs text-gray-500 mb-3">
          💡 Use @nome para mencionar: {assignees.map(a => a.user.nome).join(', ')}
        </div>
      )}
      
      <form onSubmit={handleAddComment} className="flex gap-2 mb-4">
        <input
          type="text"
          className="flex-1 border rounded p-2"
          placeholder="Adicionar comentário... Use @nome para mencionar"
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          disabled={loading}
        />
        <button 
          type="submit" 
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50" 
          disabled={loading || !newComment.trim()}
        >
          {loading ? 'Enviando...' : 'Enviar'}
        </button>
      </form>
      
      <ul className="space-y-2">
        {comments.map(c => (
          <li key={c.id} className="bg-white rounded p-2 shadow flex flex-col">
            <span className="font-semibold text-blue-700 text-sm">{c.user_name}</span>
            <div 
              className="text-gray-700 text-sm"
              dangerouslySetInnerHTML={{ 
                __html: processMentions(c.content) 
              }}
            />
            <span className="text-xs text-gray-400">{new Date(c.created_at).toLocaleString()}</span>
          </li>
        ))}
        {comments.length === 0 && <li className="text-gray-400 text-sm">Nenhum comentário ainda.</li>}
      </ul>
    </div>
  );
} 