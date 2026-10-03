# 🌟 ThisOrThat — Daily Social Voting App

> **One question. Two choices. What's your pick?**

"ThisOrThat" is a clean, modern, mobile-first daily social voting web application. Every day at **12:00 AM India Standard Time (IST)**, exactly one featured poll with two captivating image choices activates automatically. Users vote once anonymously, immediately see the community vote distribution with animated percentage bars, follow a live countdown to the next daily drop, explore past polls in the Archive, and share polls with friends.

---

## 📸 Key Features

- **⚡ Daily Automated Drop**: Exactly one featured poll per calendar day based on **Asia/Kolkata (IST)**. Switches automatically at midnight without manual administrator intervention.
- **🗳️ One-Vote Enforcement**: Validated on both the frontend and backend using an anonymous voter session ID backed by a database unique constraint `(poll_id, voter_id)` and atomic transactions.
- **📊 Real-Time Results**: Percentages and vote counts stay hidden until a user votes. Once voted, results are revealed with animated progress bars and an indicator marking "Your Pick".
- **⏳ Live IST Countdown**: A real-time ticker showing the exact hours, minutes, and seconds until the next daily poll unlocks at 12:00 AM IST.
- **📚 Interactive Archive**: Browse past daily polls with dual image thumbnails, vote counts, and winner badges. Inspect full results in read-only mode.
- **🛡️ Admin Portal**: Protected by an `ADMIN_API_KEY` secret. Schedule upcoming polls weeks in advance with live image previews, edit or delete polls, and prevent duplicate scheduling on the same IST date.
- **🎨 Minimal & Accessible Design**: Built with a warm off-white background (`#FAF8F5`), rich dark typography, and vibrant coral accent (`#FF553E`), complete with keyboard navigation, ARIA attributes, and image fallbacks.
- **🔄 Zero-Config Local Dev**: Works out of the box with SQLite or connect directly to PostgreSQL via `DATABASE_URL`.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Lucide React |
| **Backend** | Python 3.10+, FastAPI, Pydantic v2, Uvicorn |
| **Database** | PostgreSQL (supported via SQLAlchemy ORM) with local SQLite fallback |
| **Timezone** | Python standard library `zoneinfo` configured for `Asia/Kolkata` |
| **Testing** | Pytest, HTTPX, FastAPI TestClient |

---

## 📁 Project Structure

```
this-or-that/
├── .env.example                # Shared environment template
├── README.md                   # Complete documentation & run guide
│
├── backend/
│   ├── .env                    # Local backend environment variables
│   ├── requirements.txt        # Python backend dependencies
│   ├── seed.py                 # CLI database seeder for a week of sample polls
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py             # FastAPI entrypoint, CORS & lifespan hooks
│   │   ├── config.py           # Pydantic Settings configuration
│   │   ├── database.py         # SQLAlchemy engine, session & declarative Base
│   │   ├── models.py           # DailyPoll & Vote models with constraints
│   │   ├── schemas.py          # Pydantic request/response validation models
│   │   ├── crud.py             # Database query operations and stats calculator
│   │   ├── timezone_utils.py   # IST date & midnight countdown utilities
│   │   └── api/
│   │       ├── __init__.py
│   │       ├── polls.py        # /api/polls endpoints (today, vote, archive)
│   │       └── admin.py        # /api/admin endpoints (CRUD, seed, verify)
│   └── tests/
│       └── test_polls.py       # Automated test suite (6 tests passing)
│
└── frontend/
    ├── .env                    # Frontend environment variables
    ├── index.html              # HTML shell with Google Fonts & favicon
    ├── package.json            # Frontend npm scripts & dependencies
    ├── vite.config.ts          # Vite build configuration
    ├── tailwind.config.js      # Custom warm palette & shadow tokens
    └── src/
        ├── App.tsx             # Root app coordinating tabs, toasts & session
        ├── types.ts            # Shared TypeScript interfaces
        ├── main.tsx            # React root mount
        ├── index.css           # Global Tailwind and font styles
        ├── services/
        │   └── api.ts          # Client API functions & voter ID manager
        └── components/
            ├── Navbar.tsx             # Top header with tabs & brand
            ├── DailyPollView.tsx      # Main voting view with image cards & stats
            ├── ArchiveView.tsx        # Past matchups grid & results modal
            ├── AdminView.tsx          # Management dashboard & schedule form
            ├── CountdownTimer.tsx     # Live IST midnight countdown ticker
            ├── ImageWithFallback.tsx  # Graceful image fallback & skeleton
            └── Toast.tsx              # Animated feedback notifications
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18 or newer) & **npm**
- **Python** (v3.10 or newer)
- *(Optional)* PostgreSQL 14+ if using Postgres instead of SQLite

---

### 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. (Recommended) Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables in `backend/.env`:
   ```env
   DATABASE_URL=sqlite:///./thisorthat.db
   ADMIN_API_KEY=thisorthat-admin-secret-2026
   APP_TIMEZONE=Asia/Kolkata
   CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000
   ```

   > **Using PostgreSQL**:
   > To use PostgreSQL, ensure your Postgres database is created and set `DATABASE_URL`:
   > `DATABASE_URL=postgresql://user:password@localhost:5432/thisorthat`

