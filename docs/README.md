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
5.  **rock-cancel-v1** (`cancel_`): Solicitações de cancelamento. [[Guia de Migração](MIGRATION_GUIDE_ROCK_CANCEL_V1.md)]
6.  **rock-reposicoes-v1** (`repo_`): Controle de reposições.
7.  **regua-comunicacao-v2** (`rg_`): Comunicação e templates. [[Guia de Migração](MIGRATION_GUIDE_REGUA_COMUNICACAO_V2.md)]
8.  **compras-manutencao-v1** (`buy_`): Gestão de compras.
9.  **teachers-room-v1** (`tr_`): Portal dos professores. [[Guia de Migração](MIGRATION_GUIDE_TEACHERS_ROOM_V1.md)]
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

> [!IMPORTANT]
> **Sessões entre Domínios (Cross-Domain):** O Portal de Login passa o token via URL fragment (hash). O App destino deve ler esse hash e aplicar manualmente usando chaves customizadas (`sso_access` e `sso_refresh`) para evitar que o cliente Supabase as limpe antes do processamento.

```javascript
// Exemplo de integração robusta
async function verifyAccess(userId) {
  // Chamada RPC para verificar se o usuário tem permissão para ESTE app
  const { data: hasAccess, error } = await supabase.rpc('check_app_access', {
    p_user_id: userId,
    p_app_id: 'ID_DO_APP' // ex: 'rockrema-v2'
  });

  if (error || !hasAccess) {
    await supabase.auth.signOut();
    window.location.href = 'https://rock-portal-v1.netlify.app/?error=unauthorized';
    return false;
  }
  return true;
}
```

### 3. Gestão de Perfis (Roles)
Para obter o papel do usuário dentro de um contexto específico:
```javascript
const { data: userRole } = await supabase.rpc('get_user_app_role', {
    p_user_id: user.id,
    p_app_id: 'ID_DO_APP'
});
// Retorna: 'Admin', 'Teacher', 'Pedagógico', etc.
```

### 4. Padrão para Novos Guias de Migração
Todo novo guia de migração gerado deve prever e registrar explicitamente:
1. **Quais emails, grupos ou perfis de usuário terão acesso inicial ao aplicativo.** O(s) responsável(is) pela criação do guia devem **sempre perguntar** ao requisitante essa informação antes de finalizar a documentação e já formatar os emails/perfis pré-aprovados na carga do guia.
2. **Revisão das Lições Aprendidas:** Consultar ativamente a seção de Resolução de Problemas e Armadilhas abaixo (especialmente sobre *Race Conditions*, *Deadlocks* e *Vazamento de Tokens*) para atestar que o app alvo está aderente aos novos padrões de estabilidade baseados em casos reais do piloto.

---

## ⚠️ Resolução de Problemas, Armadilhas e Lições Aprendidas

### 1. O Perigo do `await` no `onAuthStateChange` e Race Conditions (Loops)
**NUNCA** use `async/await` diretamente dentro do callback do `supabase.auth.onAuthStateChange`. Isso pode travar o motor de autenticação. Ao disparar callbacks enquanto useEffects tentam fazer redirecionamentos em paralelo (como em casos de SSO), podem ocorrer **Race Conditions**, criando um *Loop Infinito* de redirecionamentos cruzados.
*   **Solução:** Centralize a ordem no roteador/páginas com travas. Use o callback apenas para atualizar um estado local e utilize um `useEffect` com bloqueios (como um `useRef` ativando flag = true) impedindo que comandos idênticos engulam o outro.

### 2. O Congelamento (Deadlock) de "Timeouts" no `signOut`
Quando um usuário for expulso do sistema por não ter permissão, tentar rodar `await supabase.auth.signOut()` pode causar congelamento de tela para sempre (deadlock) caso a intermitência de rede falhe a promessa. A linha que muda o link de redirect nunca seria alcançada.
*   **Solução:** Trate o log-off forçado como *Fire and Forget* anestesiado por um `.catch()`. Ele avisa o servidor em *background* para deslogar da chave e não perde tempo rodando `await`, procedendo imediatamente para o redirecionamento ao Portal principal.

### 3. Vazamento de Tokens e Quebra de History na URL ("Access Token Devoured")
Ao usar parâmetros de hash customizados (como `sso_access`) que evitam que a biblioteca cliente do Supabase os consuma precocemente, você herda o problema do rastro. É mandatório apagar esse Hash da aba quando processado. Se ele ficar visível, o primeiro botão F5 do usuário acionará duplo processamento.
*   **Solução:** Use regras nativas como `window.history.replaceState` para limpar a URL do navegador ativamente assim que a checagem de SSO for validada localmente.


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
