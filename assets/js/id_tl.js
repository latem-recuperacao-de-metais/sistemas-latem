// ==========================================
// BANCO DE DADOS LOCAL E ESTADO DO FORMULÁRIO
// ==========================================
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
        pesoBruto: document.getElementById('pesoBruto').value,
        pesoTara: document.getElementById('pesoTara').value
    };
    localStorage.setItem('latem_id_tl_estado', JSON.stringify(state));
}

function loadFormState() {
    const state = JSON.parse(localStorage.getItem('latem_id_tl_estado'));
    if(state) {
        ['liga','loteFornada','forno','polegada','comprimento','quantidade','pesoBruto','pesoTara'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.value = state[id] || '';
        });
        document.getElementById('tipo').value = state.tipo || 'Lingote';
        toggleCamposTarugo();
    }
}

document.querySelector('.form-section').addEventListener('input', saveFormState);
document.querySelector('.weight-controls').addEventListener('input', saveFormState);

// ==========================================
// INTERFACE E CÁLCULOS MATEMÁTICOS
// ==========================================
document.getElementById('liga').addEventListener('input', (e) => { 
    const val = e.target.value.toUpperCase(); 
    const tipoSelect = document.getElementById('tipo'); 
    if(val.startsWith('AA') || val === 'LIGA T' || val.includes('TARUGO')) { 
        tipoSelect.value = 'Tarugo'; 
    } else if(val.startsWith('SAE') || val === 'INDUSTRIAL' || val.includes('LINGOTE')) { 
        tipoSelect.value = 'Lingote'; 
    } 
    toggleCamposTarugo(); 
    saveFormState();
});

function toggleCamposTarugo() { 
    const isTarugo = document.getElementById('tipo').value === 'Tarugo'; 
    document.getElementById('camposTarugo').classList.toggle('hidden', !isTarugo); 
    
    const q = document.getElementById('quantidade'); 
    if(isTarugo) { 
        q.value = ''; 
        q.readOnly = true; 
    } else { 
        q.readOnly = false; 
    } 
    calcularPesos(); 
}

function calcularPesos() { 
    const b = parseFloat(document.getElementById('pesoBruto').value) || 0;
    const t = parseFloat(document.getElementById('pesoTara').value) || 0;
    const l = Math.max(0, b - t); 
    
    document.getElementById('pesoLiquido').value = l > 0 ? l.toFixed(1) : ''; 
    const d = document.getElementById('displayLiquido');
    if(d) {
        d.innerText = l > 0 ? l.toFixed(1) : '0'; 
        d.style.color = l < 0 ? 'var(--danger)' : '';
    }
    
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
        } else { 
            q.value = ''; 
        }
    } else { 
        q.readOnly = false; 
    } 
    
    saveFormState();
}

// ==========================================
// BLOQUEIOS E LIMPEZA DE DADOS
// ==========================================
function lockFields() {
    const t = document.getElementById('tipo').value; 
    ['liga','loteFornada'].forEach(id => document.getElementById(id).disabled = true); 
    if(t === 'Tarugo') { 
        ['forno','polegada','comprimento'].forEach(id => document.getElementById(id).disabled = true); 
    }
}

function unlockFields() { 
    ['liga','loteFornada','forno','polegada','comprimento'].forEach(id => document.getElementById(id).disabled = false); 
}

function limparParcial() {
    document.getElementById('pesoTara').value = '';
    document.getElementById('pesoBruto').value = '';
    document.getElementById('quantidade').value = document.getElementById('tipo').value === 'Lingote' ? '0' : '';
    calcularPesos();
}

function limparTudoCompleto() {
    unlockFields();
    ['loteFornada', 'liga', 'forno', 'polegada', 'comprimento', 'pesoBruto', 'pesoTara'].forEach(id => { 
        const el = document.getElementById(id); if (el) el.value = ''; 
    });
    document.getElementById('tipo').value = 'Lingote';
    document.getElementById('quantidade').value = '0';
    toggleCamposTarugo();
    saveFormState();
}

