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
- **Core**: HTML5 semântico e CSS3 Vanilla (sem frameworks pesados).
- **Configuração Centralizada**: Objeto `CONFIG` no `script.js` que permite personalizar:
  - Nome da Aplicação.
  - Descrição do Sistema.
  - Cores Primárias e Secundárias.
  - Copyright dinâmico.
- **Manipulação de DOM**: Lógica pura para alternar visibilidade de senha e estados de botão.

### 🛡️ Funcionalidades de Interface
- **E-mail/Senha**: Campos de entrada com ícones contextuais.
- **Toggle Password**: Botão interativo para exibir/ocultar a senha.
- **Loading State**: Simulação de requisição com spinner e desativação de botão para prevenir múltiplos envios.

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
