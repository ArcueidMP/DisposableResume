# DisposableResume

- **Live demo:** https://disposableresume.arcueidmp.com
- **Release:** v0.2.0

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

Try the current deployment at https://disposableresume.arcueidmp.com. The live
site may track the default branch; use the repository's GitHub Releases and
[CHANGELOG.md](./CHANGELOG.md) for immutable version history.

## MVP Features

- Basic info editor.
- Work experience editor.
- Education editor.
- Projects editor.
- Skills editor.
- Live preview.
- Template-aware live preview and selection.
- Up/down controls for ordering repeatable resume content.
- Browser-side PDF export.
- Versioned JSON export/import with strict validation and legacy v0 import.
- Clear local data button.
- Three PDF templates:
  - Classic ATS
  - Modern ATS
  - Chinese Clean

## PDF Export

PDF export runs in the browser with `@react-pdf/renderer`.

The app does not send resume contents to a backend service for rendering. Downloaded PDF and JSON filenames use conservative app-generated names such as `disposable-resume.pdf` and `disposable-resume.json`.

## Chinese PDF Fonts

Every template can render Simplified and Traditional Chinese. The Chinese Clean
template always uses the pinned, bundled Chiron Hei HK font files. Classic ATS
and Modern ATS use the built-in Helvetica for Latin-only resumes and switch to
the same bundled Chiron Hei HK files, with per-character line wrapping, as soon
as the resume contains characters that Helvetica cannot draw. Chinese PDFs use a
Hong Kong/Traditional glyph style; the app does not automatically select
region-specific Simplified or Traditional glyph forms.

The local fonts are loaded on demand from the same origin only when an export
needs them: always for Chinese Clean, and for Classic ATS or Modern ATS only
when the resume contains characters outside the built-in font's Latin-1 range.
The request contains no resume data. Latin-only Classic ATS and Modern ATS
exports and the initial application load do not request the CJK assets. The app
does not load fonts from CDNs or third-party rendering services.

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
HTTP or HTTPS destinations. The app's own origin is the only permitted HTTP(S)
destination, for its pinned font assets.

After deployment, verify the response headers on the live origin and complete a
PDF export in a browser with the developer console open. A local Vite development
server does not apply Cloudflare Pages' `_headers` file.
