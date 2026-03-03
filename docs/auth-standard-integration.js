/**
 * Rock Team - Standard Auth Integration (Bulletproof SSO Pattern)
 * 
 * Este script fornece a lógica recomendada para integrar qualquer App ao Portal de Login Central.
 * Ele resolve problemas comuns de:
 * 1. Loops de redirecionamento (Race Conditions)
 * 2. Travamentos no signOut (Deadlock)
 * 3. Limpeza de Tokens na URL (History API)
 */

// 1. Variável de controle de redirecionamento (Lock)
// Previne que múltiplos gatilhos de Auth disparem redirects simultâneos.
let isRedirecting = false;

/**
 * Captura sessão vinda do Portal de Login (SSO)
 * Deve ser chamado logo no início da inicialização do App.
 */
export async function handleSSOCheck(supabase) {
    const hash = window.location.hash;

    if (hash && hash.includes('sso_access=')) {
        const params = new URLSearchParams(hash.substring(1)); // Remove o #
        const accessToken = params.get('sso_access');
        const refreshToken = params.get('sso_refresh');

        if (accessToken && refreshToken) {
            console.log("SSO: Token detectado. Aplicando sessão...");

            const { error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
            });

            // Limpa a URL imediatamente para evitar re-processamento em caso de F5
            window.history.replaceState(null, document.title, window.location.pathname + window.location.search);

            if (error) {
                console.error("SSO: Erro ao aplicar sessão:", error.message);
                return false;
            }
            return true;
        }
    }
    return false;
}

/**
 * Valida se o usuário autenticado tem permissão para este App.
 * @param {Object} supabase - Instância do cliente Supabase
 * @param {string} appId - Identificador do app (ex: 'regua-comunicacao-v2')
 * @param {string} portalUrl - URL do portal de login para redirecionamento
 */
export async function protectRoute(supabase, appId, portalUrl = 'https://rock-portal-v1.netlify.app') {
    if (isRedirecting) return;

    const { data: { user } } = await supabase.auth.getUser();

    // Se não há usuário, manda para o portal
    if (!user) {
        redirectToPortal(portalUrl, appId);
        return false;
    }

    // Valida permissão centralizada no banco (RPC)
    const { data: hasAccess, error } = await supabase.rpc('check_app_access', {
        p_user_id: user.id,
        p_app_id: appId
    });

    if (error || !hasAccess) {
        console.warn("Acesso Negado: Usuário sem permissão para este App.");

        // Logoff "Fire and Forget" para evitar travamento (Deadlock)
        supabase.auth.signOut().then(({ error }) => { if (error) console.error(error); });

        redirectToPortal(portalUrl, appId, 'unauthorized');
        return false;
    }

    return true; // Acesso liberado
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
