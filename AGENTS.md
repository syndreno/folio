# AGENTS.md

## Project: Resume Builder Website

This file defines the product requirements, architecture rules, coding standards, UX expectations, ATS requirements, export behavior, and implementation guidance for any AI coding agent or developer working on this repository.

The goal is to build a modern, privacy-friendly, extensible resume builder where Markdown is the portable source of truth for resume content.

---

# 1. Product Vision

Build a resume builder website where a user can:

- Create a new resume from scratch.
- Upload an existing `.md` file containing resume information.
- Automatically parse the uploaded Markdown and populate the resume editor.
- Select from multiple professional resume templates.
- See their content immediately rendered in the selected template.
- Edit all resume content live without editing raw Markdown manually.
- Upload an optional profile photo.
- Change template color, typography, spacing, and supported layout settings.
- Drag and drop resume sections into any order.
- Reorder entries inside sections where appropriate.
- Add new sections.
- Rename custom sections.
- Hide or delete sections.
- Edit resume content on the fly.
- Preview changes in real time.
- Download the completed resume as:
  - PDF
  - DOCX / Microsoft Word
  - PNG
  - JPG / JPEG
  - Markdown `.md`
- Re-upload the exported Markdown later and continue editing.
- Produce ATS-friendly resume output.
- Preserve content in a clean, portable, human-readable format.
- Work without requiring an account for the core feature set.
- Keep all source code clean, modular, readable, documented, testable, and easy to extend.

The user should never be locked into the application.

Their Markdown file must remain usable as an independent resume source.

---

# 2. Core Principles

Every implementation decision must follow these principles.

## 2.1 Markdown Is the Portable Source of Truth

Resume content should be stored internally in a normalized object model, but the application must support lossless or near-lossless conversion between:

```text
Markdown
   ↓
Normalized Resume Data
   ↓
Editor
   ↓
Template Renderer
   ↓
PDF / DOCX / Image / Markdown
```

Do not make the user's resume dependent on hidden database records.

---

## 2.2 ATS First

The default PDF and DOCX outputs must prioritize Applicant Tracking System compatibility.

Visual creativity must never break machine readability.

Templates may have decorative modes, but every template must clearly indicate whether it is:

- ATS Optimized
- ATS Compatible
- Visual / Creative

The default templates should be ATS Optimized.

---

## 2.3 Privacy First

For the core application:

- Process resume data in the browser whenever possible.
- Do not upload resumes to a server unless a future cloud feature explicitly requires it.
- Do not silently collect resume content.
- Do not log personal resume content.
- Do not expose uploaded files in analytics.
- Do not send profile photos to external services.
- Do not require registration to create or export a resume.

---

## 2.4 Maintainability

Code must be understandable by a human developer who opens the repository months later.

Prefer:

- small components
- clear names
- typed interfaces
- pure functions
- documented transformation logic
- configuration-driven behavior
- reusable utilities
- feature-based folders

Avoid:

- huge components
- magic numbers
- magic strings
- deeply nested conditionals
- duplicated business logic
- hidden side effects
- unnecessary abstractions
- premature optimization

---

# 3. Recommended Technology Stack

Preferred stack:

```text
React
TypeScript
Vite
```

Suggested libraries may include:

```text
zod
gray-matter
remark
remark-gfm
unified
@dnd-kit/core
@dnd-kit/sortable
docx
@react-pdf/renderer
html-to-image
file-saver
idb
```

Use the smallest dependency set necessary.

Before adding any new dependency, ask:

1. Is this functionality difficult to implement safely ourselves?
2. Is the library actively maintained?
3. Is the bundle size acceptable?
4. Does it work in modern browsers?
5. Does it introduce security or licensing concerns?
6. Does it improve maintainability?

Do not add a library only to save a few lines of code.

---

# 4. Application Modes

The product should support these entry paths:

```text
Create New Resume
Upload Markdown Resume
Load Example Resume
```

Optional future entry paths:

```text
Import JSON
Import DOCX
Import LinkedIn Data
Load Local Draft
```

Do not implement future features unless requested, but keep the architecture extensible.

---

# 5. Main User Flow

The expected user journey is:

```text
1. Open website
2. Create new resume or upload Markdown
3. Parse resume data
4. Validate imported data
5. Choose template
6. Render resume preview
7. Edit fields
8. Add/remove/reorder sections
9. Customize design
10. Upload optional photo
11. Run ATS checks
12. Preview final pages
13. Export desired format
14. Optionally download updated Markdown
15. Re-upload Markdown later to continue editing
```

The application must never require the user to restart because they changed templates.

Content and template must remain separate.

---

# 6. Application Layout

Recommended desktop layout:

```text
+-----------------------------------------------------------------------+
| Logo | Resume Name | Undo | Redo | ATS Check | Export                 |
+---------------------------+-------------------------------------------+
|                           |                                           |
| Editor Sidebar            | Live Resume Preview                       |
|                           |                                           |
| Personal Details          |                                           |
| Summary                   |                                           |
| Experience                |                                           |
| Education                 |                                           |
| Skills                    |                                           |
| Projects                  |                                           |
| Custom Sections           |                                           |
|                           |                                           |
+---------------------------+-------------------------------------------+
```

Recommended main tabs:

```text
Content
Design
Sections
ATS
Export
```

On mobile:

```text
Editor
Preview
Design
Export
```

Use responsive tabs or bottom navigation.

---

# 7. Resume Markdown Format

The application must define a documented Markdown structure.

A recommended file format is:

