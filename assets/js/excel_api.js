// Configuração do Microsoft Entra ID (Azure)
const msalConfig = {
    auth: {
        clientId: "4579a8e7-c8c1-48bc-987d-e53e2eb5e6f4",
        authority: "https://login.microsoftonline.com/4077fdb4-c6bf-4b89-a469-5f17eb5b7f2b",
        // CORREÇÃO: Garante que volta exatamente para o ecrã que estava aberto
        redirectUri: window.location.origin + window.location.pathname 
    }
};

const msalInstance = new msal.PublicClientApplication(msalConfig);
const excelScopes = { scopes: ["User.Read", "Files.ReadWrite.All", "Sites.ReadWrite.All"] };

// Caminho para o ficheiro no SharePoint da Latem
const siteHost = "latemmetais.sharepoint.com";
const sitePath = "sites/TarefasSuporte";
const excelUrl = `https://graph.microsoft.com/v1.0/sites/${siteHost}:/${sitePath}:/drive/root:/Forno%2030t.xlsx:/workbook/worksheets('HO')/tables('TabelaHO')`;

// Mapeamento de Colunas (A=0, B=1, C=2, D=3...)
const COL = { LIGA: 3, LOTE: 4, POLEGADA: 5, BARRAS: 6, COMPRIMENTO: 7, STATUS: 22 };

window.dadosExcel = []; 

async function loginEConectarExcel() {
    try {
        // CORREÇÃO 1: Lê o resultado se o utilizador estiver a voltar da página da Microsoft
        await msalInstance.handleRedirectPromise();

        const accounts = msalInstance.getAllAccounts();
        if (accounts.length === 0) {
            // CORREÇÃO 2: Usa Redirect em vez de Popup para não ser bloqueado pelo Chrome
            await msalInstance.loginRedirect(excelScopes);
            return; // Interrompe aqui pois a página vai mudar
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
        console.warn("Token expirado, redirecionando para login...");
        // CORREÇÃO 3: Força redirect se o acesso silencioso falhar
        await msalInstance.acquireTokenRedirect(excelScopes);
    }
}

async function puxarLotesAbertos() {
    try {
        const token = await getToken();
        if(!token) return;

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
        
        // 1. Pegamos a linha atual
        const getRow = await fetch(`${excelUrl}/rows/itemAt(index=${loteData.rowIndex})`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const rowJson = await getRow.json();
        let valoresLinha = rowJson.values[0];

        // 2. Alteramos o Status (Coluna W)
        valoresLinha[COL.STATUS] = novoStatus;

        // 3. Enviamos de volta
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