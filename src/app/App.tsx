import {
  Suspense,
  lazy,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from "react";
import {
  createBlankResume,
  createEmptyItem,
  createPersonalLink,
  createSection,
} from "../domain/resume.defaults";
import type {
  PersonalDetails,
  PersonalLink,
  ResumeDesignSettings,
  ResumeDocument,
  ResumeSection,
  ResumeSectionItem,
} from "../domain/resume.types";
import {
  reorderResumeSections,
  type SectionDropPosition,
} from "../domain/resume.transforms";
import {
  WorkspaceCustomizer,
  type WorkspaceSettings,
} from "../features/design/WorkspaceCustomizer";
import { ResumeEditor } from "../features/editor/ResumeEditor";
import { parseResumeMarkdown } from "../parsers/markdown/parseResumeMarkdown";
import { serializeResumeMarkdown } from "../serializers/markdown/serializeResumeMarkdown";
import { downloadTextFile, isAcceptedMarkdownFile, sanitizeFileName } from "../utils/files";

type EditorTab = "content" | "design" | "ats";
type MobileView = "editor" | "preview";

const DEFAULT_WORKSPACE: WorkspaceSettings = {
  accentColor: "#245B4E",
  fontFamily: "Arial",
  letterSpacing: 0,
  lineHeight: 1.5,
  themeMode: "system",
  density: "comfortable",
  reduceMotion: false,
};

const ClassicTemplate = lazy(() =>
  import("../features/templates/classic/ClassicTemplate").then((module) => ({
    default: module.ClassicTemplate,
  })),
);

const AtsPanel = lazy(() =>
  import("../features/ats/AtsPanel").then((module) => ({ default: module.AtsPanel })),
);

const DesignPanel = lazy(() =>
  import("../features/design/DesignPanel").then((module) => ({ default: module.DesignPanel })),
);

function SiteFooter({ compact = false }: { compact?: boolean }) {
  return (
    <footer className={compact ? "site-footer compact-footer" : "site-footer"}>
      <div className="footer-brand">
        <span className="brand-mark">F</span>
        <div>
          <strong>Folio</strong>
          <span>Your resume stays yours.</span>
        </div>
      </div>
      <nav aria-label="Footer links">
        <a href={`${import.meta.env.BASE_URL}examples/resume-template.md`} download>
          Markdown template
        </a>
        <a href="https://fontawesome.com/license/free" target="_blank" rel="noopener noreferrer">
          Font Awesome Free
        </a>
      </nav>
      <p>Resume content is processed locally in your browser.</p>
    </footer>
  );
}

function readWorkspaceSettings(): WorkspaceSettings {
  try {
    const saved = localStorage.getItem("folio-workspace-appearance");
    if (!saved) return DEFAULT_WORKSPACE;
    const candidate: unknown = JSON.parse(saved);
    if (typeof candidate !== "object" || candidate === null) return DEFAULT_WORKSPACE;
    const record = candidate as Record<string, unknown>;
    return {
      accentColor:
        typeof record.accentColor === "string" && /^#[0-9A-Fa-f]{6}$/.test(record.accentColor)
          ? record.accentColor
          : DEFAULT_WORKSPACE.accentColor,
      fontFamily:
        typeof record.fontFamily === "string" ? record.fontFamily : DEFAULT_WORKSPACE.fontFamily,
      letterSpacing:
        typeof record.letterSpacing === "number" && Number.isFinite(record.letterSpacing)
          ? Math.min(2, Math.max(-0.5, record.letterSpacing))
          : DEFAULT_WORKSPACE.letterSpacing,
      lineHeight:
        typeof record.lineHeight === "number" && Number.isFinite(record.lineHeight)
          ? Math.min(1.8, Math.max(1.2, record.lineHeight))
          : DEFAULT_WORKSPACE.lineHeight,
      themeMode:
        record.themeMode === "light" || record.themeMode === "dark" || record.themeMode === "system"
          ? record.themeMode
          : DEFAULT_WORKSPACE.themeMode,
      density:
        record.density === "compact" || record.density === "comfortable"
          ? record.density
          : DEFAULT_WORKSPACE.density,
      reduceMotion:
        typeof record.reduceMotion === "boolean"
          ? record.reduceMotion
          : DEFAULT_WORKSPACE.reduceMotion,
    };
  } catch {
    return DEFAULT_WORKSPACE;
  }
}

function StartScreen({
  onCreate,
  onLoadExample,
  onUpload,
  workspace,
  onWorkspaceChange,
  busy,
}: {
  onCreate: () => void;
  onLoadExample: () => void;
  onUpload: (file: File) => void;
  workspace: WorkspaceSettings;
  onWorkspaceChange: (patch: Partial<WorkspaceSettings>) => void;
  busy: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <main className="welcome-shell">
      <nav className="welcome-nav" aria-label="Main navigation">
        <a className="brand" href="/" aria-label="Folio home">
          <span className="brand-mark">F</span>
          <span>Folio</span>
        </a>
        <div className="welcome-nav-actions">
          <span className="privacy-note">Private by design · Works in your browser</span>
          <WorkspaceCustomizer workspace={workspace} onChange={onWorkspaceChange} />
        </div>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Markdown-powered resume builder</p>
          <h1>Your experience.<br /><em>Your file.</em> Your future.</h1>
          <p className="hero-lede">
            Build a polished, ATS-conscious resume without an account. Keep everything in a clean Markdown file you own.
          </p>
          <div className="hero-actions">
            <button className="primary-button large" type="button" onClick={onCreate}>
              Create a new resume <span aria-hidden="true">→</span>
            </button>
            <button className="secondary-button large" type="button" onClick={() => inputRef.current?.click()}>
              Upload Markdown
            </button>
            <input
              ref={inputRef}
              className="sr-only"
              type="file"
              accept=".md,text/markdown,text/plain"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onUpload(file);
                event.target.value = "";
              }}
            />
          </div>
          <div className="helper-actions">
            <button className="link-button" type="button" onClick={onLoadExample} disabled={busy}>
              {busy ? "Loading example…" : "Load a complete example"}
            </button>
            <span aria-hidden="true">•</span>
            <a className="link-button" href={`${import.meta.env.BASE_URL}examples/resume-template.md`} download>
              Download the .md template
            </a>
          </div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="paper-shadow paper-back" />
          <div className="sample-paper">
            <div className="sample-name">Aarav Mehta</div>
            <div className="sample-role">SENIOR SOFTWARE ENGINEER</div>
            <div className="sample-contact">Pune, India · aarav@example.com</div>
            <div className="sample-rule" />
            <div className="sample-section">PROFILE</div>
            <div className="sample-lines"><i /><i /><i className="short" /></div>
            <div className="sample-section">EXPERIENCE</div>
            <div className="sample-job"><b /><i /><i /><i className="short" /></div>
            <div className="sample-job"><b /><i /><i /></div>
            <div className="sample-section">SKILLS</div>
            <div className="sample-pills"><i /><i /><i /><i /><i /></div>
          </div>
          <span className="ownership-badge">100% yours<br /><small>Portable Markdown</small></span>
        </div>
      </section>

      <section className="principles" aria-label="Product principles">
        <article><span>01</span><h2>Start your way</h2><p>Create from scratch, follow the guided template, or upload a resume you already maintain.</p></article>
        <article><span>02</span><h2>Shape the details</h2><p>Edit content live and choose professional colors and ATS-safe typography.</p></article>
        <article><span>03</span><h2>Take it with you</h2><p>Download clean Markdown and return later without relying on a hidden account.</p></article>
      </section>
      <SiteFooter />
    </main>
  );
}