```md
---
resume_version: 1
name: "John Doe"
title: "Senior Software Developer"
email: "john@example.com"
phone: "+91 9876543210"
location: "Mumbai, India"
website: "https://example.com"
linkedin: "https://linkedin.com/in/johndoe"
github: "https://github.com/johndoe"
template: "classic"
accent_color: "#1f4e79"
font_family: "Arial"
photo: ""
---

# Professional Summary

Senior Software Developer with experience building scalable enterprise applications.

# Skills

- JavaScript
- TypeScript
- React
- Angular
- Node.js
- PHP
- MySQL

# Experience

## Senior Software Developer — Example Company

**January 2023 - Present | Mumbai, India**

- Developed enterprise applications used by multiple departments.
- Reduced processing time by 35% through workflow automation.
- Built reusable frontend components and REST APIs.

## Software Developer — Previous Company

**June 2019 - December 2022 | Mumbai, India**

- Developed and maintained internal applications.
- Improved slow database queries and reporting processes.

# Education

## Bachelor of Engineering in Computer Science

Example University  
2015 - 2019

# Projects

## Resume Builder

**React, TypeScript, Markdown**

- Built a Markdown-powered resume builder.
- Added PDF, DOCX, image, and Markdown export.

# Certifications

- Certification Name — Issuer — 2026

# Languages

- English
- Hindi

# Custom: Achievements

- Employee of the Month
- Open-source contributor
```

---

# 8. Markdown Front Matter

Application-specific settings should be stored in YAML front matter.

Recommended fields:

```yaml
resume_version: 1
template: classic
accent_color: "#1f4e79"
font_family: Arial
font_size: 10.5
line_height: 1.25
page_size: A4
photo: ""
section_order:
  - summary
  - experience
  - skills
  - education
hidden_sections: []
```

Do not store excessive UI-only state inside the Markdown.

Avoid storing:

```text
open accordion state
selected editor tab
temporary modal values
current scroll position
```

Those belong to local application state.

---

# 9. Markdown Versioning

Every exported Markdown resume should include:

```yaml
resume_version: 1
```

When the format changes, provide explicit migration functions.

Example:

```ts
migrateResumeV1ToV2()
migrateResumeV2ToV3()
```

Never silently discard data from an older resume version.

Unsupported future versions should produce a clear message such as:

```text
This resume was created with a newer resume format.
Some fields may not be supported by this version of the editor.
```

---

# 10. Normalized Resume Data Model

Do not bind templates directly to Markdown AST nodes.

Parse Markdown into a normalized domain model.

Example:

```ts
export interface ResumeDocument {
  version: number;
  metadata: ResumeMetadata;
  personal: PersonalDetails;
  sections: ResumeSection[];
  design: ResumeDesignSettings;
}

export interface ResumeMetadata {
  fileName?: string;
  resumeName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PersonalDetails {
  fullName: string;
  professionalTitle?: string;
  email?: string;
  phone?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  github?: string;
  photo?: string;
}

export interface ResumeSection {
  id: string;
  type: ResumeSectionType;
  title: string;
  visible: boolean;
  order: number;
  items: ResumeSectionItem[];
}

export type ResumeSectionType =
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certifications"
  | "languages"
  | "achievements"
  | "volunteering"
  | "publications"
  | "awards"
  | "interests"
  | "custom";

export interface ResumeDesignSettings {
  templateId: string;
  accentColor: string;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  sectionSpacing: number;
  pageSize: "A4" | "LETTER";
  showPhoto: boolean;
}
```

Create more specialized interfaces for section items.

Do not use `any` unless unavoidable.

---

# 11. Data Validation

Use schema validation.

Recommended:

```text
Zod
```

Validate:

- imported front matter
- parsed sections
- links
- email
- numeric design values
- supported template IDs
- supported page sizes
- resume format version

Validation errors should be user friendly.

Bad:

```text
ZodError at path metadata.x.y
```

Good:

```text
The email address in your Markdown file does not appear to be valid.
You can still continue and edit it manually.
```

---

# 12. Markdown Import

When a user uploads a `.md` file:

1. Validate file extension.
2. Validate MIME type when available.
3. Validate file size.
4. Read the file locally.
5. Parse YAML front matter.
6. Parse Markdown body.
7. Detect known resume sections.
8. Convert data to the normalized resume model.
9. Preserve unknown sections as custom sections.
10. Validate the result.
11. Show non-blocking import warnings.
12. Render the resume immediately.

The parser must never crash the application because of malformed Markdown.

---

# 13. Section Alias Detection

Users may name sections differently.

Create centralized aliases.

Example:

```ts
export const SECTION_ALIASES = {
  summary: [
    "summary",
    "professional summary",
    "profile",
    "career summary",
    "about me"
  ],
  experience: [
    "experience",
    "work experience",
    "professional experience",
    "employment",
    "employment history",
    "career history"
  ],
  education: [
    "education",
    "academic background",
    "academic qualifications"
  ],
  skills: [
    "skills",
    "technical skills",
    "core skills",
    "technologies",
    "competencies"
  ],
  projects: [
    "projects",
    "personal projects",
    "professional projects",
    "key projects"
  ]
};
```

Keep these aliases in configuration.

Do not spread duplicate alias logic throughout the codebase.

---

# 14. Unknown Section Preservation

If a Markdown file contains:

```md
# Conferences

...
```

and `Conferences` is not a built-in section, import it as:

```ts
{
  type: "custom",
  title: "Conferences"
}
```

