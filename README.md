# MedLens — AI-Powered Clinical Information Intelligence

> **Foundation Release (Step 1)**  
> High-integrity monorepo architecture for clinical document intelligence, structured extraction, provenance tracking, and multi-report discrepancy analysis.

---

## ⚠️ Important Clinical Safety Notice & System Boundaries

**MedLens is strictly an assistive clinical information organization and intelligence system.**

### MedLens is NOT an AI Doctor.

Under NO circumstances does MedLens:
- ❌ **Diagnose diseases or clinical conditions**
- ❌ **Prescribe medications or pharmacological products**
- ❌ **Recommend medical treatments or surgical interventions**
- ❌ **Recommend medication or dosage modifications**
- ❌ **Invent patient demographic or encounter records**
- ❌ **Invent laboratory values or reference ranges**
- ❌ **Replace licensed physicians, nurses, or certified healthcare professionals**

All extracted data, chronological timelines, and report comparisons are designed strictly to reduce administrative cognitive burden and assist human clinicians. All clinical interpretations and medical decisions remain exclusively with licensed human healthcare practitioners.

---

## 🏛️ Architecture & Folder Structure

```
/medlens
│
├── frontend/                # React 18 + TypeScript + Tailwind CSS + React Router + Vite
│   ├── src/
│   │   ├── components/      # UI component library (Buttons, Cards, Forms, Modals, etc.)
│   │   │   ├── ui/          # Reusable design system components
│   │   │   ├── layout/      # Navbar, Sidebar, Footer
│   │   │   └── safety/      # Clinical safety banners and disclaimers
│   │   ├── layouts/         # Application shell layouts (AppLayout)
│   │   ├── pages/           # Dashboard, SystemHealth, Patients, Reports, Provenance
│   │   ├── services/        # Centralized HTTP API client with network & error handling
│   │   ├── hooks/           # useHealthCheck telemetry & status polling hooks
│   │   ├── types/           # TypeScript interfaces for all domain entities
│   │   └── utils/           # Formatters (dates, file sizes, MRN) and cn helper
│   ├── package.json         # Scripts, dependencies (Lucide, Tailwind, Vitest)
│   └── tsconfig.json        # Strict TypeScript configuration
│
├── backend/                 # Python 3.14 + FastAPI + SQLAlchemy 2.0 + Pydantic v2
│   ├── app/
│   │   ├── api/routes/      # Versioned API routes (/api/v1/health)
│   │   ├── core/            # Configuration (Pydantic Settings) & Safety policies
│   │   ├── database/        # Engine, sessionmaker, and Base
│   │   ├── models/          # Declarative SQLAlchemy models (User, Patient, Report, etc.)
│   │   ├── schemas/         # Pydantic validation schemas
│   │   ├── services/        # Business logic services (HealthService)
│   │   ├── utils/           # Structured logging, formatters, domain exceptions
│   │   └── main.py          # FastAPI application factory & error handlers
│   ├── alembic/             # Versioned database migrations
│   ├── tests/               # Pytest automated test suite
│   ├── requirements.txt     # Locked backend dependencies
│   └── alembic.ini          # Alembic configuration
│
├── database/                # PostgreSQL schema documentation & scripts
│   ├── init.sql             # Foundation schema and extensions
│   └── README.md            # Database guidelines
│
├── docs/                    # Architecture, safety, and API specifications
│   ├── architecture.md      # Full-stack architectural breakdown
│   ├── medical_safety.md    # Medical Safety Manifesto & Boundaries
│   ├── database_schema.md   # Complete schema documentation for 8 models
│   └── api_reference.md     # REST endpoints & response documentation
│
├── uploads/                 # Secure document ingestion directory (.gitkeep)
├── docker-compose.yml       # PostgreSQL container orchestration
├── .env.example             # Environment configuration template
├── .gitignore               # Multi-stack ignore rules
└── README.md                # Project documentation & quickstart guide
```

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18, TypeScript, Tailwind CSS, Vite | Responsive, accessible, professional clinical UI |
| **Client Routing** | React Router v6 | Declarative routing (`/`, `/dashboard`, `/system-health`) |
| **Backend API** | FastAPI, Python 3.14 | High-performance asynchronous API with OpenAPI docs |
| **Data Validation** | Pydantic v2 | Request/response schemas and runtime data constraints |
| **ORM & Database** | SQLAlchemy 2.0, PostgreSQL | Relational data persistence with connection pooling |
| **Migrations** | Alembic | Version-controlled database schema migrations |
| **Offline Dev Fallback** | SQLite | Seamless local offline development without Docker |
| **Testing** | Pytest, Vitest, React Testing Library | Full-stack automated unit and integration tests |

