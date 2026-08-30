# Folio Resume Builder — Project Handoff Guide

Last updated: 2026-08-31

Read this file first when resuming work. Then read `AGENTS.md`, which remains the authoritative product and engineering specification. This guide records the current implementation state and the context behind completed work.

## Product Summary

Folio is a privacy-first React/TypeScript/Vite resume builder. Markdown is the portable source of truth. Resume parsing, editing, autosave, preview, ATS analysis, and every export run locally in the browser without an account or backend.

Main entry paths:

- Create a new resume.
- Upload a Markdown resume.
- Load the complete fictional example.
- Browse the dedicated full-page resume template catalog before or during editing.
- Open the dedicated import guide for Folio Markdown improvement or PDF-to-Markdown conversion with an external AI assistant.

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
- Responsive import guide linked from the home menu, template catalog, editor header, and footers.
- Copy-ready, fact-preserving AI prompts for improving an existing Folio `.md` file or converting a resume PDF with the official Markdown template.
- Direct `.md` template download and finished-file import actions on the guide page, plus AI privacy and human-review warnings.

Important browser limitation: a real tab/window close can only show the browser-controlled `beforeunload` prompt. Browsers do not allow websites to replace that system prompt with custom HTML or add a download button to it. Custom branded leave dialogs are used for in-app navigation where the browser permits them.

## Resume Import Guide

`src/features/guide/ResumeGuidePage.tsx` is a dedicated, static-hosting-compatible application page. It explains two portable workflows:

1. Download the current Folio `.md`, attach it to an AI assistant, ask for fact-preserving improvements, save the complete response as UTF-8 Markdown, and re-import it.
2. Download `public/examples/resume-template.md`, attach that template and an existing resume PDF to an AI assistant, request a non-invented transcription into Folio Markdown, review uncertain `[CHECK: ...]` markers, and import the result.

The page deliberately does not call an AI service or upload resume data itself. Folio continues to process imports locally. The privacy notice makes clear that an external AI provider may retain uploaded files and advises users to remove unnecessary sensitive information. Both prompts require full Markdown output, preservation of front matter/custom sections, standard ATS-readable headings, and no invented facts.

The page remains mounted through the existing `ApplicationView` state rather than a server-dependent route, so GitHub Pages compatibility is preserved. Opening it from an active editor does not replace or mutate the resume. Tests live in `src/tests/resumeGuidePage.test.tsx` and `e2e/resume-builder.spec.ts`.

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

The builder contains 58 backward-compatible template configurations:

- 18 Basic.
- 18 Advanced.
- 22 Premium.

Template selection has two complementary interfaces. The dedicated responsive catalog provides large A4-proportioned previews filled with fictional names, roles, contact details, profile text, dated experience, measurable bullets, education, skills, projects, and template-specific sidebars. This makes layout and typography differences visible before selection instead of representing content with abstract placeholder bars. The catalog leads with structurally distinctive Professional, Tech, and Editorial designs and includes search and filters for resume format, career audience, and ATS level.

While editing, the Design panel provides Previous/Next controls and an embedded searchable quick switcher with Basic, Advanced, and Premium filters. It changes the live preview immediately without leaving the builder. The full gallery remains available for larger comparison. Template switching preserves resume content and applies the template's curated visual preset; photos remain in state even when a selected template does not display them.

The Design tab shows only the current template and a button to reopen the catalog. Basic, Advanced, and Premium remain configuration tiers, while the catalog adds chronological, skill-first, and combination format metadata plus career-purpose metadata.

The catalog is honest about the current count: 58 configurations across nineteen layout families. Color, density, and typography combinations are not described as 58 independent layout engines. Every definition has a unique combination drawn from:

- Nineteen header/layout systems: classic, minimal, centered, band, rail, boxed, split, editorial, executive, functional, student, tech, portfolio, healthcare, professional sidebar, identity sidebar, executive statement, portfolio showcase, and centered monogram.
- Eight section patterns: rule, plain, left rule, band, double rule, label, boxed, and numbered.
- Four skill treatments: chips, outline, inline, and list.
- Three density profiles: airy, balanced, and compact.
- Serif, sans-serif, or mixed heading tone.
- Independent photo support and ATS rating.
- Curated per-template accent, paper, text, body-font, and heading-font presets. Gallery cards and miniatures display these palettes, and selecting a template applies the same preset to preview and exports.