Never drop content simply because the parser does not recognize the section.

---

# 15. Resume Editor

Each built-in section must have a structured editor.

Supported actions should include:

```text
Add
Edit
Delete
Duplicate
Hide
Show
Move Up
Move Down
Drag
```

The UI should allow direct editing of:

- name
- title
- contact information
- summary
- jobs
- education
- skills
- projects
- certifications
- languages
- custom sections

All changes must update the central resume state immediately.

---

# 16. Live Preview

The preview must update as the user types.

Use sensible debouncing only where required.

The preview should show actual pagination as closely as possible.

Users must be able to see:

- page breaks
- overflowing sections
- hidden sections
- visual spacing
- template appearance
- photo placement
- final export layout

Avoid maintaining a separate data model for preview.

The preview must use the same resume state as exports.

---

# 17. Inline Editing

Where practical, let users click visible resume text to edit it.

Examples:

```text
Name
Professional title
Section title
Job title
Company
Dates
Experience bullet
Project name
Skill
```

Do not use uncontrolled `contenteditable` elements everywhere.

Prefer controlled editor components connected to the central domain state.

---

# 18. Drag and Drop

Use drag and drop for:

- resume sections
- experience entries
- education entries
- projects
- certifications
- custom section entries
- bullets when appropriate

Recommended library:

```text
dnd-kit
```

Always use stable unique IDs.

Never use the array index as the long-term identity of an item.

---

# 19. Add New Section

Users must be able to create custom sections.

Examples:

```text
Achievements
Awards
Publications
Open Source
Volunteer Work
Patents
Speaking
Conferences
Interests
Leadership
Training
```

Suggested custom section content types:

```text
Text
Bullet List
Entry List
Timeline
```

Every custom section must support:

- title editing
- content editing
- reordering
- hiding
- deleting
- Markdown export
- PDF export
- DOCX export

---

# 20. Profile Photo

Profile photos are optional.

Supported formats:

```text
JPG
JPEG
PNG
WebP
```

Features:

- upload
- preview
- remove
- replace
- crop
- zoom
- reposition
- choose shape if supported by template

Possible shapes:

```text
Square
Rounded Square
Circle
```

Important:

The application must clearly indicate that photo-based or multi-column templates may be less ATS friendly.

ATS-first templates should allow the photo to be disabled.

---

# 21. Template System

Templates must be data-driven and componentized.

Example:

```text
templates/
  classic/
  modern/
  minimal/
  executive/
  compact/
```

Each template should define metadata.

Example:

```ts
export interface ResumeTemplateDefinition {
  id: string;
  name: string;
  description: string;
  atsRating: "optimized" | "compatible" | "creative";
  supportsPhoto: boolean;
  supportsTwoColumns: boolean;
  supportedPageSizes: Array<"A4" | "LETTER">;
  defaultDesign: ResumeDesignSettings;
}
```

Do not put template-specific conditional logic all over the editor.

The editor controls data.

Templates control presentation.

---

# 22. Recommended Initial Templates

Implement a small number of high-quality templates before adding many mediocre templates.

Recommended starting set:

## Classic ATS

Characteristics:

```text
Single column
No photo by default
Standard headings
Minimal decoration
Strong ATS compatibility
```

## Modern ATS

Characteristics:

```text
Single column
Subtle accent color
Clean typography
No complex graphics
Strong ATS compatibility
```

## Compact ATS

Characteristics:

```text
Dense layout
Single column
Optimized for experienced professionals
Strong ATS compatibility
```

## Professional

Characteristics:

```text
Optional photo
Moderate visual styling
ATS compatible where possible
```

## Creative

Characteristics:

```text
More visual freedom
May use multi-column layout
Not guaranteed to perform equally in every ATS
Clearly marked as Creative
```

---

# 23. Template Color Customization

Users should be able to change the accent color.

Provide:

- color picker
- preset palette
- hexadecimal input
- reset to template default

Example:

```text
#1F4E79
#2F6FED
#176B55
#6C4AB6
#333333
```

Never allow low-contrast combinations that make text unreadable.

Use contrast validation.

---

# 24. Typography Customization

Support a controlled list of ATS-safe or broadly compatible fonts.

Recommended defaults:

```text
Arial
Calibri
Helvetica
Georgia
Times New Roman
Verdana
```

Web-only font choices can be offered for image or web preview, but exported ATS documents should favor standard embedded or commonly available fonts.

Do not allow unreadable decorative fonts in ATS templates.

---

# 25. Layout Customization

Allow controlled settings such as:

```text
Font Size
Line Height
Section Spacing
Page Margin
Heading Size
Entry Spacing
Accent Color
Photo Visibility
```

Do not expose hundreds of low-level CSS controls.

The resume should remain professional.

Use reasonable limits.

Example:

```text
Font size: 9px - 14px
Line height: 1.1 - 1.6
Page margin: 8mm - 25mm
```

---

# 26. ATS Requirements

ATS compatibility is a critical feature.

The application must provide a default ATS-safe export path.

## 26.1 ATS-Friendly PDF Requirements

The generated ATS PDF should:

- contain real selectable text
- never convert the full resume into an image
- preserve proper Unicode text
- use embedded or broadly supported fonts
- keep logical reading order
- use standard section headings
- avoid unnecessary text boxes
- avoid complex floating elements
- avoid important content inside headers and footers
- avoid critical information represented only through icons
- avoid image-only text
- avoid excessive columns
- avoid canvas-only rendering for text
- avoid decorative backgrounds behind body text
- avoid overlapping text
- avoid invisible text
- avoid unusual character substitution
- preserve copy/paste readability

