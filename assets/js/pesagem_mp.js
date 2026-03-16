function getDb() { return JSON.parse(localStorage.getItem('latem_pesagem_mp_bd')) || []; }
function saveDb(d) { localStorage.setItem('latem_pesagem_mp_bd', JSON.stringify(d)); renderHistory(); }

function saveFormState() {
    const state = {
        ticket: document.getElementById('ticket').value,
        nfe: document.getElementById('nfe').value,
        fornecedor: document.getElementById('fornecedor').value,
        material: document.getElementById('material').value,
        localizacao: document.getElementById('localizacao').value,
        unidade: document.getElementById('unidade').value,
        pesoTara: document.getElementById('pesoTara').value
    };
    localStorage.setItem('latem_pesagem_mp_estado', JSON.stringify(state));
}

function loadFormState() {
    const state = JSON.parse(localStorage.getItem('latem_pesagem_mp_estado'));
    if(state) {
        ['ticket', 'nfe', 'fornecedor', 'material', 'localizacao', 'unidade', 'pesoTara'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.value = state[id] || '';
        });
        calcularPesos();
    }
}

document.querySelector('.form-section').addEventListener('input', saveFormState);
document.querySelector('.weight-controls').addEventListener('input', saveFormState);

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
}

function lockFields() { ['ticket','nfe','fornecedor'].forEach(id => document.getElementById(id).readOnly = true); } 
function unlockFields() { ['ticket','nfe','fornecedor'].forEach(id => document.getElementById(id).readOnly = false); }

function limparParcial() {
    ['material','localizacao','unidade','pesoTara'].forEach(id => document.getElementById(id).value = '');
    if(typeof scaleConnected !== 'undefined' && !scaleConnected) document.getElementById('pesoBruto').value = '';
    calcularPesos();
    saveFormState();
}

function limparTudo() {
    const a = getDb().length > 0;
    const b = document.getElementById('pesoBruto').value;
    const l = document.getElementById('localizacao').value;
    const m = document.getElementById('material').value;
    const u = document.getElementById('unidade').value;
    const t = document.getElementById('pesoTara').value;

    if(a) {
        if(!l && !m && !u && !t && (!b || b==='0')) return showToast("Os campos parciais já estão vazios.",'warning');
        limparParcial(); 
        showToast("Campos parciais limpos.",'success');
    } else {
        const ti = document.getElementById('ticket').value;
        const n = document.getElementById('nfe').value;
        const f = document.getElementById('fornecedor').value;

        if(!ti && !n && !f && !l && !m && !u && !t && (!b || b==='0')) return showToast("O formulário já está vazio.",'warning');
        
        ['ticket','nfe','fornecedor','localizacao','material','unidade','pesoTara'].forEach(id => {
            const el = document.getElementById(id); if(el) el.value = '';
        });
        if(typeof scaleConnected !== 'undefined' && !scaleConnected) document.getElementById('pesoBruto').value = '';
        unlockFields(); 
        calcularPesos(); 
        showToast("Tudo limpo.",'success');
    }
    saveFormState();
}

function realizarPesagem() {
    const t = document.getElementById('ticket').value;
    const nfe = document.getElementById('nfe').value;
    const f = document.getElementById('fornecedor').value;
    const m = document.getElementById('material').value;
    const loc = document.getElementById('localizacao').value;
    const un = document.getElementById('unidade').value;
    const b = parseFloat(document.getElementById('pesoBruto').value) || 0;
    const ta = document.getElementById('pesoTara').value || 0;
    const l = parseFloat(document.getElementById('pesoLiquido').value) || 0;
    
    if(!t || !f || !m || !loc || !un) return showToast("Preencha todos os campos obrigatórios.", 'warning'); 
    if(b <= 0 || l <= 0) return showToast("Peso inválido.", 'warning');
    
    const r = {
        id: Date.now(), data: new Date().toLocaleDateString('pt-BR'), hora: new Date().toLocaleTimeString('pt-BR'),
        ticket: t, nfe: nfe, fornecedor: f, local: loc,
        material: m, unidade: un, bruto: b, tara: ta, liquido: l, responsavel: currentUser
    };
    
    const db = getDb(); db.unshift(r); saveDb(db); 
    lockFields(); 
    showToast("Pesagem registada com sucesso!", "success");
    
    gerarEtiqueta(r);
    limparParcial(); 
}

