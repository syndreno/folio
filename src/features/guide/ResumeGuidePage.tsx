import { useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowUpFromBracket,
  faCheck,
  faClipboard,
  faDownload,
  faFileLines,
  faFilePdf,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";
import { SiteFooter } from "../../components/SiteFooter";

const IMPROVE_MARKDOWN_PROMPT = `I attached my Folio resume Markdown file. Improve its wording while keeping it compatible with Folio Resume Builder.

Rules:
1. Treat the attached Markdown as the source of truth. Do not invent employers, dates, qualifications, skills, links, or results.
2. Preserve the complete YAML front matter, including resume_version, template, colors, typography, spacing, section_order, icons, and custom links.
3. Preserve every section. Keep unknown or custom sections instead of deleting them.
4. Improve clarity, action verbs, grammar, and concise achievement-focused wording. Keep exact facts and metrics.
5. Keep standard ATS-readable headings where possible.
6. Return the complete updated .md content only. Do not return commentary or a partial excerpt.
7. Put the result in one Markdown code block so I can save it as a UTF-8 .md file.`;

const CONVERT_PDF_PROMPT = `I attached two files:
- my existing resume PDF, which is the only source for my personal and career information
- Folio's resume-template.md file, which defines the required Markdown format

Convert the PDF into a complete Folio-compatible Markdown resume.

Rules:
1. Follow the structure and YAML front matter from resume-template.md.
2. Transcribe names, contact details, employers, job titles, dates, education, links, skills, and metrics accurately.
3. Do not invent, estimate, or silently correct missing facts. Add [CHECK: ...] beside anything unreadable or uncertain.
4. Preserve all meaningful PDF sections. Put headings that do not match the template under "# Custom: Section name".
5. Use normal Markdown text and hyphen bullets. Do not use HTML, tables, images, or decorative Unicode characters.
6. Use standard ATS-readable section headings where the meaning is equivalent.
7. Set resume_version to 1. Keep template and design settings from the provided Folio template.
8. Return only the complete Markdown in one code block, with no explanation before or after it.`;

function CopyPromptButton({ prompt, label }: { prompt: string; label: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setStatus("copied");
      window.setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("failed");
    }
  };

  return (
    <button className="secondary-button compact-button guide-copy-button" type="button" onClick={() => void copyPrompt()}>
      <FontAwesomeIcon icon={status === "copied" ? faCheck : faClipboard} aria-hidden="true" />
      {status === "copied" ? "Copied" : status === "failed" ? "Select and copy" : label}
    </button>
  );
}

function PromptCard({
  eyebrow,
  title,
  description,
  prompt,
}: {
  eyebrow: string;
  title: string;
  description: string;
  prompt: string;
}) {
  return (
    <article className="guide-prompt-card">
      <div className="guide-prompt-heading">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h3>{title}</h3>
        </div>
        <CopyPromptButton prompt={prompt} label="Copy prompt" />
      </div>
      <p>{description}</p>
      <pre tabIndex={0} aria-label={`${title} prompt`}><code>{prompt}</code></pre>
    </article>
  );
}

