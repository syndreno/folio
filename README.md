# Folio Resume Builder

Folio is a privacy-friendly resume builder that keeps Markdown as the portable source of truth. The current release runs entirely in the browser and does not require an account.

## Current features

- Create a resume from a guided blank document.
- Upload a local `.md` resume up to 1 MB.
- Load a complete fictional example.
- Download a commented Markdown starter template.
- Edit personal details, summaries, list sections, structured entries, and custom sections.
- Reorder, hide, show, and delete sections.
- See changes in a live A4 or Letter preview.
- Customize resume accent, page, and text colors with contrast guidance.
- Choose ATS-safe body and heading fonts, font size, bullet size, and line height.
- Customize website day/night mode, accent color, font, spacing, interface density, and motion locally in the browser.
- Configure contact icons with validated Font Awesome Free URLs in Markdown.
- Select each contact icon visually and restore those selections through Markdown round-tripping.
- Add custom personal links with user-defined labels, display text, destinations, and icons.
- Download a selectable-text ATS PDF with automatic multi-page wrapping.
- Review a live ATS Readiness score with actionable checks.
- Export the edited resume back to clean, versioned Markdown.
- Preserve unknown sections as custom sections.

DOCX, image export, autosave, photo editing, and additional templates remain planned features.

## Development

Requires Node.js 20 or newer.

```sh
npm install
npm run dev
```

Quality checks:

```sh
npm run typecheck
npm run lint
npm run test
npm run build
```

## Markdown files

- [`public/examples/resume-template.md`](public/examples/resume-template.md) provides a guided starter.
- [`public/examples/example-resume.md`](public/examples/example-resume.md) provides complete fictional sample data.
- [`docs/markdown-format.md`](docs/markdown-format.md) documents the portable format.
- [`docs/ats-guidelines.md`](docs/ats-guidelines.md) documents all ATS Readiness checks and score limitations.

Resume data is processed locally. Website appearance is stored in `localStorage`; resume content is not stored there in this release.

Font Awesome Free icons are bundled locally and used under the Font Awesome Free license. See [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
