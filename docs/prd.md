# 📖 Diretrizes para Documentação Integral (PRD)

## 1. Visão Geral e Arquitetura
* **Objetivo:** Portal central unificado de login e autenticação para o ecossistema de soluções da Rock Team. Este webapp recebe parâmetros de URL informando a qual aplicação o usuário deseja navegar. Ele centraliza as regras de segurança, autentica de fato e redireciona (com hash `sso_access` temporário) ao aplicativo final (ex: 'rock-portal-v1').
* **Stack Tecnológica:** HTML5, CSS3 Nativo, Vanilla JavaScript, Supabase JS v2, Vite.
* **Funcionamento Geral:** O sistema é um Single Page Application de login. Possui duas partes cruciais: uma estética do lado esquerdo para exibição da marca e uma com os formulários do lado direito (tudo em uma única página index.html construída). Usa dual-check safety audit comparando roles de tabelas legadas com a função RPC `check_app_access()`.
* **Autenticação:** Autenticação primária pelo e-mail/senha nativo do Supabase com posterior emissão de Tokens visando Single Sign On pelo ecossistema Rock.

---

## 2. Interface e Identidade Visual (UI/UX)

### 2.1. Guia de Estilo
* **Cores Primárias:** `#0084c2` (Botões de Confirmação, Bordas Ativas de Inputs, Degradês de fundo).
* **Cores Secundárias:** `#005a87` (Componentes Suporte, Hover em Elementos, Fim Transição Card Background).
* **Cores de Estado:**
    * **Texto e Background Suporte:** `#1a1a1a` (Texto Primário), `#65676b` (Texto Secundário).
    * **Inativo/Placeholder:** `#f0f2f5` (Fundo dos Inputs).
* **Tipografia:** 
    * **Fonte Principal:** Inter.
    * **Hierarquia:** H1 (2.2rem/700), H2 (2rem/700), Body (1rem/400).

### 2.2. Componentes Padrão
* **Botões:** Bordas arredondadas de 8px, efeito de translateY no HOVER aumentando o boxShadow.
* **Inputs:** Bordas em 1px solid variando entre `#e4e6eb` em descanso para primary cor `#0084c2` sob focus/ativo. Presença de padding-left robusto (44px) para inclusão de ícones SVG estáticos dentro do Input Wrapper.

---

## 3. Estrutura de Seções (Layout)
* **Branding Panel (Lado Esquerdo):** Exibe o logo branco da Rock Team que flutua. Possui o H1 de Título dinâmico ou fixo por app de destino e a descrição/copyright do Footer em cor suave. Seu Background mescla radial+linear gradients com variações do Blue primário.
* **Form Panel (Lado Direito):** Fundo Card-Light `#ffffff`. Traz dois InputGroups com iconografia e labels formatados (EMAIL e SENHA) seguido com o TogglePassword (comportamento nativo no JS alterando type input para text/password) e botão principal de Entrar com flexbox inline.

---

## 4. Funcionalidades Detalhadas (Features)

### Recebimento Automático do Aplicativo (App Redirection Detection)
* **Descrição:** Se o portal de login ver os query params `?app=[ID_DO_APP]`, ele altera dinamicamente seu título no document.js usando consulta por `.from('central_apps').eq('id', app_id)`.

### Toggle Password Visualization
* **Descrição:** Clicar num pequeno ícone olho ao lado final do Input de Senha, permitindo prever a senha antes do login.

### Autenticação Flow (Dual-Check)
* **Descrição:** Ação disparada no form `submit`. Realiza a autenticação e, simultaneamente:
  1. Verifica a role na base `profiles`.
  2. Executa a função do Banco de Dados `check_app_access` baseada no `targetApp.id` setado na inicialização.
* **Regras de Negócio:** Mismatch no acesso (ter o sistema legado validado, mas falta do central) ativa uma requisição paralela fire-and-forget para inserção na tabela de banco `app_security_audit`. Falta de acesso absoluto causa Logoff do JWT antes do descarte (SignOut) e expõe Erro ("Acesso negado").

---

## 5. Matriz de Permissões (RBAC)

> *Nota: Como a aplicação se trata exclusivamente de uma tela de login SSO, não há um painel onde a matriz sirva diretamente nesta View, o RBAC está inteiramente centralizado a nível de Supabase, verificado via `check_app_access`.*

---

## 6. Glossário de Termos
* **SSO (Single Sign On):** Capacidade de um usuário efetuar login uma única vez e navegar entre diversos apps (Ex: Do rock-login ao rock-compras / rock-portal) passando as Chaves de Sessão (access_token/refresh_token) via redirect hash fragments.
* **Dual-Check Safety Logic:** O método programático adotado no `script.js` verificando simultaneamente o acesso novo via RPC e o acesso legado na tabela profiles, realizando logs para migração.
