# Resume export guide

All export work happens in the browser and uses the same normalized `ResumeDocument` shown by the editor and live preview. Export libraries are loaded only when a user selects their format.

## Markdown

Markdown is the portable source file. It includes current content, custom and hidden sections, section order, template choice, supported design values, contact icon selections, and an optional size-limited local photo. Re-uploading it restores the resume without a server or account.

Filename: `name-resume.md`.

## ATS PDF

The PDF pipeline builds a text document with `@react-pdf/renderer`; it does not take a screenshot of the resume. It maps the selected template's header, section rules, pills, photo treatment, colors, typography, and spacing to the PDF layout. Text remains selectable and searchable, links remain links, visible sections follow logical reading order, and long entries flow across A4 or Letter pages. Automatic dictionary hyphenation is disabled so headings and keywords remain complete when copied into ATS or plain-text tools. Standard fonts and single-column structures are used for ATS templates.

Filename: `name-resume.pdf`.

## Word DOCX

The DOCX pipeline creates real Office Open XML paragraphs, heading styles, bullet numbering, hyperlinks, page dimensions, margins, and supported photos. Every catalog template maps its layout family, header treatment, section rules, colors, typography, spacing, columns, entry hierarchy, and skill treatment to editable Word content. List skills use tabbed paragraphs, functional skills use paired paragraph rows, and technology proficiency bars use shaded text runs, so these treatments do not expose Word table grids. Chip and outline skills use inline rounded Word shapes with real editable text and template-aware fill, border, padding, and typography.

The exporter preserves native document flow and pagination rather than embedding a screenshot. Decorative structure is never required to understand the resume, and the result remains editable in Microsoft Word.

Filename: `name-resume.docx`.

## PNG and JPEG

Image export captures each already-paginated live preview page at double pixel density. A single-page resume downloads directly. Multi-page resumes download one ZIP containing predictable page files such as `name-resume-page-1.png` and `name-resume-page-2.png`.

Images are intended for sharing and portfolio previews. PDF or DOCX is recommended for job applications and ATS systems.

## Failure behavior

Each exporter reports a user-friendly status and keeps the current resume state intact if generation fails. No exporter sends resume data to an external service.
