const msalConfig = {
    auth: {
        clientId: "4579a8e7-c8c1-48bc-987d-e53e2eb5e6f4",
        authority: "https://login.microsoftonline.com/4077fdb4-c6bf-4b89-a469-5f17eb5b7f2b",
        redirectUri: window.location.origin + window.location.pathname
    }
};

const msalInstance = new msal.PublicClientApplication(msalConfig);
const excelScopes = { scopes: ["User.Read", "Files.ReadWrite.All", "Sites.ReadWrite.All"] };

const COL = { LIGA: 3, LOTE: 4, POLEGADA: 5, BARRAS: 6, COMPRIMENTO: 7, FORNADA: 12, STATUS: 22 };

window.dadosExcel = []; 
let urlOficialExcel = ""; 

async function getExcelUrlSegura(token) {
    if (urlOficialExcel) return urlOficialExcel;
    
    try {
        let res = await fetch(`https://graph.microsoft.com/v1.0/sites/latemmetais.sharepoint.com:/sites/TarefasSuporte:/drive`, { 
            headers: { 'Authorization': `Bearer ${token}` } 
        });
        let drive = await res.json();
        if (drive.error) throw new Error(drive.error.message);

        res = await fetch(`https://graph.microsoft.com/v1.0/drives/${drive.id}/root:/Forno%2030t.xlsx`, { 
            headers: { 'Authorization': `Bearer ${token}` } 
        });
        let file = await res.json();
        if (file.error) throw new Error(file.error.message);

        urlOficialExcel = `https://graph.microsoft.com/v1.0/drives/${drive.id}/items/${file.id}/workbook/worksheets('HO')/tables('TabelaHO')`;
        return urlOficialExcel;
    } catch(e) {
        throw e;
    }
}

async function loginEConectarExcel() {
    try {
        await msalInstance.handleRedirectPromise();
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length === 0) {
            await msalInstance.loginRedirect(excelScopes);
            return; 
        }
        await puxarLotesAbertos();
    } catch (error) {
    }
}

async function getToken() {
    const account = msalInstance.getAllAccounts()[0];
    try {
        const response = await msalInstance.acquireTokenSilent({ ...excelScopes, account: account });
        return response.accessToken;
    } catch (err) {
        await msalInstance.acquireTokenRedirect(excelScopes);
    }
}

async function puxarLotesAbertos() {
    try {
        const token = await getToken();
        if(!token) return;

        const url = await getExcelUrlSegura(token);
        
        const response = await fetch(`${url}/rows`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if(!response.ok) throw new Error("Erro na leitura");
        const data = await response.json();
        
        window.dadosExcel = [];
        const lotesParaCaixa = [];

        if(data.value) {
            data.value.forEach((row, index) => {
                const vals = row.values[0];
                const status = vals[COL.STATUS] ? vals[COL.STATUS].toString().trim() : '';
                
                if (status === '') {
                    const loteObj = {
                        rowIndex: index, 
                        liga: vals[COL.LIGA] || '',
                        lote: vals[COL.LOTE] || '',
                        polegada: vals[COL.POLEGADA] || '',
                        barrasTarget: parseInt(vals[COL.BARRAS]) || 0,
                        forno: vals[COL.FORNADA] || '', 
                        comprimento: vals[COL.COMPRIMENTO] || ''
                    };
                    window.dadosExcel.push(loteObj);
                    if(loteObj.lote) lotesParaCaixa.push(loteObj.lote.toString());
                }
            });

            setupAutocomplete('loteFornada', lotesParaCaixa);
            if(typeof showToast === 'function') showToast("Planilha de Produção sincronizada!", "success");
        }
    } catch (error) {
    }
}

async function atualizarStatusExcel(loteNumero, novoStatus) {
    try {
        const loteData = window.dadosExcel.find(l => l.lote.toString() === loteNumero.toString());
        if (!loteData) return; 

        const token = await getToken();
        if(!token) return;
        
        const url = await getExcelUrlSegura(token);

        
        const getRow = await fetch(`${url}/rows/itemAt(index=${loteData.rowIndex})`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const rowJson = await getRow.json();
        
        let tamanhoDaLinha = rowJson.values[0].length;
        if (tamanhoDaLinha <= COL.STATUS) tamanhoDaLinha = COL.STATUS + 1;
        
        let valoresLinha = new Array(tamanhoDaLinha).fill(null);

        valoresLinha[COL.STATUS] = novoStatus;

        const resUpdate = await fetch(`${url}/rows/itemAt(index=${loteData.rowIndex})`, {
            method: 'PATCH',
            headers: { 
                'Authorization': `Bearer ${token}`, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ values: [valoresLinha] })
        });

        if (!resUpdate.ok) {
            const erroDetalhado = await resUpdate.json();
            if(typeof showToast === 'function') showToast("Erro: O Excel impediu a gravação", "error");
        } else {
            if(typeof showToast === 'function') showToast("Lote atualizado para pesado no Excel!", "success");
        }
    } catch (error) {
        if(typeof showToast === 'function') showToast("Erro ao atualizar o Excel: " + error.message, "error");}
}