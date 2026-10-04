# Mind Craft 🧠⛏️

Mind Craft is an interactive hybrid competitive coding and puzzle-solving platform. Participants find physical QR codes placed in an event venue, scan them to collect fragments of code, arrange and assemble the fragments logically on an interactive assembly board, inspect/modify the resulting code in an embedded editor, and submit solutions evaluated against automated test cases via a Judge0 execution engine in real-time.

---

## 🚀 Key Features

- **QR-Driven Code Discovery:** Physical or digital QR codes decode into encrypted blocks with language tags, order hints, and logic fragments.
- **Drag-and-Drop Assembly Board:** Visual canvas where participants reorder code snippets into coherent programs, backed by server-authoritative state synchronization (`PUT /api/sessions/assembly`).
- **Live Code Editor & Runner:** Multi-language editor connected to a self-hosted Judge0 compiler sandbox (`POST /api/submissions/run` and `POST /api/submissions/submit`).
- **Timed Challenges & Sessions:** Real-time event countdown, server-authoritative session management (`POST /api/sessions/start`), and automated session expiration tracking.
- **Live Leaderboard & Tiebreaker Scoring:** Real-time rank calculation based on challenge points, a +300 second (5-minute) penalty per failed attempt before acceptance, and CSV/XLSX export with formula injection sanitization.
- **Admin Control Center:** Comprehensive dashboard for challenge authoring, printable QR matrix generation, participant monitoring, session controls, and settings.

---

## 📂 Project Architecture

```
├── frontend/          # React (Vite) + Tailwind CSS + Redux Toolkit SPA
├── backend/           # Node.js + Express REST API + MongoDB / Redis
├── judge0/            # Sandboxed multi-language code execution infrastructure
├── infrastructure/    # Azure VM setup guides, cgroup v1 configuration
├── docs/              # Comprehensive API, architecture, and event runbooks
├── tests/             # Backend, frontend, and verification suites
└── scripts/           # Challenge creation, QR generation, verification, and DB seed utilities
```

---

## 🛠️ Quick Start

### Prerequisites
- Node.js >= 18.x
- Docker & Docker Compose
- MongoDB & Redis (or run via Docker Compose)

### 1. Database Seeding
```bash
# Seed master admin user from env credentials
cd backend
npm run seed

# Seed official challenges (5 challenges across Python, C, C++, Java)
npm run seed:challenges
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

### 4. Running Automated Tests
```bash
# Frontend Vitest suite (Registration validation, empty states, no demo data)
cd frontend
npm test

# Backend Jest suite (Registration, duplicate check, auth guards, session flow, scoring penalty, CSV escaping)
cd backend
npm test -- tests/backendSuite.test.js

# Multi-language compiler & edge-case test suite (Python, C, C++, Java Main)
node scripts/verify-compiler.js
```

### 5. Full Stack Docker Compose
```bash
docker-compose up --build
```

---

## 📜 License
MIT License. See [LICENSE](LICENSE) for details.
