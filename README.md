# TriagePulse

TriagePulse is an MVP application for support email triage. It receives emails from Gmail, stores them in PostgreSQL, uses a local LLM to summarize and classify priority, and lets support agents reply via SMTP. The frontend is built with React, Vite, and Tailwind CSS; the API uses FastAPI.

## Overview

The goal is to reduce the time support teams spend sorting and prioritizing requests by highlighting urgent messages and organizing the workflow in a clear interface.

The email workflow has been tested successfully: receiving, priority analysis, and sending replies.

Available features:
- Fetch unread Gmail messages via IMAP and store them in PostgreSQL
- Summarize messages and classify priority (`High`, `Medium`, `Low`) with Ollama
- Inbox with received dates and filters for priority, sender, and date
- AI-generated reply suggestions guided by an editable style template
- Review and manually send replies via SMTP, preserving the email thread when possible
- Dashboard metrics for received emails, high-priority emails, pending replies, and sent replies

## Screenshots

Add your screenshots to the root `screenshots/` folder using these suggested filenames:

### Dashboard

![TriagePulse dashboard](./screenshots/dashboard.png)

### Inbox and replies

![TriagePulse inbox with filters and reply controls](./screenshots/inbox.png)

## Problem

Support teams often deal with:
- Large volumes of incoming emails
- Difficulty identifying which messages are urgent
- Time-consuming manual triage
- Limited visibility into workload and performance

TriagePulse automates part of this triage process and gives teams a clear view of their workload.

## Tech stack

### Front end
- React
- Vite
- Tailwind CSS
- TypeScript

### Back end
- Python
- FastAPI
- SQLAlchemy
- Pydantic
- Uvicorn
- python-dotenv

### Data and integrations
- PostgreSQL
- Gmail IMAP
- Ollama for classification, summaries, and reply suggestions

## Project structure

```text
TriagePulse/
|-- client/
|   |-- public/
|   |-- src/
|   |-- index.html
|   |-- package.json
|   |-- vite.config.mjs
|   `-- tailwind.config.js
|-- server/
|   |-- database/
|   |-- helpers/
|   |-- main.py
|   |-- pyproject.toml
|   |-- requirements.txt
|   `-- uv.lock
|-- screenshots/
|-- README.md
`-- .gitignore
```

## Current features

### Dashboard
The dashboard shows the total number of emails, high-priority emails, eligible emails awaiting a reply, and sent replies. It also includes email volume for the last seven days and a list of recent messages.

### Inbox
The inbox shows the sender, subject, received date, summary, and priority (`High`, `Medium`, `Low`). Emails can be filtered by priority, sender, and date. For eligible emails, agents can write a reply or request a suggestion from Ollama. Suggestions remain editable drafts and are only sent after review and explicit confirmation.

### Back-end API
The back end provides endpoints to:
- Return an API welcome message
- Fetch unread messages from Gmail
- Reply via SMTP to emails that accept replies
- Generate reply drafts with Ollama
- Store emails in the database
- Analyze stored emails, generate summaries, and classify priority with Ollama
- Check database connectivity

## Workflow

```text
Gmail / IMAP
    |
    v
FastAPI -> PostgreSQL
    |
    v
Ollama (summary and priority)
    |
    v
React (Dashboard + Inbox)
    |
    v
