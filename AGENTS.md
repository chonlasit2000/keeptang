# Repository Guidelines

## Project Structure & Module Organization

This is a React 18 + Vite mobile-first PWA for the Thai income/expense app `keeptang`.

- `src/main.jsx` bootstraps React, routing, auth context, and PWA registration.
- `src/App.jsx` defines public/protected routes.
- `src/pages/` contains the five Phase 1 screens: `Login`, `Dashboard`, `AddTransaction`, `Transactions`, and `Settings`.
- `src/components/` contains reusable mobile UI pieces such as bottom navigation, headers, month picker, and transaction rows.
- `src/hooks/` contains Supabase data hooks for categories and transactions.
- `src/lib/` contains Supabase setup, default categories, icons, and formatting helpers.
- `supabase/schema.sql` contains the database schema, indexes, and RLS policies.

## Build, Test, and Development Commands

- `npm install` installs dependencies.
- `npm run dev` starts the Vite development server.
- `npm run build` creates the production build in `dist/`.
- `npm run preview` serves the production build locally.
- `npm run lint` runs ESLint for JavaScript and JSX files.

Run commands from the repository root.

## Coding Style & Naming Conventions

Use JavaScript with JSX, two-space indentation, and functional React components. Name components in `PascalCase` (`TransactionRow.jsx`) and hooks in `camelCase` beginning with `use` (`useTransactions.js`). Keep Supabase access inside hooks or `src/lib/`, not directly scattered through pages unless it is a single-purpose action.

Use Tailwind utility classes and the palette defined in `tailwind.config.js`. The UI should stay Thai-first, mobile-first, warm, rounded, and free of gradients unless the product spec changes.

## Testing Guidelines

No automated test framework is configured yet. Before merging behavior changes, at minimum run `npm run build` and manually verify login, protected routing, category seeding, add/edit/delete transactions, month filtering, category filtering, logout, and PWA manifest loading.

When tests are added, mirror source paths under `tests/` and use names such as `transactions.test.jsx`.

## Commit & Pull Request Guidelines

There is no existing commit history to infer from. Use short imperative commits such as `Add transaction editor` or `Fix month filter totals`.

Pull requests should include a summary, testing performed, Supabase schema changes if any, and screenshots or short recordings for visible UI changes.

## Security & Configuration Tips

Keep real Supabase credentials in local `.env` only. Commit `.env.example`, not secrets. Never use a Supabase service role key in client-side code. Database access must rely on the RLS policies in `supabase/schema.sql`.
