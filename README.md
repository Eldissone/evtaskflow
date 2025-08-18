# 🚀 EV TaskFlow - Instruções de Deploy

Sistema completo de **gerenciamento de tarefas colaborativas em tempo real**.  
Inclui frontend moderno, backend robusto e banco de dados relacional seguro.

---

## 📂 Estrutura do Projeto
frontend/ → Aplicação Next.js (UI + UX); 
backend/ → API Node.js com Express;
infra/ → Configurações de deploy e documentação;

## 🔧 Subir os Serviços Localmente

### ▶️ Frontend
```bash
cd frontend
npm install
npm run dev

Framework: Next.js + TypeScript
Estilização: Tailwind CSS
Funcionalidades: UI responsiva, autenticação, formulários, listas, detalhes e componentes reutilizáveis.

### ▶️ Backend
cd backend
npm install
npm run dev

Framework: Node.js + Express
API RESTful com rotas organizadas
Middleware de autenticação
Integração em tempo real com Socket.io

#🗄️Banco de Dados
Banco: PostgreSQL
ORM: Prisma

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