A user should be able to select the generated PDF text and paste it into a plain-text editor in roughly the correct reading order.

---

# 27. ATS Content Recommendations

The ATS helper should recommend standard headings such as:

```text
Professional Summary
Experience
Work Experience
Skills
Education
Projects
Certifications
Achievements
Languages
```

Warn users when a custom heading could be unclear.

Example:

```text
"Where I've Worked"
```

Suggestion:

```text
Consider renaming this section to "Work Experience" for better ATS recognition.
```

Do not force the change.

---

# 28. ATS Contact Information Rules

Important contact information should exist as normal text.

Recommended:

```text
Full Name
Phone
Email
City / Location
LinkedIn URL
Portfolio URL
GitHub URL
```

Do not rely only on icons.

For example, instead of:

```text
[mail icon] john@example.com
```

ensure the actual email address is present as text in the document.

---

# 29. ATS Table and Column Rules

Avoid tables for critical resume structure where possible.

Do not use complex tables for:

- work history
- education
- core contact data
- project descriptions

Use semantic text flow.

Two-column templates may be offered, but they must be labeled appropriately.

The ATS-first templates should remain single column unless extensive testing proves otherwise.

---

# 30. ATS Date Formatting

Support conventional date formats.

Examples:

```text
Jan 2024 - Present
January 2024 - Present
2024 - Present
```

Avoid ambiguous compact formats where practical.

Warn about inconsistent date formatting.

---

# 31. ATS Keyword Guidance

Provide an optional ATS analysis panel.

It may check for:

- missing standard sections
- incomplete contact information
- weak section headings
- excessive resume length
- repeated words
- missing measurable achievements
- long paragraphs
- insufficient skills
- image-heavy layout
- unsupported symbols
- unusual headings
- inconsistent dates
- very small font sizes

Do not claim that an internal score guarantees selection by an employer.

Use wording like:

```text
ATS Readiness
```

instead of:

```text
Guaranteed ATS Score
```

---

# 32. ATS Readiness Panel

Possible checks:

```text
✓ Selectable text output
✓ Standard section headings
✓ Contact details detected
✓ No critical text inside images
✓ Font size is readable
✓ Resume uses ATS-friendly layout
! Work experience has few measurable achievements
! Custom heading "My Journey" may be unclear to some ATS parsers
```

Provide explanations and fixes.

---

# 33. PDF Export

PDF export must have two possible concepts:

## ATS PDF

Use a text-based PDF generation approach.

Requirements:

```text
Selectable text
Logical order
Consistent pagination
No rasterized body content
Searchable content
A4 / Letter support
Professional margins
```

## Visual PDF

Optional.

This may preserve exact visual appearance for creative templates.

Clearly differentiate it from ATS PDF if the implementation method differs.

Do not present a screenshot-based PDF as ATS optimized.

---

# 34. PDF Pagination

The export system must handle:

- page breaks
- long experience sections
- sections continuing on another page
- orphan headings
- clipped content
- footer/page margin collisions

Avoid:

```text
heading at bottom of page
content starting on next page with no context
```

Where practical, use break rules to keep an entry together.

---

# 35. DOCX Export

DOCX is important because recruiters and ATS systems often accept Microsoft Word files.

The DOCX exporter must:

- create actual Word text
- use styles
- preserve headings
- preserve bullet lists
- preserve dates
- preserve links
- avoid image-based text
- avoid complex floating elements
- use standard document structure
- support A4 and Letter where possible

The output should remain editable in Microsoft Word.

---

# 36. PNG and JPEG Export

Image export is intended for:

```text
sharing
portfolio previews
social media
quick visual copies
```

Image output is not the primary ATS format.

Display a note such as:

```text
PNG/JPEG resumes are useful for sharing, but PDF or DOCX is recommended for job applications and ATS systems.
```

For multi-page resumes, export:

```text
resume-page-1.png
resume-page-2.png
...
```

or optionally package them into ZIP.

---

# 37. Markdown Export

The application must always allow the user to download the updated `.md` file.

The exported Markdown must include:

- current personal details
- all visible content
- all custom sections
- section ordering
- supported design metadata
- template selection
- resume format version

It should remain clean and readable by humans.

Do not produce machine-generated unreadable Markdown.

---

# 38. Markdown Round-Trip Requirement

The following workflow must work:

```text
Upload resume.md
↓
Edit resume
↓
Change section order
↓
Add custom section
↓
Change template
↓
Download updated resume.md
↓
Close website
↓
Return later
↓
Upload updated resume.md
↓
Resume restores correctly
```

Create automated tests for this round-trip.

---

# 39. Export Filename

Use predictable filenames.

Examples:

```text
john-doe-resume.pdf
john-doe-resume.docx
john-doe-resume.md
john-doe-resume-page-1.png
```

Sanitize filenames safely.

---

# 40. Autosave

Provide browser-local autosave.

Recommended:

```text
IndexedDB
```

or local storage for small metadata.

Autosave should never replace the need for explicit Markdown export.

Suggested behavior:

```text
Draft saved locally
```

Users should be able to:

```text
Restore Draft
Delete Local Draft
Disable Autosave
```

Do not store sensitive data remotely by default.

---

# 41. Undo and Redo

Implement application-level undo/redo.

Operations should include:

- text changes
- section reordering
- item reordering
- deleting
- adding
- hiding
- design changes

