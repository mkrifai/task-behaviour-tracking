# HabitPulse — Holistic Time & Life Balance Tracker (PWA)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF.svg)](https://vitejs.dev/)
[![PWA](https://img.shields.io/badge/PWA-Ready-green.svg)](https://web.dev/progressive-web-apps/)
[![Firebase](https://img.shields.io/badge/Firebase-Hosting-FFCA28.svg)](https://firebase.google.com/)

**HabitPulse** is a minimalist, privacy-focused Progressive Web Application (PWA) engineered to track daily tasks, deep work sessions, family commitments, and personal routines while maintaining a holistic view of human well-being.

Unlike traditional stopwatch or to-do apps that only measure corporate output, HabitPulse treats **work, family time, self-care, sleep, and restorative rest** as interconnected pillars within a continuous 24-hour cycle.

---

## 🌟 Philosophy & Core Mechanics

### 1. The Logical Day & Midnight Cutoff (04:00 AM)
Most calendar systems divide days strictly at 00:00 midnight. For night owls, writers, students, and engineers working past midnight, this creates broken records and fragmented reports.
* HabitPulse introduces a **Logical Day Cutoff** (default: `04:00 AM`).
* Any activity performed between midnight and 03:59 AM is logically attributed to the preceding day's conscious session.
* Sessions crossing the 04:00 AM boundary are automatically split into their respective logical days without manual calculation.

### 2. 24-Hour Balance & "Soft Rest" Accounting
Time is finite ($24\text{ hours} = 1440\text{ minutes}$). HabitPulse calculates:
$$\text{Soft Rest} = 24\text{h} - (\text{Work} + \text{Family} + \text{Self-Care} + \text{Sleep})$$
This ensures that untracked breathing room, leisure, transitions, and mental decompression are visibly accounted for rather than treated as "lost time".

### 3. Peaceful Zen Interface
* Calm slate palette with soft borders and deliberate typography (`Plus Jakarta Sans` & `JetBrains Mono`).
* Zero sensory overload, intrusive animations, or aggressive gamification alarms.
* Mobile-first ergonomic layout tailored for one-handed Android/iOS thumb navigation.

---

## 🚀 Key Features

* ⏱️ **Active Timer Hero:** Peaceful, non-intrusive live counter that keeps time quietly and stays persistent.
* 🌿 **Fast Routine Chips:** 1-click toggling for recurring family rituals (dinner, school pickup) and personal habits (exercise, reading).
* 🏷️ **Custom Category Matrix:** Organize activities into three primary life spheres (`work`, `family`, `self`) with custom codes (e.g., `[CAH]`, `[FAM]`) and colors.
* 🌙 **Daily Sleep & Habit Check-in:** Log night sleep and midday naps, with retroactive routine confirmation and celebratory confetti.
* 📊 **Interactive Monthly Analytics:**
  * Average 24-hour day composition (Donut chart).
  * Category time allocation ranking.
  * Stacked daily progression trends throughout the month.
* 🤖 **AI Monthly Reflection (Google Gemini):** Generates warm, constructive lifestyle evaluations analyzing balance, cognitive fatigue risks, and recovery quality.
* 💾 **Zero Lock-in Data Portability:** Export and import complete datasets via standard JSON or structured CSV summaries.
* 📱 **Full Offline PWA:** Service Worker caching via Workbox enables seamless offline operation on mobile and desktop.

---

## 📂 Project Directory Structure

```text
├── .env.example              # Environment variables template
├── .firebaserc               # Firebase project mapping
├── firebase.json             # Firebase Hosting SPA rewrite rules
├── index.html                # PWA entry shell with mobile meta viewport
├── package.json              # Project dependencies and npm scripts
├── public/
│   ├── favicon.svg           # Application brand icon
│   └── icons.svg             # PWA app icons (maskable/standalone)
├── src/
│   ├── main.jsx              # React DOM root entry point
│   ├── App.jsx               # Top-level state orchestration & router
│   ├── App.css               # Base layout styling
│   ├── index.css             # Design tokens, typography, and theme vars
│   ├── assets/               # Static vector illustrations
│   ├── components/           # Reusable UI component modules
│   │   ├── ActiveTimerHero.jsx      # Live session banner with elapsed counter
│   │   ├── CheckinModal.jsx         # Daily sleep & routine check-in modal
│   │   ├── DayBalanceBar.jsx        # Horizontal 24-hour stacked ratio bar
│   │   ├── ManualSessionModal.jsx   # Retroactive session logger & collision detector
│   │   ├── Navigation.jsx           # Responsive desktop sidebar & mobile dock
│   │   ├── QuickCategoryModal.jsx   # Modal for adding/editing categories
│   │   ├── RoutineChips.jsx         # Horizontal touch carousel for quick habits
│   │   ├── TaskForm.jsx             # Task creator with category assignment
│   │   └── TaskItem.jsx             # Task card with status toggle, timer & controls
│   ├── firebase/
│   │   └── config.js         # Firebase SDK initialization & environment loader
│   ├── lib/                  # Pure utility functions and business logic
│   │   ├── ai.js             # Google Gemini API client & prompt engineering
│   │   ├── csv.js            # RFC-compliant CSV generation for Excel/Sheets
│   │   ├── defaults.js       # Default categories, settings, and starter tasks
│   │   ├── reports.js        # Monthly aggregation algorithms & analytics math
│   │   ├── rest.js           # 24-hour composition & balance engine
│   │   ├── storage.js        # LocalStorage persistence & pub/sub reactive store
│   │   └── time.js           # Logical cutoff calculations, dates & formatting
│   ├── pages/                # Primary application views
│   │   ├── TrackerPage.jsx   # Live tracker, category dropdown filter & task list
│   │   ├── HistoryPage.jsx   # Chronological session logs grouped by logical date
│   │   ├── ReportsPage.jsx   # Chart.js analytics & AI lifestyle reflection
│   │   └── SettingsPage.jsx  # Category manager, cutoff config, and JSON backups
│   └── styles/
│       ├── components.css    # Component-specific styles and mobile bottom sheets
│       └── index.css         # Global CSS variables, reset, and container classes
└── vite.config.js            # Vite build configuration & VitePWA plugin
```

---

## 🛠️ Architecture & Module Breakdown

### 1. Data Store (`src/lib/storage.js`)
* Built on top of a reactive pub/sub architecture using native `localStorage`.
* Supports reactive subscribers (`subscribeStore`) so UI components re-render immediately when sessions, tasks, or settings change.
* Clean separation of storage keys:
  * `habitpulse_tasks`
  * `habitpulse_categories`
  * `habitpulse_sessions`
  * `habitpulse_days`
  * `habitpulse_settings`
  * `habitpulse_ai_reports`

### 2. Time Mechanics (`src/lib/time.js`)
* `getLogicalDateString(date, cutoffHour)`: Computes the YYYY-MM-DD string according to the user's cutoff hour.
* `splitSessionByLogicalDay(start, end, cutoffHour)`: Automatically segments multi-hour sessions that span across the 04:00 AM boundary into their exact proportions.

### 3. AI Reflection Engine (`src/lib/ai.js`)
* Communicates directly with the `google/generative-ai` endpoint using `gemini-1.5-flash`.
* Constructs an objective, metric-rich prompt detailing monthly hours spent in Deep Work, Family, Self-Care, and Average Sleep without leaking confidential task titles.

---

## 💻 Getting Started

### Prerequisites
* **Node.js** (v18.0.0 or higher recommended)
* **npm** (v9.0.0 or higher)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/mkrifai/task-behaviour-tracking.git
   cd task-behaviour-tracking
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Fill in your Firebase credentials and Google Gemini API key:
   ```env
   # Firebase Config (Optional for local-only, required for cloud hosting)
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id

   # Google Gemini API Key (For AI Reflections)
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```
   *(Note: The Gemini API Key can also be entered directly inside the application's Settings UI without setting an environment variable).*

4. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📦 Building & Deployment

### Production Build
To create a minified, PWA-optimized production bundle:
```bash
npm run build
```
The compiled assets will be output to the `dist/` directory.

### Deploying to Firebase Hosting
1. Login to Firebase CLI (one-time setup):
   ```bash
   npx firebase-tools login
   ```
2. Deploy to Firebase:
   ```bash
   npx firebase-tools deploy
   ```
   Firebase will upload the `dist/` directory and provide your live URL (e.g., `https://<your-project>.web.app`).

---

## 🔧 Customization & Extension Guide

If you are forking or tailoring this repository for your specific workflow:

### Adding Default Categories
Open [`src/lib/defaults.js`](file:///d:/My%20System/%282026%29%20Task%20Behaviour%20Tracking/src/lib/defaults.js) and customize the `DEFAULT_CATEGORIES` array:
```javascript
export const DEFAULT_CATEGORIES = [
  { id: 'cat-work', name: 'Deep Work', code: 'DEV', group: 'work', color: '#475569' },
  { id: 'cat-family', name: 'Family & Home', code: 'FAM', group: 'family', color: '#db2777' },
  { id: 'cat-self', name: 'Fitness & Health', code: 'FIT', group: 'self', color: '#059669' },
];
```

### Modifying AI Persona & Prompts
Open [`src/lib/ai.js`](file:///d:/My%20System/%282026%29%20Task%20Behaviour%20Tracking/src/lib/ai.js) and adjust `buildMonthlyPrompt()`. You can customize the tone, language (English, Indonesian, Japanese, etc.), and specific coaching questions.

### Adjusting Theme & Color Tokens
All design tokens reside in [`src/styles/index.css`](file:///d:/My%20System/%282026%29%20Task%20Behaviour%20Tracking/src/styles/index.css):
* Update `--accent-emerald`, `--bg-base`, or `--text-main` to change the overall mood.
* Adjust `--min-touch-target: 44px;` for custom touch ergonomics.

---

## 🔒 Privacy & Offline Guarantee

* **100% Client-Side Operation:** All tasks, duration records, and personal notes remain inside your browser's IndexedDB / LocalStorage.
* **No Telemetry or Tracking:** Zero Google Analytics, Facebook Pixel, or external trackers.
* **Network Independence:** Fully functional without an active internet connection once installed.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.
Created with care for sustainable productivity, healthy boundaries, and personal balance.
