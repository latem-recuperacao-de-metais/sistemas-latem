# Sistemas Latem - Controle de Pesagem e Identificação 

Sistema web offline-first desenvolvido para a **Latem Recuperação de Metais**. Este projeto consiste numa suite de aplicações para o chão de fábrica, focada no controlo rigoroso de entrada de matérias-primas e registo de produção de produtos acabados (Tarugos e Lingotes).

O sistema opera localmente no navegador, garantindo alta velocidade, persistência de dados sem necessidade de internet e comunicação direta com hardware industrial (balanças e impressoras térmicas).

## 📦 Módulos do Sistema

O projeto está dividido em 4 módulos principais operados de forma independente:

1. **Pesagem de Matéria-Prima:** Registo de entrada de fornecedores, leitura de peso bruto/tara e cálculo de líquido.
2. **Identificação de Matéria-Prima:** Fracionamento de lotes e geração de etiquetas de rastreabilidade.
3. **Pesagem de Tarugos e Lingotes:** Registo de produção, cálculo automático de volume/peso baseado em polegadas e comprimento (para tarugos).
4. **Identificação de Tarugos e Lingotes:** Etiquetagem de produtos acabados e consolidação de lotes/fornadas.

## ✨ Principais Funcionalidades

* **Integração com Hardware (Web Serial API):** Leitura automática do peso em tempo real comunicando diretamente com a balança ligada à porta serial.
* **Impressão Térmica Dinâmica:** Geração de etiquetas (100x70mm) com códigos de barras nativos (Libre Barcode 128) injetados diretamente para a impressora de chão de fábrica.
* **Relatórios Inteligentes (PDF):** Conversão de tabelas e históricos de turno para formato A4 de forma nativa e sem interrupção das configurações da impressora de etiquetas.
* **Offline-First & Local Storage:** Todo o histórico de pesagens, gestão de estado (rascunhos) e dados de formulário são salvos no navegador.
* **Proteção de Integridade:** Prevenção automática contra a abertura de abas duplicadas do mesmo módulo para evitar conflitos de cache (via `BroadcastChannel`).

## 🛠️ Tecnologias Utilizadas

* **Frontend:** HTML5, Vanilla JavaScript, CSS3
* **Armazenamento:** `localStorage` (Banco de Dados Local)
* **Comunicação de Hardware:** Web Serial API
* **Ícones e Tipografia:** FontAwesome 6, Google Fonts (Inter, Libre Barcode 128)

## 🚀 Como Executar o Projeto

Como o sistema foi desenhado para rodar num ambiente local sem necessidade de servidor back-end complexo:

1. Clone este repositório:
   ```bash
   git clone [https://github.com/latem-recuperacao-de-metais/sistemas-latem.git](https://github.com/latem-recuperacao-de-metais/sistemas-latem.git)

2. Abra o ficheiro index.html (Menu Principal) num navegador compatível com Web Serial (Google Chrome ou Microsoft Edge são recomendados).

3. Para a Balança: No primeiro acesso ao módulo de pesagem, clique no status da balança e dê permissão de leitura à porta COM correspondente. O navegador memorizará a permissão para reconexões automáticas.

4. Para Impressão Automática (Opcional): É recomendado rodar o atalho do navegador com a flag --kiosk-printing para que as etiquetas sejam impressas instantaneamente na impressora padrão do Windows, sem exibir a caixa de diálogo.

```
sistemas-latem/
├── assets/
│   ├── css/
│   │   └── style.css                 # Layout industrial responsivo e regras de impressão (Etiquetas 95mm)
│   └── js/
│       ├── auth.js                   # Segurança, Login e Bloqueio Mobile
│       ├── balanca.js                # Driver Web Serial e algoritmo de estabilização
│       ├── config.js                 # Banco de dados local (Ligas, Operadores, etc.)
│       ├── documents.js              # Motor de geração de relatórios em PDF
|       ├── excel_api.js              # Integração com a planilha do Forno HO
│       ├── id_mp.js                  # Lógica de Identificação de Matéria Prima
│       ├── id_tl.js                  # Lógica de Identificação de Tarugos e Lingotes
│       ├── pesagem_mp.js             # Lógica de Pesagem de Matéria Prima
│       ├── pesagem_tl.js             # Lógica de Pesagem de Tarugos e Lingotes
│       └── ui.js                     # Interface, Autocompletar inteligente e Notificações (Toasts)
├── photos/
│   └── logo-latem.png                # Logotipo utilizado nas etiquetas térmicas e relatórios
├── sistema_identificacao_mp/
│   └── index.html                    # Tela operacional: Identificação de Matéria Prima
├── sistema_identificacao_tl/
│   └── index.html                    # Tela operacional: Identificação de Tarugos e Lingotes
├── sistema_pesagem_mp/
│   └── index.html                    # Tela operacional: Pesagem de Matéria Prima
├── sistema_pesagem_tl/
│   └── index.html                    # Tela operacional: Pesagem de Tarugos e Lingotes
├── README.md                         # Documentação oficial do projeto no GitHub
└── index.html                        # Dashboard Central (Menu de acesso e validação)
```

Desenvolvedor:
Diego Redekop

Latem Recuperação de Metais © 2026 - Todos os direitos reservados.

