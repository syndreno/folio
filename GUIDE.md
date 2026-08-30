# Folio Resume Builder — Project Handoff Guide

Last updated: 2026-08-30

Read this file first when resuming work. Then read `AGENTS.md`, which remains the authoritative product and engineering specification. This guide records the current implementation state and the context behind completed work.

## Product Summary

Folio is a privacy-first React/TypeScript/Vite resume builder. Markdown is the portable source of truth. Resume parsing, editing, autosave, preview, ATS analysis, and every export run locally in the browser without an account or backend.

Main entry paths:

- Create a new resume.
- Upload a Markdown resume.
- Load the complete fictional example.
- Browse the dedicated full-page resume template catalog before or during editing.

Supported exports:

- Selectable-text ATS PDF.
- Editable Microsoft Word DOCX.
- PNG pages.
- JPEG pages.
- Versioned Markdown.

The Vite build uses relative asset paths and is compatible with GitHub Pages project subpaths.

## Current Technology

- React 19 and TypeScript 6 in strict mode.
- Vite 8.
- Zod and YAML for Markdown/front-matter validation.
- `@react-pdf/renderer` for selectable PDF output.
- `docx` for editable Word output.
- `html-to-image` and JSZip for PNG/JPEG output.
- Font Awesome Free for interface and configurable resume icons.
- IndexedDB for the optional local resume draft.
- Vitest and Playwright for automated testing.

Use `npm.cmd` in this Windows environment because PowerShell may block `npm.ps1` under its script execution policy.

## Implemented User Experience

- Guided content editor for personal information and structured/custom sections.
- Custom personal links with title, destination, and icon.
- Add, edit, duplicate, hide/show, delete, move, and drag resume sections.
- Reorder entries and simple list items.
- Drag-and-drop inside the live preview, including fast drag/drop handling through refs.
- Clicking a preview section scrolls the editor to that section.
- Undo and redo for content, structural, and design changes.
- Toggle editor and preview panes independently from the header.
- Responsive mobile Editor/Preview navigation.
- Actual A4 and Letter preview pagination with overflow protection.
- Preview footer without large empty scrolling regions.
- Styled in-application confirmation dialogs for navigation and destructive actions.
- Browser-local autosave with restore, delete, and disable controls.
- Import notifications that dismiss automatically.
- Website customization from the header icon only, on both home and builder pages.
- Day/night mode, website accent, UI font, letter spacing, line height, density, and reduced-motion controls.
- Dynamic favicon using the Folio logo and selected website color.

Important browser limitation: a real tab/window close can only show the browser-controlled `beforeunload` prompt. Browsers do not allow websites to replace that system prompt with custom HTML or add a download button to it. Custom branded leave dialogs are used for in-app navigation where the browser permits them.

## Resume Design Controls

- Accent, paper, and text colors with contrast warnings.
- ATS-safe body and heading fonts.
- Editorial, Contemporary, and Executive typography presets.
- Font size, bullet size, heading size, line height, letter spacing, section spacing, entry spacing, and page margins.
- A4 or US Letter.
- Optional profile photo with upload, replacement, removal, crop position, zoom, visibility, and square/rounded/circle shape.
- Configurable contact icons.

The current default is Calibri body text with Georgia headings.

## Template System

The builder contains 54 backward-compatible template configurations:

- 18 Basic.
- 18 Advanced.
- 18 Premium.

Template selection now lives on a dedicated responsive catalog page instead of inside the narrow Design panel. It provides large A4-proportioned previews filled with fictional names, roles, contact details, profile text, dated experience, measurable bullets, education, skills, projects, and template-specific sidebars. This makes layout and typography differences visible before selection instead of representing content with abstract placeholder bars. The catalog also includes search and filters for resume format, career audience, and ATS level. It can be opened from the home page or Design tab. Selecting from an open resume preserves all content and returns to the editor; selecting from home starts a blank resume using that template.

The Design tab shows only the current template and a button to reopen the catalog. Basic, Advanced, and Premium remain configuration tiers, while the catalog adds chronological, skill-first, and combination format metadata plus career-purpose metadata.

The catalog is honest about the current count: 54 configurations across fifteen layout families. Color, density, and typography combinations are not described as 54 independent layout engines. Every definition has a unique combination drawn from:

- Fifteen header/layout systems: classic, minimal, centered, band, rail, boxed, split, editorial, executive, functional, student, tech, portfolio, healthcare, and professional sidebar.
- Eight section patterns: rule, plain, left rule, band, double rule, label, boxed, and numbered.
- Four skill treatments: chips, outline, inline, and list.
- Three density profiles: airy, balanced, and compact.
- Serif, sans-serif, or mixed heading tone.
- Independent photo support and ATS rating.