function limparTudo() {
    const a = getDb().length > 0;
    const b = document.getElementById('pesoBruto').value;
    const t = document.getElementById('pesoTara').value;
    const q = document.getElementById('quantidade').value;
    const lf = document.getElementById('loteFornada').value;
    const lg = document.getElementById('liga').value;
    const fo = document.getElementById('forno').value;
    const pol = document.getElementById('polegada').value;
    const comp = document.getElementById('comprimento').value;

    if (a) {
        if (!t && (!q || q==='0' || q==='') && (!b || b==='0')) return showToast("Os campos parciais já estão vazios.", "warning");
        limparParcial();
        showToast("Campos parciais limpos com sucesso.", "success");
    } else {
        if (!lf && !lg && !fo && !pol && !comp && !t && (!q || q==='0' || q==='') && (!b || b==='0')) return showToast("O formulário já está vazio.", "warning");
        limparTudoCompleto();
        showToast("Todos os campos limpos com sucesso.", "success");
    }
    saveFormState();
}

// ==========================================
// PROCESSAR A IDENTIFICAÇÃO E ETIQUETAS
// ==========================================
function realizarIdentificacao() { 
    const lote = document.getElementById('loteFornada').value;
    const liga = document.getElementById('liga').value;
    const tipo = document.getElementById('tipo').value;
    const qtd = parseInt(document.getElementById('quantidade').value) || 0;
    const b = parseFloat(document.getElementById('pesoBruto').value) || 0;
    const ta = parseFloat(document.getElementById('pesoTara').value) || 0;
    const l = parseFloat(document.getElementById('pesoLiquido').value) || 0; 
    
    if(!lote || !liga || b <= 0 || qtd <= 0) return showToast("Preencha campos obrigatórios e verifique a quantidade/peso.", "warning"); 
    if(tipo === 'Tarugo') {
        if(!document.getElementById('forno').value || !document.getElementById('polegada').value || !document.getElementById('comprimento').value) {
            return showToast("Para Tarugo, preencha Forno, Polegada e Comprimento.", "warning");
        }
    }
    
    const i = {
        id: Date.now(), data: new Date().toLocaleDateString('pt-BR'), hora: new Date().toLocaleTimeString('pt-BR'),
        lote, liga, tipo, qtd, bruto: b, tara: ta, liq: l, 
        forno: tipo === 'Tarugo' ? document.getElementById('forno').value : '', 
        polegada: tipo === 'Tarugo' ? document.getElementById('polegada').value : '', 
        comprimento: tipo === 'Tarugo' ? document.getElementById('comprimento').value : '', 
        responsavel: currentUser
    }; 
    
    const db = getDb(); db.unshift(i); saveDb(db); 
    lockFields(); 
    
    renderEtiquetas(i); 
    limparParcial();
    showToast("Identificação registada com sucesso!", "success"); 
}

