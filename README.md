# 🚀 EV TaskFlow

Sistema de **gestão de tarefas colaborativas em tempo real**, com autenticação, notificações inteligentes, histórico de mudanças e interface moderna.  
Feito para equipes que precisam de **produtividade, clareza e colaboração** no dia a dia.

![Node.js](https://img.shields.io/badge/node-%3E%3D16-green)
![Next.js](https://img.shields.io/badge/framework-Next.js-black)
![TypeScript](https://img.shields.io/badge/language-TypeScript-blue)
![PostgreSQL](https://img.shields.io/badge/database-PostgreSQL-lightblue)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## 📂 Estrutura do Projeto

/frontend → Interface web (Next.js + Tailwind + TS)
/backend → API RESTful e Socket.io (Express + Prisma)
/prisma → Definições do schema e migrations

## 🔧 Subir os Serviços Localmente

## 🔧 Pré-requisitos
- [Node.js](https://nodejs.org/) >= 16  
- [PostgreSQL](https://www.postgresql.org/) rodando localmente ou em servidor remoto  
- NPM ou Yarn  

---
⚙️ Configuração do Ambiente
Antes de rodar o frontend, configure as variáveis de ambiente

1- Copie o arquivo de exemplo:

frontend/.env.example
# URL interna usada pelo servidor Next.js
BACKEND_URL=http://localhost:3001

# URL pública exposta no browser (precisa começar com NEXT_PUBLIC_)
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001

ou 
# Conexão por variáveis separadas (forma 2)
DB_HOST=db
DB_PORT=5432
DB_NAME=TaskFlow
DB_USER=TaskFlow_user
DB_PASS=TaskFlow_pass

JWT_SECRET=sua_chave_secreta_super_segura

e roda: docker-compose up --build


## ▶️ Frontend

```bash
cd frontend
npm install
npm run dev

Stack:
Framework: Next.js + TypeScript
Estilização: Tailwind CSS
Funcionalidades: UI responsiva, autenticação, formulários, listas, detalhes e componentes reutilizáveis.

⚙️ Configuração do Ambiente
Antes de rodar o backend, configure as variáveis de ambiente.

1- Copie o arquivo de exemplo:
cp backend/.env.example backend/.env

2- Edite backend/.env com suas credenciais:
PORT=3001
DATABASE_URL="postgresql://user:password@localhost:5432/evtaskflow"
JWT_SECRET="uma_chave_secreta_segura"

### ▶️ Backend
cd backend
npm install
npm run dev

Stack:
Framework: Node.js + Express
API RESTful com rotas organizadas
Middleware de autenticação
Integração em tempo real com Socket.io

#🗄️Banco de Dados
Banco: PostgreSQL
ORM: Prisma

Rodar migrations:
cd backend
npx prisma migrate dev

Esquema já configurado:
    👥 Usuários e autenticação
    📋 Tarefas e relacionamentos
    ✅ Subtarefas e microetapas
    📌 Checkpoints e aprovações
    💬 Comentários e menções
    📚 Histórico de mudanças
    🎓 Lições aprendidas

###⚡ Funcionalidades Principais
✅ Tarefas compartilhadas com múltiplos destinatários
✅ Microetapas organizadas com drag & drop
✅ Checkpoints automáticos com aprovação colaborativa
✅ Sistema de comentários com menções @nome
✅ Notificações de prazo para tarefas urgentes
✅ Histórico completo de mudanças
✅ Lições aprendidas categorizadas
✅ Interface moderna e responsiva
✅ Backend robusto com validação completa
✅ Tempo real via Socket.io

📌 Status
O EV TaskFlow está 85% funcional e pronto para uso, com todas as funcionalidades implementadas com qualidade profissional.

🤝 Contribuição
Pull requests são bem-vindos. Para mudanças maiores, abra primeiro uma issue para discutir o que você gostaria de alterar.
