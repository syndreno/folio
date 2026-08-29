# Folio Resume Builder

Folio is a privacy-friendly resume builder that keeps Markdown as the portable source of truth. The current release runs entirely in the browser and does not require an account.

## Current features

- Create a resume from a guided blank document.
- Upload a local `.md` resume up to 5 MB, including an optional embedded profile photo.
- Load a complete fictional example.
- Download a commented Markdown starter template.
- Edit personal details, summaries, list sections, structured entries, and custom sections.
- Reorder sections and their entries from the editor or live preview; hide, show, and delete sections.
- Undo and redo content, design, add/delete, and reorder changes from the header or keyboard.
- See changes in a live A4 or Letter preview.
- Switch between Classic ATS, Modern ATS, and photo-capable Professional templates without changing resume content.
- Customize resume accent, page, and text colors with contrast guidance.
- Choose ATS-safe fonts and tune font, bullet, heading, line, letter, section, entry, and page spacing.
- Upload, replace, crop, zoom, position, shape, hide, or remove an optional local profile photo.
- Customize website day/night mode, accent color, font, spacing, interface density, and motion locally in the browser.
- Use the Folio logo as the favicon and recolor it automatically with the selected website color.
- Configure contact icons with validated Font Awesome Free URLs in Markdown.
- Select each contact icon visually and restore those selections through Markdown round-tripping.
- Add custom personal links with user-defined titles, destinations, and visual icon selection.
- Download a selectable-text ATS PDF with automatic multi-page wrapping.
- Download an editable Word DOCX with real headings, bullets, links, and conventional page structure.
- Export every visual resume page as PNG or JPEG; multi-page sets download as a ZIP.
- Review a live ATS Readiness score with actionable checks.
- Export the edited resume back to clean, versioned Markdown.
- Autosave the active Markdown draft to browser-local IndexedDB, restore it later, delete it, or disable autosave.
- Preserve unknown sections as custom sections.

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
npm run test:e2e
npm run build
```

The end-to-end suite uses the installed Google Chrome browser, so it does not download a second browser copy.

## GitHub Pages

The production build uses relative asset paths and does not require a server, account system, or backend API. It is compatible with a GitHub Pages project subpath.

```sh
npm install
npm run build
```

Publish the generated `dist/` directory with GitHub Pages or a Pages deployment workflow. Resume import, editing, local drafts, previews, and exports all run in the browser.

## Markdown files

- [`public/examples/resume-template.md`](public/examples/resume-template.md) provides a guided starter.
- [`public/examples/example-resume.md`](public/examples/example-resume.md) provides complete fictional sample data.
- [`docs/markdown-format.md`](docs/markdown-format.md) documents the portable format.
- [`docs/ats-guidelines.md`](docs/ats-guidelines.md) documents all ATS Readiness checks and score limitations.
- [`docs/export-guide.md`](docs/export-guide.md) describes each output pipeline and its intended use.
- [`docs/development.md`](docs/development.md) explains the domain, parser, template, and extension boundaries.

Resume data is processed locally. Website appearance and the autosave preference use `localStorage`; the optional active resume draft uses browser-local IndexedDB. Nothing is uploaded by the application.

Font Awesome Free icons are bundled locally and used under the Font Awesome Free license. See [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
