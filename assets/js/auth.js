function verificarDispositivo() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isSmallScreen = window.innerWidth <= 800;

    if (isMobile || isSmallScreen) {
        document.body.innerHTML = `
            <div style="height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #0f172a; color: white; text-align: center; padding: 20px; font-family: 'Inter', sans-serif;">
                <img src="${window.location.pathname.includes('sistema_') ? '../' : ''}photos/logo-latem.png" style="max-height: 80px; margin-bottom: 20px;" onerror="this.style.display='none'">
                <h1 style="color: #ef4444; font-size: 1.5rem; margin-bottom: 10px;">Acesso Negado</h1>
                <p style="color: #94a3b8; line-height: 1.6;">Este sistema é exclusivo para terminais Desktop (Computadores) da Latem.<br>O acesso via dispositivos móveis não é permitido.</p>
                <div style="margin-top: 20px; font-size: 3rem; color: #1e293b;"><i class="fa-solid fa-mobile-screen-button"></i></div>
            </div>
        `;
        window.stop();
    }
}

let currentUser = 'Operador';

function carregarOperador() { 
    currentUser = localStorage.getItem('latem_usuario_bd') || 'Operador'; 
    const elName = document.getElementById('userNameDisplay');
    const elIcon = document.getElementById('userAvatarIcon');
    if(elName) elName.innerText = currentUser; 
    if(elIcon) elIcon.innerText = currentUser.charAt(0).toUpperCase(); 
}

function logout() { 
    if(typeof showToast === 'function') showToast("Encerrando...", "info"); 
    
    if(typeof scaleConnected !== 'undefined' && scaleConnected) { 
        try { 
            keepReading = false; 
            if(typeof serialReader !== 'undefined' && serialReader) serialReader.cancel().catch(e=>console.log(e)); 
            if(typeof serialPort !== 'undefined' && serialPort) serialPort.close().catch(e=>console.log(e)); 
            localStorage.removeItem('latem_balanca_bd'); 
        } catch(e){} 
    } 
    
    setTimeout(() => { 
        if(window.location.pathname.includes('sistema_')) {
            window.location.href = '../index.html';
        } else {
            localStorage.removeItem('latem_usuario_bd'); 
            document.getElementById('loginModal').classList.remove('hidden');
            document.getElementById('loginForm').reset();
            document.getElementById('userNameDisplay').innerText = '---';
            document.getElementById('userAvatarIcon').innerHTML = '<i class="fa-solid fa-user"></i>';
            if(document.getElementById('welcomeMessage')) document.getElementById('welcomeMessage').innerText = "Seja bem-vindo!";
            document.getElementById('username').focus();
            
            document.querySelectorAll('.system-card').forEach(card => card.style.display = 'flex');
        }
    }, 1000);
}