The visual benchmark for the premium catalog is the official Novoresume template gallery (`https://novoresume.com/resume-templates`). Use it to study composition quality--identity proportions, typography hierarchy, sidebars, section rhythm, skill treatments, and thumbnail presentation--but create original Folio layouts rather than copying a named template. The Professional, Tech, and Functional families now use distinct full-page compositions based on those principles:

- Professional: three-part photo-ready identity header, full-width profile, timeline-led main column, and a muted skills/details sidebar.
- Tech: split light/dark identity and contact header, evidence-led main column, and a technical competency rail with visual proficiency markers.
- Functional: accent identity card, full-width profile, skills-first left rail, and experience/education narrative on the right.

These multi-region templates are rated ATS Compatible, not ATS Optimized. The default Classic/Modern single-column families remain the safest ATS choice.

The live renderer now groups every section semantically. Split and editorial families use separate section-title/content rails, rail families use timeline entries, boxed families visually group section bodies, centered families use balanced section dividers, and executive families emphasize the career profile. These structural rules also apply to measurement pages, so pagination remains conservative.

PDF mirrors the Professional, Tech, and Functional main/sidebar structures in selectable text and also uses the split/editorial title-rail composition and executive summary treatment. DOCX uses editable native Word tables for premium headers, main/sidebar compositions, and split/editorial title rails. Because table/column structure is less universally ATS-safe, those configurations are rated ATS Compatible or Creative rather than ATS Optimized. Default ATS templates remain semantic single-column layouts.

Key template files:

- `src/constants/resumeTemplates.ts` — the complete catalog, IDs, categories, visual tokens, and density helper.
- `src/features/templates/registry.ts` — runtime template registry and lazy shared renderer.
- `src/features/templates/classic/ClassicTemplate.tsx` — shared paginated preview and drag/drop renderer.
- `src/features/templates/TemplateCatalogPage.tsx` — full-page catalog, filtering, and selection.
- `src/features/templates/TemplateMiniature.tsx` — shared catalog/Design miniature renderer.
- `src/features/design/DesignPanel.tsx` — current-template summary and design controls.
- `src/styles/global.css` — gallery miniatures and token-driven live-preview treatments.

Legacy IDs `classic`, `modern`, and `professional` remain valid for existing Markdown files.

## Font Awesome Icon System

The icon picker offers the full bundled Font Awesome Free catalog:

- 1,422 solid icons.
- 572 brand icons.
- 1,994 unique icons total.

Features:

- Search by display name, icon name, style, ligature, and aliases.
- Live result count and incrementally rendered scroll gallery.
- Official Font Awesome URLs stored in Markdown.
- Lazy catalog loading so the initial application bundle is not forced to load the complete icon pack.
- Selected definitions registered at runtime for immediate preview.
- Imported uncommon icons loaded asynchronously.
- PDF preloads selected definitions before rendering.
- Icons render as SVG in the preview and vector paths in PDF.
- Contact text always remains visible/selectable for ATS compatibility.

Key files:

- `src/constants/contactIcons.ts`
- `src/features/icons/FontAwesomeIconPicker.tsx`
- `src/features/icons/fontAwesomeCatalog.ts`
- `src/features/icons/fontAwesomeRegistry.ts`
- `src/features/icons/useFontAwesomeIconDefinition.ts`
- `src/features/export/pdf/pdfContactIcon.ts`

## Export Architecture

All exports consume the same normalized `ResumeDocument` and selected template ID.

### PDF

- Real selectable/searchable Unicode text, not a screenshot.
- Automatic multi-page wrapping.
- Heading presence and widow/orphan protection.
- Vector Font Awesome contact icons.
- Template-aware header, section, skill, density, typography, color, page size, margin, numbering, and photo behavior.
- No editor drag handles or artificial page-number footer.

Key files:

- `src/features/export/pdf/ResumePdfDocument.tsx`
- `src/features/export/pdf/pdfTemplateStyles.ts`
- `src/features/export/pdf/exportResumeToPdf.tsx`

### DOCX

- Real Word text, headings, bullets, hyperlinks, and page settings.
- Template-aware native borders, alignment, bands, labels, numbering, skill flow, typography, density, and supported photos.
- Remains editable and ATS-readable.

Key file: `src/features/export/docx/exportResumeToDocx.ts`.

### PNG and JPEG

