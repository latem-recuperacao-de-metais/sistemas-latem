function getDb() { return JSON.parse(localStorage.getItem('latem_id_tl_bd')) || []; } 
function saveDb(db) { localStorage.setItem('latem_id_tl_bd', JSON.stringify(db)); renderHistory(); }

function saveFormState() {
    const state = {
        liga: document.getElementById('liga').value,
        loteFornada: document.getElementById('loteFornada').value,
        tipo: document.getElementById('tipo').value,
        forno: document.getElementById('forno').value,
        polegada: document.getElementById('polegada').value,
        comprimento: document.getElementById('comprimento').value,
        quantidade: document.getElementById('quantidade').value,
        pesoBruto: document.getElementById('pesoBruto').value
    };
    localStorage.setItem('latem_id_tl_estado', JSON.stringify(state));
}

function loadFormState() {
    const state = JSON.parse(localStorage.getItem('latem_id_tl_estado'));
    if(state) {
        ['liga','loteFornada','forno','polegada','comprimento','quantidade','pesoBruto'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.value = state[id] || '';
        });
        document.getElementById('tipo').value = state.tipo || 'Lingote';
        toggleCamposTarugo();
    }
}

document.querySelector('.form-section').addEventListener('input', saveFormState);
document.querySelector('.weight-controls').addEventListener('input', saveFormState);

document.getElementById('liga').addEventListener('input', (e) => { 
    const val = e.target.value.toUpperCase(); 
    const tipoSelect = document.getElementById('tipo'); 
    if(val.startsWith('AA') || val === 'LIGA T' || val.includes('TARUGO')) { tipoSelect.value = 'Tarugo'; } 
    else if(val.startsWith('SAE') || val === 'INDUSTRIAL' || val.includes('LINGOTE')) { tipoSelect.value = 'Lingote'; } 
    toggleCamposTarugo(); saveFormState();
});

function toggleCamposTarugo() { 
    const isTarugo = document.getElementById('tipo').value === 'Tarugo'; 
    document.getElementById('camposTarugo').classList.toggle('hidden', !isTarugo); 
    const q = document.getElementById('quantidade'); 
    if(isTarugo) { q.value = ''; q.readOnly = true; } else { q.readOnly = false; } 
    calcularPesos(); 
}

function calcularPesos() { 
    const l = parseFloat(document.getElementById('pesoBruto').value) || 0;
    const d = document.getElementById('displayLiquido');
    if(d) { d.innerText = l > 0 ? l.toFixed(1) : '0'; d.style.color = ''; }
    
    const isTarugo = document.getElementById('tipo').value === 'Tarugo'; 
    const q = document.getElementById('quantidade'); 
    
    if(isTarugo) {
        const pol = parseFloat(document.getElementById('polegada').value) || 0;
        const comp = parseFloat(document.getElementById('comprimento').value) || 0; 
        if(l > 0 && pol > 0 && comp > 0) {
            const raio = (pol * 0.0254) / 2;
            const volume = Math.PI * Math.pow(raio, 2) * comp;
            const pesoPeca = volume * 2700; 
            q.value = Math.max(1, Math.round(l / pesoPeca)); 
            q.readOnly = true;
        } else { q.value = ''; }
    } else { q.readOnly = false; } 
    saveFormState();
}

function lockFields() {
    const t = document.getElementById('tipo').value; 
    ['liga','loteFornada'].forEach(id => document.getElementById(id).disabled = true); 
    if(t === 'Tarugo') { ['forno','polegada','comprimento'].forEach(id => document.getElementById(id).disabled = true); }
}

function unlockFields() { 
    ['liga','loteFornada','forno','polegada','comprimento'].forEach(id => document.getElementById(id).disabled = false); 
}

function limparParcial() {
    document.getElementById('pesoBruto').value = '';
    document.getElementById('quantidade').value = document.getElementById('tipo').value === 'Lingote' ? '0' : '';
    calcularPesos();
}

function limparTudoCompleto() {
    unlockFields();
    ['loteFornada', 'liga', 'forno', 'polegada', 'comprimento', 'pesoBruto'].forEach(id => { 
        const el = document.getElementById(id); if (el) el.value = ''; 
    });
    document.getElementById('tipo').value = 'Lingote'; document.getElementById('quantidade').value = '0';
    toggleCamposTarugo(); saveFormState();
}