// ==========================================
// SISTEMA DE CONTROLE DE PERMISSÕES
// ==========================================
function verificarPermissoes() {
    const nomeUsuario = localStorage.getItem('latem_usuario_bd');
    if(!nomeUsuario) return; 

    const userData = CONFIG.usuarios.find(u => u.user.toLowerCase() === nomeUsuario.toLowerCase());
    if(!userData) return;

    const acessos = userData.acessos || ['*']; 
    const isAdmin = acessos.includes('*');

    const path = window.location.pathname;
    const isDashboard = path.endsWith('/') || path.endsWith('index.html') && !path.includes('sistema_');

    if(isDashboard) {
        const cards = document.querySelectorAll('.system-card');
        cards.forEach(card => {
            const href = card.getAttribute('href');
            let permitido = isAdmin;
            
            if(!isAdmin) {
                if(href.includes('pesagem_mp') && acessos.includes('pesagem_mp')) permitido = true;
                if(href.includes('pesagem_tl') && acessos.includes('pesagem_tl')) permitido = true;
                if(href.includes('identificacao_mp') && acessos.includes('id_mp')) permitido = true;
                if(href.includes('identificacao_tl') && acessos.includes('id_tl')) permitido = true;
            }

            card.style.display = permitido ? 'flex' : 'none';
        });
    } else {

        let bloqueado = false;
        if(!isAdmin) {
            if(path.includes('pesagem_mp') && !acessos.includes('pesagem_mp')) bloqueado = true;
            if(path.includes('pesagem_tl') && !acessos.includes('pesagem_tl')) bloqueado = true;
            if(path.includes('identificacao_mp') && !acessos.includes('id_mp')) bloqueado = true;
            if(path.includes('identificacao_tl') && !acessos.includes('id_tl')) bloqueado = true;
        }

        if(bloqueado) {
            document.body.innerHTML = `
                <div style="height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #0f172a; color: white; text-align: center; padding: 20px; font-family: 'Inter', sans-serif;">
                    <img src="../photos/logo-latem.png" style="max-height: 80px; margin-bottom: 20px;" onerror="this.style.display='none'">
                    <i class="fa-solid fa-lock" style="font-size: 3rem; color: #ef4444; margin-bottom: 15px;"></i>
                    <h1 style="color: #ef4444; font-size: 1.5rem; margin-bottom: 10px;">Acesso Negado</h1>
                    <p style="color: #94a3b8; line-height: 1.6;">O seu perfil de utilizador não tem permissão para aceder a este módulo da fábrica.</p>
                    <button onclick="window.location.href='../index.html'" style="margin-top:20px; padding: 10px 20px; border:none; border-radius:8px; background:var(--primary); color:white; cursor:pointer; font-weight:bold; transition:0.2s;">
                        <i class="fa-solid fa-arrow-left"></i> Voltar ao Painel
                    </button>
                </div>
            `;
            window.stop(); 
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    verificarDispositivo(); 
    
    if(typeof updateClock === 'function') updateClock();
    carregarOperador();
    
    verificarPermissoes();
    
    const loginForm = document.getElementById('loginForm');
    const loginModal = document.getElementById('loginModal');
    
    if (loginForm && loginModal) {
        
        if (typeof CONFIG !== 'undefined' && CONFIG.usuarios) {
            const userNames = CONFIG.usuarios.map(u => u.user);
            setupAutocomplete('username', userNames);
        }

        const loggedUser = localStorage.getItem('latem_usuario_bd');
        if(loggedUser) {
            loginModal.classList.add('hidden');
            if(document.getElementById('welcomeMessage')) {
                document.getElementById('welcomeMessage').innerText = "Bem-vindo(a), " + loggedUser + "!";
            }
        } else {
            loginModal.classList.remove('hidden');
            document.getElementById('username').focus();
        }

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const u = document.getElementById('username').value.trim();
            const p = document.getElementById('password').value;

            const f = CONFIG.usuarios.find(x => x.user.toLowerCase() === u.toLowerCase() && x.pass === p);

            if (f) {
                localStorage.setItem('latem_usuario_bd', f.user); 
                loginModal.classList.add('hidden');
                carregarOperador();
                
                verificarPermissoes();
                
                if(document.getElementById('welcomeMessage')) {
                    document.getElementById('welcomeMessage').innerText = "Bem-vindo(a), " + f.user + "!"; 
                }
                
                document.getElementById('loginError').classList.add('hidden');
                document.getElementById('password').value = ''; 
                if(typeof showToast === 'function') showToast("Login realizado com sucesso!", 'success');
            } else {
                document.getElementById('loginError').classList.remove('hidden'); 
                const loginBox = document.querySelector('.login-box');
                loginBox.style.transform = 'translateX(-10px)';
                setTimeout(() => loginBox.style.transform = 'translateX(10px)', 100);
                setTimeout(() => loginBox.style.transform = 'translateX(-10px)', 200);
                setTimeout(() => loginBox.style.transform = 'translateX(0)', 300);
            }
        });
    }
});