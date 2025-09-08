# Java Debugger – Frontend

A lightweight single-page app (SPA) UI for the Java Debugger backend.  
This repo contains only the frontend code.

---

## Quick Start

### Prerequisites
- Node.js ≥ 18 (LTS recommended)
- npm (comes with Node)

### Setup
```bash
# 1) Clone
git clone https://github.com/ujjwal02tiwari-rgb/java-debugger-frontend.git
cd java-debugger-frontend

# 2) Install deps
npm install     # or: npm ci (if package-lock.json is present)

# 3) Configure environment
cp .env.example .env  # if .env.example exists; otherwise create .env (see below)

# 4) Run dev server
npm run dev      # (common for Vite)
# or:
npm start        # (common for CRA)

repo structure
java-debugger-frontend/
├─ public/                 # static assets (favicon, icons, index.html for Vite)
├─ src/
│  ├─ components/          # UI components
│  ├─ pages/               # route pages/screens
│  ├─ hooks/               # custom React hooks (optional)
│  ├─ services/            # API & WebSocket/STOMP clients
│  ├─ styles/              # css files (optional)
│  └─ main.jsx             # app entry
├─ .env                    # local env vars (do not commit)
├─ package.json
└─ README.md
