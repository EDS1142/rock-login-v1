# Documentação Centralizada - Rock Login V1 & Ecossistema Rock Team

## 🎯 Visão Geral

O **Rock Login V1** é o portal de design de referência para todas as telas de login do ecossistema **Rock Team**. Ele define o **layout premium padronizado** adotado por todos os Web Apps.

> [!IMPORTANT]
> **Modelo atual: Login Local por App.**
> Cada aplicativo possui sua própria tela de login independente, com o layout visual idêntico ao portal.
> O SSO centralizado foi **descontinuado** por instabilidade e complexidade excessiva.

---

## 🏗️ Arquitetura de Autenticação

### Modelo: Login Local + Permissão Centralizada

```
┌─────────────────────────────────────────────────────┐
│                    Usuário                          │
│                      │                              │
│         ┌────────────┼────────────┐                 │
│         ▼            ▼            ▼                 │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│   │  Régua   │ │ Teachers │ │   Rock   │           │
│   │  Login   │ │  Login   │ │  Rema    │           │
│   │ (/auth)  │ │ (/login) │ │  Login   │           │
│   └────┬─────┘ └────┬─────┘ └────┬─────┘           │
│        │             │            │                 │
│        └─────────────┼────────────┘                 │
│                      ▼                              │
│        ┌───────────────────────────┐                │
│        │    Supabase Auth          │                │
│        │  signInWithPassword()     │                │
│        └────────────┬──────────────┘                │
│                     ▼                               │
│        ┌───────────────────────────┐                │
│        │   RPC check_app_access    │                │
│        │  (central_permissions)    │                │
│        └───────────────────────────┘                │
└─────────────────────────────────────────────────────┘
```

**Cada app:**
1. Possui sua **própria tela de login** (formulário de email/senha)
2. Autentica via `supabase.auth.signInWithPassword()`
3. Verifica acesso via RPC `check_app_access` na tabela `central_permissions`
4. Se sem permissão → mostra erro e faz `signOut()`
5. Se com permissão → redireciona para o app

---

## 🎨 Layout Premium Padronizado

### Regras de Design
- **Cada app muda APENAS o título** (ex: "Régua de Comunicação", "Teachers Room", "Rock Rema")
- Descrição, cores, logo e copyright são **idênticos** em todos os apps
- Logo: `https://rock-login-v1.netlify.app/assets/logo-3ZeB-E8p.png`

### Estrutura Visual
| Elemento | Valor |
|---|---|
| Background | `radial-gradient(circle at top left, #0084c2, #005a87)` |
| Branding Panel | Gradiente `135deg, #0084c2 → #005a87` |
| Botão Submit | `background-color: #0084c2` |
| Fonte | Inter (Google Fonts) |
| Logo | Branca com `filter: brightness(0) invert(1)` |
| Copyright | `© 2026 Rock Education System` |
| Descrição | `Seu portal unificado de acesso a todas as ferramentas e soluções do ecossistema Rock Team.` |

### Layout Split-Screen
```
┌────────────────────────────────────────┐
│ ┌──────────────┐ ┌──────────────────┐  │
│ │   BRANDING   │ │   FORMULÁRIO     │  │
│ │              │ │                  │  │
│ │   [Logo]     │ │  Bem-vindo(a)!   │  │
│ │   Título     │ │  EMAIL: [____]   │  │
│ │   Descrição  │ │  SENHA: [____]   │  │
│ │              │ │  [  Entrar  ]    │  │
│ │  © 2026...   │ │                  │  │
│ └──────────────┘ └──────────────────┘  │
└────────────────────────────────────────┘
```

---

## 🔐 Controle de Acesso (ACL)

