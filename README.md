# DisposableResume

DisposableResume is a zero-retention, browser-only resume builder.

Status: MVP foundation is in progress. PR2 adds the core resume builder:
a Zod resume schema, fake-only default data, an in-memory Zustand store, editors
for basics, work, education, projects, and skills, template selection, a simple
local preview, and browser-side JSON import/export. Session drafts and browser
PDF export will be implemented in later PRs.

## Product Goals

- No account.
- No backend.
- No database.
- No analytics or telemetry.
- No default `localStorage` or IndexedDB.
- Resume data stays in memory unless a temporary session draft feature is added.
- PDF export runs in the browser.

## MVP Scope

- Basic info.
- Work experience.
- Education.
- Projects.
- Skills.
- Templates: Classic ATS, Modern ATS, Chinese Clean.
- Browser-side PDF export.
- JSON export/import.
- Clear local data control.

## Roadmap Status

- Done in PR2: resume schema, fake defaults, in-memory store, basics/work/
  education/projects/skills editors, template selection, JSON import/export,
  clear local data control, and preview wiring.
- Next: optional session drafts and browser-side PDF export.

## Non-Goals For The MVP

- AI rewrite.
- Resume upload parsing.
- Login.
- Payments.
- Cloud save.
- Backend PDF rendering.

## Local Development

Requirements:

- Node 22.
- pnpm through Corepack.

Setup:

```sh
nvm use
corepack enable
pnpm install
pnpm dev
```

Verification:

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Privacy Model

DisposableResume is designed not to collect, transmit, or persist resume data by
default. See [PRIVACY.md](./PRIVACY.md) for the project privacy boundaries and
language cautions.

## Contributing

Read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a PR. Use fake data
only in examples, fixtures, tests, screenshots, and documentation.

## License

MIT. See [LICENSE](./LICENSE).
