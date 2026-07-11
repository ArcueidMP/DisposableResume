## Summary

-

## Privacy Checklist

- [ ] Used fake data only.
- [ ] Did not add authentication, backend code, a database, analytics, telemetry, tracking pixels, or session replay.
- [ ] Did not add default `localStorage` or IndexedDB usage.
- [ ] Did not put resume data in URLs.
- [ ] Did not log resume data.
- [ ] Kept PDF export browser-side.
- [ ] Kept the JSON contract compatible, or added an explicit versioned migration.

## Verification

- [ ] `pnpm format:check`
- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] `pnpm build`
