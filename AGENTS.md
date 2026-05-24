# DisposableResume - Agent Instructions

## Product

DisposableResume is a zero-retention, browser-only resume builder.

The MVP is a lightweight open-source web app:
- No account.
- No backend.
- No database.
- No analytics.
- No default localStorage.
- Resume data exists only in memory or sessionStorage.
- PDF export runs in the browser.

## Stack

- Vite
- React
- TypeScript
- Tailwind CSS
- Zod
- React Hook Form
- Zustand
- @react-pdf/renderer
- pnpm
- Node 22

## Non-negotiable privacy rules

- Do not add authentication.
- Do not add a database.
- Do not add remote storage.
- Do not add analytics, session replay, tracking pixels, or telemetry.
- Do not use localStorage or IndexedDB by default.
- sessionStorage is allowed only for temporary session drafts.
- Never put resume data in URL query strings.
- Never log resume data to console.
- Never commit real resumes, real names, real emails, or real phone numbers.
- Test fixtures must use fake data only.
- PDF export must run in the browser.

## MVP scope

Build only:
- Basic info
- Work experience
- Education
- Projects
- Skills
- 3 templates:
  - Classic ATS
  - Modern ATS
  - Chinese Clean
- PDF export
- JSON export/import
- Clear local data button

Do not build yet:
- AI rewrite
- Resume upload parser
- Login
- Payments
- Cloud save
- Backend PDF rendering

## Required checks

Before finalizing changes, run:

pnpm build

If typecheck or test scripts are added later, also run:

pnpm typecheck
pnpm test

## Development behavior

- Main agent acts as project lead and reviewer.
- Use subagents only for bounded work.
- Read-only subagents must not edit files.
- Implementation subagents should make small, focused changes.
- Always summarize changed files and why they changed.
- Prefer minimal dependencies.
