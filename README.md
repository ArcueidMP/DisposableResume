# DisposableResume

- **Live demo:** https://disposableresume.arcueidmp.com
- **Release:** v0.1.0

DisposableResume is a zero-retention, browser-only resume builder for creating a resume, previewing it, exporting it, and clearing it from the browser.

The MVP is intentionally lightweight:

- No account.
- No backend.
- No database.
- No analytics or telemetry.
- No default `localStorage` or IndexedDB.
- Resume data stays in memory by default.
- Temporary session drafts may use `sessionStorage` only when explicitly implemented.
- Resume data is never placed in URL query strings.
- PDF export runs in the browser.

## Live Demo

Try the v0.1.0 release at https://disposableresume.arcueidmp.com.

## MVP Features

- Basic info editor.
- Work experience editor.
- Education editor.
- Projects editor.
- Skills editor.
- Live preview.
- Template selection.
- Browser-side PDF export.
- JSON export/import with validation.
- Clear local data button.
- Three PDF templates:
  - Classic ATS
  - Modern ATS
  - Chinese Clean

## PDF Export

PDF export runs in the browser with `@react-pdf/renderer`.

The app does not send resume contents to a backend service for rendering. Downloaded PDF and JSON filenames use conservative app-generated names such as `disposable-resume.pdf` and `disposable-resume.json`.

## Known Font Limitation

The app does not load remote fonts, CDN assets, tracking images, or external rendering resources.

Until an approved local CJK font strategy is added, Chinese text rendering depends on the PDF renderer and browser environment and may have limited glyph coverage in exported PDFs.

Do not add bundled font files, emoji source registration, remote font requests, or font registration APIs without prior approval.

## Privacy Model

DisposableResume is designed not to collect, transmit, or persist resume data by default.

Use fake data only in examples, fixtures, screenshots, tests, and demos. Do not commit real resumes, real names, real email addresses, or real phone numbers.

See [PRIVACY.md](./PRIVACY.md) for the project privacy boundaries and wording cautions.

## Local Development

Requirements:

- Node 22.13 or newer within the Node 22 release line
- pnpm 11.2.2 through Corepack

The same constraints live in `package.json`, so package managers warn when the
local development runtime is outside the supported range. `.nvmrc` selects the
Node 22 release line; check `node --version` if a dependency reports an engine
incompatibility.

Setup:

```sh
nvm use
corepack enable
pnpm install
pnpm dev
```

Build:

```sh
pnpm build
```

## Verification

Run the required local checks before finalizing changes:

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Cloudflare Pages Deployment

Deploy DisposableResume as a static Cloudflare Pages site.

- Build command: `pnpm build`
- Output directory: `dist`
- Do not use `wrangler deploy` for the app.
- Do not add a Workers backend.

Cloudflare Pages should serve the generated static files only.

The repository's [`public/_headers`](./public/_headers) file is copied into the
build output and applies the production security policy. In particular, the CSP
blocks remote connections and resources while allowing same-origin app assets,
local Blob/data images, and the embedded WebAssembly used by browser-side PDF
layout. The `data:` allowance on `connect-src` is local-only; it does not permit
HTTP or HTTPS destinations.

After deployment, verify the response headers on the live origin and complete a
PDF export in a browser with the developer console open. A local Vite development
server does not apply Cloudflare Pages' `_headers` file.
