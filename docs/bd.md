# Documentação do Banco de Dados (BD_Geral)

## 1. Tabelas Utilizadas pelo Login

### `central_apps`
Armazena a relação de aplicativos centrais que compõe o ecossistema Rock Team. Usado para buscar o nome e URL do portal de destino com base no `app` param.
* **id**: UUID, Chave Primária.
* **name**: Texto, Nome do aplicativo.
* **url**: Texto, URL de destino após o login.

### `profiles` (Tabela Legada)
Armazena perfis de usuários com suas roles no formato legado, usada para auditoria no login.
* **id**: UUID, chave estrangeira para `auth.users(id)`.
* **role**: Texto, papel do usuário na plataforma.

### `app_security_audit`
Tabela para auditoria de segurança para registrar incidentes, como discrepâncias entre a permissão legada e a permissão central.
* **id**: UUID, Chave Primária.
* **event_type**: Texto (ex: 'mismatch_detected').
* **user_id**: UUID, referência para `auth.users(id)`.
* **app_id**: Texto, referência para identificador do app logado.
* **details**: JSONB, informações adicionais (ex: role legado, user agent).
* **created_at**: Timestamp.

## 2. Funções (RPC)

### `check_app_access`
Função RPC que verifica se um usuário tem permissão central de acesso ao aplicativo destino.
* **Parâmetros**: 
  * `p_user_id` (UUID): ID do usuário na tabela `auth.users`.
  * `p_app_id` (Texto): ID do aplicativo (ex: 'rock-portal-v1').
* **Retorno**: Booleano (true caso logado, false caso negado).

## 3. Políticas (RLS)
> *Nota: Políticas detalhadas são mantidas no projeto BD_Geral no Supabase.*

* A tabela `central_apps` possui permissão de leitura anônima para a busca dos metadados através do ID do app na URL.
* O login insere na tabela `app_security_audit`, portanto, necessita de permissão para iteração ou está executando com permissão contida na função RPC.

*(Última Atualização: Criação Inicial)*
