# Documentação Centralizada - Rock Login V1 & Ecossistema Rock Team

## 🎯 Visão Geral

O **Rock Login V1** (referenciado no BD como `rock-portal-v1`) é o portal de design de referência para todas as telas de login do ecossistema **Rock Team**. Ele define o **layout premium padronizado** adotado por todos os Web Apps.

> [!IMPORTANT]
> **Modelo atual: Login Local por App.**
> Cada aplicativo possui sua própria tela de login independente, com o layout visual idêntico ao portal.
> O SSO centralizado foi **descontinuado** por instabilidade e complexidade excessiva.

> [!CAUTION]
> **REGRA CRÍTICA DE PADRONIZAÇÃO DE LAYOUT**
> **NUNCA** mude a estrutura do login para variações de tela cheia, split horizontal ou designs personalizados. 
> Todos os aplicativos **DEVEM** usar o padrão **Card Centralizado** (1000px max) com animação `cardEnter`.
> Qualquer alteração que fuja desse padrão visual (Card Branco flutuante sobre fundo degradê radial) é considerada um **ERRO GRAVE**.

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

### Permissões por App (Migrados)
Abaixo estão os aplicativos que já utilizam o sistema de autenticação centralizado (V3.2 Bulletproof) e as roles configuradas para cada um:

| App | Roles com Acesso (BD Real) |
|---|---|
| `regua-comunicacao-v2` | Administrativo, Direção |
| `teachers-room-v1` | Teacher, Administrativo, Direção, Pedagógico |
| `rockrema-v2` | Administrativo, Direção, Pedagógico |
| `rock-cancel-v1` | Administrativo, Direção |
| `student-abcd` | Teacher, Administrativo, Direção, Pedagógico |
| `rock-recibo-v4` | Administrativo, Comercial, Direção |
| `compras-manutencao-v1` | Administrativo, Comercial, Direção, Pedagógico |
| `pdi-v1` | Direção, Pedagógico |
| `relatorio-menor-v1` | Teacher, Administrativo, Direção, Pedagógico |
| `rock-portal-v1 (rock-login-v1)` | Teacher, Administrativo, Comercial, Direção, Pedagógico |
| `rockpg-turmas-v3` | Teacher, Administrativo, Direção |
| `to-do-list-v1` | Teacher, Administrativo, Direção |
| `todo-list-v2` | Teacher, Administrativo, Comercial, Direção, Pedagógico |
| `turmas-old` | Administrativo, Direção |
| `rock-reposicoes-v1` | Administrativo, Comercial, Direção, Pedagógico |

> [!NOTE]
> O ID `rock-portal-v1` no banco de dados refere-se ao projeto **rock-login-v1** (nome da pasta local e no Netlify).

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

**Solução:** Use the callback apenas para setar estado local. Faça chamadas async em `useEffect` separados ou inline.

### 4. Sempre verificar a URL do logo
**Problema:** Vite adiciona hash nos assets. `logo.png` vira `logo-3ZeB-E8p.png`.

**Solução:** Colocar assets estáticos na pasta `public/` do projeto (sem hash) ou usar a URL completa com hash.

### 5. Verificar rotas de logout
**Problema:** Logout redirecionando para `/login` quando a rota real é `/auth` (ou vice-versa) causa 404.

**Solução:** Grep por `/login` e `/auth` no projeto para garantir consistência.

### 6. Sessões SSO residuais
**Problema:** Usuários que usaram o SSO antigo podem ter sessões residuais no navegador.

**Solução:** Na tela de login, ao detectar sessão sem acesso, fazer `signOut()` silencioso e mostrar o formulário limpo.

### 7. OBRIGATÓRIO: Criar `public/_redirects` para SPAs no Netlify
**Problema:** Apps com `BrowserRouter` (React Router) retornam **404** quando o usuário acessa diretamente uma rota como `/login` ou `/auth`. O Netlify procura um arquivo físico que não existe.

**Solução:** Criar o arquivo `public/_redirects` com o conteúdo:
```
/*    /index.html   200
```
O `netlify.toml` com `[[redirects]]` deveria funcionar, mas é **menos confiável**. O arquivo `_redirects` dentro de `public/` é copiado diretamente para `dist/` pelo Vite e tem **prioridade máxima**. Sempre incluir ambos como garantia.