function gerarEtiqueta(r) {
    document.getElementById('etiquetaArea').innerHTML = `
        <div style="padding:2mm; display:block !important; height:auto !important; box-sizing:border-box; page-break-after: avoid !important; font-weight: bold !important; color: black;">
            
            <div style="text-align:center;border-bottom:2px solid black;padding-bottom:1mm;margin-bottom:1mm">
                <img src="../photos/logo-latem.png" style="max-height:8mm;display:block;margin:0 auto 1mm auto" onerror="this.style.display='none'">
                <span style="font-size:10px;display:block;letter-spacing:1px">COMPROVANTE DE PESAGEM</span>
            </div>
            
            <div style="font-size:10px;line-height:1.4;display:flex;justify-content:space-between;margin-bottom:2px;">
                <div style="text-align:left;width:48%">
                    <div>Ticket: ${r.ticket}</div>
                    <div style="margin-top:2px">Nota Fiscal: ${r.nfe || '---'}</div>
                </div>
                <div style="text-align:right;width:50%">
                    <div>Fornecedor: ${r.fornecedor}</div>
                    <div style="margin-top:2px">Material: ${r.material}</div>
                </div>
            </div>
            
            <div style="text-align:center;border-top:2px dashed #000;border-bottom:2px dashed #000;padding:3mm 0;margin:2mm 0;">
                <div style="display:flex;justify-content:space-between;margin-bottom:2px;font-size:12px;">
                    <span>Bruto: ${r.bruto} kg</span>
                    <span>Tara: ${r.tara} kg</span>
                </div>
                <div style="font-size:18px;">Peso Líquido: ${r.liquido} kg</div>
            </div>
            
            <div style="text-align:center;margin-top:2mm;">
                <div style="font-family:'Libre Barcode 128',cursive;font-size:32px;line-height:1;font-weight:normal !important;">*${r.ticket}*</div>
                <div style="margin-top:2mm;border-top:1px solid black;padding-top:1mm;font-size:8px;">
                    DATA: ${r.data} | HORA: ${r.hora} | RESP.: ${r.responsavel.toUpperCase()}
                </div>
            </div>
            
        </div>`;
    document.getElementById('etiquetaModal').style.display = 'flex';
}

let itemParaRemover = null; 
function pedirRemocao(id) { itemParaRemover = id; document.getElementById('confirmModal').classList.remove('hidden'); } 
function fecharConfirmacao() { itemParaRemover = null; document.getElementById('confirmModal').classList.add('hidden'); } 
function confirmarExclusao() { 
    if(itemParaRemover !== null) { 
        let d = getDb().filter(i => i.id !== itemParaRemover); 
        saveDb(d); 
        if(d.length === 0) unlockFields(); 
        showToast("Registo removido.","info"); 
        itemParaRemover = null;
    } 
    document.getElementById('confirmModal').classList.add('hidden'); 
}

function renderHistory() {
    const b = document.querySelector('#historyTable tbody'); 
    if(!b) return;
    b.innerHTML = '';
    const db = getDb();
    
    db.forEach((i, idx) => {
        const num = db.length - idx; 
        b.innerHTML += `<tr>
            <td style="text-align:center">${num}</td>
            <td>${i.material}</td>
            <td>${i.local||'-'}</td>
            <td style="text-align:center">${i.unidade||'-'}</td>
            <td style="text-align:right;color:var(--primary);font-weight:bold">${i.liquido} kg</td>
            <td style="text-align:right">${i.tara} kg</td>
            <td style="text-align:right">${i.bruto} kg</td>
            <td style="text-align:center"><button class="btn-danger" style="padding:5px 8px" onclick="pedirRemocao(${i.id})"><i class="fa-solid fa-trash"></i></button></td>
        </tr>`;
    });
}

