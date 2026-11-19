# Sona Scheduler

> **Centralized Remedial Class Management & Timetable Scheduling Platform**  
> Custom-engineered for **Sona College of Technology** (Initially supporting **ADS** and **IT** departments with zero-redesign multi-department scalability).

---

## 🏛️ System Overview

**Sona Scheduler** solves the end-to-end logistical challenge of academic arrear remediation:
- Ingests student master rosters (Excel) with all sections (A, B, C for ADS) in one sheet.
- Ingests university arrear PDFs and validates against regulation/syllabus masters.
- Provides a **Mandatory Pre-Commit Reconciliation Table** (zero silent discard).
- Automatically groups students into subject-wise remedial cohorts.
- Schedules multi-slot remedial sessions with **Multi-Dimensional Conflict Detection** (Faculty overlap, Student double-booking, and Venue clashes).
- Assigns Peer Tutors and issues **passwordless, tokenized, mobile-friendly attendance links**.
- Identifies absent students and immediately dispatches **SMS and Email alerts** to concerned professors and designated CC administrators.
- Provides interactive analytics and Excel/CSV report exports.
- Maintains an immutable **Audit Trail** of all administrative actions.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 16 (App Router, Server Actions, Dynamic API Routes) |
| **Frontend** | React 19, TypeScript, Tailwind CSS |
| **Icons & UI** | Lucide React, Custom Academic Theme (Navy `#1E3A8A`, Light Grey `#F8FAFC`) |
| **Database** | Supabase PostgreSQL (Normalized 16-table relational schema) |
| **Authentication** | Supabase Auth + HttpOnly Session Cookies |
| **File Processing** | `xlsx` for Excel rosters, PDF parser regex engine for Arrear PDFs |
| **Notifications** | Modular Provider Adapter (Console for dev/test, Fast2SMS/Twilio & Resend/SendGrid for prod) |
| **Deployment** | Vercel Ready, Responsive Desktop & Mobile |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js `v20+` or `v24+`
- npm `10+`

### 2. Installation
```bash
cd sona-scheduler
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

### 4. Running the Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🔐 Credentials & Default Access

### Admin / Remedial Coordinator Portal
- **Login URL:** `http://localhost:3000/login`
- **Default Email:** `admin@sonatech.ac.in`
- **Default Password:** `admin` (or `SonaAdmin@2026`)

### Peer Tutor Attendance Form (Passwordless)
- Peer tutors require **NO user accounts or passwords**.
- A secure cryptographic token is generated for every remedial class:  
  `http://localhost:3000/attendance/[token]`  
- Live sample token for testing: `http://localhost:3000/attendance/demo-token-rem-001-xyz89`

---

## 🗄️ Database & Supabase Migrations

All production SQL migrations are organized in `supabase/migrations/`:

1. `supabase/migrations/20261118000001_initial_schema.sql`: Full DDL, relational tables, constraints, foreign keys, and indexes.
2. `supabase/migrations/20261118000002_rls_and_security.sql`: Supabase Row Level Security (RLS) policies for admin and anonymous token attendance.
3. `supabase/migrations/20261118000003_seed_data.sql`: Foundational seed data (ADS & IT departments, R2019/R2021 regulations, batches, subjects, faculty, and peer tutors).

To apply these to your remote Supabase project:
1. Paste the SQL scripts into your **Supabase Dashboard -> SQL Editor**, or
2. Run `supabase db push` with the Supabase CLI.

---

## 📦 Implemented Modules (16 of 16 Complete)

| Module | Route / Feature | Status |
| :--- | :--- | :--- |
| **Module 1: Admin Auth** | `/login`, `/api/auth/*`, Protected middleware | ✅ Complete |
| **Module 2: Dashboard** | `/dashboard`, Live relational KPI cards, Upcoming sessions | ✅ Complete |
| **Module 3: Department Management** | `/departments`, ADS & IT configured, Dynamic multi-dept expansion | ✅ Complete |
| **Module 4: Regulation & Syllabus** | `/regulations`, 4-year cycle, Subjects master, Common courses | ✅ Complete |
| **Module 5: Student Management** | `/students`, Multi-section Excel ingestion (ADS A, B, C), Text reg numbers | ✅ Complete |
| **Module 6: Faculty Management** | `/faculty`, Faculty CRUD, Subject mapping, Phone for SMS | ✅ Complete |
| **Module 7: Arrear PDF Management** | `/arrears`, Batch & Dept selection, Regex extraction & Reconciliation | ✅ Complete |
| **Module 8: Subject Groupings** | `/groupings`, Dynamic student cohorts by subject & batch | ✅ Complete |
| **Module 9: Academic Calendar** | `/calendar`, Working days, Blackout dates, Exam periods | ✅ Complete |
| **Module 10: Remedial Scheduling** | `/schedule`, Multi-slot picker, Multi-resource conflict engine | ✅ Complete |
| **Module 11: Peer Tutor Management** | `/tutors`, Directory, Allocation wizard, SMS link dispatch | ✅ Complete |
| **Module 12: Attendance Form Gen** | `/attendance/[token]`, Single-use tokenized mobile URL | ✅ Complete |
| **Module 13: Attendance Management** | `/attendance`, Submission locks, Absentee calculation | ✅ Complete |
| **Module 14: SMS & Email Alerts** | `/notifications`, Automated faculty & tutor alerts, Retry trigger | ✅ Complete |
| **Module 15: Reports & Analytics** | `/reports`, Filterable rosters, Instant Excel (.xlsx) exports | ✅ Complete |
| **Module 16: Audit Trail** | `/audit-logs`, Immutable logging of all actions and overrides | ✅ Complete |

---

## 🏫 Institutional Details
- **Institution:** Sona College of Technology, Salem, Tamil Nadu
- **Initial Departments:** Artificial Intelligence and Data Science (ADS) & Information Technology (IT)