### 8. Constraint UNIQUE (user_id, app_id) na tabela de permissões
**Problema:** A tabela `central_permissions` possui constraint `UNIQUE(user_id, app_id)`, ou seja, **um usuário só pode ter UMA role por app**. Tentativas de inserir múltiplas roles para o mesmo usuário+app falham silenciosamente.

**Solução:** Na prática funciona bem porque o `check_app_access` verifica apenas se o registro **existe** (independente da role). Se precisar diferenciar comportamentos por role dentro de um app, usar a coluna `role` existente, sem tentar inserir registros duplicados.

### 9. NÃO usar SSO centralizado com redirect entre apps
**Problema:** O modelo de SSO centralizado (Portal → Token na URL → App aplica sessão) é **extremamente frágil**. Race conditions entre `setSession()`, `onAuthStateChange()` e limpeza de URL causam loops infinitos de redirecionamento. Cada tentativa de correção introduz novos problemas.

**Solução:** Usar **Login Local por App** (modelo atual). Cada app tem sua própria tela de login, autentica via `signInWithPassword()` e verifica permissão via RPC. Simples, robusto e sem dependências.

### 10. Sempre verificar permissões no BD ANTES de migrar um app
**Problema:** Ao migrar um app para usar `check_app_access`, se não existirem registros na tabela `central_permissions` para aquele `app_id`, **TODOS os usuários serão bloqueados** com "Acesso Negado".

**Solução:** Antes de fazer deploy do novo login, rodar uma query para garantir que os registros existem:
```sql
SELECT COUNT(*) FROM central_permissions WHERE app_id = 'meu-app-id';
-- Se retornar 0, inserir as permissões antes do deploy!
```

### 11. Posicionamento do `AuthProvider` e Reatividade do Logout
**Problema:** O logout é executado (`signOut`), mas a aplicação não redireciona automaticamente para a tela de login, permanecendo na rota protegida ou exigindo refresh manual.

**Causa:** O `AuthProvider` está aninhado dentro do `ProtectedRoute`, ou o `ProtectedRoute` não está "ouvindo" as mudanças de estado do contexto de autenticação.

**Solução:** 
1. O `<AuthProvider>` deve envolver toda a aplicação no `App.tsx` (incluindo o `BrowserRouter`).
2. O `ProtectedRoute` deve utilizar o hook `useAuth()` para acessar a `session`.
3. Adicione a `session` como dependência no `useEffect` de verificação do `ProtectedRoute`. Assim, quando a sessão for limpa pelo logout, o componente re-renderiza e dispara o redirecionamento instantâneo.


---

## 🗃️ Ecossistema de Aplicações

| ID do App | Nome do Aplicaivo | Prefixo de Tabelas | Descrição |
|---|---|---|---|
| `rock-portal-v1` | Rock Login V1 | - | Portal central de login e documentação (Referenciado como `rock-portal-v1` no BD) |
| `pdi-v1` | PDI v1 | `pdi_` | Plano de Desenvolvimento Individual |
| `rockrema-v2` | Rematrícula v2 | `rema_` | Gestão de rematrículas |
| `student-abcd` | Portal do Aluno (ABCD) | `alunos`, `turmas_` | Portal acadêmico para alunos |
| `rock-recibo-v4` | Recibos v4 | `rc_`, `rec_` | Emissão e gestão de recibos |
| `rock-cancel-v1` | Cancelamentos v1 | `cancel_` | Gestão de cancelamentos de matrículas |
| `regua-comunicacao-v2` | Régua de Comunicação v2 | `rg_` | Automação de réguas e templates |
| `compras-manutencao-v1` | Compras e Manutenção v1 | `buy_` | Gestão interna de compras |
| `teachers-room-v1` | Teachers Room v1 | `tr_` | Portal central para professores |
| `rockpg-turmas-v3` | Gestão de Turmas v3 | `app_` | Administração de turmas e alunos |
| `pdi-v1` | PDI v1 | `pdi_` | Plano de Desenvolvimento Individual |
| `rock-reposicoes-v1` | Reposições v1 | `repo_` | Controle e agendamento de reposições |
| `todo-list-v2` | To-Do List v2 | `todo_` | Gerenciador de tarefas e pendências (com separação de perfis Teacher/Admin) |
| `to-do-list-v1` | To-Do List v1 | `todo_` | Versão legado do To-Do List |
| `relatorio-menor-v1` | Relatório Menor v1 | `rm_` | Gestão de relatórios e documentação pedagógica |
| `turmas-old` | Turmas Legado | `app_` | Backup / Consulta de dados antigos |

