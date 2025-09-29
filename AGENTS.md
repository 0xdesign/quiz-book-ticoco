# Repository Guidelines

## Project Structure & Module Organization
- `src/app` — App Router pages and routes. API endpoints live at `src/app/api/*/route.ts` (e.g., `create-story`, `generate-story`, `create-payment-intent`). Checkout/download/success routes use dynamic segments.
- `src/components` — UI components (e.g., `QuizForm.tsx`, `StoryReview.tsx`).
- `src/lib` — Services and utilities (`openai.ts`, `stripe.ts`, `pdf.ts`, `supabase.ts`, `services.ts`, etc.).
- `__tests__` — Mirrors `src` for unit tests.
- Config: `next.config.ts`, `eslint.config.mjs`, `jest.config.js`, `database.sql`, `.env.example`.

## Build, Test, and Development Commands
- `npm run dev` — Start Next.js at `http://localhost:3000`.
- `npm run build` — Production build.
- `npm start` — Serve built app.
- `npm run lint` — ESLint with Next.js rules.
- `npm test` / `npm run test:watch` / `npm run test:coverage` — Jest + RTL.
- `npm run test:quiz` / `test:pdf` / `test:services` — Run focused suites.
- `./test.sh` — Quick integration checks (env, build, tests).

## Coding Style & Naming Conventions
- TypeScript, 2-space indent, single quotes, no semicolons.
- React function components; default export for single-file components.
- Filenames: components `PascalCase.tsx` (e.g., `QuizForm.tsx`); libs `camelCase.ts` (e.g., `openai.ts`).
- Route folders under `src/app` use kebab-case.
- Run `npm run lint` before pushing; fix warnings where reasonable.

## Testing Guidelines
- Frameworks: Jest + React Testing Library (jsdom).
- Location: place tests in `__tests__` mirroring `src`; name files `*.test.ts`/`*.test.tsx`.
- Coverage: generate with `npm run test:coverage`; aim for 80%+ lines in `src` (no hard gate).
- Example: `__tests__/lib/pdf.test.ts` for `src/lib/pdf.ts`.

## Commit & Pull Request Guidelines
- Commits use imperative mood, present tense, concise subjects.
  - Example: `Fix payment intent metadata handling`.
- Branch names: `feat/...`, `fix/...`, `chore/...`, `docs/...`.
- PRs must include: clear summary, linked issue(s), test plan/steps, screenshots or GIFs for UI changes, and any env/setup notes.

## Security & Configuration Tips
- Copy `.env.example` to `.env.local`; never commit secrets.
- Required keys: OpenAI, Stripe, Supabase, Resend. Configure Stripe webhook at `/api/webhooks/stripe`.
- Use `database.sql` to provision tables before payment/download flows.
