import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const router = useRouter();

  // Proteção: se já estiver logado, redireciona para a página principal
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.replace('/');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('token', data.token);
        setSucesso('Login bem-sucedido! Redirecionando...');
        setTimeout(() => router.push('/'), 1200);
      } else {
        setErro(data.error || 'Erro ao fazer login');
      }
    } catch (err) {
      setErro('Erro de conexão');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow max-w-sm w-full flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-center">Login</h1>
        <input
          type="email"
          placeholder="E-mail"
          className="border p-2 rounded"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Senha"
          className="border p-2 rounded"
          value={senha}
          onChange={e => setSenha(e.target.value)}
          required
        />
        {erro && <p className="text-red-500 text-sm text-center">{erro}</p>}
        {sucesso && <p className="text-green-600 text-sm text-center">{sucesso}</p>}
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Entrar</button>
        <p className="text-center text-sm">Não tem conta? <a href="/register" className="text-blue-600 underline">Cadastre-se</a></p>
      </form>
    </div>
  );
} 