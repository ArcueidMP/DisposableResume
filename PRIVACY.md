# Privacy

DisposableResume uses a zero-retention design: the app is intended to run in the
browser without accounts, a backend, a database, analytics, telemetry, or default
persistent browser storage.

## Data Handling Boundaries

- Resume data should stay in memory by default.
- Temporary session drafts may use `sessionStorage` only when the feature is
  explicit and easy to clear.
- Do not use `localStorage` or IndexedDB by default.
- Do not put resume data in URLs, route params, or query strings.
- Do not log resume data to the console.
- Do not send resume data to a server.
- PDF export must run in the browser.
- JSON import/export must be user-controlled local file handling.
- PDF and JSON exports should use local browser Blob/object URL downloads and
  revoke object URLs after use.
- Export filenames should be generic and should not be derived from resume data.
- PDF export must not load remote fonts, images, stylesheets, CDNs, or other
  network assets.
- Do not register bundled fonts, CJK fonts, emoji sources, or remote font files
  without prior approval.
- Do not write resume-derived values into hidden PDF metadata.
- JSON import errors should not echo resume contents, local file paths, or
  detailed validation payloads.

## PDF Export

PDF export is designed to run entirely in the browser. Resume contents should
not be sent to a server for PDF rendering, font lookup, analytics, logging, or
file naming.

The Classic ATS, Modern ATS, and Chinese Clean templates are local app
templates. Chinese Clean may not fully render all CJK glyphs until an approved
local font strategy is added.

## Clear Local Data

The clear local data control should clear in-memory state and any temporary
`sessionStorage` draft keys owned by the app.

It does not remove PDFs or JSON files the user already downloaded. It also does
not clear browser downloads, print history, PDF viewer state, crash recovery,
browser extension data, operating system backups, or files synced by external
tools.

## Hosting And Browser Caveats

Static hosts and CDNs may log basic page requests. The app design must not send
resume contents in those requests. Browser extensions, crash recovery, OS
backups, downloaded files, print dialogs, and PDF viewers are outside the app's
control.

## Language Guidance

Prefer:

- "zero-retention design"
- "designed not to collect, transmit, or persist resume data by default"
- "the app does not intentionally send resume contents to a server"

Avoid:

- "guaranteed deletion"
- "100% private"
- "anonymous"
- "cannot be recovered"
- "no logs anywhere"
- "we never store anything" without explaining temporary session drafts and
  browser behavior
