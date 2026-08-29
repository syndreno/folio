# Development guide

## Data flow

The application keeps one normalized `ResumeDocument` in history-aware React state:

```text
Markdown -> parser -> ResumeDocument -> editor/template -> serializer/exporter
```

Templates and exporters consume this model directly. They do not parse Markdown and do not maintain separate resume content.

## Main boundaries

- `src/domain` defines typed resume data, defaults, validation, and immutable transformations.
- `src/parsers/markdown` converts untrusted Markdown and YAML front matter into normalized data while preserving unknown headings as custom sections.
- `src/serializers/markdown` produces readable, versioned Markdown for round-tripping.
- `src/features/templates` contains the registry and presentation components.
- `src/features/export` keeps PDF, DOCX, and image logic independent and lazy-loadable.
- `src/features/ats` contains readiness checks and explanations.
- `src/services/resumeDraftStore.ts` stores the optional active Markdown draft in IndexedDB.

## Adding a template

1. Add its ID to `RESUME_TEMPLATE_IDS`.
2. Implement a component accepting `ResumeTemplateProps`.
3. Add one definition and lazy component entry to `features/templates/registry.ts`.
4. Scope template-only CSS under its template class.
5. Declare its ATS rating, photo support, column behavior, and page sizes.
6. Add registry, rendering, Markdown round-trip, PDF, and accessibility tests.

Switching templates must never remove or rewrite resume content.

## Adding a section type

1. Add the type to `RESUME_SECTION_TYPES` and define suitable defaults.
2. Add centralized aliases where the Markdown parser detects section names.
3. Extend the structured editor only when the section needs fields beyond the existing text, simple-list, or entry-list models.
4. Confirm preview, Markdown, PDF, DOCX, ATS, reorder, hide, and delete behavior.
5. Add parser and round-trip fixtures. Unknown headings must continue to import as custom sections.

## Tests

Run `npm run typecheck`, `npm run lint`, `npm test -- --maxWorkers=1`, `npm run test:e2e`, and `npm run build`. The serial Vitest option keeps memory use predictable on smaller development machines.
