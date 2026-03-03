# Guia de Migração: Login Unificado Rock Team 🚀

Este documento deve ser seguido à risca para migrar este Web App para o sistema de autenticação e autorização centralizado.

## 1. O Conceito
Este aplicativo deixará de usar sua própria tela de login legada. Em vez disso, ele redirecionará o usuário para o **Portal de Login Central**, que cuidará da autenticação e verificará se o usuário tem permissão (`role` ativa) para acessar este sistema específico.

## 2. Identificação do App
Para este aplicativo, utilize o seguinte identificador oficial:
**ID do App:** `rockrema-v2`

## 3. Usuários Autorizados (Exclusivo)
A autorização para este app foi configurada por **exclusão**. Apenas os seguintes e-mails possuem acesso ativo no banco de dados para este sistema:

- **rockpg.adm@gmail.com** (Acesso Administrativo)
- **rockfeller.pontagrossa@gmail.com** (Acesso Direção)

*Qualquer outro e-mail, mesmo que autenticado no Supabase, terá o acesso negado pela função `check_app_access`.*

---

## 3. Passo a Passo Técnico

### Passo A: Redirecionamento Inicial
Se o usuário tentar acessar qualquer página interna e não estiver autenticado, o app deve redirecioná-lo para a URL do Portal Central com o parâmetro de ID.

**URL do Portal:** `https://rock-portal-v1.netlify.app/` (Verifique a URL final de produção)

```javascript
// Exemplo de lógica no roteador ou página de login
if (!userIsAuthenticated) {
    window.location.href = `https://rock-portal-v1.netlify.app/?app=rockrema-v2`;
}
```

### Passo B: Verificação de Autorização (Após o Login)
Mesmo que o usuário consiga logar com sucesso no Supabase, o aplicativo **DEVE** verificar se ele tem uma permissão ativa na tabela central antes de liberar o acesso.

Adicione este código no seu fluxo de inicialização/sessão:

```javascript
async function verifyAccess(userId) {
    // 1. Limpeza Imediata da URL (Ver Lição 3 no README)
    if (window.location.hash.includes('sso_access=')) {
        window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
    }

    // 2. Valida permissão centralizada no banco (BD_Geral)
    const { data: hasAccess, error } = await supabase.rpc('check_app_access', {
        p_user_id: userId,
        p_app_id: 'rockrema-v2' // ID deste app
    });

    if (error || !hasAccess) {
        // Logoff "Fire and forget" para evitar travamento (Deadlock)
        supabase.auth.signOut().then(({ error }) => { if (error) console.error(error); });
        
        window.location.href = 'https://rock-portal-v1.netlify.app/?app=rockrema-v2&error=unauthorized';
        return;
    }
}
```

### Passo C: Gestão de Perfis (Roles)
Se o seu app precisa saber se o usuário é "Administrativo" ou "Teacher" para mostrar botões diferentes, utilize a função abaixo:

```javascript
const { data: userRole } = await supabase.rpc('get_user_app_role', {
    p_user_id: user.id,
    p_app_id: 'rockrema-v2'
});

// userRole retornará: 'Admin', 'Teacher', 'Pedagógico', etc.
```

---

## 4. Checklist para a IA de Migração

## 5. Passo a Passo de Implementação (Padrão Estável)

### Passo 1: Criar o arquivo de utilitários
Crie um arquivo chamado `auth-utils.js` (ou `.ts`) e cole o conteúdo de [auth-standard-integration.js](auth-standard-integration.js).

### Passo 2: Capturar a sessão no início do App
No seu arquivo principal (ex: `App.jsx` ou `main.jsx`), adicione:

```javascript
import { handleSSOCheck } from './auth-utils';
handleSSOCheck(supabase);
```

### Passo 3: Proteger as rotas
No componente que controla o acesso, use a função `protectRoute`:

```javascript
import { protectRoute } from './auth-utils';

useEffect(() => {
    protectRoute(supabase, 'rockrema-v2', 'https://rock-portal-v1.netlify.app');
}, []);
```

---
© 2026 Rock Education System - Engenharia de Dados