Do not create one history entry for every keystroke if it makes undo unusable.

Group edits sensibly.

---

# 42. Template Switching

Changing templates must never alter resume content.

Template switching should affect only presentation.

Bad:

```text
Switching template deletes unsupported photo
```

Good:

```text
Switching to a no-photo template simply hides the photo.
The photo remains in resume state.
```

---

# 43. Separation of Concerns

Use a layered architecture.

Recommended structure:

```text
src/
  app/
  components/
  features/
    editor/
    import/
    export/
    templates/
    ats/
    photo/
    sections/
    design/
  domain/
  parsers/
  serializers/
  services/
  hooks/
  stores/
  schemas/
  utils/
  constants/
  types/
  styles/
  tests/
```

Possible template structure:

```text
src/
  features/
    templates/
      registry.ts
      classic/
        ClassicTemplate.tsx
        classic.config.ts
        classic.module.css
      modern/
        ModernTemplate.tsx
        modern.config.ts
        modern.module.css
```

---

# 44. Domain Layer

The domain layer should contain:

- resume models
- section types
- validation
- transformations
- migrations
- domain utilities

The domain layer should not import React components.

---

# 45. Parser Layer

Parser responsibilities:

```text
Markdown → ResumeDocument
```

Keep parsing logic isolated.

Example:

```text
parsers/
  parseResumeMarkdown.ts
  parseFrontMatter.ts
  parseSections.ts
  detectSectionType.ts
  parseExperience.ts
  parseEducation.ts
```

Avoid one 1,000-line parser file.

---

# 46. Serializer Layer

Serializer responsibilities:

```text
ResumeDocument → Markdown
ResumeDocument → DOCX
ResumeDocument → PDF model
ResumeDocument → image render model
```

Keep format-specific code separate.

---

# 47. Template Registry

Register templates centrally.

Example:

```ts
export const templateRegistry = {
  classic: {
    definition: classicDefinition,
    component: ClassicTemplate
  },
  modern: {
    definition: modernDefinition,
    component: ModernTemplate
  }
};
```

Adding a template should not require editing many unrelated files.

---

# 48. State Management

Use a predictable state model.

Possible solutions:

```text
React Context + reducer
Zustand
Redux Toolkit
```

Choose based on project complexity.

Do not introduce a heavy state library unnecessarily.

Core resume state should include:

```text
resume
selectedTemplate
designSettings
history
importWarnings
atsResults
autosaveState
```

---

# 49. Immutable Updates

Prefer immutable state updates.

Do not mutate nested resume state directly.

Use:

- reducers
- helper update functions
- Immer if justified

Create well-named actions.

Example:

```ts
updatePersonalDetails()
addSection()
removeSection()
moveSection()
updateSection()
addSectionItem()
updateSectionItem()
removeSectionItem()
updateDesignSettings()
```

---

# 50. Coding Standards

Use TypeScript strict mode.