export function ResumeGuidePage({
  hasOpenResume,
  onBack,
  onHome,
  onUpload,
  headerActions,
}: {
  hasOpenResume: boolean;
  onBack: () => void;
  onHome: () => void;
  onUpload: (file: File) => void;
  headerActions?: ReactNode;
}) {
  const uploadRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onUpload(file);
    event.target.value = "";
  };

  return (
    <div className="guide-page-shell">
      <header className="guide-page-header">
        <button className="brand brand-button" type="button" onClick={onHome} aria-label="Folio home">
          <span className="brand-mark">F</span><span>Folio</span>
        </button>
        <button className="template-back-button" type="button" onClick={onBack}>
          <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" />
          {hasOpenResume ? "Back to editor" : "Back to home"}
        </button>
        <div className="guide-page-actions">{headerActions}</div>
      </header>

      <main className="guide-page-main">
        <section className="guide-hero">
          <div>
            <p className="eyebrow">Resume import guide</p>
            <h1>Bring your resume into Folio—without starting again.</h1>
            <p>
              Keep a portable Markdown copy, improve it with an AI assistant if you choose,
              or convert an existing resume PDF before importing it into the builder.
            </p>
            <div className="guide-hero-actions">
              <a className="primary-button" href={`${import.meta.env.BASE_URL}examples/resume-template.md`} download>
                <FontAwesomeIcon icon={faDownload} aria-hidden="true" /> Download .md template
              </a>
              <button className="secondary-button" type="button" onClick={() => uploadRef.current?.click()}>
                <FontAwesomeIcon icon={faArrowUpFromBracket} aria-hidden="true" /> Import finished .md
              </button>
              <input
                ref={uploadRef}
                className="sr-only"
                type="file"
                accept=".md,text/markdown,text/plain"
                onChange={handleFileChange}
              />
            </div>
          </div>
          <aside className="guide-route-card" aria-label="Resume conversion route">
            <span><FontAwesomeIcon icon={faFilePdf} aria-hidden="true" /> Resume PDF</span>
            <i aria-hidden="true">→</i>
            <span><FontAwesomeIcon icon={faFileLines} aria-hidden="true" /> AI conversion</span>
            <i aria-hidden="true">→</i>
            <span><strong>.md</strong> Folio import</span>
          </aside>
        </section>

        <nav className="guide-jump-links" aria-label="Guide sections">
          <a href="#keep-markdown">Keep your Folio file</a>
          <a href="#convert-pdf">Convert a PDF</a>
          <a href="#check-import">Check the result</a>
          <a href="#privacy">Privacy</a>
        </nav>

        <section className="guide-workflow-section" id="keep-markdown">
          <div className="guide-section-intro">
            <span className="guide-step-number">01</span>
            <div>
              <p className="eyebrow">Already using Folio</p>
              <h2>Download your Markdown before asking AI for help.</h2>
              <p>
                In the editor header, choose <strong>Download .md</strong>. That file contains your
                resume content plus the selected template, colors, fonts, spacing, section order,
                icons, and links needed to restore your work later.
              </p>
            </div>
          </div>
          <ol className="guide-steps">
            <li><strong>Download .md</strong><span>Use the button in the Folio editor header.</span></li>
            <li><strong>Attach it to your AI assistant</strong><span>Paste the prompt below and describe the job or changes you want.</span></li>
            <li><strong>Save the complete response</strong><span>Use a plain UTF-8 file ending in <code>.md</code>, not <code>.txt</code>.</span></li>
            <li><strong>Import and review</strong><span>Upload it here, then verify every fact before exporting.</span></li>
          </ol>
          <PromptCard
            eyebrow="Copy-ready prompt"
            title="Improve an existing Folio .md file"
            description="Add your target role or job description after this prompt if you want tailored wording. The assistant must still preserve facts and Folio settings."
            prompt={IMPROVE_MARKDOWN_PROMPT}
          />
        </section>

        <section className="guide-workflow-section" id="convert-pdf">
          <div className="guide-section-intro">
            <span className="guide-step-number">02</span>
            <div>
              <p className="eyebrow">Starting from a PDF</p>
              <h2>Give the AI both your PDF and Folio’s template.</h2>
              <p>
                The PDF supplies your facts. The downloaded template tells the AI exactly how Folio
                expects the Markdown to be structured. This produces a cleaner import than asking for
                generic Markdown without the template.
              </p>
            </div>
          </div>
          <ol className="guide-steps">
            <li><strong>Download the Folio template</strong><span>Use the button at the top of this page.</span></li>
            <li><strong>Attach two files to the AI</strong><span>Your resume PDF and <code>resume-template.md</code>.</span></li>
            <li><strong>Copy the conversion prompt</strong><span>It tells the assistant not to invent missing information.</span></li>
            <li><strong>Create your .md file</strong><span>Copy only the generated Markdown into a plain UTF-8 file.</span></li>
            <li><strong>Import into Folio</strong><span>Use “Import finished .md”, choose a template, edit, run ATS checks, and export.</span></li>
          </ol>
          <PromptCard
            eyebrow="Copy-ready prompt"
            title="Convert an existing resume PDF"
            description="Use this with an AI service that accepts file attachments. For scanned PDFs, ask it to perform OCR while marking uncertain text."
            prompt={CONVERT_PDF_PROMPT}
          />
        </section>

        <section className="guide-check-section" id="check-import">
          <div>
            <p className="eyebrow">Before exporting</p>
            <h2>AI conversion is a draft. You remain the reviewer.</h2>
            <p>Open each section in Folio and compare it with the original PDF or Markdown file.</p>
          </div>
          <ul className="guide-checklist">
            <li><FontAwesomeIcon icon={faCheck} aria-hidden="true" /><span><strong>Identity and contact details</strong>Email, phone, location, and URLs are exact.</span></li>
            <li><FontAwesomeIcon icon={faCheck} aria-hidden="true" /><span><strong>Employment and education</strong>Names, titles, dates, and qualifications were not changed.</span></li>
            <li><FontAwesomeIcon icon={faCheck} aria-hidden="true" /><span><strong>Metrics and claims</strong>Every number and achievement is supported by your source resume.</span></li>
            <li><FontAwesomeIcon icon={faCheck} aria-hidden="true" /><span><strong>Import notes</strong>Resolve any <code>[CHECK: ...]</code> markers and Folio import warnings.</span></li>
            <li><FontAwesomeIcon icon={faCheck} aria-hidden="true" /><span><strong>ATS readiness</strong>Run Folio’s ATS panel, then download a fresh .md backup before PDF or DOCX.</span></li>
          </ul>
        </section>

        <section className="guide-privacy-section" id="privacy">
          <FontAwesomeIcon icon={faShieldHalved} aria-hidden="true" />
          <div>
            <p className="eyebrow">Privacy checkpoint</p>
            <h2>Folio processes imports locally. An external AI service may not.</h2>
            <p>
              Review the AI provider’s privacy and retention settings before uploading a resume.
              Remove details the conversion does not need, never upload identity documents, and avoid
              sharing references’ private information. You can always fill sensitive contact fields in
              Folio after the conversion.
            </p>
          </div>
        </section>

        <section className="guide-final-cta">
          <div>
            <p className="eyebrow">Ready to build</p>
            <h2>Import the Markdown and make it yours.</h2>
            <p>Your resume stays editable, portable, and independent of any one AI tool.</p>
          </div>
          <button className="primary-button large" type="button" onClick={() => uploadRef.current?.click()}>
            Import a .md file <span aria-hidden="true">→</span>
          </button>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
