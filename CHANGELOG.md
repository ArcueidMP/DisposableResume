# Changelog

All notable changes to DisposableResume are documented in this file.

The project follows Semantic Versioning while its JSON export contract and user
features continue to evolve before 1.0.

## [Unreleased]

### Fixed

- Chinese and other non-Latin-1 text in Classic ATS and Modern ATS PDF exports
  rendered as unrelated Latin characters because those templates only used the
  built-in Helvetica font. They now switch to the bundled Chiron Hei HK fonts
  and per-character line wrapping whenever the resume contains such
  characters, and still load the fonts only when needed.
- The bundled Chinese font paths now resolve correctly when the test suite runs
  on Windows.

## [0.2.0] - 2026-07-13

### Added

- Up/down controls for reordering links, skills, work experience, education,
  projects, and their repeatable detail items.
- Pinned local Chiron Hei HK regular and bold fonts for Simplified and
  Traditional Chinese character coverage in Chinese Clean PDF exports.
- On-demand CJK font loading so the initial app and non-Chinese templates do not
  request the larger font assets.

### Changed

- JSON exports now use a versioned `schemaVersion: 1` envelope; imports continue
  to accept the original unversioned resume object as the single legacy v0 path.
- The live preview now reflects the selected Classic ATS, Modern ATS, or Chinese
  Clean template.
- PDF export code is loaded only when requested, reducing initial application
  work.
- Validation, presentation mapping, download handling, and privacy boundaries
  are separated into focused modules with expanded automated coverage.

### Security

- Strengthened the Content Security Policy and architecture tests that prohibit
  resume-data transmission, persistent storage, logging, URL leakage, analytics,
  and remote PDF rendering resources.
- Chinese PDF fonts are fixed same-origin assets; font requests contain no
  resume-derived values.

## [0.1.0] - 2026-05-25

### Added

- Initial browser-only resume builder with Basic Info, Work Experience,
  Education, Projects, and Skills editors.
- Classic ATS, Modern ATS, and Chinese Clean templates with live preview.
- Browser-side PDF export and local JSON import/export.
- Clear local data control and the initial zero-retention privacy model.

[Unreleased]: https://github.com/ArcueidMP/DisposableResume/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/ArcueidMP/DisposableResume/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/ArcueidMP/DisposableResume/releases/tag/v0.1.0
