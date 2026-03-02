# Guia de Migração: Régua de Comunicação V2 📱

Este documento detalha os passos para integrar a **Régua de Comunicação V2** ao sistema de autenticação e autorização centralizado do ecossistema Rock Team.

## 1. O Conceito
A Régua de Comunicação deixará de utilizar sua própria tela local de login (`/login`). Em vez disso, o acesso será feito através do **Portal de Login Central**, que autenticará o usuário e checará se ele tem permissão ativa para acessar este aplicativo.

## 2. Identificação do App
Para este aplicativo, utilize o seguinte identificador oficial no banco de dados e nos redirecionamentos:
**ID do App:** `regua-comunicacao-v2`

## 3. Regras de Autorização
A autorização validará os seguintes pontos:
1. Se o usuário está devidamente autenticado no Supabase.
2. Se o usuário possui um vínculo ativo na tabela `public.central_permissions` com o `app_id: 'regua-comunicacao-v2'`.

---

## 4. Passo a Passo Técnico

### Passo A: Redirecionamento Inicial
Caso o usuário tente acessar a aplicação (inclusive a rota `https://regua-comunicacao-v2.netlify.app/login`) sem uma sessão ativa, ele deve ser remetido ao portal central:

**URL do Portal:** `https://rock-login-v1.netlify.app/`

```javascript
// Exemplo de lógica no roteador ou na raiz do projeto, substituindo a tela de login
if (!userIsAuthenticated) {
    window.location.href = `https://rock-login-v1.netlify.app/?app=regua-comunicacao-v2`;
}
```

### Passo B: Recepção do Token (SSO) e Validação de Acesso
A Régua de Comunicação deve estar preparada para capturar os tokens vindos na URL (sob o hash `#sso_access=...`) e aplicar na sessão local do Supabase. Após inicializar o usuário, a permissão **deve** ser checada centralmente:

```javascript
async function verifyReguaAccess(userId) {
    // Valida permissão centralizada no banco (BD_Geral)
    const { data: hasAccess, error } = await supabase.rpc('check_app_access', {
        p_user_id: userId,
        p_app_id: 'regua-comunicacao-v2'
    });

    if (error || !hasAccess) {
        // Usuário não tem permissão p/ usar a Régua - deslogar e mandar de volta
        await supabase.auth.signOut();
        window.location.href = 'https://rock-login-v1.netlify.app/?error=unauthorized';
        return false;
    }
    
    return true; // Acesso liberado!
}
```

### Passo C: Configuração de Banco/Supabase
Certifique-se de que a aplicação esteja utilizando as chaves (URL e Anon Key) do projeto Supabase principal (`BD_Geral`), o mesmo utilizado no Portal de Login, para que o compartilhamento de sessão e chamadas RPCs funcionem corretamente.

---

## 5. Checklist de Implementação
Se você (desenvolvedor ou IA) estiver aplicando essa migração na base de código da Régua de Comunicação V2, atente-se a:

1. [ ] Remover a UI atual da tela de login local e alterar a sua rota para atuar apenas como um middleware de redirecionamento.
2. [ ] Configurar a captura e *parsing* da sessão oriunda do portal no formato `#sso_access=...`.
3. [ ] Implementar a trava de acesso utilizando a RPC `check_app_access`, barrando renderizações até obter a confirmação.
4. [ ] Confirmar que eventos de `onAuthStateChange` na aplicação não travem o frontend (ex: evitando calls bloqueantes na thread principal sem gerenciar o estado (`loading`)).
5. [ ] **Gitignore:** Garantir que credenciais e variáveis sensíveis seguem seguras no `.env` e não foram expostas após as mudanças.

---
© 2026 Rock Education System - Engenharia de Dados