- Captures every rendered preview page at 2× resolution.
- A single page downloads directly; multiple pages are zipped.
- Preview drag handles are filtered out.
- SVG and text nodes are explicitly allowed. This matters because Font Awesome icons caused a former crash when the filter incorrectly assumed every cloned node was an `HTMLElement`.

Key file: `src/features/export/image/exportResumeImages.ts`.

### Markdown

- Includes version, content, custom links/icons, section order, visibility, selected template, and supported design settings.
- Human-readable YAML front matter and Markdown body.
- Unknown Markdown sections are preserved as custom sections.
- All 54 template IDs round-trip through import/export.

Key files:

- `src/parsers/markdown/parseResumeMarkdown.ts`
- `src/serializers/markdown/serializeResumeMarkdown.ts`
- `public/examples/resume-template.md`
- `public/examples/example-resume.md`
- `docs/markdown-format.md`

## ATS Readiness

The ATS panel is advisory and never promises hiring outcomes. It covers standard headings, contact completeness, safe layout/template rating, readable fonts, dates, resume length, measurable achievements, paragraph length, skills, unsupported symbols, image reliance, PDF text, and pagination-related guidance.

Keep ATS-first templates semantic and single-column unless future cross-ATS testing justifies broader claims. Critical information must never be represented only by an icon or image.

Documentation: `docs/ats-guidelines.md`.

## State and Privacy

- Core state is the normalized `ResumeDocument`.
- Content and template presentation remain separate.
- Template switching never deletes content or photos.
- Resume data is not sent to a server.
- Website appearance/preferences use `localStorage`.
- The optional resume draft uses IndexedDB.
- Do not log personal resume content, place it in URLs, or send it to analytics.

## Important Tests

Latest verified status on 2026-08-30 (rerun after premium-composition changes before handoff):

- 24 Vitest files passed.
- 60 unit/integration tests passed.
- 3 Playwright end-to-end tests passed.
- ESLint passed.
- TypeScript typecheck passed.
- Production build passed.

Coverage includes:

- Markdown parsing, security, aliases, and round-tripping.
- Every template ID through Markdown.
- Editable DOCX generation for all 54 templates.
- PDF generation across all fifteen layout systems.
- Multi-page selectable PDF text.
- Vector contact icons in PDF.
- Professional photo output.
- Template category counts and unique design signatures.
- PNG/JPEG node filtering.
- Browser downloads for Markdown, PDF, DOCX, PNG, and JPEG.
- Browser selection of Premium templates and searchable icons.

Primary catalog/export regression test: `src/tests/templateCatalogExports.test.ts`.

Run all checks:

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run test:e2e
```

Playwright uses installed Google Chrome and starts Vite on `127.0.0.1:4173`. If a browser test unexpectedly shows the old three-template interface, a stale Vite process is occupying port 4173. Verify the exact owning process before stopping only that process, then rerun the suite.

Vite currently reports expected large-chunk warnings for the lazy PDF exporter and full lazy Font Awesome catalog. Heavy exporters and the complete icon catalog are loaded only when needed.

## Coding and Safety Conventions

- Follow `AGENTS.md`.
- Preserve strict TypeScript types; do not introduce `any` to bypass design problems.
- Use `apply_patch` for source/document edits.
- Use `rg`/`rg --files` for discovery.
- Preserve unrelated user changes in a dirty worktree.
- Keep domain parsing/serialization independent from React.
- Extend the data-driven template catalog instead of adding template-ID conditionals throughout the application.
- When adding a visual token, implement it in live preview, PDF, and DOCX and add export coverage.
- Image output automatically follows the rendered preview but must continue filtering editor-only controls.
- Keep Markdown migrations explicit when the format version changes.
- Do not add server dependencies or remote processing without explicit authorization.

## Documentation Map

- `AGENTS.md` — authoritative product and engineering requirements.
- `README.md` — public project overview and setup.
- `GUIDE.md` — durable implementation handoff and current context.
- `docs/development.md` — architecture and extension boundaries.
- `docs/markdown-format.md` — Markdown/front-matter format.
- `docs/ats-guidelines.md` — ATS checks and limitations.
- `docs/export-guide.md` — export behavior and intended formats.
- `THIRD_PARTY_NOTICES.md` — bundled third-party licensing.

## Resume-Work Startup Checklist

1. Read `GUIDE.md`.
2. Read `AGENTS.md`.
3. Check `git status --short` and preserve existing work.
4. Inspect the relevant implementation and tests before editing.
5. Keep preview/PDF/DOCX/Markdown behavior synchronized when changing templates or design settings.
6. Run checks proportional to the change; use the full suite for export, template, parser, or state changes.
