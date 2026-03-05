# 🏭 Central de Sistemas - Latem

Suite de aplicações web desenvolvida para o controlo interno de **Pesagem** e **Identificação** de Matéria Prima, Tarugos e Lingotes da Latem. O sistema funciona inteiramente no navegador, com persistência de dados local, impressão padronizada e comunicação direta com balanças via porta serial.

## 🚀 Funcionalidades Principais

- **Comunicação Serial Direta:** Conexão automática e leitura de dados em tempo real com balanças através da Web Serial API.
- **Prevenção de Conflitos:** Bloqueio inteligente que impede a abertura do mesmo sistema em múltiplas abas simultaneamente (via BroadcastChannel).
- **Impressão de Etiquetas (100x70mm):** Geração de comprovativos formatados estritamente para impressoras térmicas.
- **Relatórios A4:** Geração de relatórios de produção e pesagem devidamente formatados para folhas A4 com totais calculados automaticamente.
- **Autocomplete Customizado:** Seleção rápida e visualmente limpa de Ligas, Fornos, Fornecedores e Materiais.
- **Interface Padronizada:** Notificações (Toasts), modais e navegação uniformes em todos os módulos.
- **Armazenamento Local:** Salvaguarda do estado dos formulários e do histórico de registos via `localStorage`.

## 📁 Estrutura do Projecto

A suite é composta por uma Central (Painel de Login/Navegação) e 4 módulos operacionais independentes:

```text
sistemas/
├── index.html                        # Central de Sistemas (Login e Dashboard)
├── photos/                           # Logótipos e imagens do sistema
│   ├── logo-latem.png
│   └── ...
├── sistema_pesagem_tl/               # Módulo: Pesagem de Tarugos e Lingotes
│   └── index.html
├── sistema_pesagem_mp/               # Módulo: Pesagem de Matéria Prima
│   └── index.html
├── sistema_identificacao_tl/         # Módulo: Identificação de Tarugos e Lingotes
│   └── index.html
└── sistema_identificacao_mp/         # Módulo: Identificação de Matéria Prima
    └── index.html
