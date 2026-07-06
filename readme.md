# 📚 AetherStudy

A premium, responsive, and fully interactive **Study Planner Web App** — built with vanilla HTML5, CSS3, and modular ES6 JavaScript. No frameworks, no backend, no build step. Everything runs client-side and persists locally in your browser.

---

## 🎓 About

Built as a capstone submission for the **Google x Kaggle 5-Day Gen AI Intensive (Vibe Coding Capstone)**, using Antigravity IDE for AI-assisted development.

---

## ✨ Features

- **📋 Planner** — Create, categorize, and prioritize study tasks (Study, Revise, Exam, Project) with due dates and Pomodoro estimates.
- **⏱️ Pomodoro Timer** — Circular SVG progress timer with Work / Short Break / Long Break modes, audio alerts, and session stats tracking.
- **🃏 Flashcards** — Build custom decks with a 3D flip-card interface and self-grading review (Easy / Medium / Hard).
- **🧠 Quizzes** — Create your own multiple-choice quizzes or try preloaded sample quizzes, with instant scoring and a results summary.
- **📊 Dashboard** — At-a-glance view of completion rates, focus session counts, and study streaks.
- **🎨 Premium UI** — Glassmorphism design, dark theme, smooth micro-animations, and a fully responsive layout for desktop and mobile.
- **🔒 Private by design** — All data (tasks, pomodoro stats, flashcards, quizzes) is stored locally via `localStorage`. Nothing leaves your browser.

---

## 🛠️ Tech Stack

- **HTML5** — Semantic SPA structure
- **CSS3** — Custom design system (Grid, Flexbox, `backdrop-filter`, transitions)
- **JavaScript (ES6 Modules)** — Modular, framework-free architecture

---

## 📁 Project Structure

```
├── index.html          # Main SPA shell (nav, dashboard, modals)
├── style.css           # Design system: theme, layout, animations
├── app.js              # App shell: routing, state, event handling
├── planner.js          # Task CRUD, categories, priorities
├── pomodoro.js         # Timer logic, modes, stats, audio
├── flashcards.js       # Deck management, flip-card UI, review sessions
└── quizzes.js          # Quiz builder, quiz runner, scoring
```

---

## 🚀 Getting Started

No build tools or dependencies required.

### Option 1: Just open it
Double-click `index.html` or open it directly in your browser.

### Option 2: Run a local dev server (recommended)
```bash
npx http-server
```
or
```bash
npm install --save-dev live-server
npx live-server
```
Then visit the local URL shown in your terminal.

---

## ✅ How to Use

1. **Planner** — Add a task, set its category and priority, and optionally link it to a Pomodoro session.
2. **Pomodoro** — Select a task, start the timer, and let it track your focus sessions.
3. **Flashcards** — Create a deck, add cards, flip through them, and self-grade your recall.
4. **Quizzes** — Build a custom quiz or try a sample one, then view your score.

All progress is saved automatically to your browser's local storage — refresh anytime without losing data.

---

