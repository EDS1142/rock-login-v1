# Guia de Migração: Login Unificado Rock Team 🚀

Este documento deve ser seguido à risca para migrar este Web App para o sistema de autenticação e autorização centralizado.

## 1. O Conceito
Este aplicativo deixará de usar sua própria tela de login legada. Em vez disso, ele redirecionará o usuário para o **Portal de Login Central**, que cuidará da autenticação e verificará se o usuário tem permissão (`role` ativa) para acessar este sistema específico.

## 2. Identificação do App
Para este aplicativo, utilize o seguinte identificador oficial:
**ID do App:** `rockrema-v2`  *(Substitua pelo ID correto caso esteja migrando outro app)*

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
async function verifyAccess() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
        // PERGUNTA AO PORTAL: "Este usuário pode entrar aqui?"
        const { data: hasAccess, error } = await supabase.rpc('check_app_access', {
            p_user_id: user.id,
            p_app_id: 'rockrema-v2' // ID deste app
        });

        if (error || !hasAccess) {
            // Se o retorno for FALSE, o usuário está demitido ou não tem acesso aqui
            await supabase.auth.signOut();
            window.location.href = 'https://rock-portal-v1.netlify.app/?error=unauthorized';
            return;
        }
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

Se você é uma IA realizando esta migração, certifique-se de:
1. [ ] Desativar/Remover a tela de login local deste aplicativo.
2. [ ] Configurar o redirecionamento automático para o Portal Central.
3. [ ] Implementar a chamada RPC `check_app_access` na proteção de rotas.
4. [ ] Garantir que o `supabase-js` esteja configurado para o mesmo projeto Supabase (`BD_Geral`).

---
© 2026 Rock Education System - Engenharia de Dados
