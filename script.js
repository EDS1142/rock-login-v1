import { createClient } from '@supabase/supabase-js';

/**
 * REUSABLE LOGIN CONFIGURATION
 */
const CONFIG = {
    appName: "Rock Team",
    appDescription: "Seu portal unificado de acesso a todas as ferramentas e soluções do ecossistema Rock Team.",
    copyright: `© ${new Date().getFullYear()} Rock Education System`,
    primaryColor: "#0084c2",
    secondaryColor: "#005a87",
    defaultAppId: 'rock-portal-v1'
};

// Global state to store the actual target app
let targetApp = {
    id: CONFIG.defaultAppId,
    name: CONFIG.appName,
    url: null
};

// Initialize Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function initializeApp() {
    // 1. Check if there's an 'app' parameter in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const appIdFromUrl = urlParams.get('app');

    if (appIdFromUrl) {
        // 2. Fetch app meta-data from central_apps
        const { data: appData } = await supabase
            .from('central_apps')
            .select('name, url')
            .eq('id', appIdFromUrl)
            .single();

        if (appData) {
            targetApp.id = appIdFromUrl;
            targetApp.name = appData.name;
            targetApp.url = appData.url;

            // Update UI dynamically
            document.title = `Login | ${targetApp.name}`;
            document.getElementById('app-title').textContent = targetApp.name;
        }
    }

    // Apply baseline UI
    document.getElementById('app-description').textContent = CONFIG.appDescription;
    document.getElementById('copyright').textContent = CONFIG.copyright;
}

document.addEventListener('DOMContentLoaded', async () => {
    await initializeApp();

    // Password Toggle Logic
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            if (type === 'text') {
                togglePassword.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
            } else {
                togglePassword.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
            }
        });
    }

    // Form Submission with Dual-Check Safety Logic
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            if (!emailInput || !passwordInput) return;

            const email = emailInput.value;
            const password = passwordInput.value;

            const btn = loginForm.querySelector('.submit-btn');
            const originalContent = btn.innerHTML;

            btn.innerHTML = `<span class="loader"></span> Autenticando...`;
            btn.disabled = true;

            try {
                // 1. Autenticação Primária
                const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (authError) throw authError;

                const user = authData.user;

                // 2. Dual-Check (Validação Legada vs Centralizada)
                // Checagem Legada (profiles)
                const { data: legacyProfile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                // Checagem Centralizada
                const { data: hasCentralAccess } = await supabase
                    .rpc('check_app_access', {
                        p_user_id: user.id,
                        p_app_id: targetApp.id
                    });

                // 3. Lógica de Segurança (Audit Mode)
                const allowsLegacy = !!legacyProfile;
                const allowsCentral = !!hasCentralAccess;

                if (allowsLegacy && !allowsCentral) {
                    console.warn("MIGRAÇÃO: Usuário tem acesso legado mas não centralizado.");
                    await supabase.from('app_security_audit').insert({
                        event_type: 'mismatch_detected',
                        user_id: user.id,
                        app_id: targetApp.id,
                        details: { legacy_role: legacyProfile?.role, central_access: false }
                    });
                }

                // 4. Conclusão do Login
                if (!allowsLegacy && !allowsCentral) {
                    throw new Error(`Acesso Negado: Você não tem permissão para acessar o sistema "${targetApp.name}".`);
                }

                console.log("Login bem sucedido.");

                // Redirecionamento 
                if (targetApp.url) {
                    window.location.href = targetApp.url;
                } else {
                    alert(`Sucesso! Você agora está logado no ecossistema Rock Team. (App: ${targetApp.name})`);
                }

            } catch (err) {
                console.error(err);
                alert(err.message || "Erro ao realizar login");
            } finally {
                btn.innerHTML = originalContent;
                btn.disabled = false;
            }
        });
    }
});