Recommended:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noUncheckedIndexedAccess": true
  }
}
```

Do not disable compiler rules just to make code pass.

---

# 51. Naming Rules

Use clear names.

Good:

```ts
parseResumeMarkdown
exportResumeToDocx
moveResumeSection
validateAtsReadiness
selectedTemplateId
```

Bad:

```ts
doStuff
handleIt
temp
data2
obj
x1
fun
```

Use:

```text
PascalCase for components and types
camelCase for functions and variables
UPPER_SNAKE_CASE for true constants
kebab-case for filenames only where project conventions require it
```

Be consistent.

---

# 52. Function Design

Functions should:

- do one clear job
- have descriptive names
- avoid hidden side effects
- return predictable values
- accept typed parameters
- remain reasonably small

Prefer:

```ts
function detectSectionType(title: string): ResumeSectionType
```

over:

```ts
function processEverything(file: string)
```

---

# 53. Components

Components should stay focused.

Avoid a single component containing:

```text
file upload
Markdown parsing
editor
template rendering
ATS checks
export
drag and drop
photo editing
```

Break functionality into feature-level components.

---

# 54. Comments

Comments should explain:

```text
Why
Business rules
Non-obvious edge cases
ATS decisions
Browser workarounds
Format compatibility
```

Do not comment obvious code.

Bad:

```ts
// Increment index
index++;
```

Good:

```ts
// Preserve unknown headings as custom sections so Markdown round-tripping
// never drops user content.
```

---

# 55. Documentation

Important modules should contain concise documentation.

Document:

- Markdown format
- parser rules
- resume schema
- template API
- export pipeline
- ATS requirements
- adding a new template
- adding a new section type
- adding a new export format

---

# 56. Error Handling

Never expose raw stack traces to users.

User-facing errors should be clear.

Examples:

```text
We could not read this Markdown file.
The file is larger than the supported limit.
This resume uses a newer format version.
The uploaded photo format is not supported.
The PDF export could not be completed.
```

Log developer details only in development mode.

---

# 57. File Upload Security

Treat uploaded files as untrusted input.

For Markdown:

- limit file size
- validate extension
- validate type where possible
- sanitize rendered HTML
- do not execute HTML or scripts from Markdown
- do not allow arbitrary JavaScript URLs

For photos:

- validate image type
- validate image size
- decode safely
- reject unsupported files
- avoid SVG upload unless properly sanitized

Do not render user-supplied raw HTML directly.

---

# 58. Markdown Security

Raw HTML from Markdown should be disabled by default.

Never allow:

```html
<script>
```

event handlers such as:

```html
<img onerror="...">
```

or unsafe URLs such as:

```text
javascript:
```

Sanitize all external links.

Use:

```text
rel="noopener noreferrer"
```

for external links opened in a new tab.

---

# 59. Privacy

Do not include resume text, emails, phone numbers, or addresses in:

- analytics events
- logs
- error tracking payloads
- URLs
- query parameters

Analytics should track generic events only.

Example:

```text
template_selected
pdf_export_clicked
ats_check_completed
```

Not:

```text
user_email=john@example.com
```

---

# 60. Accessibility

Target WCAG 2.1 AA where practical.

Requirements:

- keyboard navigation
- visible focus states
- labels on inputs
- screen-reader friendly controls
- sufficient color contrast
- accessible drag-and-drop alternatives
- logical heading structure
- meaningful button labels
- no color-only indicators

Drag/drop must also provide:

```text
Move Up
Move Down
```

or keyboard interaction.

---

# 61. Responsive Design

The editor must work on:

```text
Desktop
Laptop
Tablet
Mobile
```

The resume preview may scale on smaller screens, but export output must preserve actual page dimensions.

---

# 62. Performance

Avoid rerendering the entire application for every minor change.

Optimize only where necessary.

Potential strategies:

- memoize templates
- split editor panels
- lazy-load heavy export libraries
- lazy-load template thumbnails
- debounce expensive ATS checks
- avoid storing derived state redundantly

Do not sacrifice code readability for minor gains.

---

# 63. Export Performance

Heavy export code should be loaded only when needed.

Example:

```ts
const { exportToDocx } = await import("./exportToDocx");
```

Consider similar lazy loading for:

```text
PDF generation
DOCX generation
Image export
ZIP creation
```

---

# 64. Testing Strategy

Use automated tests.

Recommended categories:

```text
Unit Tests
Integration Tests
End-to-End Tests
Visual Regression Tests
```

---

# 65. Parser Tests

Test:

- valid Markdown
- missing front matter
- custom sections
- alternative section names
- malformed headings
- empty sections
- long bullet lists
- Unicode names
- special characters
- links
- date formats
- Markdown produced by previous app versions

---

# 66. Round-Trip Tests

Critical test:

```text
Markdown
→ parse
→ edit
→ serialize
→ parse again
```

The second parse must preserve the resume content.

---

# 67. Export Tests

Test that:

- PDF contains selectable text
- PDF has expected visible content
- DOCX contains editable text
- links are preserved
- bullets remain bullets
- section order matches editor order
- hidden sections are omitted
- custom sections are preserved
- multi-page exports do not clip content

---

# 68. ATS Export Tests

Create fixture resumes and automatically check:

- key text can be extracted from PDF
- text order is reasonable
- contact information is extractable
- section headings are present
- no body content is rasterized in ATS PDF
- Unicode characters survive export

Where practical, use at least one PDF text extraction test in CI.

---

# 69. Accessibility Tests

Test:

- forms have labels
- buttons are keyboard accessible
- dialogs trap focus correctly
- drag/drop has keyboard support
- color contrast is acceptable
- errors are announced accessibly

---

# 70. End-to-End Scenarios

At minimum automate:

## Scenario 1

```text
Create new resume
Fill details
Select template
Export PDF
```

## Scenario 2

```text
Upload Markdown
Auto-fill editor
Edit experience
Reorder sections
Export updated Markdown
```

## Scenario 3

```text
Upload previously exported Markdown
Confirm content restores
Export DOCX
```

## Scenario 4

```text
Upload photo
Change template color
Switch template
Ensure resume content is unchanged
```

## Scenario 5

```text
Add custom section
Move it
Hide it
Show it
Export Markdown
Re-import Markdown
Confirm custom section survives
```

---

# 71. Formatting and Linting

Use automated formatting and linting.

Recommended:

```text
ESLint
Prettier
```

Do not commit code with lint errors.

Add scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest",
    "test:e2e": "playwright test",
    "lint": "eslint .",
    "format": "prettier --write .",
    "typecheck": "tsc --noEmit"
  }
}
```

Exact tools may change, but equivalent quality checks must exist.

---

# 72. Git Standards

Keep commits focused.

Recommended commit style:

```text
feat: add Markdown resume importer
feat: add ATS classic template
fix: preserve custom sections during export
refactor: split export services
test: add Markdown round-trip coverage
docs: document template API
```

Do not mix unrelated refactors with feature changes.

---

# 73. Pull Request Quality Checklist

Before considering a feature complete:

```text
[ ] Feature works
[ ] TypeScript passes
[ ] Lint passes
[ ] Tests pass
[ ] No unnecessary dependencies added
[ ] Accessibility considered
[ ] Mobile checked
[ ] Error states handled
[ ] No user data leaked
[ ] Markdown round-trip considered
[ ] ATS impact considered
[ ] Documentation updated
```

---

# 74. Design System

Create reusable primitives.

Examples:

```text
Button
Input
Textarea
Select
ColorPicker
Modal
Drawer
Tabs
Accordion
Tooltip
Card
Badge
IconButton
FileUploader
```

Avoid defining visually inconsistent controls inside individual features.

---

# 75. Status Labels

Suggested badges:

```text
ATS Optimized
ATS Compatible
Creative
Photo Supported
Single Column
Two Column
```

Use them on template cards.

---

# 76. ATS Template Rating

Do not claim universal ATS guarantees.

Suggested wording:

```text
ATS Optimized
Designed for strong compatibility with common resume parsers.
```

Avoid:

