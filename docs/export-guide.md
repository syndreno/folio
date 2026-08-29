# Resume export guide

All export work happens in the browser and uses the same normalized `ResumeDocument` shown by the editor and live preview. Export libraries are loaded only when a user selects their format.

## Markdown

Markdown is the portable source file. It includes current content, custom and hidden sections, section order, template choice, supported design values, contact icon selections, and an optional size-limited local photo. Re-uploading it restores the resume without a server or account.

Filename: `name-resume.md`.

## ATS PDF

The PDF pipeline builds a text document with `@react-pdf/renderer`; it does not take a screenshot of the resume. Text remains selectable and searchable, links remain links, visible sections follow logical reading order, and long entries flow across A4 or Letter pages. Standard fonts and single-column structures are used for ATS templates.

Filename: `name-resume.pdf`.

## Word DOCX

The DOCX pipeline creates real Office Open XML paragraphs, heading styles, bullet numbering, hyperlinks, page dimensions, and margins. It maps the selected Classic, Modern, or Professional template to editable Word styling, including its header treatment, section rules, colors, fonts, spacing, and supported Professional photo. The result remains editable in Microsoft Word and prioritizes ATS-readable document flow; decorative content is never required for interpreting it.

Filename: `name-resume.docx`.

## PNG and JPEG

Image export captures each already-paginated live preview page at double pixel density. A single-page resume downloads directly. Multi-page resumes download one ZIP containing predictable page files such as `name-resume-page-1.png` and `name-resume-page-2.png`.

Images are intended for sharing and portfolio previews. PDF or DOCX is recommended for job applications and ATS systems.

## Failure behavior

Each exporter reports a user-friendly status and keeps the current resume state intact if generation fails. No exporter sends resume data to an external service.