---

## 🚀 Prerequisites

Before starting, ensure your workstation has:
- **Python**: 3.11+ (Python 3.14 recommended)
- **Node.js**: 20+ LTS (Node v24 supported)
- **PostgreSQL 16+** (or Docker for running PostgreSQL container; automatic local SQLite fallback provided if PostgreSQL is not active)

---

## ⚙️ Installation & Environment Setup

### 1. Clone & Configure Environment

```bash
# Navigate to project directory
cd medlens

# Copy the environment template
cp .env.example .env
```

Review your `.env` configuration. Placeholders include:
```ini
DATABASE_URL=postgresql+psycopg://medlens_user:medlens_password@localhost:5432/medlens_db
SECRET_KEY=change-this-to-a-secure-random-secret-key-in-production
AI_API_KEY=your-gemini-or-openai-api-key-here
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:8000
```

> **Note:** The backend is configured with `AUTO_FALLBACK_SQLITE=true`. If PostgreSQL is not reachable, the system automatically uses a local SQLite database for isolated development without crashing.

---

### 2. Backend Setup & Startup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start FastAPI backend server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The MedLens API will be accessible at:
- **API Base**: `http://127.0.0.1:8000`
- **Health Endpoint**: `http://127.0.0.1:8000/api/v1/health`
- **Interactive OpenAPI Documentation**: `http://127.0.0.1:8000/docs`
- **ReDoc Documentation**: `http://127.0.0.1:8000/redoc`

---

### 3. Frontend Setup & Startup

In a separate terminal window:

```bash
# Navigate to frontend
cd frontend

# Install frontend dependencies
npm install

# Start Vite development server
npm run dev
```

The MedLens clinical interface will be available at:
- `http://localhost:5173` (or `http://localhost:5173/dashboard`)

---

## 🧪 Testing Commands

### Backend Automated Tests

Run the Pytest suite verifying database connectivity, `/api/v1/health`, root metadata, and error handling:

```bash
cd backend
.venv\Scripts\pytest tests/ -v
```

### Frontend Automated Tests

Run Vitest verifying UI rendering, clinical safety notices, navigation, and component rendering:

```bash
cd frontend
npm test
```

### TypeScript Compilation & Production Build

Verify frontend types and assets:

```bash
cd frontend
npm run build
```

---

## 🐘 PostgreSQL Setup (Optional via Docker)

To run the containerized PostgreSQL 16 instance:

```bash
docker compose up -d postgres
```

The database initializes with UUID and trigram search extensions defined in `./database/init.sql`.

---

## 🗺️ Future Roadmap & Architecture Readiness

The foundation architecture prepares 8 declarative database models without premature business logic:
- **Step 2**: User authentication (RBAC) & Patient management
- **Step 3**: Medical report upload, PDF/image processing & OCR
- **Step 4**: AI extraction & reference-range intelligence
- **Step 5**: Structured medical record, human verification & source provenance
- **Step 6**: Conflict detection & timeline generation
- **Step 7**: Patient-friendly summaries & report export
- **Step 8**: Security, HIPAA compliance & audit logging
- **Step 9**: System integration, validation & demo polish
