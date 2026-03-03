/**
 * Rock Team - Standard Auth Integration (Bulletproof SSO Pattern V3)
 * 
 * Este script fornece a lógica recomendada para integrar qualquer App ao Portal de Login Central.
 * Ele resolve problemas comuns de:
 * 1. Loops de redirecionamento (Race Conditions)
 * 2. Travamentos no signOut (Deadlock)
 * 3. Limpeza de Tokens na URL (History API)
 * 4. Travamentos em verificação paralela (Initialization Lock)
 */

// --- Configurações e Estado Interno ---
let isRedirecting = false;
let initPromise = null; // Trava de segurança para evitar inicializações paralelas

/**
 * Utilitário de log para diagnóstico
 */
const log = (msg, data = null) => {
    const time = new Date().toLocaleTimeString();
    if (data) console.log(`[AUTH ${time}] ${msg}`, data);
    else console.log(`[AUTH ${time}] ${msg}`);
};

/**
 * Verifica e aplica tokens SSO da URL se presentes.
 * @param {object} supabase - Instância do cliente Supabase
 */
export async function handleSSOCheck(supabase) {
    const hash = window.location.hash;
    const hasNewToken = hash && hash.includes('sso_access=');

    // Se já houver um lock mas detectarmos um NOVO token, resetamos para processar o novo
    if (initPromise && !hasNewToken) {
        log("Aguardando inicialização paralela...");
        return initPromise;
    }

    initPromise = (async () => {
        console.group("🔐 Auth Check: Verificando Sessão");
        log("Iniciando verificação...");

        if (hasNewToken) {
            log("Token detectado na URL. Aplicando sessão...");
            const params = new URLSearchParams(hash.substring(1));
            const access_token = params.get('sso_access');
            const refresh_token = params.get('sso_refresh');

            if (access_token && refresh_token) {
                try {
                    const { error } = await supabase.auth.setSession({
                        access_token,
                        refresh_token
                    });

                    if (error) throw error;
                    log("Sessão aplicada com sucesso.");

                    // Limpa a URL imediatamente (Lição 3)
                    window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
                    log("URL limpa.");
                } catch (err) {
                    console.error("Erro ao aplicar sessão SSO:", err);
                }
            }
        } else {
            log("Nenhum token novo na URL. Prosseguindo...");
        }
    })();

    await initPromise;
    console.groupEnd();
    return;
}

/**
 * Valida se o usuário autenticado tem permissão para este App.
 * @param {Object} supabase - Instância do cliente Supabase
 * @param {string} appId - Identificador do app (ex: 'regua-comunicacao-v2')
 * @param {string} portalUrl - URL do portal de login para redirecionamento
 */
export async function protectRoute(supabase, appId, portalUrl = 'https://rock-portal-v1.netlify.app') {
    if (isRedirecting) return false;

    try {
        // 1. Processa token se existir (aguarda trava de segurança)
        await handleSSOCheck(supabase);

        // 2. Tenta pegar sessão local (instantâneo) antes de ir para a rede
        log("Checando usuário...");
        const { data: { session } } = await supabase.auth.getSession();
        let user = session?.user;

        // Se não tem sessão local, tenta o getUser (rede) como fallback
        if (!user) {
            log("Sessão local não encontrada, tentando rede...");
            const { data: { user: networkUser } } = await supabase.auth.getUser();
            user = networkUser;
        }

        // Se não há usuário, manda para o portal
        if (!user) {
            log("Nenhum usuário logado. Redirecionando para o portal...");
            redirectToPortal(portalUrl, appId);
            return false;
        }

        // 3. Valida permissão centralizada no banco (RPC)
        log(`Validando acesso para o app: ${appId}`);
        const { data: hasAccess, error } = await supabase.rpc('check_app_access', {
            p_user_id: user.id,
            p_app_id: appId
        });

        if (error || !hasAccess) {
            console.warn("Acesso Negado: Usuário sem permissão central.");

            // Logoff "Fire and Forget"
            supabase.auth.signOut().then(({ error }) => { if (error) console.error(error); });

            redirectToPortal(portalUrl, appId, 'unauthorized');
            return false;
        }

        log("Acesso autorizado!");

        // Pequena pausa (microtask) para garantir que o router e o Supabase terminem de sincronizar
        // antes de remover a tela de loading. Resolve o problema de "spinner persistente" em apps React.
        await new Promise(resolve => setTimeout(resolve, 50));

        return true;
    } catch (err) {
        console.error("Erro crítico na proteção de rota:", err);
        return false;
    }
}

/**
 * Função utilitária interna para redirecionamento seguro
 */
function redirectToPortal(portalUrl, appId, errorType = null) {
    if (isRedirecting) return;
    isRedirecting = true;

    let url = `${portalUrl}/?app=${appId}`;
    if (errorType) url += `&error=${errorType}`;

    window.location.href = url;
}
