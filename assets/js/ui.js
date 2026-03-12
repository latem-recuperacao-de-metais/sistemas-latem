// ==========================================
// PREVENÇÃO DE ABAS DUPLICADAS
// ==========================================
const globalTabChannel = new BroadcastChannel('latem_trava_abas');
globalTabChannel.onmessage = (e) => {
    if(e.data === 'TEM_ALGUEM_AI') globalTabChannel.postMessage('EU_JA_ESTOU_AQUI');
    else if(e.data === 'EU_JA_ESTOU_AQUI') {
        const modal = document.getElementById('duplicateTabModal');
        if(modal) modal.classList.remove('hidden');
    }
};
setTimeout(() => globalTabChannel.postMessage('TEM_ALGUEM_AI'), 100);

// ==========================================
// RELÓGIO E DATA
// ==========================================
function updateClock(){
    const n = new Date();
    const clockEl = document.getElementById('clock');
    const dateEl = document.getElementById('date');
    if(clockEl) clockEl.innerText = n.toLocaleTimeString('pt-BR');
    if(dateEl) dateEl.innerText = n.toLocaleDateString('pt-BR');
}
setInterval(updateClock, 1000); 

// ==========================================
// NOTIFICAÇÕES (TOAST)
// ==========================================
function showToast(msg, type='success'){
    const c = document.getElementById('toast-container');
    if(!c) return;
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    let icon = type === 'error' ? 'circle-exclamation' : (type === 'warning' ? 'triangle-exclamation' : (type === 'info' ? 'circle-info' : 'check-circle'));
    t.innerHTML = `<i class="fa-solid fa-${icon}"></i> <span>${msg}</span>`; 
    c.appendChild(t);
    setTimeout(() => { 
        t.style.animation = 'fadeOut 0.5s ease-out forwards'; 
        setTimeout(() => t.remove(), 500);
    }, 3000);
}

// ==========================================
// AUTOCOMPLETAR GLOBAL
// ==========================================
function setupAutocomplete(inputId, optionsArray) {
    const input = document.getElementById(inputId);
    if(!input) return;
    input.setAttribute('autocomplete', 'off');
    const wrapper = document.createElement('div');
    wrapper.className = 'custom-autocomplete-wrapper';
    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);

    const list = document.createElement('ul');
    list.className = 'custom-autocomplete-list hidden';
    wrapper.appendChild(list);

    function showOptions(filterStr) {
        if(input.disabled || input.readOnly) return;
        list.innerHTML = '';
        const filtered = filterStr ? optionsArray.filter(o => o.toLowerCase().includes(filterStr.toLowerCase())) : optionsArray;
        if (filtered.length === 0) { list.classList.add('hidden'); return; }
        filtered.forEach(o => {
            const li = document.createElement('li');
            li.textContent = o;
            li.onmousedown = (e) => { 
                e.preventDefault(); 
                input.value = o; 
                list.classList.add('hidden'); 
                input.dispatchEvent(new Event('input')); 
            };
            list.appendChild(li);
        });
        list.classList.remove('hidden');
    }

    input.addEventListener('focus', () => showOptions(input.value));
    input.addEventListener('input', () => showOptions(input.value));
    input.addEventListener('blur', () => setTimeout(()=> list.classList.add('hidden'), 150));
}
