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
- **silviamsoares1710@gmail.com** (Acesso Coordenação)

*Qualquer outro e-mail, mesmo que autenticado no Supabase, terá o acesso negado pela função `check_app_access`.*

---

## 3. Passo a Passo Técnico

### Passo A: Redirecionamento Inicial
Se o usuário tentar acessar qualquer página interna e não estiver autenticado, o app deve redirecioná-lo para a URL do Portal Central com o parâmetro de ID.

**URL do Portal:** `https://rock-login-v1.netlify.app/`

```javascript
// Exemplo de lógica no redirecionamento
if (!userIsAuthenticated) {
    window.location.href = `https://rock-login-v1.netlify.app/?app=rockrema-v2`;
}
```

### Passo B: Verificação de Autorização (Após o Login)
Mesmo que o usuário consiga logar com sucesso no Supabase, o aplicativo **DEVE** verificar se ele tem uma permissão ativa na tabela central antes de liberar o acesso.

Adicione este código no seu fluxo de inicialização/sessão:

```javascript
async function verifyAccess(userId) {
    // PERGUNTA AO PORTAL: "Este usuário pode entrar aqui?"
    const { data: hasAccess, error } = await supabase.rpc('check_app_access', {
        p_user_id: userId,
        p_app_id: 'rockrema-v2' // ID deste app
    });

    if (error || !hasAccess) {
        // Se o retorno for FALSE, o usuário está demitido ou não tem acesso aqui
        await supabase.auth.signOut();
        window.location.href = 'https://rock-login-v1.netlify.app/?error=unauthorized';
        return false;
    }
    return true;
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

## 4. ⚠️ Resolução de Problemas e Armadilhas (Crucial)

Durante a migração do `rockrema-v2`, enfrentamos 3 desafios críticos que devem ser evitados em novos apps:

### ⚠️ A. Sessões entre domínios diferenets (Cross-Domain)
**Problema:** O Supabase armazena a sessão no `localStorage` do domínio atual. Se o usuário loga em `portal.com` e volta para `app.com`, o `app.com` acha que ele é um anônimo.
**Solução:** O Portal de Login passa o token via URL fragment (hash). O App destino deve ler esse hash e aplicar manualmente:
`https://app.com/#sso_access=...&sso_refresh=...`

### ⚠️ B. Uso de Prefixos Customizados (`sso_access`)
**Problema:** Se usarmos o padrão do Supabase (`#access_token=...`), a biblioteca cliente do Supabase no App destino "devora" o token automaticamente e limpa a URL antes que o nosso código de autorização termine de processar, causando erros de sessão vazia.
**Solução:** Sempre use as chaves `sso_access` e `sso_refresh` na URL de redirecionamento para evitar que o Supabase client as apague prematuramente.

### ⚠️ C. O Perigo do `await` no `onAuthStateChange`
**Problema:** **NUNCA** use `async/await` dentro do callback do `supabase.auth.onAuthStateChange`. Isso trava o motor de autenticação do Supabase "silenciosamente" e deixa seu app preso na tela de "Carregando".
**Solução:** Use o callback apenas para setar um estado (ex: `setPendingUser(user)`) e use um `useEffect` separado que reaja a essa mudança de estado para fazer as chamadas assíncronas ao banco de dados (RPC).

---

## 5. Checklist para a IA de Migração

Se você é uma IA realizando esta migração, certifique-se de:
1. [ ] Desativar/Remover a tela de login local deste aplicativo.
2. [ ] Configurar o redirecionamento automático para o Portal Central.
3. [ ] Implementar a chamada RPC `check_app_access` **FORA** do callback de auth.
4. [ ] Garantir que o `supabase-js` esteja configurado para o mesmo projeto Supabase (`BD_Geral`).
5. [ ] Configurar a leitura das chaves `sso_access` na URL hash.

---
© 2026 Rock Education System - Engenharia de Dados
