# ⚕️ HomeoPrep — AIAPGET Homoeopathy Preparation PWA

> A personalized, AI-assisted study companion and testing suite designed specifically for the **AIAPGET (All India Ayush Post Graduate Entrance Test) Homoeopathy** exam.

![HomeoPrep Overview](https://img.shields.dev/badge/PWA-Ready-success?style=flat-square) ![License](https://img.shields.dev/badge/License-MIT-blue?style=flat-square) ![Stack](https://img.shields.dev/badge/Stack-VanillaJS--CSS--Supabase--Gemini-orange?style=flat-square)

---

## 🌟 Key Features

### 👨‍🎓 For Students:
- **📊 Interactive Dashboard**: Countdown timer to exam date, day streak counter, daily study targets, and subject coverage bars.
- **📝 Practice Mode**: Filter 2800+ questions by subject, year (2021–2025), difficulty, or bookmarked items. Includes real exam +4/−1 marking.
- **⏱ Timed Mock Test Engine**: Full 120-question, 120-minute exam simulation with live score counter, question navigator grid, flag for review, and auto-submit on timer expiry.
- **📊 Results & Analytics**: Score grade breakdown, subject-by-subject accuracy bars, focus area alerts (below 60% accuracy), collapsible question review, and AI score prediction.
- **🃏 Spaced Repetition Flashcards**: Drug keynotes, aphorisms, and clinical facts using the SuperMemo SM-2 algorithm with flip animation and 4-rating review system.
- **🗓 Study Planner**: Day-by-day auto-generated study plan based on exam date and subject weightage, plus a weekly calendar view.
- **🏆 Achievements & Badges**: 12 unlockable badges and question milestone progress tracker.
- **📲 Progressive Web App (PWA)**: Works offline, installable on mobile devices (iOS & Android).

### ⚡ For Admin:
- **👑 1-Click Role Switcher**: Switch between Student and Admin views right from Settings.
- **📝 Question Manager**: Full CRUD, status filtering (Verified / AI Pending / No Answer), search, and bulk JSON import.
- **🃏 Flashcard Manager**: Create, edit, search, and bulk-import flashcard decks.
- **📄 Document & PDF AI Extractor**: Paste raw text or reference book PDFs — Gemini AI automatically extracts structured MCQs with explanations!
- **📊 Student Performance Monitor**: View student's overall accuracy, streak, subject mastery, automated guidance recommendations, and complete test history log.
- **🔔 Notification Broadcast Center**: Send custom study reminders, streak protection alerts, and test notifications via Web Push API.

---

## 📚 Covered AIAPGET Subjects (12 Subjects)

| Icon | Subject Name | Exam Weightage | Theme Color |
|---|---|---|---|
| 🌿 | **Materia Medica** | ~30 Qs / 120 marks | `#C4714F` (Terracotta) |
| 📖 | **Organon of Medicine** | ~25 Qs / 100 marks | `#6B8F71` (Sage Green) |
| 📚 | **Repertory** | ~15 Qs / 60 marks | `#5C748A` (Slate Blue) |
| 🧪 | **Homoeopathic Pharmacy** | ~10 Qs / 40 marks | `#B88B4A` (Ochre) |
| 🩺 | **Practice of Medicine** | ~12 Qs / 48 marks | `#9E5A47` (Rust) |
| 🔪 | **Surgery** | ~8 Qs / 32 marks | `#7A5C8A` (Plum) |
| 👶 | **Gynaecology & Obstetrics** | ~8 Qs / 32 marks | `#C06C84` (Dusty Rose) |
| ⚖️ | **Forensic Medicine & Toxicology** | ~4 Qs / 16 marks | `#4A7C59` (Forest Green) |
| 🦴 | **Anatomy** | ~3 Qs / 12 marks | `#8C6D58` (Warm Taupe) |
| 🫀 | **Physiology & Biochemistry** | ~3 Qs / 12 marks | `#A35C5C` (Muted Red) |
| 🔬 | **Pathology & Microbiology** | ~2 Qs / 8 marks | `#5E7A70` (Earthy Teal) |
| 🏛️ | **Community Medicine** | ~2 Qs / 8 marks | `#7C786A` (Warm Gray) |

---

## 📁 Directory Layout

```
aiapget-prep/
├── index.html              ← PWA App shell, sidebar, admin bar
├── manifest.json           ← Web App Manifest for mobile installation
├── sw.js                   ← Service worker (Stale-While-Revalidate caching + push)
├── schema.sql              ← Supabase PostgreSQL database setup script
├── DEPLOYMENT.md           ← Step-by-step hosting & PWA installation guide
├── css/
│   └── main.css            ← CSS Design System with custom tokens & components
└── js/
    ├── app.js              ← Main single-page application router & auth flow
    ├── data/
    │   ├── subjects.js     ← Subject metadata & exam weightage
    │   ├── questions.js    ← Built-in AIAPGET seed question bank
    │   └── flashcards.js   ← Built-in flashcard deck
    ├── lib/
    │   ├── supabase.js     ← Supabase client & storage integration
    │   ├── ai.js           ← Gemini AI explanation generator & PDF parser
    │   ├── sm2.js          ← SuperMemo-2 Spaced Repetition algorithm
    │   └── utils.js        ← Achievements, streak, study planner utilities
    └── pages/
        ├── login.js        ← Login screen & Demo Mode launcher
        ├── dashboard.js    ← Main student dashboard & target overview
        ├── practice.js     ← Subject-wise practice engine
        ├── mockTest.js     ← Timed mock test simulator
        ├── results.js      ← Test results, score breakdown & question review
        ├── flashcards.js   ← Spaced repetition review engine
        ├── analytics.js    ← Analytics charts, tables & score prediction
        ├── achievements.js ← Achievements & badge gallery
        ├── pyq.js          ← PYQ browser by year, subject, and group
        ├── planner.js      ← Weekly calendar & study plan generator
        ├── settings.js     ← Profile, exam date, AI keys, Supabase, role switcher
        └── admin/
            ├── questions.js ← Admin question CRUD & JSON import
            ├── flashcards.js← Admin flashcard CRUD & deck import
            ├── upload.js    ← AI PDF & book question extractor
            ├── students.js  ← Student reports & activity monitor
            └── notifications.js ← Notification broadcast & reminder center
```

---

## 🛠️ Quick Local Start

```bash
# Clone or navigate to the project directory
cd /Users/niketan/Project/aiapget-prep

# Option A: Ruby local server (built into macOS)
ruby -run -e httpd . -p 8080

# Option B: Python 3 server
python3 -m http.server 8080
```
Then open `http://localhost:8080` in your browser and click **"Try Demo Mode"**!

---

## 📄 License

This project is licensed under the MIT License — free for personal and educational use.
