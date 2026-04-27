// Configuração do Microsoft Entra ID (Azure)
const msalConfig = {
    auth: {
        clientId: "4579a8e7-c8c1-48bc-987d-e53e2eb5e6f4",
        authority: "https://login.microsoftonline.com/4077fdb4-c6bf-4b89-a469-5f17eb5b7f2b",
        redirectUri: window.location.origin + window.location.pathname
    }
};

const msalInstance = new msal.PublicClientApplication(msalConfig);
const excelScopes = { scopes: ["User.Read", "Files.ReadWrite.All", "Sites.ReadWrite.All"] };

// Mapeamento de Colunas (A=0, B=1, C=2, D=3...)
const COL = { LIGA: 3, LOTE: 4, POLEGADA: 5, BARRAS: 6, COMPRIMENTO: 7, STATUS: 22 };

window.dadosExcel = []; 
let urlOficialExcel = ""; // Guardará a URL limpa e segura

// FUNÇÃO NOVA: Cria uma rota segura para evitar o Erro 400 da Microsoft
async function getExcelUrlSegura(token) {
    if (urlOficialExcel) return urlOficialExcel;
    
    // 1. Descobre o ID interno do site TarefasSuporte
    const respostaSite = await fetch(`https://graph.microsoft.com/v1.0/sites/latemmetais.sharepoint.com:/sites/TarefasSuporte?$select=id`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const dadosSite = await respostaSite.json();
    
    // 2. Monta a URL perfeita sem excesso de "dois pontos"
    const nomeArquivo = encodeURIComponent("Forno 30t.xlsx");
    urlOficialExcel = `https://graph.microsoft.com/v1.0/sites/${dadosSite.id}/drive/root:/${nomeArquivo}:/workbook/worksheets('HO')/tables('TabelaHO')`;
    return urlOficialExcel;
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
        console.warn("Token expirado, redirecionando...");
        await msalInstance.acquireTokenRedirect(excelScopes);
    }
}

async function puxarLotesAbertos() {
    try {
        const token = await getToken();
        if(!token) return;

        // Chama a nossa nova função segura
        const url = await getExcelUrlSegura(token);
        
        const response = await fetch(`${url}/rows`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if(!response.ok) throw new Error("Erro na leitura da Tabela");

        const data = await response.json();
        
        window.dadosExcel = [];
        const lotesParaCaixa = [];

        if(data.value) {
            data.value.forEach((row, index) => {
                const vals = row.values[0];
                const status = vals[COL.STATUS] ? vals[COL.STATUS].toString().trim() : '';
                
                // Se o Status estiver vazio, consideramos o Lote "Aberto"
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

            // Alimenta a caixa de seleção do sistema
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
        if (!loteData) return; // Se o lote foi digitado manualmente e não veio do Excel, ignora.

        const token = await getToken();
        if(!token) return;
        
        const url = await getExcelUrlSegura(token);

        // 1. Pegamos a linha atual
        const getRow = await fetch(`${url}/rows/itemAt(index=${loteData.rowIndex})`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const rowJson = await getRow.json();
        let valoresLinha = rowJson.values[0];

        // 2. Alteramos o Status
        valoresLinha[COL.STATUS] = novoStatus;

        // 3. Enviamos de volta
        await fetch(`${url}/rows/itemAt(index=${loteData.rowIndex})`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ values: [valoresLinha] })
        });

        console.log(`Lote ${loteNumero} atualizado para ${novoStatus}!`);
    } catch (error) {
        console.error("Erro ao dar baixa no Excel:", error);
    }
}