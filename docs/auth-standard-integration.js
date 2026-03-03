/**
 * Rock Team - Standard Auth Integration (Bulletproof SSO Pattern V3.2)
 * 
 * Este script fornece a lógica recomendada para integrar qualquer App ao Portal de Login Central.
 */

// --- Configurações e Estado Interno ---
let isRedirecting = false;
let initPromise = null;

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
 */
export async function handleSSOCheck(supabase) {
    const hash = window.location.hash;
    const hasNewToken = hash && hash.includes('sso_access=');

    // Se já houver um lock mas NÃO houver um novo token, aguarda o processo em curso
    if (initPromise && !hasNewToken) {
        log("Aguardando inicialização paralela...");
        return initPromise;
    }

    // Se houver um novo token ou nenhuma inicialização em curso, inicia uma nova
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

    try {
        await initPromise;
    } finally {
        console.groupEnd();
        // Não limpamos o initPromise aqui para que chamadas subsequentes subseqüentes vejam o resultado resolvido
    }
    return;
}

/**
 * Valida se o usuário autenticado tem permissão para este App.
 */
export async function protectRoute(supabase, appId, portalUrl = 'https://rock-portal-v1.netlify.app') {
    if (isRedirecting) return false;

    try {
        // 1. Processa token se existir
        await handleSSOCheck(supabase);

        // 2. Tenta pegar sessão local (instantâneo)
        log("Checando usuário...");
        const { data: { session } } = await supabase.auth.getSession();
        let user = session?.user;

        // Fallback para rede se necessário
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

        // 3. Valida permissão centralizada
        log(`Validando acesso para o app: ${appId}`);
        const { data: hasAccess, error } = await supabase.rpc('check_app_access', {
            p_user_id: user.id,
            p_app_id: appId
        });

        if (error || !hasAccess) {
            console.warn("Acesso Negado: Usuário sem permissão central.");
            supabase.auth.signOut().then(({ error }) => { if (error) console.error(error); });
            redirectToPortal(portalUrl, appId, 'unauthorized');
            return false;
        }

        log("Acesso autorizado!");

        // --- NOVIDADE V3.2: ESCAPE DO LOOPING DE PÁGINA DE LOGIN ---
        // Se o código chegou aqui, o usuário ESTÁ logado e tem acesso.
        // Se ainda estiver na URL /login, forçamos o redirecionamento para a Home do App.
        if (window.location.pathname.endsWith('/login')) {
            log("Usuário já autorizado detectado na página de login. Redirecionando para Home...");
            window.location.href = window.location.origin + '/';
            return false; // Retornamos falso pois vamos sair desta página
        }

        return true;
    } catch (err) {
        console.error("Erro crítico na proteção de rota:", err);
        return false;
    }
}

/**
 * Redirecionamento seguro
 */
function redirectToPortal(portalUrl, appId, errorType = null) {
    if (isRedirecting) return;
    isRedirecting = true;

    let url = `${portalUrl}/?app=${appId}`;
    if (errorType) url += `&error=${errorType}`;

    window.location.href = url;
}