Optional reply draft -> manual review -> send via SMTP
```

## Data models

The main back-end model is `StoredEmail` in `server/database/models.py`:
- id
- sender and reply-to addresses
- title
- body
- received_at
- replied_at

Analysis data (summary and priority) is stored separately and associated with each email.

## Main endpoints

### `GET /`
Returns the API welcome message.

### `GET /get_emails`
Fetches unread emails from Gmail, stores them in the database, and returns them as JSON.

### `GET /analyze_emails?limit=50`
Reads up to 50 recent emails from the database and returns the received date, summary, and priority (`High`, `Medium`, or `Low`). `High` is for messages requiring the earliest attention due to immediate risk, a critical deadline, or significant impact; `Medium` is for issues that need follow-up but are not critical; `Low` covers routine requests with no apparent urgency. Priority is based on impact and timing, not the subject. Ollama is only called when an email has not yet been analyzed; subsequent requests reuse the stored analysis. The limit can be set between 1 and 500.

The front-end Inbox calls this route through Vite's `/api` proxy. Keep the back end and Ollama running, with the model installed, to use email analysis.

### `POST /emails/{email_id}/reply`
Sends a text reply to the sender or `Reply-To` address of an imported email, preserving thread headers when available. The route rejects messages identified as automated or `no-reply`, and messages without a valid reply address.

### `POST /emails/{email_id}/suggest-reply`
Generates a reply draft with Ollama in the same language as the email and in a professional tone. The reply template configured in the Inbox is used as a style and structure reference. Suggestions are not sent automatically; review and edit the text before selecting "Send reply".

### `GET /dashboard_metrics`
Returns metrics calculated from stored emails: total messages, analyzed high-priority emails, eligible emails awaiting a reply, sent replies, email volume for the last seven days, and recent messages.

### `GET /db_status`
Checks whether the database connection is working.

When the back end starts, the terminal shows the connection status for PostgreSQL, Gmail/IMAP, and Ollama. An unavailable integration is reported as `not connected`, but does not prevent the API from starting. Check its configuration and start the relevant service.

Interactive API documentation is also available at:
- http://localhost:8000/docs
- http://localhost:8000/redoc

## Requirements

Before running the project, install or configure:
- Python 3.12+
- Node.js 18+
- npm
- An accessible PostgreSQL database
- A Gmail account with IMAP enabled

## Local setup

### 1) Clone the repository

```bash
git clone https://github.com/Gr33d0/TriagePulse.git
cd TriagePulse
```

### 2) Set up the back end

Change to the server directory:

```bash
cd server
```

Create and activate a virtual environment:

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

Install the dependencies:

```bash
pip install -r requirements.txt
```

For NLP analysis, install and start [Ollama](https://ollama.com/) in addition to the Python `ollama` package included in the requirements, then download the model used by the server:

```bash
ollama pull llama3.2:latest
```

The unit tests use a mocked Ollama client and do not require a running Ollama service:

```bash
python -m unittest discover -s tests
```

The project includes a dataset of 30 synthetic English emails, evenly distributed across the `High`, `Medium`, and `Low` priorities (10 examples per priority). Expected labels and rationales are in `server/tests/fixtures/priority_dataset.csv`. With Ollama running and `llama3.2:latest` installed, run this command from the `server` directory to evaluate the model:

```powershell
python -X utf8 -m scripts.evaluate_priority_model
```

The report includes accuracy, precision, recall, and F1 for each priority, a confusion matrix, and misclassified examples. In the last recorded run, `llama3.2:latest` correctly classified all 30 examples (100% accuracy and 100% recall for each priority). This result only applies to the current synthetic dataset: the prompt and example `M10` were adjusted while reviewing these cases, so the measurement is not independent and does not represent expected production accuracy. To evaluate generalization, use new, varied emails labeled by people familiar with the priority criteria.

Alternatively, use the environment managed by `uv`:

```bash
uv sync
```

Create a `.env` file inside `server/` with the following variables:

```env
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@localhost:5432/triagepulse
EMAIL_IMAP_URL=imap.gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=465
```

Notes:
- For Gmail IMAP/SMTP authentication, use an app password; do not use your regular Google Account password.
- Before starting the API against an existing database, apply `server/database/migrations/001_email_reply_fields.sql` and `server/database/migrations/002_dashboard_metrics.sql` in order. Emails imported before the first migration will not have reply support; fetch them again to store the required headers.
- The project uses `dotenv` to load environment variables.

Start the API:

```bash
uvicorn main:app --reload --port 8000
```

The API will be available at:
- http://localhost:8000
- http://localhost:8000/docs

### 3) Set up the front end

Open a new terminal and change to the client directory:

```bash
cd client
npm install
npm run dev
```

The web interface will be available at:
- http://localhost:5173

## Status and limitations

The main workflow - receiving, storing, analyzing/classifying, and replying to emails - has been tested successfully. The application requires PostgreSQL, Gmail credentials with IMAP/SMTP enabled, and Ollama with the configured model.

AI-generated suggestions should be reviewed before sending. The application does not yet include user authentication and is not documented as production-ready. The priority evaluation described above uses synthetic emails and does not guarantee production performance.

Possible future improvements include authentication, integration tests against real services, deployment, and ongoing evaluation with new emails labeled by people.

## Project status

Functional MVP for email triage and replies; under active development.

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.
