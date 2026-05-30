<<'EOF'
# DisposableResume

**Live demo:** https://disposableresume.arcueidmp.com  
**Release:** v0.1.0

DisposableResume is a zero-retention, browser-only resume builder.

Create, edit, preview, export, and clear a resume directly in the browser. The MVP is designed for temporary resume generation without accounts, backend storage, analytics, or telemetry.

## Product Goals

- No account.
- No backend.
- No database.
- No analytics or telemetry.
- No default `localStorage` or IndexedDB.
- Resume data stays in memory unless a temporary session draft feature is explicitly added.
- PDF export runs in the browser.

## MVP Features

- Basic info editor.
- Work experience editor.
- Education editor.
- Projects editor.
- Skills editor.
- Live preview.
- Template selection.
- JSON export/import with validation.
- Clear local data control.
- Browser-side PDF export.
- Three PDF templates:
  - Classic ATS
  - Modern ATS
  - Chinese Clean

## PDF Export

PDF export runs in the browser with `@react-pdf/renderer`.

The app does not send resume contents to a backend service for rendering. Downloaded PDF and JSON filenames use conservative app-generated names such as `disposable-resume.pdf` and `disposable-resume.json`.

## Font Limitations

The app does not load remote fonts, CDN assets, tracking images, or external rendering resources.

Until an approved local CJK font strategy is added, Chinese text rendering depends on the PDF renderer and browser environment and may have limited glyph coverage in exported PDFs.

Do not add bundled font files, emoji source registration, remote font requests, or font registration APIs without prior approval.

## Privacy Model

DisposableResume is designed not to collect, transmit, or persist resume data by default.

See [PRIVACY.md](./PRIVACY.md) for the project privacy boundaries and wording cautions.

## Local Development

Requirements:

- Node 22
- pnpm through Corepack

Setup:

```sh
nvm use
corepack enable
pnpm install
pnpm dev

