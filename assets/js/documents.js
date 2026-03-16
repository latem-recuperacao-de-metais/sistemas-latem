function baixarArquivoRelatorio(titulo, conteudoHTML, filename, operador) {
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    const horaAtual = new Date().toLocaleTimeString('pt-BR');
    
    const logoUrl = new URL('../photos/logo-latem.png', window.location.href).href;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${filename}</title>
            <style>
                body { font-family: Arial, sans-serif; color: black; background: white; padding: 20px; margin: 0; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                th { background: #eee; font-weight: bold; border-bottom: 2px solid #000; padding: 8px; text-align: left; }
                td { padding: 8px; border-bottom: 1px solid #ccc; }
                .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 15px; }
                .footer { margin-top: 30px; text-align: center; font-size: 11px; border-top: 2px dashed #000; padding-top: 15px; font-weight: bold; }
                @media print {
                    @page { size: A4 portrait !important; margin: 10mm !important; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <img src="${logoUrl}" style="max-height: 80px; margin-bottom: 10px;" onerror="this.style.display='none'">
                <h2 style="margin: 0; font-size: 18px;">${titulo}</h2>
            </div>
            ${conteudoHTML}
            <div class="footer">
                DATA: ${dataAtual} &nbsp;|&nbsp; HORA: ${horaAtual} &nbsp;|&nbsp; RESPONSÁVEL: ${operador.toUpperCase()}
            </div>
        </body>
        </html>
    `);
    doc.close();

    showToast("A abrir tela de impressão...", "info");

    const tituloOriginal = document.title;
    document.title = filename;

    setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        
        setTimeout(() => { 
            document.title = tituloOriginal;
            document.body.removeChild(iframe); 
        }, 1000);
    }, 500);
}

function fecharEtiqueta() { 
    const modal = document.getElementById('etiquetaModal');
    if(modal) modal.style.display = 'none'; 
} 
function imprimirEtiqueta() { 
    document.body.classList.add('printing-label'); 
    window.print(); 
    setTimeout(() => document.body.classList.remove('printing-label'), 500);
}