export function App() {
  const [resume, setResume] = useState<ResumeDocument | null>(null);
  const [activeTab, setActiveTab] = useState<EditorTab>("content");
  const [mobileView, setMobileView] = useState<MobileView>("editor");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [message, setMessage] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [workspace, setWorkspace] = useState<WorkspaceSettings>(readWorkspaceSettings);
  const uploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem("folio-workspace-appearance", JSON.stringify(workspace));
  }, [workspace]);

  useEffect(() => {
    if (!message) return;
    const dismissTimer = window.setTimeout(() => setMessage(""), 5000);
    return () => window.clearTimeout(dismissTimer);
  }, [message]);

  const updateResume = (update: (current: ResumeDocument) => ResumeDocument) => {
    setResume((current) => (current ? update(current) : current));
  };

  const importMarkdown = (markdown: string, fileName?: string) => {
    const result = parseResumeMarkdown(markdown, fileName);
    setResume(result.resume);
    setWarnings(result.warnings);
    setMessage(fileName ? `${fileName} was imported.` : "Example resume loaded.");
  };

  const handleUpload = async (file: File) => {
    const error = isAcceptedMarkdownFile(file);
    if (error) {
      setMessage(error);
      return;
    }
    try {
      importMarkdown(await file.text(), file.name);
    } catch {
      setMessage("We could not read this Markdown file. Try another file.");
    }
  };

  const loadExample = async () => {
    setBusy(true);
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}examples/example-resume.md`);
      if (!response.ok) throw new Error("Example file unavailable");
      importMarkdown(await response.text(), "example-resume.md");
    } catch {
      setMessage("The example resume could not be loaded.");
    } finally {
      setBusy(false);
    }
  };

  if (!resume) {
    return (
      <div
        className="app"
        data-theme={workspace.themeMode}
        data-density={workspace.density}
        data-reduce-motion={workspace.reduceMotion}
        style={
          {
            "--ui-accent": workspace.accentColor,
            "--ui-font": workspace.fontFamily,
            "--ui-letter-spacing": `${workspace.letterSpacing}px`,
            "--ui-line-height": workspace.lineHeight,
          } as CSSProperties
        }
      >
        {message && (
          <div className="toast" role="status" aria-live="polite">
            <span>{message}</span>
            <button type="button" onClick={() => setMessage("")} aria-label="Dismiss notification">
              ×
            </button>
          </div>
        )}
        <StartScreen
          onCreate={() => {
            setResume(createBlankResume());
            setWarnings([]);
          }}
          onLoadExample={loadExample}
          onUpload={handleUpload}
          workspace={workspace}
          onWorkspaceChange={(patch) => setWorkspace((current) => ({ ...current, ...patch }))}
          busy={busy}
        />
      </div>
    );
  }

  const updatePersonal = (field: Exclude<keyof PersonalDetails, "customLinks">, value: string) => {
    updateResume((current) => ({
      ...current,
      personal: { ...current.personal, [field]: value },
    }));
  };

  const updateSection = (sectionId: string, patch: Partial<ResumeSection>) => {
    updateResume((current) => ({
      ...current,
      sections: current.sections.map((section) =>
        section.id === sectionId ? { ...section, ...patch } : section,
      ),
    }));
  };

  const updateItem = (sectionId: string, itemId: string, patch: Partial<ResumeSectionItem>) => {
    updateResume((current) => ({
      ...current,
      sections: current.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
            }
          : section,
      ),
    }));
  };

  const moveSection = (sectionId: string, direction: -1 | 1) => {
    updateResume((current) => {
      const ordered = [...current.sections].sort((a, b) => a.order - b.order);
      const index = ordered.findIndex((section) => section.id === sectionId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= ordered.length) return current;
      const currentSection = ordered[index];
      const targetSection = ordered[target];
      if (!currentSection || !targetSection) return current;
      ordered[index] = targetSection;
      ordered[target] = currentSection;
      return { ...current, sections: ordered.map((section, order) => ({ ...section, order })) };
    });
  };

  const reorderSectionsFromPreview = (
    sourceSectionId: string,
    targetSectionId: string,
    position: SectionDropPosition,
  ) => {
    updateResume((current) => ({
      ...current,
      sections: reorderResumeSections(
        current.sections,
        sourceSectionId,
        targetSectionId,
        position,
      ),
    }));
  };

  const deleteSection = (sectionId: string) => {
    if (!window.confirm("Delete this section? This cannot be undone in this version.")) return;
    updateResume((current) => ({
      ...current,
      sections: current.sections
        .filter((section) => section.id !== sectionId)
        .map((section, order) => ({ ...section, order })),
    }));
  };

  const downloadResume = () => {
    const base = sanitizeFileName(resume.personal.fullName);
    downloadTextFile(serializeResumeMarkdown(resume), `${base}-resume.md`);
    setMessage("Markdown resume downloaded.");
  };

  const downloadPdf = async () => {
    setExportingPdf(true);
    setMessage("Preparing selectable-text PDF…");
    try {
      const { exportResumeToPdf } = await import("../features/export/pdf/exportResumeToPdf");
      const base = sanitizeFileName(resume.personal.fullName);
      await exportResumeToPdf(resume, `${base}-resume.pdf`);
      setMessage("ATS PDF downloaded. Long resumes are paginated automatically.");
    } catch {
      setMessage("The PDF export could not be completed. Please try again.");
    } finally {
      setExportingPdf(false);
    }
  };

  const workspaceStyle = {
    "--ui-accent": workspace.accentColor,
    "--ui-font": workspace.fontFamily,
    "--ui-letter-spacing": `${workspace.letterSpacing}px`,
    "--ui-line-height": workspace.lineHeight,
  } as CSSProperties;

  return (
    <div
      className="app builder-app"
      data-theme={workspace.themeMode}
      data-density={workspace.density}
      data-reduce-motion={workspace.reduceMotion}
      style={workspaceStyle}
    >
      <header className="app-header">
        <button
          className="brand brand-button"
          type="button"
          onClick={() => {
            if (window.confirm("Return to the start screen? Download your Markdown first if you want to keep these edits.")) {
              setResume(null);
              setWarnings([]);
              setMessage("");
            }
          }}
        >
          <span className="brand-mark">F</span><span>Folio</span>
        </button>
        <div className="document-title">
          <strong>{resume.personal.fullName || "Untitled resume"}</strong>
          <span>Saved only in this browser session</span>
        </div>
        <div className="header-actions">
          <WorkspaceCustomizer
            workspace={workspace}
            onChange={(patch) => setWorkspace((current) => ({ ...current, ...patch }))}
          />
          <button className="secondary-button compact-button" type="button" onClick={() => uploadRef.current?.click()}>
            Upload .md
          </button>
          <input
            ref={uploadRef}
            className="sr-only"
            type="file"
            accept=".md,text/markdown,text/plain"
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              const file = event.target.files?.[0];
              if (file) void handleUpload(file);
              event.target.value = "";
            }}
          />
          <button className="secondary-button compact-button" type="button" onClick={downloadResume}>
            Download .md
          </button>
          <button
            className="primary-button compact-button"
            type="button"
            onClick={() => void downloadPdf()}
            disabled={exportingPdf}
          >
            {exportingPdf ? "Creating PDF…" : "Download PDF"}
          </button>
        </div>
      </header>

      {(message || warnings.length > 0) && (
        <div className="message-bar" role="status">
          <div>
            {message && <strong>{message}</strong>}
            {warnings.length > 0 && (
              <details>
                <summary>{warnings.length} import {warnings.length === 1 ? "note" : "notes"}</summary>
                <ul>{warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
              </details>
            )}
          </div>
          <button className="icon-button" type="button" aria-label="Dismiss message" onClick={() => { setMessage(""); setWarnings([]); }}>×</button>
        </div>
      )}

      <div className="mobile-view-switcher" aria-label="Mobile workspace view">
        <button className={mobileView === "editor" ? "active" : ""} onClick={() => setMobileView("editor")}>Editor</button>
        <button className={mobileView === "preview" ? "active" : ""} onClick={() => setMobileView("preview")}>Preview</button>
      </div>

      <main className="workspace">
        <aside className={`editor-pane ${mobileView === "editor" ? "mobile-active" : ""}`}>
          <nav className="editor-tabs" aria-label="Resume editor">
            <button className={activeTab === "content" ? "active" : ""} onClick={() => setActiveTab("content")}>Content</button>
            <button className={activeTab === "design" ? "active" : ""} onClick={() => setActiveTab("design")}>Design</button>
            <button className={activeTab === "ats" ? "active" : ""} onClick={() => setActiveTab("ats")}>ATS</button>
          </nav>
          <div className="editor-scroll">
            {activeTab === "content" ? (
              <ResumeEditor
                resume={resume}
                onPersonalChange={updatePersonal}
                onPersonalLinkAdd={() =>
                  updateResume((current) => ({
                    ...current,
                    personal: {
                      ...current.personal,
                      customLinks: [...current.personal.customLinks, createPersonalLink()],
                    },
                  }))
                }
                onPersonalLinkChange={(linkId: string, patch: Partial<PersonalLink>) =>
                  updateResume((current) => ({
                    ...current,
                    personal: {
                      ...current.personal,
                      customLinks: current.personal.customLinks.map((link) =>
                        link.id === linkId ? { ...link, ...patch } : link,
                      ),
                    },
                  }))
                }
                onPersonalLinkDelete={(linkId: string) =>
                  updateResume((current) => ({
                    ...current,
                    personal: {
                      ...current.personal,
                      customLinks: current.personal.customLinks.filter((link) => link.id !== linkId),
                    },
                  }))
                }
                onSectionChange={updateSection}
                onItemChange={updateItem}
                onAddItem={(sectionId) =>
                  updateResume((current) => ({
                    ...current,
                    sections: current.sections.map((section) =>
                      section.id === sectionId ? { ...section, items: [...section.items, createEmptyItem()] } : section,
                    ),
                  }))
                }
                onDeleteItem={(sectionId, itemId) =>
                  updateResume((current) => ({
                    ...current,
                    sections: current.sections.map((section) =>
                      section.id === sectionId
                        ? { ...section, items: section.items.filter((item) => item.id !== itemId) }
                        : section,
                    ),
                  }))
                }
                onMoveSection={moveSection}
                onDeleteSection={deleteSection}
                onAddSection={() =>
                  updateResume((current) => ({
                    ...current,
                    sections: [...current.sections, createSection("custom", "New Section", current.sections.length)],
                  }))
                }
              />
            ) : activeTab === "design" ? (
              <Suspense fallback={<div className="editor-card">Loading design controls…</div>}>
                <DesignPanel
                  design={resume.design}
                  onDesignChange={(patch: Partial<ResumeDesignSettings>) =>
                    updateResume((current) => ({ ...current, design: { ...current.design, ...patch } }))
                  }
                />
              </Suspense>
            ) : (
              <Suspense fallback={<div className="editor-card">Running ATS checks…</div>}>
                <AtsPanel resume={resume} />
              </Suspense>
            )}
            <SiteFooter compact />
          </div>
        </aside>

        <section className={`preview-pane ${mobileView === "preview" ? "mobile-active" : ""}`} aria-label="Live resume preview">
          <div className="preview-toolbar">
            <div><span className="live-dot" /> Live preview</div>
            <span>{resume.design.pageSize} · {resume.design.fontSize} pt</span>
          </div>
          <div className="preview-scroll">
            <Suspense fallback={<div className="preview-loading">Preparing preview…</div>}>
              <ClassicTemplate resume={resume} onSectionReorder={reorderSectionsFromPreview} />
            </Suspense>
            <SiteFooter compact />
          </div>
        </section>
      </main>
    </div>
  );
}