---

## 📊 Matriz de Acesso (App x Usuários)

A tabela abaixo detalha quais e-mails têm acesso a quais aplicativos no ecossistema atual.

| Aplicativo | ID do App | Usuários Autorizados (E-mails) |
|---|---|---|
| **Rock Login V1** | `rock-portal-v1` | mikael.rockfeller25@gmail.com, gusmartins94@gmail.com, spiderdan145@gmail.com, henrique.rockfeller@gmail.com, fashionlivea@gmail.com, teacherdave.rockefeller@gmail.com, brunrosa90@gmail.com, vinicius.mgk20@gmail.com, nicolemflemming2@gmail.com, dematosr20@gmail.com, luisa.grigoldias@hotmail.com, silviamsoares1710@gmail.com, vanessa.russano@gmail.com, rockpg.adm@gmail.com, rockfeller.pontagrossa@gmail.com |
| **Teachers Room v1** | `teachers-room-v1` | rockpg.adm@gmail.com, mikael.rockfeller25@gmail.com, vinicius.mgk20@gmail.com, brunrosa90@gmail.com, gusmartins94@gmail.com, henrique.rockfeller@gmail.com, nicolemflemming2@gmail.com, spiderdan145@gmail.com, teacherdave.rockefeller@gmail.com, dematosr20@gmail.com, fashionlivea@gmail.com, luisa.grigoldias@hotmail.com, rockfeller.pontagrossa@gmail.com, silviamsoares1710@gmail.com, mariasantana2108@gmail.com |
| **Gestão de Turmas v3** | `rockpg-turmas-v3` | rockpg.adm@gmail.com, rockfeller.pontagrossa@gmail.com, silviamsoares1710@gmail.com, mikael.rockfeller25@gmail.com, vinicius.mgk20@gmail.com, brunrosa90@gmail.com, gusmartins94@gmail.com, henrique.rockfeller@gmail.com, nicolemflemming2@gmail.com, spiderdan145@gmail.com, teacherdave.rockefeller@gmail.com, dematosr20@gmail.com, fashionlivea@gmail.com, luisa.grigoldias@hotmail.com |
| **Recibos v4** | `rock-recibo-v4` | rockfeller.pontagrossa@gmail.com, vanessa.russano@gmail.com, silviamsoares1710@gmail.com, rockpg.adm@gmail.com |
| **Régua de Comunicação v2** | `regua-comunicacao-v2` | rockpg.adm@gmail.com, rockfeller.pontagrossa@gmail.com |
| **Rematrícula v2** | `rockrema-v2` | rockpg.adm@gmail.com, rockfeller.pontagrossa@gmail.com, silviamsoares1710@gmail.com |
| **Portal do Aluno (ABCD)** | `student-abcd` | spiderdan145@gmail.com, fashionlivea@gmail.com, dematosr20@gmail.com, gusmartins94@gmail.com, brunrosa90@gmail.com, henrique.rockfeller@gmail.com, rockpg.adm@gmail.com, vinicius.mgk20@gmail.com, silviamsoares1710@gmail.com, luisa.grigoldias@hotmail.com, teacherdave.rockefeller@gmail.com, rockfeller.pontagrossa@gmail.com, nicolemflemming2@gmail.com, mikael.rockfeller25@gmail.com |
| **Cancelamentos v1** | `rock-cancel-v1` | silviamsoares1710@gmail.com, rockpg.adm@gmail.com, rockfeller.pontagrossa@gmail.com |
| **PDI v1** | `pdi-v1` | rockpg.adm@gmail.com, rockfeller.pontagrossa@gmail.com, silviamsoares1710@gmail.com, mikael.rockfeller25@gmail.com, vinicius.mgk20@gmail.com, brunrosa90@gmail.com, gusmartins94@gmail.com, henrique.rockfeller@gmail.com, nicolemflemming2@gmail.com, spiderdan145@gmail.com, teacherdave.rockefeller@gmail.com, dematosr20@gmail.com, fashionlivea@gmail.com, luisa.grigoldias@hotmail.com, mariasantana2108@gmail.com |
| **Compras e Manutenção** | `compras-manutencao-v1` | rockpg.adm@gmail.com, rockfeller.pontagrossa@gmail.com, silviamsoares1710@gmail.com |
| **To-Do List v1** | `to-do-list-v1` | rockpg.adm@gmail.com, rockfeller.pontagrossa@gmail.com, silviamsoares1710@gmail.com, mikael.rockfeller25@gmail.com, vinicius.mgk20@gmail.com, brunrosa90@gmail.com, gusmartins94@gmail.com, henrique.rockfeller@gmail.com, nicolemflemming2@gmail.com, spiderdan145@gmail.com, teacherdave.rockefeller@gmail.com, dematosr20@gmail.com, fashionlivea@gmail.com, luisa.grigoldias@hotmail.com |
| **To-Do List v2** | `todo-list-v2` | rockfeller.pontagrossa@gmail.com (Direção), silviamsoares1710@gmail.com (Pedagógico), rockpg.adm@gmail.com (Administrativo), vanessa.russano@gmail.com (Comercial), brunrosa90@gmail.com, spiderdan145@gmail.com, teacherdave.rockefeller@gmail.com, gusmartins94@gmail.com, fashionlivea@gmail.com, nicolemflemming2@gmail.com, vinicius.mgk20@gmail.com, henrique.rockfeller@gmail.com, luisa.grigoldias@hotmail.com, mariasantana2108@gmail.com (Teachers) |
| **Relatório Menor v1** | `relatorio-menor-v1` | rockfeller.pontagrossa@gmail.com, silviamsoares1710@gmail.com, rockpg.adm@gmail.com, mikael.rockfeller25@gmail.com, gusmartins94@gmail.com, spiderdan145@gmail.com, henrique.rockfeller@gmail.com, fashionlivea@gmail.com, teacherdave.rockefeller@gmail.com, brunrosa90@gmail.com, vinicius.mgk20@gmail.com, nicolemflemming2@gmail.com, dematosr20@gmail.com, luisa.grigoldias@hotmail.com, mariasantana2108@gmail.com |
| **Turmas Legado** | `turmas-old` | rockpg.adm@gmail.com, rockfeller.pontagrossa@gmail.com, silviamsoares1710@gmail.com |
| **Reposições v1** | `rock-reposicoes-v1` | rockfeller.pontagrossa@gmail.com, rockpg.adm@gmail.com, silviamsoares1710@gmail.com, vanessa.russano@gmail.com |