function limparTudo() {
    const a = getDb().length > 0;
    const b = document.getElementById('pesoBruto').value;
    const q = document.getElementById('quantidade').value;
    const lf = document.getElementById('loteFornada').value;
    const lg = document.getElementById('liga').value;
    const fo = document.getElementById('forno').value;

    if (a) {
        // CORREÇÃO: Verifica se os parciais já estão vazios
        if ((!q || q==='0' || q==='') && (!b || b==='0')) return showToast("Os campos parciais já estão vazios.", "warning");
        limparParcial(); 
        showToast("Campos parciais limpos.", "success");
    } else {
        if (!lf && !lg && !fo && (!q || q==='0' || q==='') && (!b || b==='0')) return showToast("O formulário já está vazio.", "warning");
        limparTudoCompleto(); 
        showToast("Todos os campos limpos com sucesso.", "success");
    }
}

function realizarIdentificacao() { 
    const lote = document.getElementById('loteFornada').value;
    const liga = document.getElementById('liga').value;
    const tipo = document.getElementById('tipo').value;
    const qtd = parseInt(document.getElementById('quantidade').value) || 0;
    const b = parseFloat(document.getElementById('pesoBruto').value) || 0;
    
    if(!lote || !liga || b <= 0 || qtd <= 0) return showToast("Preencha campos obrigatórios e verifique a quantidade/peso.", "warning"); 
    if(tipo === 'Tarugo' && (!document.getElementById('forno').value || !document.getElementById('polegada').value || !document.getElementById('comprimento').value)) {
        return showToast("Para Tarugo, preencha Fornada, Polegada e Comprimento.", "warning");
    }
    
    const i = {
        id: Date.now(), data: new Date().toLocaleDateString('pt-BR'), hora: new Date().toLocaleTimeString('pt-BR'),
        lote, liga, tipo, qtd, peso: b, 
        forno: tipo === 'Tarugo' ? document.getElementById('forno').value : '', 
        polegada: tipo === 'Tarugo' ? document.getElementById('polegada').value : '', 
        comprimento: tipo === 'Tarugo' ? document.getElementById('comprimento').value : '', 
        responsavel: currentUser
    }; 
    
    const db = getDb(); db.unshift(i); saveDb(db); lockFields(); 
    renderEtiquetas(i); limparParcial(); showToast("Identificação registada com sucesso!", "success"); 
}

function renderEtiquetas(r) {
    const area = document.getElementById('etiquetaScrollArea');
    if(!area) return;
    const pesoExibicao = r.peso || r.bruto;
    
    area.innerHTML = `
        <div class="etiqueta-individual" style="padding:2mm; display:block !important; height:auto !important; max-height:none !important; border:none !important; box-sizing:border-box; page-break-after: avoid !important; font-weight: bold !important; color: black;">
            <div style="text-align:center;border-bottom:2px solid black;padding-bottom:1mm;margin-bottom:1mm">
                <img src="../photos/logo-latem.png" style="max-height:8mm;display:block;margin:0 auto 1mm auto" onerror="this.style.display='none'">
                <span style="font-size:10px;display:block;letter-spacing:1px">COMPROVANTE DE IDENTIFICAÇÃO</span>
            </div>
            <div style="font-size:10px;line-height:1.4;display:flex;justify-content:space-between;margin-bottom:2px;">
                <div style="text-align:left;width:48%">
                    <div>Liga: ${r.liga}</div>
                    <div style="margin-top:2px">Lote: ${r.lote}</div>
                    <div style="margin-top:2px">Tipo: ${r.tipo.toUpperCase()}</div>
                </div>
                <div style="text-align:right;width:50%">
                    ${r.tipo === 'Tarugo' ? `
                    <div>Fornada: ${r.forno}</div>
                    <div style="margin-top:2px">Polegada: ${r.polegada}"</div>
                    <div style="margin-top:2px">Compr.: ${r.comprimento}m</div>` : ''}
                </div>
            </div>
            <div style="text-align:center;border-top:2px dashed #000;border-bottom:2px dashed #000;padding:3mm 0;margin:2mm 0;">
                <div style="font-size:16px;margin-bottom:2px;">Peso: ${pesoExibicao} kg</div>
                <div style="font-size:16px;">Quantidade: ${r.qtd}</div>
            </div>
            <div style="text-align:center;margin-top:2mm;">
                <div style="font-family:'Libre Barcode 128',cursive;font-size:32px;line-height:1;font-weight:normal !important;">*${r.lote}*</div>
                <div style="margin-top:2mm;border-top:1px solid black;padding-top:1mm;font-size:8px;">
                    DATA: ${r.data} | HORA: ${r.hora} | RESP.: ${r.responsavel.toUpperCase()}
                </div>
            </div>
        </div>`;

    const modal = document.getElementById('etiquetaModal');
    if(modal) modal.style.display = 'flex';
}

