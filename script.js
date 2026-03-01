/**
 * REUSABLE LOGIN CONFIGURATION
 * To customize for a new app, simply update the CONFIG object below.
 */
const CONFIG = {
    appName: "Rock Team",
    appDescription: "Gerencie relatórios, frequências, reuniões e muito mais em um único lugar.",
    copyright: `© ${new Date().getFullYear()} Rock Education System`,
    primaryColor: "#0084c2",
    secondaryColor: "#005a87"
};

document.addEventListener('DOMContentLoaded', () => {
    // Apply configuration
    document.title = `Login | ${CONFIG.appName}`;
    document.getElementById('app-title').textContent = CONFIG.appName;
    document.getElementById('app-description').textContent = CONFIG.appDescription;
    document.getElementById('copyright').textContent = CONFIG.copyright;

    // Password Toggle Logic
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    togglePassword.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        // Change icon based on state
        if (type === 'text') {
            togglePassword.innerHTML = `
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
            `;
        } else {
            togglePassword.innerHTML = `
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            `;
        }
    });

    // Form Submission
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Feedback visual de carregamento
        const btn = loginForm.querySelector('.submit-btn');
        const originalContent = btn.innerHTML;
        
        btn.innerHTML = `<span class="loader"></span> Aguarde...`;
        btn.disabled = true;
        btn.style.opacity = "0.7";

        // Adiciona um delay simulando uma requisição
        console.log(`Tentativa de login para: ${email}`);
        
        setTimeout(() => {
            // Aqui você integraria com sua API ou Supabase
            // alert('Login realizado com sucesso! (Simulado)');
            btn.innerHTML = originalContent;
            btn.disabled = false;
            btn.style.opacity = "1";
        }, 1500);
    });
});