---

## 👤 Perfis e Vínculos

Relacionamento entre papéis (roles) e os e-mails associados.

| Perfil (Role) | E-mails Vinculados |
|---|---|
| **Direção** | rockfeller.pontagrossa@gmail.com |
| **Pedagógico** | silviamsoares1710@gmail.com |
| **Administrativo** | rockfeller.pontagrossa@gmail.com, rockpg.adm@gmail.com, silviamsoares1710@gmail.com |
| **Comercial** | vanessa.russano@gmail.com |
| **Teacher / Professor** | gusmartins94@gmail.com, spiderdan145@gmail.com, henrique.rockfeller@gmail.com, fashionlivea@gmail.com, teacherdave.rockefeller@gmail.com, brunrosa90@gmail.com, vinicius.mgk20@gmail.com, nicolemflemming2@gmail.com, luisa.grigoldias@hotmail.com, mariasantana2108@gmail.com |
| **Teacher / Professor (Desligados)** | ~~mikael.rockfeller25@gmail.com~~, ~~dematosr20@gmail.com~~ |

---

## 🗄️ Tabelas de Registro (BD)

Os dados de acesso e permissões estão distribuídos nas seguintes tabelas do Supabase:

1.  **`auth.users`**: Gerencia a autenticação primária (Email, Senha, ID do Usuário).
2.  **`public.profiles`**: Armazena o perfil básico de cada usuário vinculado ao `auth.users`, incluindo e-mail e papel base (`role`).
3.  **`public.central_permissions`**: A tabela definitiva de permissões. Mapeia o `user_id` para um `app_id` e define o `role` específico para aquele aplicativo. Possui controle de ativação (`active`).
4.  **`public.central_apps`**: Cadastro mestre de todos os aplicativos autorizados no ecossistema (ID, Nome, URL).
5.  **`public.user_roles`**: Tabela redundante/legada opcional para alguns apps (em processo de migração total para `central_permissions`).

---

© 2026 Rock Education System.
