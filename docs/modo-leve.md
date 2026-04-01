# 🛡️ Guia Oficial: Modo Leve (Lighter Development Protocol)

Este guia documenta o padrão de trabalho para ambientes com recursos limitados de RAM, como o **ChromeOS Flex (Linux)**, visando evitar congelamentos da IDE e do sistema.

---

## 1. 🤖 Comportamento da IA (Agente)

O Agente deve seguir o seguinte fluxo de verificação para poupar recursos:

1.  **Fase de Validação de Serviço:**
    *   Sempre usar `read_url_content` (texto) para verificar se o servidor subiu na porta correta (ex: `localhost:3000`).
    *   Não abrir o navegador visual se o objetivo for apenas ler o HTML ou conferir a presença de uma `<div>`.

2.  **Fase de Layout (Browser Flash):**
    *   Ao usar o `browser_subagent`, o comando deve ser atômico: "Abra a URL, capture Screenshot/DOM e encerre a sessão imediatamente".
    *   Evitar interações prolongadas (cliques manuais, scrolls infinitos) dentro do processo do sub-agente.

3.  **Fase de Agrupamento:**
    *   Agentes devem realizar múltiplas correções de código antes de solicitar uma nova verificação visual.

---

## 2. ⚙️ Otimização do Frontend (Vite)

Sempre que um projeto usar Vite, o arquivo `vite.config.ts` deve ser configurado ou reeditado para incluir:

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    hmr: {
      overlay: false, // DESATIVADO: Evita renderizações pesadas de erros na interface
    },
    watch: {
      // Otimização de monitoramento
      usePolling: false, // Menos uso de CPU
    },
  },
  build: {
    sourcemap: false, // DESATIVADO: Economiza RAM ao não mapear arquivos gigantes no dev
  }
});
```

---

## 3. 🖥️ Boas Práticas do Usuário (Linux)

Como o Linux no ChromeOS não permite o gerenciamento manual de **Swap** individual (pelo comando `swapon`), o usuário deve:

*   **Filtro de Abas:** Mantenha apenas a aba da IDE aberta. Feche o navegador interno (*Browser Preview*) assim que a verificação visual for concluída.
*   **Limpeza de Cache:** Regularmente execute `npm cache clean --force` ou delete a pasta `dist` se notar lentidão extrema.
*   **Aumento de Espaço:** Garanta pelo menos 30GB-40GB de espaço no Linux (Configurações do ChromeOS) para que o sistema consiga gerenciar o paging de arquivos de forma eficiente.

---

## 4. 🆘 O que fazer em caso de Congelamento?

Se a IDE ou o sistema pararem de responder:
1.  Aguarde 30 segundos (o ChromeOS geralmente tenta rodar o OOM-Killer para fechar processos pesados automaticamente).
2.   Use o atalho `Busca + Esc` (Task Manager do ChromeOS) para matar o processo `CrosVM` ou a aba específica da IDE se possível.

---

> [!IMPORTANT]
> Copie este arquivo para `/docs/modo-leve.md` em qualquer novo projeto para que a IA detecte o protocolo automaticamente ao ler o repositório.