function renderEtiquetas(r) {
    const area = document.getElementById('etiquetaScrollArea');
    if(!area) return;
    
    area.innerHTML = `
        <div class="etiqueta-individual">
            <div style="text-align:center;border-bottom:2px solid black;padding-bottom:1mm;margin-bottom:1mm">
                <img src="../photos/logo-latem.png" style="max-height:8mm;margin-bottom:1mm" onerror="this.style.display='none'">
                <div style="font-size:10px;font-weight:bold;letter-spacing:1px">COMPROVANTE DE IDENTIFICAÇÃO</div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:10px;line-height:1.4;margin-bottom:2px;">
                <div style="text-align:left;width:48%">
                    <div><strong>Liga:</strong> ${r.liga}</div>
                    <div style="margin-top:2px"><strong>Lote + Fornada *:</strong> ${r.lote}</div>
                    <div style="margin-top:2px"><strong>Tipo:</strong> ${r.tipo.toUpperCase()}</div>
                </div>
                <div style="text-align:right;width:50%">
                    ${r.tipo === 'Tarugo' ? `
                    <div><strong>Forno:</strong> ${r.forno}</div>
                    <div style="margin-top:2px"><strong>Polegada:</strong> ${r.polegada}"</div>
                    <div style="margin-top:2px"><strong>Comprimento:</strong> ${r.comprimento}m</div>` : ''}
                </div>
            </div>
            <div style="margin-top:auto;border-top:1px dashed #000;border-bottom:1px dashed #000;padding:2mm 0;text-align:center;font-size:10px">
                <div style="display:flex;justify-content:space-between">
                    <span>Peso Bruto: ${r.bruto} kg</span>
                    <span>Tara: ${r.tara} kg</span>
                </div>
                <div style="font-size:16px;font-weight:bold;margin:2mm 0">Peso Líquido: ${r.liq} kg</div>
                <div style="font-size:12px;font-weight:bold;margin-top:1px;">Quantidade: ${r.qtd}</div>
            </div>
            <div style="margin-top:2mm;text-align:center">
                <div style="font-family:'Libre Barcode 128',cursive;font-size:32px">*${r.lote}*</div>
            </div>
            <div style="margin-top:3px;border-top:1px solid black;padding-top:2px;text-align:center;font-size:8px;font-weight:bold;">
                DATA: ${r.data} | HORA: ${r.hora} | RESPONSÁVEL: ${r.responsavel.toUpperCase()}
            </div>
        </div>`;

    const modal = document.getElementById('etiquetaModal');
    if(modal) modal.style.display = 'flex';
}

// ==========================================
// TABELA E EXCLUSÃO
// ==========================================
let itemParaRemover = null; 
function pedirRemocao(id) { itemParaRemover = id; document.getElementById('confirmModal').classList.remove('hidden'); } 
function fecharConfirmacao() { itemParaRemover = null; document.getElementById('confirmModal').classList.add('hidden'); } 
function confirmarExclusao() { 
    if(itemParaRemover !== null) { 
        let d = getDb().filter(i => i.id !== itemParaRemover); 
        saveDb(d); 
        if(d.length === 0) unlockFields(); 
        showToast("Registo removido.", "info"); 
        itemParaRemover = null; 
    } 
    document.getElementById('confirmModal').classList.add('hidden'); 
}

function renderHistory() {
    const b = document.querySelector('#historyTable tbody'); 
    if(!b) return;
    b.innerHTML = ''; 
    const d = getDb();
    
    d.slice(0, 15).forEach((i, idx) => {
        const num = d.length - idx; 
        b.innerHTML += `<tr>
            <td style="text-align:center">${num}</td>
            <td style="text-align:center;font-weight:bold">${i.qtd}</td>
            <td style="text-align:right;font-weight:bold;color:var(--primary)">${i.liq} kg</td>
            <td style="text-align:right">${i.tara} kg</td>
            <td style="text-align:right">${i.bruto} kg</td>
            <td style="text-align:center"><button class="btn-danger" style="padding:5px 8px;height:auto" onclick="pedirRemocao(${i.id})"><i class="fa-solid fa-trash"></i></button></td>
        </tr>`;
    });
}