The visual benchmark for the premium catalog is the official Novoresume template gallery (`https://novoresume.com/resume-templates`). Use it to study composition quality--identity proportions, typography hierarchy, sidebars, section rhythm, skill treatments, and thumbnail presentation--but create original Folio layouts rather than copying a named template. The Professional, Tech, and Functional families now use distinct full-page compositions based on those principles:

- Professional: three-part photo-ready identity header, full-width profile, timeline-led main column, and a muted skills/details sidebar.
- Tech: split light/dark identity and contact header, evidence-led main column, and a technical competency rail with visual proficiency markers.
- Functional: accent identity card, full-width profile, skills-first left rail, and experience/education narrative on the right.

These multi-region templates are rated ATS Compatible, not ATS Optimized. The default Classic/Modern single-column families remain the safest ATS choice.

Four premium layouts provide additional structural variety:

- Veridian: accent identity banner, left expertise rail, and spacious main career narrative.
- Boardroom: dark executive statement banner, prominent profile panel, and date-led career entries.
- Aperture: photo-led editorial header, project cards, and a compact expertise column.
- Maison: centered portrait identity with a refined balanced-column body.

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
- Dictionary hyphenation is disabled so headings, skills, and keywords copy as complete ATS tokens instead of split forms such as `Certifica- tions`.
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
- All 58 template IDs round-trip through import/export.

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

Latest verified status on 2026-08-31 (rerun after the full 58-template, five-format export audit):

- 24 Vitest files passed.
- 66 unit/integration tests passed.
- 3 Playwright end-to-end tests passed.
- The opt-in 58-template raster audit passed all 116 PNG/JPEG downloads.
- ESLint passed.
- TypeScript typecheck passed.
- Production build passed.

Coverage includes:

- Markdown parsing, security, aliases, and round-tripping.
- Every complete example resume through Markdown for all 58 template IDs, including template presets and section/item preservation.
- Rich editable DOCX generation for all 58 templates, including content, links, bullets, relationships, layout structures, and rounded skill shapes.
- Native Microsoft Word open/close compatibility for all 58 generated DOCX files with editable text and no repair failures.
- Selectable PDF generation and text extraction for all 58 templates across all nineteen layout systems.
- Full browser audit of every live template plus 116 actual PNG/JPEG downloads, including file signatures, pixel dimensions, page counts, overflow, and console errors.
- Visual comparison of a representative from every layout system against the live preview.
- PDF list bullets use separate marker/text columns, preserve container padding, and avoid opaque item boxes.
- Inline skill lists start with a bullet in preview, PDF, and DOCX; image exports inherit the preview rendering.
- DOCX skill sections use native editable tabbed list paragraphs, inline rounded DrawingML capsules with real text, functional pairs, and paragraph-based tech proficiency bars; skill treatments do not expose editable Word tables or grid handles. Capsule geometry is normalized after packing because the DOCX library emits rectangular Word shapes by default.
- DOCX shaded section headings use same-color paragraph borders and preserved spaces to provide reliable horizontal and vertical padding in Microsoft Word.
- Multi-page selectable PDF text.
- Vector contact icons in PDF.
- Professional photo output.
- Template category counts and unique design signatures.
- PNG/JPEG node filtering.
- Browser downloads for Markdown, PDF, DOCX, PNG, and JPEG.
- Browser selection of Premium templates and searchable icons.

Primary catalog/export regression test: `src/tests/templateCatalogExports.test.ts`.

The expensive raster matrix is retained as an opt-in Playwright audit so routine browser tests stay fast. Run it in PowerShell with:

```powershell
$env:FULL_TEMPLATE_AUDIT = "1"
npx.cmd playwright test e2e/template-export-audit.spec.ts
Remove-Item Env:FULL_TEMPLATE_AUDIT
```

To write all DOCX files for a native Microsoft Word compatibility sweep:

```powershell
$env:WRITE_WORD_AUDIT = "1"
npm.cmd test -- --run src/tests/templateCatalogExports.test.ts
Remove-Item Env:WRITE_WORD_AUDIT
```

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