### Tabela: `central_permissions`
```sql
-- Colunas
id        UUID        PK
user_id   UUID        FK → auth.users
app_id    TEXT        -- ex: 'regua-comunicacao-v2'
role      TEXT        -- ex: 'Direção', 'Administrativo', 'Teacher'
active    BOOLEAN     -- controle de ativação
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

### RPC: `check_app_access`
```sql
-- Definição
CREATE OR REPLACE FUNCTION public.check_app_access(p_user_id UUID, p_app_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.central_permissions
        WHERE user_id = p_user_id
        AND app_id = p_app_id
        AND active = TRUE
    );
END;
$$;
```

### Perfis (Roles) Padronizados
| Role | Descrição |
|---|---|
| **Direção** | Gestores, diretores — acesso amplo |
| **Administrativo** | Secretaria e administrativo |
| **Pedagógico** | Coordenação pedagógica |
| **Teacher** | Professores |
| **Comercial** | Equipe comercial |

### Permissões por App (Atual)
| App | Roles com Acesso |
|---|---|
| `regua-comunicacao-v2` | Administrativo, Direção |
| `teachers-room-v1` | Teacher, Administrativo, Direção, Pedagógico |
| `rockrema-v2` | Direção, Pedagógico, Administrativo |

### Adicionar Permissão
```sql
-- Adicionar acesso para um usuário
INSERT INTO central_permissions (user_id, app_id, role, active)
VALUES ('UUID_DO_USUARIO', 'ID_DO_APP', 'ROLE', true);

-- Revogar acesso
UPDATE central_permissions SET active = false
WHERE user_id = 'UUID_DO_USUARIO' AND app_id = 'ID_DO_APP';
```

---

## 🛠️ Guia de Integração: Novo App

### Passo 1: Criar o Componente de Login
Crie um componente `Login.tsx` (ou `Auth.tsx`) seguindo o layout padronizado.

**Estrutura obrigatória:**
```tsx
// 1. Estado local
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

