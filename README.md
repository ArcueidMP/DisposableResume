# DisposableResume

DisposableResume is a zero-retention, browser-only resume builder.

Status: PR3 adds the browser-side PDF export path for the three MVP templates:
Classic ATS, Modern ATS, and Chinese Clean. Resume data remains local to the
browser runtime; PDF generation uses in-browser code and does not require a
backend renderer.

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

## PDF Export

PDF export runs in the browser with `@react-pdf/renderer`. The app does not send
resume contents to a backend service for rendering.

The MVP includes three PDF templates:

- Classic ATS.
- Modern ATS.
- Chinese Clean.

Downloaded PDF and JSON filenames use conservative app-generated names such as
`disposable-resume.pdf` and `disposable-resume.json`. Filename cleanup is for
download compatibility only and does not change resume contents.

## Font Limitations

The app does not load remote fonts, CDN assets, tracking images, or external
rendering resources. Until an approved local CJK font strategy is added, Chinese
text rendering depends on the PDF renderer and browser environment and may have
limited glyph coverage in exported PDFs. Do not add bundled font files, emoji
source registration, remote font requests, or font registration APIs without
prior approval.

## Roadmap Status

- Done in PR2: resume schema, fake defaults, in-memory store, basics/work/
  education/projects/skills editors, template selection, JSON import/export,
  clear local data control, and preview wiring.
- Added in PR3: browser-side PDF export for Classic ATS, Modern ATS, and
  Chinese Clean.
- Next: optional session drafts using app-owned `sessionStorage` keys only.

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
