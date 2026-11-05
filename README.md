# SchemeSathi AI — Generative AI Government Scheme Eligibility Assistant

**SchemeSathi AI** is a citizen-first, generative AI-powered welfare discovery assistant for Indian central and Gujarat state government schemes. It demystifies bureaucratic guidelines, evaluates eligibility through a **deterministic rule engine**, provides grounded plain-language explanations with **verified citations**, and safely guides citizens to official government portals (`.gov.in` / `.nic.in`).

---

## 🌟 Key Features

* **Warm Editorial Discovery Experience:** Art-directed, Pinterest-inspired cards, warm ivory canvas (`#FFF9F1`), vivid category accents, subtle glassmorphism, and smooth microinteractions. Strictly no generic dark themes or plain gray clones.
* **Guided Profile Intake:** A private 5-step questionnaire asking one question at a time. Supports skipping, provides field explanations, allows review/edit, and features an instant **Reset Profile** trigger.
* **Deterministic Rule Matching:** Hard business rules (`eq`, `in`, `gte`, `lte`, `between`, `boolean`, `contains`) evaluate whether you match, do not match, or need more information. Unknown user fields evaluate strictly to `unknown`, never inferring or guessing.
* **Grounded AI Assistant ("Ask SchemeSathi"):** AI explanation layer strictly constrained to approved scheme guidelines and excerpts. Redacts hallucinated URLs and unsupported claims.
* **Comprehensive Scheme Breakdown:**
  * Criterion-by-criterion status (`Matched`, `Not Met`, `Need to Confirm`).
  * Verified benefit overview and target demographics.
  * Mandatory document checklist.
  * Step-by-step application procedure.
  * External departure warning gate to prevent online fraud.
* **Saved & Side-by-Side Comparison:** Compare up to 3 saved schemes side-by-side on benefits, conditions, documents, and source freshness. Kept in client-side storage with zero cross-user leakage.
* **Bilingual English & Gujarati (ગુજરાતી):** Complete UI localization, typography fallbacks, and high line-height handling for Gujarati glyphs.
* **Admin Review & Source Freshness Audit:** Role-protected internal workspace (`X-Admin-Secret`) to audit source URLs, verification stamps, and transition lifecycle states (`draft`, `reviewed`, `published`, `needs_verification`).
* **Privacy & Safety Guarantees:** Never asks for Aadhaar number, OTP, bank PIN, or passwords. Logs are sanitized automatically.

---

## 🏗️ Repository Architecture

```text
scheme-sathi-ai/
├── apps/
│   └── web/                               # Next.js 14 App Router, TypeScript, Tailwind, Lucide
│       ├── src/
│       │   ├── app/                       # App Router routes and global styles
│       │   ├── components/                # Modular UI (Navbar, SchemeCard, Modals, Chat)
│       │   └── lib/                       # API clients, local storage, bilingual i18n
├── services/
│   └── api/                               # FastAPI (Python 3.11+ / 3.14)
│       ├── app/
│       │   ├── api/v1/                    # Endpoints (schemes, eligibility, assistant, feedback, admin)
│       │   ├── core/                      # Config, security, logging sanitizer
│       │   ├── models/                    # Pydantic v2 schemas
│       │   └── services/                  # EligibilityEngine, CitationValidator, RAGService
│       └── tests/                         # Pytest test suite (100% passing)
├── packages/
│   └── shared/                            # Shared TypeScript contracts & schemas
├── data/
│   └── seed_demo/                         # Seed demo fixtures labeled DEMO — NOT VERIFIED
├── docker-compose.yml                     # Local PostgreSQL and container definitions
├── .env.example                           # Blueprint environment configuration
└── README.md
```

---

## 🚀 Quickstart Guide

### Prerequisites
* **Node.js** v18+ (tested on Node v25.4.0)
* **pnpm** v9+ (tested on pnpm v11.6.0)
* **Python** 3.11+ (tested on Python 3.14.0)

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone <repo-url>
cd "scheme sathi ai"

# Install Node & frontend packages
pnpm install

# Build shared TypeScript package
pnpm build:shared
```

### 2. Backend Setup & Test Runner

```bash
# Set up Python virtual environment
cd services/api
python -m venv .venv

# Activate virtual environment (Windows PowerShell)
.\.venv\Scripts\Activate.ps1
# (Linux / macOS: source .venv/bin/activate)

# Install requirements
pip install -r requirements.txt

# Run backend unit test suite
pytest -c pytest.ini tests -v

# Start FastAPI development server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend will be available at `http://localhost:8000` (Interactive Swagger docs at `http://localhost:8000/docs`).

### 3. Frontend Setup

In another terminal:

```bash
# Start Next.js development server
pnpm dev:web
```

Frontend will be available at `http://localhost:3000`.

---

## 🧪 Testing & Validation

* **Typechecking:**
  ```bash
  pnpm typecheck
  ```
* **Frontend Production Build:**
  ```bash
  pnpm build:web
  ```
* **Backend Unit & Integration Tests:**
  ```bash
  .\services\api\.venv\Scripts\pytest -c services/api/pytest.ini services/api/tests -v
  ```
  * `test_eligibility.py`: Full match, unknown profile handling, exclusion rules, and geographic state mismatch.
  * `test_citation_validator.py`: Verification that unapproved/hallucinated external URLs are redacted and that citations reference approved source records.
  * `test_api_endpoints.py`: Tests for `/schemes`, `/eligibility/matches`, `/assistant/chat`, and admin authorization security.

---

## 🛡️ Anti-Hallucination & Provenance Policy

1. **Eligibility is Deterministic:** The rule engine evaluates criteria with mathematical certainty. The LLM only explains and translates findings.
2. **Missing Information = Unknown:** If an applicant does not provide an income bracket, the system states *"Information for this criterion was not provided"* instead of assuming eligibility.
3. **Citation Validation:** Every factual response links back to the source organization, official domain, and verification date.
4. **Demo Data Transparency:** Seed demonstration records carry clear `DEMO — NOT VERIFIED` badges.

---

## 📄 License
Public Service Informational Project. Built for Indian citizens and students.
