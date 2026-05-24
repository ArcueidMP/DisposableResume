# Contributing

Thanks for helping build DisposableResume. This project is privacy-sensitive, so
small and reviewable changes are preferred.

## Setup

```sh
nvm use
corepack enable
pnpm install
pnpm dev
```

## Checks

Run these before opening a PR:

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Privacy Guardrails

- Do not add authentication.
- Do not add a backend.
- Do not add a database.
- Do not add analytics, telemetry, tracking pixels, or session replay.
- Do not use `localStorage` or IndexedDB by default.
- Use `sessionStorage` only for explicit temporary session drafts.
- Never put resume data in URLs.
- Never log resume data.
- Keep PDF export browser-side.
- Use fake data only in fixtures, tests, screenshots, and docs.

## Development Notes

- Ask before adding production dependencies.
- Keep implementation PRs small.
- Avoid broad refactors unless they directly support the current task.
- If an external link is necessary in the app UI, use `rel="noreferrer"` with
  `target="_blank"`.