```text
100% ATS Guaranteed
Guaranteed interview
Guaranteed ATS pass
```

No software can guarantee recruiter or ATS outcomes.

---

# 77. Resume Quality Helper

The application may provide optional content guidance.

Possible suggestions:

```text
Use action verbs.
Add measurable results.
Keep bullets concise.
Avoid first-person pronouns.
Use consistent tense.
Use standard headings.
Include job-relevant keywords naturally.
```

Do not rewrite user content without explicit user action.

---

# 78. Resume Length Guidance

Display non-blocking guidance.

Typical rules:

```text
1 page: often suitable for early-career candidates
1-2 pages: common for experienced professionals
Longer resumes: may be appropriate for academic, research, or specialized careers
```

Do not hard-limit resumes to one page.

---

# 79. Page Overflow Warning

If content exceeds the current page layout, show:

```text
Your resume currently uses 3 pages.
```

Provide suggestions such as:

```text
Reduce section spacing
Use compact template
Reduce font size slightly
Remove less relevant content
```

Never automatically delete content.

---

# 80. Icons

Icons may be used visually in templates.

However, ATS-critical information must also exist as plain text.

Example:

```text
Email: john@example.com
```

not icon-only content.

---

# 81. Links

Exported PDF and DOCX should preserve clickable links where supported.

Examples:

```text
LinkedIn
GitHub
Portfolio
Email
```

Display recognizable text.

Do not hide all URLs behind icons in ATS templates.

---

# 82. Photo Persistence

A Markdown file cannot reasonably contain large binary photo data as plain YAML.

Use one of these approaches:

Preferred default:

```text
Photo is stored locally in browser draft storage.
Markdown stores optional photo metadata but does not embed the binary image.
```

Optional portable mode:

```text
Allow the user to explicitly embed a compressed data URL only if the file size remains within a safe limit.
```

Clearly explain that an exported Markdown file may not include the photo unless the user chooses an embedding option.

Do not silently create multi-megabyte Markdown files.

---

# 83. Recommended Portable Resume Package

A future feature may offer:

```text
resume-package.zip
```

containing:

```text
resume.md
photo.jpg
metadata.json
```

This is optional and should not replace plain Markdown export.

---

# 84. Import Warnings

Examples:

```text
This section was imported as a custom section.
The template saved in this resume is not available, so Classic was selected.
The saved photo could not be restored.
The file uses an unknown front-matter field. It has been preserved where possible.
```

Warnings must not block editing unless the file is completely unreadable.

---

# 85. Data Loss Prevention

Before destructive actions such as:

```text
Clear Resume
Delete Draft
Replace Current Resume
```

show confirmation.

If an unsaved local draft exists and the user uploads another resume, warn before replacing it.

---

# 86. No Vendor Lock-In

Never force resume data into proprietary hidden formats only.

Markdown export must remain a first-class feature.

If a JSON representation is used internally, it should be documented.

---

# 87. Import/Export Compatibility Layer

Keep adapters separate.

Example:

```text
ResumeDocument
  ↕
MarkdownAdapter
  ↕
DocxExporter
  ↕
PdfExporter
  ↕
ImageExporter
```

Future formats should be easy to add.

---

# 88. Feature Flags

For unfinished or experimental features, use feature flags.

Example:

```ts
export const featureFlags = {
  experimentalImportDocx: false,
  cloudSync: false
};
```

Do not leave half-working features visible.

---

# 89. Browser Support

Target modern versions of:

```text
Chrome
Edge
Firefox
Safari
```

Test export functionality carefully because browser file behavior can differ.

---

# 90. Static Hosting

The basic application should remain deployable as a static website.

Avoid backend dependencies for:

```text
Markdown import
editing
templates
ATS analysis
PDF generation
DOCX generation
image generation
Markdown export
local autosave
```

If routing is added, make sure static hosting refresh behavior is handled correctly.

---

# 91. Future-Friendly Features

Architecture should make these possible later without major rewrites:

```text
Cloud sync
User accounts
Multiple saved resumes
Job-description keyword comparison
AI-assisted bullet writing
Resume version history
Import from JSON
Import from DOCX
Cover letter builder
Portfolio builder
Localization
Multiple languages
Template marketplace
Resume sharing links
Collaboration
```

Do not build them unless requested.

---

# 92. Suggested Repository Structure

```text
resume-builder/
├── public/
│   ├── icons/
│   └── template-previews/
│
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   └── routes.tsx
│   │
│   ├── components/
│   │   └── ui/
│   │
│   ├── domain/
│   │   ├── resume.types.ts
│   │   ├── resume.schema.ts
│   │   ├── resume.defaults.ts
│   │   └── resume.migrations.ts
│   │
│   ├── features/
│   │   ├── ats/
│   │   ├── design/
│   │   ├── editor/
│   │   ├── export/
│   │   │   ├── pdf/
│   │   │   ├── docx/
│   │   │   ├── image/
│   │   │   └── markdown/
│   │   ├── import/
│   │   ├── photo/
│   │   ├── sections/
│   │   └── templates/
│   │
│   ├── parsers/
│   │   └── markdown/
│   │
│   ├── serializers/
│   │   └── markdown/
│   │
│   ├── services/
│   ├── hooks/
│   ├── stores/
│   ├── utils/
│   ├── constants/
│   ├── styles/
│   └── tests/
│
├── docs/
│   ├── markdown-format.md
│   ├── template-api.md
│   ├── ats-guidelines.md
│   └── export-pipeline.md
│
├── AGENTS.md
├── README.md
├── package.json
├── tsconfig.json
├── vite.config.ts
└── LICENSE
```

