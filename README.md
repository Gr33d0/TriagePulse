# TriagePulse

TriagePulse é um protótipo de sistema para triagem inteligente de mensagens e atendimento, com foco em inbox de suporte, indicadores de urgência e dashboard executivo. O projeto combina frontend em React + Vite + Tailwind com backend em FastAPI e integração com Gmail/IMAP e banco PostgreSQL.

## Visão geral

A ideia central do projeto é reduzir o tempo que uma equipe de atendimento gasta classificando e priorizando solicitações, destacando mensagens urgentes e organizando o fluxo de trabalho em uma interface simples e visual.

O produto atual inclui:
- Caixa de entrada com mensagens recentes
- Níveis de urgência (Alta, Média, Baixa)
- Dashboard de métricas operacionais
- Integração com emails do Gmail via IMAP
- Persistência das mensagens em banco PostgreSQL
- API em FastAPI para consulta e status do sistema

## Problema que resolve

Equipes de suporte e atendimento normalmente lidam com:
- muitos e-mails chegando ao mesmo tempo
- dificuldade para identificar urgência de cada mensagem
- perda de tempo em triagem manual
- pouca visibilidade de volume e desempenho

TriagePulse busca automatizar parte dessa triagem e organizar a operação em uma visão clara para a equipe.

## Stack tecnológica

### Frontend
- React
- Vite
- Tailwind CSS
- TypeScript

### Backend
- Python
- FastAPI
- SQLAlchemy
- Pydantic
- Uvicorn
- python-dotenv

### Dados e integrações
- PostgreSQL
- IMAP do Gmail
- Ollama (em desenvolvimento / referência para IA local)

## Estrutura do projeto

```text
TriagePulse/
├── client/
│   ├── public/
│   ├── src/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.mjs
│   └── tailwind.config.js
├── server/
│   ├── database/
│   ├── helpers/
│   ├── main.py
│   ├── pyproject.toml
│   ├── requirements.txt
│   └── uv.lock
├── README.md
└── .gitignore
```

## Funcionalidades atuais

### Dashboard
A interface de dashboard apresenta uma visão geral do atendimento com:
- total de pacientes atendidos
- fila de espera
- tempo médio
- casos urgentes
- gráfico de volume de atendimentos
- lista de atendimentos recentes

### Inbox
A página de inbox lista mensagens com:
- endereço do remetente
- assunto
- resumo gerado por NLP
- nível de urgência (Alta, Média ou Baixa)
- visualização em tabela

### Backend API
O backend tem endpoints para:
- retornar a mensagem de boas-vindas
- buscar e-mails não lidos do Gmail
- salvar os e-mails no banco
- analisar e-mails já salvos, gerar resumo e classificar urgência com Ollama
- verificar conexão com o banco

## Fluxo de funcionamento

```text
Gmail / IMAP
    ↓
FastAPI API
    ↓
Busca de mensagens não lidas
    ↓
Validação e persistência no banco PostgreSQL
    ↓
Análise NLP local com Ollama (assunto + corpo → resumo + urgência)
    ↓
React frontend
    ↓
Dashboard + Caixa de entrada
```

## Modelos e dados

No backend, o modelo principal é `StoredEmail` em `server/database/models.py`:
- id
- mail_for
- email
- title
- body

A API salva as mensagens recuperadas do Gmail no banco para permitir histórico e consultas futuras.

## Endpoints principais

### `GET /`
Retorna mensagem de status inicial da API.

### `GET /get_emails`
Busca e-mails não lidos do Gmail, salva no banco e retorna a lista em formato JSON.

### `GET /analyze_emails?limit=50`
Lê até 50 e-mails recentes do banco, analisa o assunto e o corpo com o modelo local `llama3.2:1b` via Ollama e retorna o resumo e a urgência (`Alta`, `Média` ou `Baixa`). O limite pode ser definido entre 1 e 500. Esta rota calcula a análise ao ser chamada; não grava o resumo nem a urgência no banco.

A página Inbox do frontend consulta essa rota através do proxy `/api` do Vite. Para usar a análise, mantenha o backend e o serviço Ollama ativos, com o modelo instalado.

### `GET /db_status`
Verifica se a conexão com o banco está funcionando.

A documentação interativa da API também está disponível em:
- http://localhost:8000/docs
- http://localhost:8000/redoc

## Requisitos

Antes de rodar o projeto, você precisa ter instalado:
- Python 3.12+
- Node.js 18+
- npm
- PostgreSQL configurado e acessível
- Conta Gmail com IMAP habilitado

## Configuração local

### 1) Clone o repositório

```bash
git clone https://github.com/Gr33d0/TriagePulse.git
cd TriagePulse
```

### 2) Configure o backend

Entre na pasta do servidor:

```bash
cd server
```

Crie e ative um ambiente virtual:

Windows:
```bash
python -m venv .venv
.venv\Scripts\activate
```

Linux/macOS:
```bash
python -m venv .venv
source .venv/bin/activate
```

Instale as dependências:

```bash
pip install -r requirements.txt
```

Para a análise NLP, além do pacote Python `ollama` incluído nos requisitos, instale e inicie o [Ollama](https://ollama.com/) e baixe o modelo usado pelo servidor:

```bash
ollama pull llama3.2:1b
```

Ou, se preferir usar o ambiente gerenciado pelo `uv`:

```bash
uv sync
```

Crie um arquivo `.env` dentro de `server/` com as variáveis:

```env
DATABASE_URL=postgresql+psycopg://usuario:senha@localhost:5432/triagepulse
EMAIL_IMAP_URL=imap.gmail.com
EMAIL_USER=seu-email@gmail.com
EMAIL_PASSWORD=sua-senha-ou-app-password
```

Observações:
- Para Gmail, normalmente é necessário usar uma senha de app, se o provedor exigir.
- O projeto usa `dotenv` para carregar variáveis de ambiente.

Inicie a API:

```bash
uvicorn main:app --reload --port 8000
```

A API estará disponível em:
- http://localhost:8000
- http://localhost:8000/docs

### 3) Configure o frontend

Abra um novo terminal e entre na pasta do cliente:

```bash
cd client
npm install
npm run dev
```

A interface Web será iniciada em:
- http://localhost:5173

## Observações sobre o estado atual do projeto

Este repositório está em fase de protótipo / MVP inicial. A estrutura já inclui:
- interface visual de dashboard
- lista de inbox com triagem por urgência
- integração com Gmail para leitura de e-mails
- persistência em banco
- API base para expansão

Ainda há espaço para evoluir com:
- classificação automática por IA
- análise de sentimento
- roteamento por departamento
- geração de respostas automatizadas
- autenticação
- regras de negócio para atendimento
- testes automatizados
- deploy e ambiente de produção

## Próximos passos sugeridos

- integrar LLM para classificação e resumo dos e-mails
- criar endpoint de análise de sentimento e urgência
- conectar a interface à API real em vez de dados mockados
- adicionar autenticação para usuários e equipes
- implementar estrutura de fila por prioridade
- persistir status de cada ticket e resposta gerada

## Status

Projeto em desenvolvimento ativo, com foco em triagem operacional de atendimento e automação inicial de inbox.

## Licença

Atualmente não há arquivo de licença definido no repositório. Caso queira, a licença pode ser adicionada posteriormente conforme a escolha do projeto.
