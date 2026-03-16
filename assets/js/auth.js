function verificarDispositivo() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isSmallScreen = window.innerWidth <= 800;

    if (isMobile || isSmallScreen) {
        document.body.innerHTML = `
            <div style="height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #0f172a; color: white; text-align: center; padding: 20px; font-family: 'Inter', sans-serif;">
                <img src="${window.location.pathname.includes('sistema_') ? '../' : ''}photos/logo-latem.png" style="max-height: 80px; margin-bottom: 20px;">
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
        }
    }, 1000);
}

document.addEventListener('DOMContentLoaded', () => {
    verificarDispositivo(); 
    
    if(typeof updateClock === 'function') updateClock();
    carregarOperador();
    
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
