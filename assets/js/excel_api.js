const msalConfig = {
    auth: {
        clientId: "4579a8e7-c8c1-48bc-987d-e53e2eb5e6f4",
        authority: "https://login.microsoftonline.com/4077fdb4-c6bf-4b89-a469-5f17eb5b7f2b",
        redirectUri: window.location.origin
    }
};

const msalInstance = new msal.PublicClientApplication(msalConfig);
const excelScopes = { scopes: ["User.Read", "Files.ReadWrite.All", "Sites.ReadWrite.All"] };

const siteHost = "latemmetais.sharepoint.com";
const sitePath = "sites/TarefasSuporte";
const excelUrl = `https://graph.microsoft.com/v1.0/sites/${siteHost}:/${sitePath}:/drive/root:/Forno%2030t.xlsx:/workbook/worksheets('HO')/tables('TabelaHO')`;

const COL = { LIGA: 3, LOTE: 4, POLEGADA: 5, BARRAS: 6, COMPRIMENTO: 7, STATUS: 22 };

window.dadosExcel = []; 

async function loginEConectarExcel() {
    try {
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length === 0) {
            await msalInstance.loginPopup(excelScopes);
        }
        await puxarLotesAbertos();
    } catch (error) {
        console.error("Erro na autenticação MSAL:", error);
        if(typeof showToast === 'function') showToast("Erro ao conectar com o Microsoft 365.", "error");
    }
}

async function getToken() {
    const account = msalInstance.getAllAccounts()[0];
    try {
        const response = await msalInstance.acquireTokenSilent({ ...excelScopes, account: account });
        return response.accessToken;
    } catch (err) {
        const response = await msalInstance.acquireTokenPopup(excelScopes);
        return response.accessToken;
    }
}

async function puxarLotesAbertos() {
    try {
        const token = await getToken();
        const response = await fetch(`${excelUrl}/rows`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
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
        console.error("Erro ao puxar dados do Excel:", error);
    }
}

async function atualizarStatusExcel(loteNumero, novoStatus) {
    try {
        const loteData = window.dadosExcel.find(l => l.lote.toString() === loteNumero.toString());
        if (!loteData) return; 

        const token = await getToken();
        
        const getRow = await fetch(`${excelUrl}/rows/itemAt(index=${loteData.rowIndex})`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const rowJson = await getRow.json();
        let valoresLinha = rowJson.values[0];

        valoresLinha[COL.STATUS] = novoStatus;

        await fetch(`${excelUrl}/rows/itemAt(index=${loteData.rowIndex})`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ values: [valoresLinha] })
        });

        console.log(`Lote ${loteNumero} atualizado para ${novoStatus}!`);
    } catch (error) {
        console.error("Erro ao dar baixa no Excel:", error);
    }
}