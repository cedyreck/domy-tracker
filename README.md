# 🎴 Domy Tracker

A competitive balance tracking application for Domino players. Track scores, manage game sessions, view rankings, and settle payments — all in one place.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Build Tool** | [Vite](https://vitejs.dev/) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| **Backend** | Supabase — Auth, Database, Edge Functions |
| **State Management** | [TanStack Query](https://tanstack.com/query) |
| **Routing** | [React Router v6](https://reactrouter.com/) |
| **Charts** | [Recharts](https://recharts.org/) |
| **Validation** | [Zod](https://zod.dev/) + [React Hook Form](https://react-hook-form.com/) |
| **Testing** | [Vitest](https://vitest.dev/) |

---

## 📁 Project Structure

```
src/
├── components/
│   ├── activity/        # Activity feed & filters
│   ├── admin/           # Admin tools (tokens, roles, password reset)
│   ├── auth/            # Auth forms & protected routes
│   ├── dashboard/       # Balance cards, charts, pending requests
│   ├── layout/          # App shell, footer, navigation
│   ├── rankings/        # Leaderboard & podium
│   └── ui/              # shadcn/ui primitives
├── contexts/
│   └── AuthContext.tsx   # Authentication state & role management
├── hooks/               # Custom hooks (profiles, rankings, sessions, etc.)
├── integrations/
│   └── supabase/        # Auto-generated client & types
├── lib/                 # Utilities & validation schemas
├── pages/               # Route-level page components
│   ├── Activity.tsx
│   ├── Admin.tsx
│   ├── Auth.tsx
│   ├── Dashboard.tsx
│   ├── GameSuggestions.tsx
│   ├── Rankings.tsx
│   ├── Reports.tsx
│   └── Settings.tsx
└── test/                # Test setup & specs

supabase/
└── functions/
    ├── admin-reset-password/  # Admin password reset edge function
    └── suggest-games/         # AI-powered game suggestions
```

---

## ✨ Features

- **🔐 Invite-only Registration** — First user becomes admin; others need an invite token
- **📊 Dashboard** — Real-time balance tracking with charts per opponent
- **🏆 Rankings** — Podium-style leaderboard across all players
- **📝 Activity Log** — Full history of balance changes with filters
- **🤝 Pending Requests** — Propose & approve balance updates between players
- **🎮 Game Sessions** — Start/end sessions, track scores & rankings per session
- **💰 Payment Tracking** — Mark session debts as paid/unpaid (admin)
- **👑 Admin Panel** — Generate invite tokens, manage roles, reset passwords, terminate sessions
- **🎯 Game Suggestions** — AI-powered game recommendations
- **🌙 Dark Theme** — Sleek dark UI with glass-card design

---

## 🛠️ Getting Started

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project
cd domy-tracker

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app will be available at `http://localhost:8080`.

---

## 🧪 Running Tests

```sh
npm run test
```

---

## 📜 Credits

**Built by [Cedyreck](https://github.com/Cedyreck)** 🎯

---

## 📄 License

This project is private and proprietary. All rights reserved © Cedyreck.