function gerarRelatorio(){ 
    const db = getDb();
    if(!db.length) return showToast("Sem registos para gerar relatório.",'warning'); 
    
    let tb=0, tt=0, tl=0, rw=''; 
    const qtdTotal = db.length; 

    const dbReverso = db.slice().reverse();
    
    dbReverso.forEach((i, idx) => {
        tb += parseFloat(i.bruto||0);
        tt += parseFloat(i.tara||0);
        tl += parseFloat(i.liquido||0);
        rw += `<tr>
            <td style="text-align:center">${idx + 1}</td>
            <td>${i.material}</td>
            <td>${i.local||'-'}</td>
            <td style="text-align:center">${i.unidade||'-'}</td>
            <td style="text-align:right">${i.bruto}</td>
            <td style="text-align:right">${i.tara}</td>
            <td style="text-align:right;font-weight:bold">${i.liquido}</td>
        </tr>`;
    }); 

    const horaStr = new Date().toLocaleTimeString('pt-BR').replace(/:/g, '-');
    const filename = `RPMP_${new Date().toLocaleDateString('pt-BR').replace(/\//g,'-')}_${horaStr}_${db[0].fornecedor}_${db[0].ticket}_${tl.toFixed(2)}kg`; 
    
    const conteudoHTML = `
        <div style="display: flex; justify-content: space-between; border: 1px solid #ccc; padding: 15px; margin-bottom: 20px; background: #f9f9f9; font-size:14px;">
            <div style="text-align: left;">
                <div><strong>Ticket:</strong> ${db[0].ticket}</div>
                <div style="margin-top:4px"><strong>Nota Fiscal:</strong> ${db[0].nfe || '---'}</div>
                <div style="margin-top:4px"><strong>Fornecedor:</strong> ${db[0].fornecedor}</div>
            </div>
        </div>
        <div style="display: flex; justify-content: space-around; align-items: center; border: 1px solid #ccc; padding: 15px; margin-bottom: 20px; background: #f9f9f9; font-size:15px; font-weight: bold;">
            <span>Qtd Total: ${qtdTotal} itens</span>
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
                    <th style="text-align:center;width:8%">Nº</th>
                    <th>Material</th>
                    <th>Localização</th>
                    <th style="text-align:center">Unidade</th>
                    <th style="text-align:right">Peso Bruto (kg)</th>
                    <th style="text-align:right">Tara (kg)</th>
                    <th style="text-align:right">Peso Líquido (kg)</th>
                </tr>
            </thead>
            <tbody>${rw}</tbody>
        </table>
    `; 
    
    baixarArquivoRelatorio("Relatório de Pesagem de Matéria Prima", conteudoHTML, filename, currentUser);
    
    localStorage.removeItem('latem_pesagem_mp_bd'); 
    localStorage.removeItem('latem_pesagem_mp_estado'); 
    unlockFields();
    renderHistory();
    
    ['ticket','nfe','fornecedor','material','localizacao','unidade','pesoTara'].forEach(id => document.getElementById(id).value = '');
    if(typeof scaleConnected !== 'undefined' && !scaleConnected) document.getElementById('pesoBruto').value = '';
    calcularPesos();
}

window.onload = () => {
    setupAutocomplete('fornecedor', CONFIG.fornecedores);
    setupAutocomplete('material', CONFIG.materiais);
    setupAutocomplete('localizacao', CONFIG.locais);
    setupAutocomplete('unidade', CONFIG.unidades);
    
    loadFormState();
    renderHistory();
    
    const d = getDb();
    if(d.length > 0) {
        lockFields();
        document.getElementById('ticket').value = d[0].ticket;
        document.getElementById('nfe').value = d[0].nfe || '';
        document.getElementById('fornecedor').value = d[0].fornecedor;
        showToast("Atenção: Pesagem em andamento restaurada.", "info");
    } 
    
    if(typeof autoConnectScale === 'function') autoConnectScale();
}
