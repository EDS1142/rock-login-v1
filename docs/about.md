# Projeto Rock Login V1

## 🎯 Objetivo
O **Rock Login V1** é uma solução de interface de autenticação padronizada, desenvolvida para unificar a experiência de acesso em todas as aplicações do ecossistema **Rock Team**. O projeto foca em oferecer uma interface premium, altamente responsiva e de fácil integração para novos módulos e sistemas da Rock Education System.

---

## ✨ Características Principais

### 🎨 Design Premium & UX
- **Layout Split Screen**: Painel dividido entre Branding (esquerda) e Formulário (direita), seguindo tendências modernas de design SaaS.
- **Micro-interações**: Feedback visual em todos os estados de interação (hover, foco, carregamento).
- **Animações Fluidas**: Efeitos de entrada de card (`cardEnter`) e flutuação de logo (`float`).
- **Tipografia**: Utilização da fonte 'Inter' via Google Fonts para máxima legibilidade.
- **Responsividade Total**: Adaptação automática para tablets e smartphones, reorganizando o layout verticalmente.

### ⚙️ Arquitetura Técnica
- **Core**: HTML5 semântico e CSS3 Vanilla.
- **Ambiente de Desenvolvimento**: 
  - **NPM**: Gestão de dependências e scripts.
  - **Vite**: Servidor de desenvolvimento rápido com Hot Module Replacement (HMR).
- **Configuração Centralizada**: Objeto `CONFIG` no `script.js` que permite personalizar:
  - Nome da Aplicação.
  - Descrição do Sistema.
  - Cores Primárias e Secundárias.
  - Copyright dinâmico.
- **Dependências Externas**:
  - `@supabase/supabase-js`: Preparado para integração com o banco de dados.
- **Manipulação de DOM**: Lógica pura para alternar visibilidade de senha e estados de botão.

### 🛡️ Funcionalidades de Interface
- **E-mail/Senha**: Campos de entrada com ícones contextuais.
- **Toggle Password**: Botão interativo para exibir/ocultar a senha.
- **Loading State**: Simulação de requisição com spinner e desativação de botão para prevenir múltiplos envios.
---

## 🗄️ Estrutura do Banco de Dados (Supabase)

O Rock Login V1 centraliza o acesso ao ecossistema **Rock Team**, utilizando um banco de dados Supabase compartilhado (`BD_Geral`). A arquitetura do banco é projetada para ser multi-aplicativo, permitindo que diferentes sistemas operem de forma independente em um único esquema.

### **Arquitetura Baseada em Prefixos**
As tabelas do banco de dados são identificadas por prefixos técnicos que segmentam os dados por aplicação:

- **`app_`**: Sistema Acadêmico Central (Gestão de Aulas, Matrículas, Presença e Avaliação).
- **`rock_`**: Estrutura de Infraestrutura (Salas, Livros, Horários e Turmas Base).
- **`turmas_`**: Organização secundária de alocação de classes e alunos.
- **`okrs_`**: Módulo de acompanhamento de metas institucionais.
- **`estoque_`**: Gestão de materiais e logística escolar.
- **`pesquisas_`**: Sistema de coleta de feedbacks e NPS.

### **Identidade e Mapeamento de Usuários**
O sistema de autenticação é projetado para operar exclusivamente com usuários previamente cadastrados no Supabase. O login valida as credenciais contra a tabela base de autenticação e cruza os dados com as tabelas de perfil do ecossistema:

1. **`auth.users` (Supabase Internal)**: Tabela mestre que gerencia e-mail, senhas criptografadas e tokens de sessão.
2. **`public.profiles`**: Tabela de extensão principal. Vincula o UUID do usuário a papéis de negócio (`role`) e ao identificador de professor (`teacher_id`).
3. **`public.app_users`**: Tabela de controle de acesso específica para os módulos do sistema acadêmico (`app_`).
4. **`public.users`**: Tabela de usuários para o módulo de gestão de documentos e assinaturas digitais.
5. **`public.app_teachers` / `public.rock_professores`**: Tabelas que armazenam os dados profissionais dos docentes, vinculados ao login para controle de turmas e relatórios.

---

## 📁 Estrutura do Projeto

```text
/
├── docs/
│   └── about.md          # Este documento de documentação
├── index.html            # Estrutura principal da página
├── style.css             # Design System e estilização
├── script.js             # Configurações e comportamentos JS
├── logo.png              # Logotipo da Rock Team
├── AvatarRock.png        # Asset visual para identificação
└── .git/                 # Controle de versão (se aplicável)
```

---

---

## 🔐 Segurança e Isolamento de Aplicações

Devido à natureza compartilhada do banco de dados (`BD_Geral`), as seguintes diretrizes são **mandatórias**:

### **1. Fluxo de Autenticação Obrigatório**
- **Sempre a Primeira Tela**: Por questão de segurança, a tela de login deve ser, obrigatoriamente, a porta de entrada de qualquer aplicação. Nenhum recurso ou dado interno deve ser acessível sem que o usuário tenha passado pelo processo de autenticação.
- **Acesso Restrito**: O acesso a qualquer app dentro do ecossistema Rock Team deve ser realizado estritamente via portal de login.

### **2. Integridade do Ecossistema**
- **Isolamento de Lógica**: Ao desenvolver ou customizar o login para um novo app, é vital garantir que as alterações não quebrem a autenticação ou o fluxo de outros apps que compartilham o mesmo banco de dados.
- **Cuidado com Mudanças Globais**: Alterações em tabelas centrais (`public.profiles`, `auth.users`, `public.app_users`) devem ser testadas em todo o ecossistema para evitar efeitos colaterais em cascata.

---

## 🚀 Como Customizar
Para adaptar este login para um novo sistema (ex: Rock Compras), basta editar o `script.js`:

```javascript
const CONFIG = {
    appName: "Novo Nome do App",
    appDescription: "Breve descrição do módulo",
    // ... cores e outros detalhes
};
```

---

## 🛠️ Notas de Implementação (Timeline)
O projeto foi concebido para ser agnóstico de backend. Atualmente, a submissão do formulário (`submit-btn`) realiza uma simulação de 1.5s antes de liberar o botão, pronta para receber chamadas de API (fetch) ou integração com Supabase.

© 2025 Rock Education System.