5. Seed sample polls for the week (past, today, and future days):
   ```bash
   python seed.py
   ```

6. Start the backend development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   The backend API will be running at `http://localhost:8000`.
   Explore interactive OpenAPI documentation at `http://localhost:8000/docs`.

---

### 3. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

---

## 🧪 Running Automated Tests

A comprehensive suite of tests covers timezone math, voting rules, duplicate prevention, and archive boundaries:

```bash
cd backend
python -m pytest -v
```

### Test Coverage Highlights:
- `test_ist_timezone_calculation`: Confirms UTC+5:30 offset and accurate countdown to midnight.
- `test_today_poll_fallback_when_empty`: Validates friendly fallback response when no poll is scheduled for today.
- `test_admin_auth_and_poll_creation`: Tests `X-Admin-Key` verification and duplicate calendar date rejection.
- `test_today_poll_hides_stats_before_voting`: Verifies that vote percentages are concealed from voters before they submit a pick.
- `test_voting_flow_and_duplicate_rejection`: Tests vote recording, percentage calculations (e.g. 50/50), and duplicate 409 rejection.
- `test_archive_filtering_and_read_only`: Verifies that archive only returns past polls and rejects votes on closed polls.

---

## 🔒 Admin Portal & Scheduling Guide

1. Click the shield icon in the top right corner of the app.
2. Enter the Admin Secret Key (default development key: `thisorthat-admin-secret-2026`).
3. In the Admin Dashboard:
   - Click **"Schedule Poll"** to plan future polls.
   - Enter question, Option A & Option B labels, image URLs, and scheduled date.
   - The UI provides real-time image previews as you type image URLs.
   - The backend validates image URLs (`http://` or `https://`) and prevents two polls from sharing the same calendar date.
   - Click **"Seed Week"** at any time to automatically populate 7 curated matchups (past, present, and future).

---

## 🌐 Production Deployment

### Backend (Render, Railway, or VPS)
- Set environment variables:
  - `DATABASE_URL`: PostgreSQL connection URI (`postgresql://...`)
  - `ADMIN_API_KEY`: Strong random secret key
  - `APP_TIMEZONE`: `Asia/Kolkata`
  - `CORS_ORIGINS`: Production frontend domain (e.g., `https://thisorthat.example.com`)
- Start command:
  ```bash
  uvicorn app.main:app --host 0.0.0.0 --port $PORT
  ```

### Frontend (Vercel, Netlify, Cloudflare Pages)
- Set environment variable:
  - `VITE_API_URL`: URL of the deployed backend (e.g., `https://api.thisorthat.example.com`)
- Build command: `npm run build`
- Output directory: `dist`
