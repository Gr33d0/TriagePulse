# ⚡ TriagePulse AI — Intelligent Customer Support Triage & Response Hub

> **A Full-Stack AI-powered application for automated triage, sentiment analysis, and priority management of customer support requests.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0+-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

---

## 🎯 Business Problem

Small-to-medium enterprises (SMEs) and customer support teams lose hundreds of manual hours filtering through cluttered inboxes, classifying customer tickets, and writing repetitive responses from scratch.

Key operational challenges include:
- **Delayed handling of critical requests:** Urgent inquiries or complaints from frustrated customers get buried in the general queue.
- **Lack of prioritization:** Absence of visual metrics and real-time insights on customer sentiment and issue severity.
- **Inefficient response workflows:** Support agents waste valuable time drafting routine replies instead of focusing on high-value interactions.

---

## 💡 The Solution: TriagePulse AI

**TriagePulse AI** is a B2B platform that centralizes incoming support messages across channels. Leveraging **Natural Language Processing (LLMs via API)**, the application automatically analyzes incoming emails, assesses urgency levels, evaluates customer sentiment, assigns department tags, and drafts ready-to-send responses in seconds.

---

## ✨ Key Features

- **🚨 Smart Inbox & Urgency Prioritization:** Automatic triage into three severity levels (*High*, *Medium*, *Low*) with clear visual cues.
- **🎭 Real-Time Sentiment Analysis:** Instantly identifies customer emotional tone (*Frustrated*, *Neutral*, *Satisfied*) to proactively mitigate churn.
- **🏷️ Automated Department Tagging:** Routes incoming messages straight to the relevant department (`Technical Support`, `Billing`, `Sales`, `Cancellations`).
- **🤖 One-Click AI Copilot Replies:** Automatically generates contextual, professional draft responses ready for human review and approval.
- **📊 Business Metrics Dashboard:** At-a-glance visualization of ticket distribution by category and overall customer sentiment trends.

---

## 🏗️ System Architecture

```text
[ Customer / Incoming Email ]
              │
              ▼
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND                           │
│  React + Tailwind CSS + Vite                            │
│  - Interactive Inbox & Urgency Status Indicators        │
│  - Response Editor & Analytics Dashboard                │
└───────────────────────────┬─────────────────────────────┘
                            │ REST API (JSON)
                            ▼
┌─────────────────────────────────────────────────────────┐
│                      BACKEND                            │
│  FastAPI (Python) + Pydantic                            │
│  - Schema Validation & API Route Management             │
│  - LLM Service Integration (Structured JSON Output)     │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️️ Tech Stack

### **Backend**
- **[Python 3.10+](https://www.python.org/)** — Core runtime environment.
- **[FastAPI](https://fastapi.tiangolo.com/)** — High-performance asynchronous web framework.
- **[Pydantic](https://docs.pydantic.dev/)** — Strict data validation and schema enforcement for AI responses.
- **[Uvicorn](https://www.uvicorn.org/)** — Lightning-fast ASGI server.
- **[Google Gemini API / OpenAI API]** — LLM integration for text extraction and reply generation.

### **Frontend**
- **[React 18](https://react.dev/)** — Component-based UI framework.
- **[Vite](https://vitejs.dev/)** — Fast next-generation frontend tooling.
- **[Tailwind CSS](https://tailwindcss.com/)** — Utility-first CSS framework for rapid UI design.
- **[Lucide React](https://lucide.dev/)** — Clean icons for modern web interfaces.

---

## 🚀 Local Setup & Installation

### Prerequisites
- **Node.js** (v18 or higher)
- **Python** (v3.10 or higher)
- An LLM API Key (**Gemini API Key** or **OpenAI API Key**)

---

### 1. Clone the Repository

```bash
git clone https://github.com/Gr33d0/triagePulse.git
cd triagePulse
```

---

### 2. Configure & Run Backend (FastAPI)

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv

# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment variable file
echo "GEMINI_API_KEY=your_api_key_here" > .env

# Start FastAPI server
uvicorn main:app --reload --port 8000
```
> The backend API will be running at `http://localhost:8000`. Interactive Swagger documentation is accessible at `http://localhost:8000/docs`.

---

### 3. Configure & Run Frontend (React)

Open a new terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Install packages
npm install

# Start Vite development server
npm run dev
```
> The application UI will be running live at `http://localhost:5173`.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Developed by <b>[Your Name]</b> · <a href="https://linkedin.com/in/your-linkedin">LinkedIn</a> · <a href="https://github.com/your-username">GitHub</a>
</p>