let itemParaRemover = null; 
function pedirRemocao(id) { itemParaRemover = id; document.getElementById('confirmModal').classList.remove('hidden'); } 
function fecharConfirmacao() { itemParaRemover = null; document.getElementById('confirmModal').classList.add('hidden'); } 
function confirmarExclusao() { 
    if(itemParaRemover !== null) { 
        let d = getDb().filter(i => i.id !== itemParaRemover); saveDb(d); 
        if(d.length === 0) unlockFields(); showToast("Registo removido.", "info"); itemParaRemover = null; 
    } 
    document.getElementById('confirmModal').classList.add('hidden'); 
}

function renderHistory() {
    const b = document.querySelector('#historyTable tbody'); 
    if(!b) return; b.innerHTML = ''; const d = getDb();
    d.slice(0, 15).forEach((i, idx) => {
        const num = d.length - idx; const pesoExibicao = i.peso || i.bruto;
        b.innerHTML += `<tr>
            <td style="text-align:center">${num}</td><td style="text-align:center;font-weight:bold">${i.qtd}</td>
            <td style="text-align:right;font-weight:bold;color:var(--primary)">${pesoExibicao} kg</td>
            <td style="text-align:center"><button class="btn-danger" style="padding:5px 8px;height:auto" onclick="pedirRemocao(${i.id})"><i class="fa-solid fa-trash"></i></button></td>
        </tr>`;
    });
}

function gerarRelatorio(){ 
    const db=getDb(); if(!db.length) return showToast("Sem dados para relatório.","warning"); 
    let rw='', tb=0, qtdTotal=0; const t = db[0].tipo === 'Tarugo'; 
    const dbReverso = db.slice().reverse();
    dbReverso.forEach((i, idx)=>{
        const p = parseFloat(i.peso || i.bruto); tb += p; qtdTotal += parseInt(i.qtd || 0);
        rw += `<tr><td style="text-align:center">${idx + 1}</td><td style="text-align:center">${i.qtd}</td><td style="text-align:right;font-weight:bold">${p}</td></tr>`;
    }); 
    const horaStr = new Date().toLocaleTimeString('pt-BR').replace(/:/g, '-');
    const filename = `RILT_${new Date().toLocaleDateString('pt-BR').replace(/\//g,'-')}_${horaStr}_${db[0].liga}_${db[0].lote.replace(/[\/\\]/g,'-')}_${qtdTotal}un_${tb.toFixed(2)}kg`; 
    const conteudoHTML = `
        <div style="display: flex; justify-content: space-between; border: 1px solid #ccc; padding: 15px; margin-bottom: 20px; background: #f9f9f9; font-size:14px;">
            <div style="text-align: left;">
                <div><strong>Liga:</strong> ${db[0].liga}</div><div style="margin-top:4px"><strong>Lote:</strong> ${db[0].lote}</div><div style="margin-top:4px"><strong>Tipo:</strong> ${db[0].tipo.toUpperCase()}</div>
            </div>
            ${t ? `<div style="text-align: right;"><div><strong>Fornada:</strong> ${db[0].forno}</div><div style="margin-top:4px"><strong>Polegada:</strong> ${db[0].polegada}"</div><div style="margin-top:4px"><strong>Comprimento:</strong> ${db[0].comprimento}m</div></div>` : ''}
        </div>
        <div style="display: flex; justify-content: space-around; align-items: center; border: 1px solid #ccc; padding: 15px; margin-bottom: 20px; background: #f9f9f9; font-size:15px; font-weight: bold;">
            <span>Qtd Total: ${qtdTotal} un</span><span style="color:#ccc">|</span><span>Peso Total: ${tb.toFixed(2)} kg</span>
        </div>
        <table><thead><tr><th style="text-align:center;width:15%">Nº</th><th style="text-align:center;width:35%">Quantidade</th><th style="text-align:right;width:50%">Peso (kg)</th></tr></thead><tbody>${rw}</tbody></table>
    `; 
    baixarArquivoRelatorio("Relatório de Identificação de Tarugos e Lingotes", conteudoHTML, filename, currentUser);
    localStorage.removeItem('latem_id_tl_bd'); localStorage.removeItem('latem_id_tl_estado');
    unlockFields(); renderHistory(); limparTudoCompleto();
}

window.onload = () => { 
    setupAutocomplete('liga', CONFIG.ligas); setupAutocomplete('polegada', CONFIG.polegadas);
    loadFormState();
    const d = getDb(); 
    if(d.length > 0) {
        const l = d[0]; document.getElementById('liga').value = l.liga; document.getElementById('loteFornada').value = l.lote; document.getElementById('tipo').value = l.tipo;
        if(l.tipo === 'Tarugo') { document.getElementById('forno').value = l.forno || ''; document.getElementById('polegada').value = l.polegada || ''; document.getElementById('comprimento').value = l.comprimento || ''; }
        toggleCamposTarugo(); lockFields(); showToast("Atenção: Identificação em andamento restaurada.", "info");
    } 
    renderHistory(); 
};