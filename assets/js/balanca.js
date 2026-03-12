// ==========================================
// VARIÁVEIS GLOBAIS DA BALANÇA
// ==========================================
let scaleConnected = false;
let serialPort = null;
let serialReader = null;
let keepReading = false;

let lastWeight = -1;
let stableTimer = null;
let isStable = false;

// ==========================================
// DESCONEXÃO SEGURA AO FECHAR A PÁGINA
// ==========================================
window.addEventListener('beforeunload', async () => {
    if (scaleConnected) {
        keepReading = false;
        if (serialReader) await serialReader.cancel().catch(e => console.log(e));
        if (serialPort) await serialPort.close().catch(e => console.log(e));
        localStorage.removeItem('latem_balanca_bd');
    }
});

// ==========================================
// CONECTAR / DESCONECTAR BALANÇA
// ==========================================
async function conectarBalanca() {
    if (scaleConnected) {
        keepReading = false;
        if (serialReader) await serialReader.cancel().catch(e => console.log(e));
        if (serialPort) await serialPort.close().catch(e => console.log(e));
        scaleConnected = false;
        localStorage.removeItem('latem_balanca_bd');
        updateStatus(false);
        showToast('Balança desconectada.', 'info');
        return;
    }

    if (!('serial' in navigator)) {
        return showToast('O seu navegador não suporta conexão com a balança.', 'error');
    }

    try {
        serialPort = await navigator.serial.requestPort();
        await serialPort.open({ baudRate: 9600 });
        scaleConnected = true;
        keepReading = true;
        localStorage.setItem('latem_balanca_bd', 'true');
        updateStatus(true);
        showToast('Balança conectada com sucesso!', 'success');
        readSerialLoop();
    } catch (err) {
        showToast('Falha ao conectar. Confirme a porta.', 'error');
        scaleConnected = false;
        updateStatus(false);
    }
}

// ==========================================
// AUTO-CONEXÃO AO ABRIR A PÁGINA
// ==========================================
async function autoConnectScale() {
    if (!('serial' in navigator)) return;
    try {
        const ports = await navigator.serial.getPorts();
        if (ports.length > 0) {
            serialPort = ports[0];
            
            await serialPort.open({ baudRate: 9600 });
            
            scaleConnected = true;
            keepReading = true;
            
            updateStatus(true);
            
            readSerialLoop(); 
            
            showToast('Balança auto-conectada com sucesso!', 'success');
        } else if (localStorage.getItem('latem_balanca_bd') === 'true') {
            conectarBalanca();
        } else {
            atualizarStatusEstabilizacao(true, "Modo Manual");
        }
    } catch (e) {
        console.error("Erro na autoconexão:", e);
        updateStatus(false);
        atualizarStatusEstabilizacao(true, "Modo Manual");
    }
}

// ==========================================
// ATUALIZAR INTERFACE VISUAL
// ==========================================
function updateStatus(isConnected) {
    const badge = document.getElementById('scaleStatus');
    const text = document.getElementById('statusText');
    const display = document.getElementById('displayContainer');
    const inputBruto = document.getElementById('pesoBruto');

    if (isConnected) {
        if(badge) { badge.style.background = '#dcfce7'; badge.style.color = 'var(--success)'; }
        if(text) text.innerText = "Conectada";
        if(display) display.classList.remove('display-offline');
        if (inputBruto) inputBruto.readOnly = true;
        
        atualizarStatusEstabilizacao(false, "Aguardando peso...");
    } else {
        if(badge) { badge.style.background = '#fee2e2'; badge.style.color = 'var(--danger)'; }
        if(text) text.innerText = "Desconectada (Clique conectar)";
        if(display) display.classList.add('display-offline');
        if (document.getElementById('displayLiquido')) document.getElementById('displayLiquido').innerText = "----";
        if (inputBruto) {
            inputBruto.value = 0;
            inputBruto.readOnly = false;
        }
        
        atualizarStatusEstabilizacao(true, "Modo Manual");
        lastWeight = -1;
    }
}

// ==========================================
// SISTEMA DE ESTABILIZAÇÃO DE PESO
// ==========================================
function atualizarStatusEstabilizacao(stable, msg) {
    const btn = document.getElementById('btnPesar');
    const statusEl = document.getElementById('estabilizacaoStatus');
    
    if (btn) {
        btn.style.opacity = stable ? '1' : '0.5';
        btn.style.pointerEvents = stable ? 'auto' : 'none';
    }

    if (statusEl) {
        if (msg.includes("Modo Manual")) {
            statusEl.innerText = "";
        } else {
            statusEl.innerText = msg;
            statusEl.style.color = stable ? 'var(--success)' : 'var(--warning)';
        }
    }
    isStable = stable;
}

function processarNovoPeso(peso) {
    const inputBruto = document.getElementById('pesoBruto');
    if (inputBruto) inputBruto.value = peso;
    
    if (typeof calcularPesos === 'function') {
        calcularPesos();
    }

    if (peso !== lastWeight) {
        lastWeight = peso;
        atualizarStatusEstabilizacao(false, "Aguardando estabilização...");
        
        clearTimeout(stableTimer);
        
        stableTimer = setTimeout(() => {
            atualizarStatusEstabilizacao(true, "Peso Estável!");
        }, 1500);
    }
}

// ==========================================
// LOOP DE LEITURA DA PORTA SERIAL
// ==========================================
async function readSerialLoop() {
    const textDecoder = new TextDecoderStream();
    serialPort.readable.pipeTo(textDecoder.writable);
    const reader = textDecoder.readable.getReader();
    serialReader = reader;
    let buffer = '';

    try {
        while (keepReading) {
            const { value, done } = await reader.read();
            if (done) break;
            
            if (value) {
                buffer += value;
                if (buffer.includes('\r') || buffer.includes('\n')) {
                    const lines = buffer.split(/[\r\n]+/);
                    const lastData = lines.filter(x => x.trim().length > 0).pop();
                    
                    if (lastData) {
                        const match = lastData.match(/(\d+(\.\d+)?)/);
                        if (match && match[0]) {
                            processarNovoPeso(parseFloat(match[0]));
                        }
                    }
                    buffer = '';
                }
            }
        }
    } catch (e) {
        showToast('Erro de hardware. Balança desconectada.', 'error');
        scaleConnected = false;
        updateStatus(false);
    } finally {
        reader.releaseLock();
    }
}