// 2. handleSubmit
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setError(null);

  // 2a. Login
  const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
  if (authError) { setError('E-mail ou senha incorretos'); return; }

  // 2b. Verificar acesso via RPC
  const { data: hasAccess, error: rpcError } = await (supabase.rpc as any)(
    'check_app_access',
    { p_user_id: data.user.id, p_app_id: 'MEU-APP-ID' }
  );

  if (rpcError || !hasAccess) {
    setError('Acesso Negado: Sem permissão para este aplicativo.');
    await supabase.auth.signOut();
    return;
  }

  // 2c. Sucesso → redirecionar
  navigate('/', { replace: true });
};
```

> [!CAUTION]
> **TypeScript:** O tipo `supabase.rpc` pode não incluir `check_app_access` nos tipos auto-gerados. Use `(supabase.rpc as any)('check_app_access', ...)` para contornar.

### Passo 2: Criar ProtectedRoute
```tsx
const ProtectedRoute = ({ children }) => {
  const [state, setState] = useState<"loading" | "authorized" | "unauthorized">("loading");

  useEffect(() => {
    let cancelled = false;
    const verify = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;

      if (!session?.user) { setState("unauthorized"); return; }

      const { data: hasAccess, error } = await (supabase.rpc as any)(
        'check_app_access',
        { p_user_id: session.user.id, p_app_id: 'MEU-APP-ID' }
      );

      if (cancelled) return;
      if (error || !hasAccess) {
        await supabase.auth.signOut();
        setState("unauthorized");
      } else {
        setState("authorized");
      }
    };
    verify();
    return () => { cancelled = true; };
  }, []);

  if (state === "loading") return <Spinner />;
  if (state === "unauthorized") return <Navigate to="/login" replace />;
  return <>{children}</>;
};
```

### Passo 3: Configurar Rotas
```tsx
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
</Routes>
```

### Passo 4: Logout
```tsx
const handleLogout = async () => {
  await supabase.auth.signOut();
  navigate('/login'); // Sempre redirecionar para a rota de login LOCAL
};
```

> [!WARNING]
> **NUNCA redirecionar para o portal central no logout.** O login é local em cada app.

### Passo 5: Registrar Permissões no Banco
```sql
INSERT INTO central_permissions (user_id, app_id, role, active)
SELECT id, 'meu-novo-app', 'Direção', true
FROM auth.users WHERE email IN ('rockfeller.pontagrossa@gmail.com');
```

---

## ⚠️ Lições Aprendidas & Armadilhas

### 1. NÃO usar múltiplos hooks para verificar autenticação
**Problema:** Combinar `useAuth` + `useAppAccess` em hooks separados causa **loops de re-render e deadlocks**. O `onAuthStateChange` atualiza o `user`, que re-dispara `useAppAccess`, que alterna `loading`, causando flickering infinito.

**Solução:** Fazer verificação **inline** em um único `useEffect` usando `getSession()` + RPC, sem hooks intermediários.

### 2. NÃO usar `useEffect + navigate()` em ProtectedRoute
**Problema:** Chamar `navigate("/login")` dentro de `useEffect` cria loops de redirecionamento porque o React não desmonta o componente imediatamente.

**Solução:** Usar o componente declarativo `<Navigate to="/login" replace />` no return do componente.

### 3. NÃO usar `async/await` no callback de `onAuthStateChange`
**Problema:** Pode travar o motor de autenticação e criar race conditions.

**Solução:** Use o callback apenas para setar estado local. Faça chamadas async em `useEffect` separados ou inline.

### 4. Sempre verificar a URL do logo
**Problema:** Vite adiciona hash nos assets. `logo.png` vira `logo-3ZeB-E8p.png`.

**Solução:** Colocar assets estáticos na pasta `public/` do projeto (sem hash) ou usar a URL completa com hash.

### 5. Verificar rotas de logout
**Problema:** Logout redirecionando para `/login` quando a rota real é `/auth` (ou vice-versa) causa 404.

**Solução:** Grep por `/login` e `/auth` no projeto para garantir consistência.

### 6. Sessões SSO residuais
**Problema:** Usuários que usaram o SSO antigo podem ter sessões residuais no navegador.

**Solução:** Na tela de login, ao detectar sessão sem acesso, fazer `signOut()` silencioso e mostrar o formulário limpo.

---

## 🗃️ Ecossistema de Aplicações

| # | App ID | Prefixo de Tabelas | Descrição |
|---|---|---|---|
| 1 | `rock-todo-list-v2` | `todo_` | Gerenciador de tarefas |
| 2 | `student-abcd` | `alunos`, `turmas_` | Portal do acadêmico |
| 3 | `rock-recibo-v4` | `rc_`, `rec_` | Emissão de recibos |
| 4 | `rockrema-v2` | `rema_` | Gestão de rematrículas |
| 5 | `rock-cancel-v1` | `cancel_` | Cancelamentos |
| 6 | `rock-reposicoes-v1` | `repo_` | Controle de reposições |
| 7 | `regua-comunicacao-v2` | `rg_` | Comunicação e templates |
| 8 | `compras-manutencao-v1` | `buy_` | Gestão de compras |
| 9 | `teachers-room-v1` | `tr_` | Portal dos professores |
| 10 | `rockpg-turmas-v3` | `app_` | Gestão administrativa central |
| 11 | `pdi-v1` | `pdi_` | Plano de Desenvolvimento Individual |

---

## 🔧 Configuração do Portal (rock-login-v1)

O portal em si é um app Vite + HTML/CSS/JS puro.

```
rock-login-v1/
├── index.html          # Página principal
├── logo.png            # Logo (source)
├── public/
│   └── logo.png        # Logo (acessível via /logo.png após deploy)
├── docs/
│   └── README.md       # Esta documentação
├── package.json
└── vite.config.js
```

### Variáveis em cada App
Cada app React precisa de:
- `VITE_SUPABASE_URL` — URL do projeto Supabase (`BD_Geral`)
- `VITE_SUPABASE_ANON_KEY` — Chave pública do Supabase

---

© 2026 Rock Education System.