---

# 93. Example Feature Module Structure

Example editor feature:

```text
features/editor/
├── components/
│   ├── ResumeEditor.tsx
│   ├── PersonalDetailsEditor.tsx
│   ├── SectionEditor.tsx
│   └── EntryEditor.tsx
├── hooks/
├── editor.actions.ts
├── editor.reducer.ts
├── editor.types.ts
└── index.ts
```

Keep public imports clean using feature-level `index.ts` files if the project adopts that convention.

---

# 94. Implementation Order

Recommended development phases:

## Phase 1 — Foundation

```text
Project setup
TypeScript strict mode
Resume domain model
Basic application layout
Template registry
Classic ATS template
```

## Phase 2 — Markdown

```text
Markdown parser
Front matter support
Section detection
Custom section preservation
Markdown serializer
Round-trip tests
```

## Phase 3 — Editor

```text
Personal details editor
Section editors
Live preview
Add/delete/edit
Drag and drop
Undo/redo
```

## Phase 4 — Design

```text
Template selector
Accent color
Typography
Spacing
Photo upload
Additional ATS templates
```

## Phase 5 — Export

```text
ATS PDF
DOCX
PNG
JPEG
Markdown
Pagination tests
```

## Phase 6 — ATS

```text
ATS readiness checks
Warnings
Section heading analysis
Text extraction verification
```

## Phase 7 — Quality

```text
Accessibility
Responsive UI
Autosave
Error handling
Performance
E2E tests
Documentation
```

---

# 95. Definition of Done

The project is not complete until a user can successfully perform this workflow:

```text
1. Open the website.
2. Upload a Markdown resume.
3. See the information automatically filled into the editor.
4. Select another template.
5. See the same information rendered in the new template.
6. Upload a profile photo.
7. Change the template accent color.
8. Edit personal details.
9. Edit experience.
10. Drag Experience above Skills.
11. Add a new custom section.
12. Reorder items.
13. Hide a section.
14. Run ATS readiness checks.
15. Download an ATS-friendly PDF.
16. Download an editable DOCX.
17. Download PNG/JPEG output.
18. Download the updated Markdown file.
19. Close the application.
20. Return later.
21. Upload the exported Markdown.
22. See the resume content, section order, and supported settings restored correctly.
```

---

# 96. Critical Acceptance Criteria

The following are mandatory.

## Markdown

```text
[ ] User can upload .md
[ ] Known sections are detected
[ ] Unknown sections are preserved
[ ] User can export updated .md
[ ] Re-import works
[ ] Versioning exists
```

## Editor

```text
[ ] All common sections editable
[ ] Add section works
[ ] Delete section works
[ ] Hide/show works
[ ] Drag/drop works
[ ] Entry reordering works
[ ] Live preview works
[ ] Undo/redo works
```

## Design

```text
[ ] Multiple templates
[ ] Template switching preserves data
[ ] Accent color editing
[ ] Typography options
[ ] Spacing controls
[ ] Optional photo
```

## Export

```text
[ ] ATS PDF
[ ] DOCX
[ ] PNG
[ ] JPEG
[ ] Markdown
[ ] Correct filenames
[ ] Multi-page handling
```

## ATS

```text
[ ] ATS-first template exists
[ ] PDF contains selectable text
[ ] Logical text order is maintained
[ ] Standard headings supported
[ ] No critical information stored only in icons/images
[ ] Contact data is machine-readable
[ ] ATS readiness checks exist
```

## Engineering Quality

```text
[ ] TypeScript strict mode
[ ] No unnecessary use of any
[ ] Lint passes
[ ] Tests pass
[ ] Architecture documented
[ ] No huge monolithic components
[ ] No duplicated parser/export logic
[ ] Accessible controls
[ ] Responsive layout
[ ] User data remains private by default
```

---

# 97. Rules for AI Coding Agents

When modifying this repository, an AI coding agent must:

1. Read this `AGENTS.md` before making architectural changes.
2. Inspect existing patterns before creating new ones.
3. Reuse existing components and utilities where reasonable.
4. Keep changes scoped to the requested feature.
5. Avoid rewriting unrelated working code.
6. Avoid introducing breaking changes without migration logic.
7. Preserve Markdown compatibility.
8. Preserve custom sections.
9. Preserve ATS behavior.
10. Add or update tests for meaningful behavior changes.
11. Run type checking and linting where available.
12. Keep code human readable.
13. Explain non-obvious implementation decisions in code comments or documentation.
14. Never store user resume data remotely without an explicit product requirement.
15. Never claim ATS guarantees.
16. Never rasterize the ATS PDF body text.
17. Never remove user content silently.
18. Never couple resume content to a single template.
19. Never make template switching destructive.
20. Never introduce a backend for features that can reasonably remain client-side without a clear requirement.

---

# 98. Final Engineering Principle

The project should be designed so that another developer can easily:

```text
Add a template
Add a section type
Change the Markdown parser
Add an export format
Add an ATS rule
Change the editor UI
Add a new design option
```

without rewriting the entire application.

Prefer explicit, boring, readable architecture over clever code.

The final product should feel simple to the user even if the internal implementation is sophisticated.

---

# 99. Final Product Principle

The user owns their resume.

The application should help them edit, design, validate, export, and preserve it without locking their data into the tool.

Markdown provides portability.

Templates provide presentation.

ATS-safe exports provide compatibility.

Clean architecture provides maintainability.
