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

## Clear Local Data

The clear local data control should clear in-memory state and any temporary
`sessionStorage` draft keys owned by the app. It should not claim to remove files
the user already downloaded or data managed by the browser, operating system, or
extensions.

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