// ==========================================
// RELATÓRIO PDF (COM SOMAS E Nº)
// ==========================================
function gerarRelatorio(){ 
    const db=getDb(); 
    if(!db.length) return showToast("Sem dados para relatório.","warning"); 
    
    let rw='', tb=0, tt=0, tl=0, qtdTotal=0; 
    const t = db[0].tipo === 'Tarugo'; 
    
    const dbReverso = db.slice().reverse();
    
    dbReverso.forEach((i, idx)=>{
        tb += parseFloat(i.bruto);
        tt += parseFloat(i.tara);
        tl += parseFloat(i.liq);
        qtdTotal += parseInt(i.qtd || 0);
        
        rw += `<tr>
            <td style="text-align:center">${idx + 1}</td>
            <td style="text-align:center">${i.qtd}</td>
            <td style="text-align:right">${i.bruto}</td>
            <td style="text-align:right">${i.tara}</td>
            <td style="text-align:right;font-weight:bold">${i.liq}</td>
        </tr>`;
    }); 
    
    const horaStr = new Date().toLocaleTimeString('pt-BR').replace(/:/g, '-');
    const filename = `RILT_${new Date().toLocaleDateString('pt-BR').replace(/\//g,'-')}_${horaStr}_${db[0].liga}_${db[0].lote.replace(/[\/\\]/g,'-')}_${qtdTotal}un_${tl.toFixed(2)}kg`; 
    
    const conteudoHTML = `
        <div style="display: flex; justify-content: space-between; border: 1px solid #ccc; padding: 15px; margin-bottom: 20px; background: #f9f9f9; font-size:14px;">
            <div style="text-align: left;">
                <div><strong>Liga:</strong> ${db[0].liga}</div>
                <div style="margin-top:4px"><strong>Lote + Fornada *:</strong> ${db[0].lote}</div>
                <div style="margin-top:4px"><strong>Tipo:</strong> ${db[0].tipo.toUpperCase()}</div>
            </div>
            ${t ? `
            <div style="text-align: right;">
                <div><strong>Forno:</strong> ${db[0].forno}</div>
                <div style="margin-top:4px"><strong>Polegada:</strong> ${db[0].polegada}"</div>
                <div style="margin-top:4px"><strong>Comprimento:</strong> ${db[0].comprimento}m</div>
            </div>` : ''}
        </div>
        <div style="display: flex; justify-content: space-around; align-items: center; border: 1px solid #ccc; padding: 15px; margin-bottom: 20px; background: #f9f9f9; font-size:15px; font-weight: bold;">
            <span>Qtd Total: ${qtdTotal} un</span>
            <span style="color:#ccc">|</span>
            <span>P. Bruto Total: ${tb.toFixed(2)} kg</span>
            <span style="color:#ccc">|</span>
            <span>Tara Total: ${tt.toFixed(2)} kg</span>
            <span style="color:#ccc">|</span>
            <span>P. Líquido Total: ${tl.toFixed(2)} kg</span>
        </div>
        <table>
            <thead>
                <tr>
                    <th style="text-align:center;width:10%">Nº</th>
                    <th style="text-align:center;width:15%">Quantidade</th>
                    <th style="text-align:right;width:25%">Peso Bruto (kg)</th>
                    <th style="text-align:right;width:25%">Tara (kg)</th>
                    <th style="text-align:right;width:25%">Peso Líquido (kg)</th>
                </tr>
            </thead>
            <tbody>${rw}</tbody>
        </table>
    `; 
    
    baixarArquivoRelatorio("Relatório de Identificação de Tarugos e Lingotes", conteudoHTML, filename, currentUser);
    
    localStorage.removeItem('latem_id_tl_bd');
    localStorage.removeItem('latem_id_tl_estado');
    unlockFields();
    renderHistory();
    limparTudoCompleto();
}

// ==========================================
// INICIALIZAÇÃO
// ==========================================
window.onload = () => { 
    setupAutocomplete('liga', CONFIG.ligas);
    setupAutocomplete('forno', CONFIG.fornos);
    setupAutocomplete('polegada', CONFIG.polegadas);
    
    loadFormState();
    
    const d = getDb(); 
    if(d.length > 0) {
        const l = d[0];
        document.getElementById('liga').value = l.liga;
        document.getElementById('loteFornada').value = l.lote;
        document.getElementById('tipo').value = l.tipo;
        if(l.tipo === 'Tarugo') {
            document.getElementById('forno').value = l.forno || '';
            document.getElementById('polegada').value = l.polegada || '';
            document.getElementById('comprimento').value = l.comprimento || '';
        }
        toggleCamposTarugo();
        lockFields(); 
        showToast("Atenção: Identificação em andamento restaurada.", "info");
    } 
    
    renderHistory(); 
};
