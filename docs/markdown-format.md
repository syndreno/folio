# Resume Markdown format

Resume Builder uses a versioned Markdown file as the portable source of truth for a resume. Users can edit the file in any text editor, upload it to the application, and download it again after making changes.

## Starter files

- [`resume-template.md`](../public/examples/resume-template.md) is a lightly filled template with instructions.
- [`example-resume.md`](../public/examples/example-resume.md) is a complete fictional resume that can be loaded as sample data.

All names, employers, contact details, links, and achievements in the example are fictional.

## File structure

The file has two parts:

1. YAML front matter between the opening and closing `---` lines.
2. Resume content written as ordinary Markdown.

The front matter stores portable settings such as the format version, personal details, selected template, resume page colors (`accent_color`, `paper_color`, and `text_color`), body and heading fonts, bullet size, section order, and hidden sections. Temporary interface state—including website appearance—is not stored there.

## Heading rules

- A single `#` starts a resume section, such as `# Experience`.
- A `##` starts an item within a section, such as a job or project.
- A line beginning with `-` creates a bullet.
- An unknown `#` heading is preserved as a custom section.
- `# Custom: Section Name` explicitly declares a custom section.

Section names are matched case-insensitively against known aliases. For example, `Professional Experience` and `Employment History` can both be recognized as experience.

## Versioning

Every exported file contains:

```yaml
resume_version: 1
```

Future format changes must use explicit migrations. Importing a file from a newer unsupported format should produce a warning and must not silently discard content.

## Photos

The `photo` field is empty by default. Photo binary data is stored locally by the application and is not silently embedded in Markdown. A future explicit portable-photo option may use a size-limited embedded data URL or downloadable package.

## Contact icons

Contact icons are optional presentation metadata. Contact details always remain visible as normal text for accessibility and ATS parsing.

```yaml
show_contact_icons: true
contact_icons:
  email: "https://fontawesome.com/icons/envelope?f=classic&s=solid"
  phone: "https://fontawesome.com/icons/phone?f=classic&s=solid"
  location: "https://fontawesome.com/icons/location-dot?f=classic&s=solid"
  website: "https://fontawesome.com/icons/globe?f=classic&s=solid"
  linkedin: "https://fontawesome.com/icons/linkedin?f=brands&s=brands"
  github: "https://fontawesome.com/icons/github?f=brands&s=brands"
```

Supported Free icon names are `at`, `briefcase`, `envelope`, `github`, `globe`, `link`, `linkedin`, `location-dot`, `map-pin`, `mobile-screen-button`, `phone`, and `user`.

Users can select these icons visually in the resume Design panel. The selected official URLs are written to `contact_icons` during Markdown export and restored automatically during the next import. Selecting **No icon** stores an empty value for that contact type.

Only official HTTPS URLs matching `https://fontawesome.com/icons/<supported-name>` are accepted. The URL identifies the icon; the application renders its locally bundled Font Awesome Free definition. It does not fetch arbitrary remote SVG, HTML, or JavaScript. Invalid sources produce a non-blocking import warning.

## Additional personal links

The `custom_links` list stores optional portfolio, blog, social, and other links. Each entry has readable resume text and an independently validated destination and icon.

```yaml
custom_links:
  - header: "Portfolio"
    content: "portfolio.example.com"
    url: "https://portfolio.example.com"
    icon: "https://fontawesome.com/icons/link?f=classic&s=solid"
```

- `header` is the user-defined label.
- `content` is the visible value shown after the label.
- `url` is the clickable HTTP or HTTPS destination.
- `icon` is an optional supported Font Awesome Free URL.

The preview and ATS PDF keep `header` and `content` as normal text even when an icon is selected. Custom links can be added and edited in **Personal details**, and all four fields are restored when the exported Markdown is uploaded again.

## Safety

Raw HTML is ignored during resume rendering. Instruction comments in the starter template do not appear in the resume. Scripts, event handlers, and unsafe URLs are never executed.
