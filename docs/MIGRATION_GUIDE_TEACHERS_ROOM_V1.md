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
    // 1. Limpeza Imediata da URL
    if (window.location.hash.includes('sso_access=')) {
        window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
    }

    // 2. Valida permissão centralizada
    const { data: hasAccess, error } = await supabase.rpc('check_app_access', {
        p_user_id: userId,
        p_app_id: 'teachers-room-v1'
    });

    if (error || !hasAccess) {
        // Logoff "Fire and Forget" para evitar travamento
        supabase.auth.signOut().then(({ error }) => { if (error) console.error(error); });
        
        window.location.href = 'https://rock-login-v1.netlify.app/?app=teachers-room-v1&error=unauthorized';
        return false;
    }
    return true; // Acesso liberado
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

## 5. Passo a Passo de Implementação (Padrão Unificado)

Para evitar os problemas comuns de looping, utilize o padrão **Bulletproof V3.2**:

### Passo 1: Arquivo de utilitários
Crie o `auth-utils.js` com o conteúdo integral de [auth-standard-integration.js](auth-standard-integration.js).

### Passo 2: Proteção no App.jsx
```javascript
import { protectRoute } from './auth-utils';

function App() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Validação TUDO-EM-UM para Teachers Room
        protectRoute(supabase, 'teachers-room-v1')
            .then(ok => { if (ok) setLoading(false); });
    }, []);

    if (loading) return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2>Verificando permissões de acesso...</h2>
            <p>Se demorar, verifique mensagens no Console do Navegador (F12).</p>
        </div>
    );

    return <ConteudoDoApp />;
}
```

---
© 2026 Rock Education System - Engenharia de Dados
