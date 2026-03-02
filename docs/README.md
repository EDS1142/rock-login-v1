# Documentação Centralizada - Rock Login V1

## 🎯 Objetivo e Visão Geral
O **Rock Login V1** é a solução de interface de autenticação padronizada do ecossistema **Rock Team**. Ele unifica a experiência de acesso de todos os aplicativos do ecossistema, garantindo uma interface premium, responsiva e, acima de tudo, segura.

Este projeto atua como o **Portal de Entrada Único**, centralizando a autorização através de um modelo de ACL (Access Control List) no banco de dados compartilhado `BD_Geral`.

---

## ✨ Características do Sistema

### 🎨 Design Premium & UX
- **Layout Moderno**: Interface split-screen balanceada entre branding e funcionalidade.
- **Interatividade**: Micro-animações e feedbacks visuais fluidos.
- **Responsividade**: Otimizado para qualquer dispositivo (desktop, tablet, mobile).

### ⚙️ Arquitetura Técnica
- **Core**: HTML5, CSS3 Vanilla e JS puro (agnóstico de frameworks pesados).
- **Tooling**: Desenvolvido com **Vite** para performance e **Supabase** para infraestrutura de backend.
- **Configuração**: Objeto `CONFIG` centralizado para fácil customização por aplicação.

---

## 🔐 Controle de Acesso Centralizado (ACL)

### 1. Contexto e Problema
Com múltiplos apps compartilhando o mesmo banco, o risco de acesso cruzado indevido é alto. O objetivo deste sistema é garantir que:
- **Default Deny**: Ninguém acessa nada sem permissão explícita.
- **Foco por Perfil**: Professores veem apenas ferramentas pedagógicas; Administrativo vê apenas gestão, etc.
- **Gestão de Ativos**: Bloqueio instantâneo de contas em caso de desligamentos.

### 2. Matriz de Permissões (Tabelas `central_`)
Utilizamos uma estrutura flexível na qual um usuário pode ter diferentes papéis em diferentes aplicativos:

- **`public.central_apps`**: Registro oficial de todos os Web Apps do ecossistema.
- **`public.central_permissions`**: Vincula `user_id` + `app_id` + `role` + `active` (boolean).

### 3. Perfis Padronizados (Roles)
- **Pedagógico** (Antigo "Acadêmico")
- **Administrativo**
- **Comercial**
- **Direção**
- **Teacher**

---

## 🗃️ Ecossistema de Aplicações e Dados

### Mapeamento de Apps (Prefixos de Tabelas)
Identificamos os seguintes aplicativos ativos que utilizam o banco compartilhado:

1.  **rock-todo-list-v2** (`todo_`): Gerenciador de tarefas.
2.  **student-abcd** (`alunos`, `turmas_`): Portal do acadêmico.
3.  **rock-recibo-v4** (`rc_`, `rec_`): Emissão de recibos.
4.  **rockrema-v2** (`rema_`): Gestão de rematrículas.
5.  **rock-cancel-v1** (`cancel_`): Solicitações de cancelamento.
6.  **rock-reposicoes-v1** (`repo_`): Controle de reposições.
7.  **regua-comunicacao-v2** (`rg_`): Comunicação e templates.
8.  **compras-manutencao-v1** (`buy_`): Gestão de compras.
9.  **teachers-room-v1** (`tr_`): Portal dos professores.
10. **rockpg-turmas-v3** (`app_`): Gestão administrativa central.
11. **pdi-v1** (`pdi_`): Plano de Desenvolvimento Individual.

---

## 🚀 Implementação e Segurança

### Fluxo de Segurança
1. **Login Mandatário**: Nenhuma página interna funciona sem autenticação.
2. **Dual Check**: Durante a transição, validamos o acesso pelo modelo legado e pelo novo modelo centralizado.
3. **Audit Log**: Mismatches de permissão são registrados na tabela `app_security_audit`.

### Estratégia de Migração (Fases)
- [x] Fase 1: Infraestrutura de tabelas `central_`.
- [x] Fase 2: Sincronização inicial de dados de usuários.
- [x] Fase 3: Integração do Frontend com Dual-Check e Log de Auditoria.
- [/] Fase 4: Validação em produção e monitoramento.
- [ ] Fase 5: Cutover final (Desativação total das permissões legadas).

---

---

## 🛠️ Guia de Integração para desenvolvedores

Para integrar qualquer Web App ao sistema de controle de acesso centralizado, siga estes passos:

### 1. Requisito
O app deve utilizar o **Supabase Auth** para autenticação básica.

### 2. Implementação da Autorização
Logo após a chamada de `signInWithPassword` (ou qualquer método de login), adicione a verificação da RPC `check_app_access`.

```javascript
// Exemplo de integração genérica
const { data, error } = await supabase.auth.signInWithPassword({ email, password });

if (data?.user) {
  // Verifica se o usuário tem permissão para ESTE app específico
  const { data: hasAccess, error: accessError } = await supabase.rpc('check_app_access', {
    user_id: data.user.id,
    app_id: 'ID_DO_SEU_APP' // ex: 'rockrema-v2'
  });

  if (accessError || !hasAccess) {
    // Se não tiver acesso, desloga e impede a entrada
    await supabase.auth.signOut();
    alert("Dê um tchauzinho! Você não tem permissão para este sistema.");
    return;
  }
  
  // Sucesso: Redirecionar para a área interna
  window.location.href = '/dashboard';
}
```

### 3. IDs de Aplicativos Registrados
Use os IDs exatos listados na seção **"Ecossistema de Aplicações"** acima para garantir que o vínculo funcione corretamente.

---

## ⚙️ Como Customizar o Portal de Login
```javascript
const CONFIG = {
    appName: "Nome do App",
    appDescription: "Descrição unificada ou específica",
    currentAppId: "id-do-app-cadastrado-no-central_apps"
};
```

© 2026 Rock Education System.
