# Guia de Migração: Rock Cancel V1 📱

Este documento detalha os passos para integrar o **Rock Cancel V1** (https://rock-cancel-v1.netlify.app/) ao sistema de autenticação e autorização centralizado do ecossistema Rock Team.

## 1. O Conceito
O Rock Cancel deixará de utilizar um sistema isolado (caso exista) e passará a ter o acesso feito através do **Portal de Login Central**, que autenticará o usuário e checará se ele tem permissão ativa para acessar este aplicativo.

## 2. Identificação do App
Para este aplicativo, utilize o seguinte identificador oficial no banco de dados e nos redirecionamentos:
**ID do App:** `rock-cancel-v1`

## 3. Carga Inicial de Acessos
Conforme estabelecido pelo processo padrão, os seguintes perfis e e-mails devem ser cadastrados previamente na tabela `public.central_permissions` para liberação do uso em produção:

- **Email:** `rockpg.adm@gmail.com` | **Perfil (Role):** Administrativo
- **Email:** `rockfeller.pontagrossa@gmail.com` | **Perfil (Role):** Direção

Certifique-se de vincular a estes usuários o `app_id` como `rock-cancel-v1` com a flag `active` definida como `true`.

---

## 4. Passo a Passo Técnico

### Passo A: Redirecionamento Inicial
Caso o usuário tente acessar a aplicação sem uma sessão ativa, ele deve ser remetido ao portal central:

**URL do Portal:** `https://rock-login-v1.netlify.app/`

```javascript
// Exemplo de lógica no roteador ou na raiz do projeto (como middleware)
if (!userIsAuthenticated) {
    window.location.href = `https://rock-login-v1.netlify.app/?app=rock-cancel-v1`;
}
```

### Passo B: Recepção do Token (SSO) e Validação de Acesso
O Rock Cancel V1 deve estar preparado para capturar os tokens vindos na URL (sob o hash `#sso_access=...`) e aplicar na sessão local do Supabase. Após inicializar o usuário, a permissão **deve** ser checada centralmente e logo após limpar o residual da URL:

```javascript
// ATENÇÃO: Verifique a Lição Aprendida #3 sobre a limpeza da URL abaixo.
if (window.location.hash.includes('sso_access=')) {
    // 1. Extração manual do token do fragmento
    // 2. setSession manual do Supabase...
    
    // 3. IMPORTANTÍSSIMO: Limpeza de History
    window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
}

async function verifyCancelAccess(userId) {
    // 1. Limpeza Imediata da URL (Ver Lição 3 no README)
    if (window.location.hash.includes('sso_access=')) {
        window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
    }

    // 2. Valida permissão centralizada no banco (BD_Geral)
    const { data: hasAccess, error } = await supabase.rpc('check_app_access', {
        p_user_id: userId,
        p_app_id: 'rock-cancel-v1'
    });

    if (error || !hasAccess) {
        // Usuário não tem permissão - log-off "Fire and forget" e manda de volta
        supabase.auth.signOut().then(({ error }) => { if (error) console.error(error); });
        
        window.location.href = 'https://rock-login-v1.netlify.app/?app=rock-cancel-v1&error=unauthorized';
        return false;
    }
    
    return true; // Acesso liberado!
}
```

### Passo C: Configuração de Banco/Supabase
Certifique-se de que a aplicação esteja utilizando as chaves (URL e Anon Key) do projeto Supabase principal (`BD_Geral`), o mesmo utilizado no Portal de Login, para que o compartilhamento de sessão e chamadas RPCs funcionem corretamente.

---

## 5. Passo a Passo de Implementação (Padrão Unificado)

### Passo 1: Arquivo de utilitários
Crie o `auth-utils.js` com o conteúdo de [auth-standard-integration.js](auth-standard-integration.js).

### Passo 2: Proteção no App.jsx
```javascript
import { protectRoute } from './auth-utils';

useEffect(() => {
    protectRoute(supabase, 'rock-cancel-v1').then(ok => {
        if (ok) setLoading(false);
    });
}, []);

if (loading) return <div>Validando acesso... (Abra o Console F12 se persistir)</div>;
```

---

## 6. Lições Aprendidas e Armadilhas (Troubleshooting)

Verifique sempre a aderência aos padrões do portal para evitar comportamentos inesperados:

**1. Race Conditions e Efeitos Colaterais (Loop Infinito):**
Ao sumir com o usuário num redirect inválido, proteja as lógicas com um `useRef` (ex: `isRedirecting.current = true`) para evitar que as funções asssíncronas do React engulam umas às outras, mandando o usuário para diversas rotas do Portal de Login de modo simultâneo.

**2. O Congelamento (Deadlock) de "Timeouts" no `signOut`:**
Se você for chutar um usuário incorreto pela função `verifyCancelAccess`, lembre-se: nunca use `await supabase.auth.signOut()`. O tempo de espera pela rede gera uma promessa pendente que congela a tela na frente do usuário. Trate-o como Fire and Forget anexando `.catch()`. 

**3. Vazamento de Tokens e Quebra de History na URL:**
Essa checagem já está no Passo B, mas lembre-se: Uma vez usando regras nativas `sso_access`, não deixe a URL contaminada depois do *parse*. Use `history.replaceState` ou então um F5 duplicará o uso acionando event loops do Auth.

---
© 2026 Rock Education System - Engenharia de Dados
