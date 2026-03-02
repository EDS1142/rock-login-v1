# Planejamento: Sistema de Controle de Acesso Centralizado

## Projetos Mapeados no Banco de Dados
Abaixo estão os aplicativos identificados através dos prefixos das tabelas no Supabase. Estes são os candidatos iniciais para a tabela `central_apps`:

1.  **rockpg-turmas-v3** (Prefixo `app_`): Sistema de gestão de turmas administrativo.
2.  **to-do-list-v1** (Prefixo `todo_`): Gerenciador de tarefas e tags.
3.  **compras-manutencao-v1** (Prefixo `buy_`): Gestão de compras e fornecedores.
4.  **teachers-room-v1** (Prefixo `tr_`): Mural de avisos e comunicações para professores.
5.  **estoque-v1** (Prefixo `estoque_`): Gestão de itens e movimentações de estoque.
6.  **pdi-v1** (Prefixo `pdi_`): Plano de Desenvolvimento Individual (PDI) de professores.
7.  **turmas-old/v2** (Prefixos `turmas_` e `rock_`): Versões anteriores ou legadas de gestão.

---

## Perfis Padronizados (Roles)
Estes são os perfis oficiais que serão utilizados na tabela `central_permissions`:

- **Acadêmico**
- **Administrativo**
- **Comercial**
- **Direção**
- **Teacher**

---

## 1. Contexto e Objetivos
O projeto utiliza um banco de dados Supabase compartilhado entre diversos Web Apps (ex: `rockpg-turmas-v3`, `teachers-room-v1`, `to-do-list-v1`). 

### Problema Atual
Atualmente, qualquer usuário autenticado no Supabase pode, em teoria, acessar qualquer aplicativo se as políticas de Row Level Security (RLS) forem apenas `auth.role() = 'authenticated'`. Isso é um risco de segurança, especialmente quando professores não devem acessar sistemas administrativos.

### Objetivo
Implementar uma camada de **Autorização Centralizada** que controle quais e-mails/usuários podem acessar quais aplicativos e com quais papéis (roles) específicos em cada um.

---

## 2. Arquitetura Proposta (ACL Matrix)

Em vez de colunas fixas por app, utilizaremos uma estrutura relacional flexível de "Muitos-para-Muitos".

### Novas Tabelas (Prefixo `central_`)

#### `public.central_apps`
Lista de todos os Web Apps registrados no ecossistema.
- `id` (text, PK): Identificador único (ex: 'rockpg-turmas-v3').
- `name` (text): Nome amigável (ex: 'Gestão de Turmas v3').
- `description` (text): Breve descrição do propósito do app.
- `url` (text): URL de produção do app.

#### `public.central_permissions`
Matriz de acesso que vincula usuários aos apps.
- `id` (uuid, PK): ID único do registro.
- `user_id` (uuid, FK para auth.users): O usuário autenticado.
- `app_id` (text, FK para central_apps): O app ao qual ele tem acesso.
- `role` (text): O papel/perfil do usuário **especificamente nesse app** (ex: 'admin', 'teacher', 'commercial', 'direction').

---

## 3. Passo a Passo da Implementação (Faseado)

### Passo 1: Documentação e Alinhamento (ATUAL)
- [x] Registrar a decisão arquitetural.
- [ ] Validar a lista inicial de Apps e Perfis.

### Passo 2: Preparação do Banco de Dados
- Criar as tabelas `central_apps` e `central_permissions`.
- Criar funções auxiliares (PostgreSQL) para facilitar a checagem:
  - `check_app_access(user_id, app_id)` -> Retorna boolean.
  - `get_user_app_role(user_id, app_id)` -> Retorna o papel do usuário.

### Passo 3: Cópia e Sincronização de Dados (Coexistência)
- Popular a tabela `central_apps` com os nomes dos apps existentes.
- **Cópia de Segurança:** Em vez de mover os dados, faremos uma cópia dos usuários das tabelas `profiles` e `app_users` para a nova `central_permissions`.
- Manter as tabelas originais intactas e operacionais como backup primário.
- **Importante:** Garantir que ninguém perca acesso durante a transição.

### Passo 4: Implementação nos Clientes (Frontend)
- Atualizar o hook `useAuth` de cada app para verificar se o usuário logado possui registro para o `app_id` atual.
- Implementar redirecionamento para tela de "Acesso Negado" caso o vínculo não exista.

### Passo 5: Reforço na Segurança (RLS - Backend)
- Alterar as políticas de Row Level Security (RLS) de tabelas críticas (como `app_classes`).
- As políticas deixarão de ser apenas `authenticated` e passarão a verificar a tabela `central_permissions`.

---

## 4. Estratégia de Coexistência e Reversibilidade

Para garantir 100% de confiança, adotaremos a abordagem de **Execução em Paralelo**:

1.  **Preservação Total:** As tabelas `profiles`, `app_users` e as políticas de RLS atuais **não** serão removidas ou alteradas inicialmente.
2.  **Duplo Check:** Durante a fase de testes, o Web App verificará a autorização tanto no modelo antigo quanto no novo.
3.  **Botão de Pânico (Rollback):** Caso qualquer anomalia seja detectada, basta reverter o código do Frontend para o estado anterior. O banco de dados continuará com os dados originais preservados.
4.  **Desativação Gradual:** Apenas após semanas de estabilidade no novo sistema centralizado, começaremos a planejar a desativação (não remoção) das tabelas legadas.

---

## 5. Segurança e Regras Críticas

1.  **Login Mandatário (Mandatory Authentication):** Nenhum Web App deve permitir o acesso a qualquer conteúdo, rota ou funcionalidade sem passar obrigatoriamente pela tela de login. Toda tentativa de acesso direto a URLs internas deve resultar em redirecionamento para o portal de entrada.
2.  **Bloqueio por Padrão (Default Deny):** Se um e-mail não estiver cadastrado para o app X, ele não terá acesso ao app X, mesmo que consiga logar com sucesso no Supabase.
3.  **Imutabilidade do Legado:** Nenhuma tabela existente (`app_users`, `profiles`) será deletada ou terá dados removidos neste processo.
4.  **Não-Interferência:** A criação dessas tabelas não afeta os apps atuais até que as políticas de RLS sejam alteradas ou o código do frontend seja atualizado.
5.  **Independência de Perfis:** Um usuário pode ser **Admin** no sistema de turmas e apenas **Visualizador** no sistema de lista de tarefas.

## 5. Próximas Ações Sugeridas
1.  Listar formalmente todos os Web Apps que já estão "vivos" no banco.
2.  Criar um script SQL piloto para as novas tabelas.
3.  Testar em uma tabela de teste antes de aplicar em `app_classes`.
