# Guia de Migração: Teachers Room V1 🍎

Este documento detalha os passos para integrar o **Teachers Room** ao sistema de autenticação e autorização centralizado do ecossistema Rock Team.

## 1. O Conceito
O Teachers Room deixará de gerenciar seu próprio fluxo de login local. O acesso será mediado pelo **Portal de Login Central**, que autenticará o usuário e verificará se ele possui a permissão de `Teacher` ativa para este sistema.

## 2. Identificação do App
Para este aplicativo, utilize o seguinte identificador oficial:
**ID do App:** `teachers-room-v1`

## 3. Regras de Autorização
Diferente de apps administrativos restritos, o Teachers Room é destinado a todos os docentes ativos. A autorização valida:
1. Se o usuário está autenticado no Supabase.
2. Se o usuário possui um vínculo ativo na tabela `public.central_permissions` com o `app_id: 'teachers-room-v1'`.
3. Se o perfil do usuário possui um `teacher_id` válido (opcional, dependendo da lógica interna do app).

---

## 4. Passo a Passo Técnico

### Passo A: Redirecionamento Inicial
Caso o usuário não possua uma sessão ativa, ele deve ser enviado ao portal central:

**URL do Portal:** `https://rock-login-v1.netlify.app/`

```javascript
if (!userIsAuthenticated) {
    window.location.href = `https://rock-login-v1.netlify.app/?app=teachers-room-v1`;
}
```

### Passo B: Verificação de Acesso (SSO)
O app deve estar preparado para capturar os tokens vindos via URL Fragment (`#sso_access=...`) para manter a sessão entre domínios.

```javascript
async function verifyTeacherAccess(userId) {
    // Valida permissão centralizada
    const { data: hasAccess, error } = await supabase.rpc('check_app_access', {
        p_user_id: userId,
        p_app_id: 'teachers-room-v1'
    });

    if (error || !hasAccess) {
        await supabase.auth.signOut();
        window.location.href = 'https://rock-login-v1.netlify.app/?error=unauthorized';
        return false;
    }
    return true;
}
```

### Passo C: Recuperação de Dados do Professor
Uma vez autorizado, o app pode buscar os dados específicos do docente:
```javascript
const { data: profile } = await supabase
    .from('profiles')
    .select('teacher_id, full_name')
    .eq('id', user.id)
    .single();
```

---

## 5. Checklist de Implementação
1. [ ] Remover/Comentar a tela de login legada (`/login`).
2. [ ] Implementar captura de hash customizado (`sso_access`).
3. [ ] Configurar verificador de permissão (RPC `check_app_access`).
4. [ ] **IMPORTANTE:** Não usar `await` dentro do `onAuthStateChange`.
5. [ ] Validar se as tabelas com prefixo `tr_` estão acessíveis via RLS para o usuário logado.

---
© 2026 Rock Education System - Engenharia de Dados
