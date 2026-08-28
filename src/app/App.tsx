import {
  Suspense,
  lazy,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretLeft, faCaretRight } from "@fortawesome/free-solid-svg-icons";
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
  reorderResumeSectionItems,
  type SectionDropPosition,
  duplicateResumeSection,
} from "../domain/resume.transforms";
import {
  WorkspaceCustomizer,
  type WorkspaceSettings,
} from "../features/design/WorkspaceCustomizer";
import { ResumeEditor } from "../features/editor/ResumeEditor";
import { parseResumeMarkdown } from "../parsers/markdown/parseResumeMarkdown";
import { serializeResumeMarkdown } from "../serializers/markdown/serializeResumeMarkdown";
import { downloadTextFile, isAcceptedMarkdownFile, sanitizeFileName } from "../utils/files";
import { updateFolioBrowserBranding } from "../utils/favicon";

type EditorTab = "content" | "design" | "ats";
type MobileView = "editor" | "preview";
type DesktopPaneLayout = "both" | "editor" | "preview";

const DEFAULT_WORKSPACE: WorkspaceSettings = {
  accentColor: "#245B4E",
  fontFamily: "Arial",
  letterSpacing: 0,
  lineHeight: 1.5,
  themeMode: "system",
  density: "comfortable",
  reduceMotion: false,
};

const LEAVE_PAGE_WARNING =
  "Return to the start screen? Download your Markdown first if you want to keep these edits.";

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
  const [showHomeDialog, setShowHomeDialog] = useState(false);
  const [showCloseReminderDialog, setShowCloseReminderDialog] = useState(false);
  const [sectionPendingDeletion, setSectionPendingDeletion] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [desktopPaneLayout, setDesktopPaneLayout] = useState<DesktopPaneLayout>("both");
  const [workspace, setWorkspace] = useState<WorkspaceSettings>(readWorkspaceSettings);
  const uploadRef = useRef<HTMLInputElement>(null);
  const editorScrollRef = useRef<HTMLDivElement>(null);
  const markdownIsCurrentRef = useRef(false);
  const resumeIsOpen = resume !== null;

  useEffect(() => {
    localStorage.setItem("folio-workspace-appearance", JSON.stringify(workspace));
  }, [workspace]);

  useEffect(() => {
    updateFolioBrowserBranding(workspace.accentColor);
  }, [workspace.accentColor]);

  useEffect(() => {
    if (!message) return;
    const dismissTimer = window.setTimeout(() => setMessage(""), 5000);
    return () => window.clearTimeout(dismissTimer);
  }, [message]);

  useEffect(() => {
    if (!resumeIsOpen) return;

    // Browsers require their own security-controlled dialog for tab/window exits;
    // unlike in-app confirmations, its wording and appearance cannot be customized.
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      if (markdownIsCurrentRef.current) return;
      // If the user chooses "Stay" in the browser prompt, React renders the
      // site's download reminder as soon as control returns to this page.
      setShowCloseReminderDialog(true);
      event.preventDefault();
      event.returnValue = LEAVE_PAGE_WARNING;
    };

    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [resumeIsOpen]);

  const updateResume = (update: (current: ResumeDocument) => ResumeDocument) => {
    markdownIsCurrentRef.current = false;
    setResume((current) => (current ? update(current) : current));
  };

  const importMarkdown = (markdown: string, fileName?: string) => {
    const result = parseResumeMarkdown(markdown, fileName);
    markdownIsCurrentRef.current = false;
    setResume(result.resume);
    setWarnings(result.warnings);
    setMessage(fileName ? `${fileName} was imported.` : "Example resume loaded.");
    setDesktopPaneLayout("both");
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
            markdownIsCurrentRef.current = false;
            setResume(createBlankResume());
            setWarnings([]);
            setDesktopPaneLayout("both");
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

  const reorderItemsFromPreview = (
    sectionId: string,
    sourceItemId: string,
    targetItemId: string,
    position: SectionDropPosition,
  ) => {
    updateResume((current) => ({
      ...current,
      sections: reorderResumeSectionItems(
        current.sections,
        sectionId,
        sourceItemId,
        targetItemId,
        position,
      ),
    }));
  };

  const selectSectionFromPreview = (sectionId: string) => {
    setActiveTab("content");
    setMobileView("editor");

    // Wait for the Content tab (and mobile Editor pane) to render before
    // locating the matching card and moving the editor viewport to it.
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const scrollContainer = editorScrollRef.current;
        const sectionCard = Array.from(
          scrollContainer?.querySelectorAll<HTMLElement>("[data-editor-section-id]") ?? [],
        ).find((element) => element.dataset.editorSectionId === sectionId);
        if (!sectionCard) return;

        sectionCard.scrollIntoView({
          behavior: workspace.reduceMotion ? "auto" : "smooth",
          block: "start",
        });
        sectionCard.querySelector<HTMLInputElement>("input")?.focus({ preventScroll: true });
      });
    });
  };

  const copySection = (sectionId: string) => {
    const sourceTitle = resume.sections.find((section) => section.id === sectionId)?.title;
    updateResume((current) => ({
      ...current,
      sections: duplicateResumeSection(current.sections, sectionId),
    }));
    if (sourceTitle) setMessage(`${sourceTitle} was copied.`);
  };

  const deleteSection = (sectionId: string) => {
    const section = resume.sections.find((candidate) => candidate.id === sectionId);
    if (!section) return;
    setSectionPendingDeletion({ id: section.id, title: section.title });
  };

  const confirmSectionDeletion = () => {
    if (!sectionPendingDeletion) return;
    const sectionToDelete = sectionPendingDeletion;
    updateResume((current) => ({
      ...current,
      sections: current.sections
        .filter((section) => section.id !== sectionToDelete.id)
        .map((section, order) => ({ ...section, order })),
    }));
    setSectionPendingDeletion(null);
    setMessage(`${sectionToDelete.title} was deleted.`);
  };

  const downloadResume = () => {
    const base = sanitizeFileName(resume.personal.fullName);
    downloadTextFile(serializeResumeMarkdown(resume), `${base}-resume.md`);
    markdownIsCurrentRef.current = true;
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

  const toggleDesktopPane = (pane: "editor" | "preview") => {
    setDesktopPaneLayout((current) => {
      if (pane === "editor") {
        if (current === "both") return "preview";
        if (current === "preview") return "both";
        return "preview";
      }
      if (current === "both") return "editor";
      if (current === "editor") return "both";
      return "editor";
    });
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
      {showHomeDialog && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowHomeDialog(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setShowHomeDialog(false);
          }}
        >
          <section
            className="confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="return-home-title"
            aria-describedby="return-home-description"
          >
            <div className="confirm-dialog-brand" aria-hidden="true">
              <span className="brand-mark">F</span>
            </div>
            <p className="eyebrow">Before you leave</p>
            <h2 id="return-home-title">Return to the start screen?</h2>
            <p id="return-home-description">
              This resume is saved only in the current browser session. Download your Markdown file first if you want to keep editing it later.
            </p>
            <div className="confirm-dialog-note">
              <strong>Your file stays yours.</strong>
              <span>The downloaded .md file restores your content and customization choices.</span>
            </div>
            <div className="confirm-dialog-actions">
              <button
                className="secondary-button"
                type="button"
                autoFocus
                onClick={() => setShowHomeDialog(false)}
              >
                Cancel
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  downloadResume();
                  setShowHomeDialog(false);
                }}
              >
                Download .md
              </button>
              <button
                className="dialog-danger-button"
                type="button"
                onClick={() => {
                  setShowHomeDialog(false);
                  setResume(null);
                  setWarnings([]);
                  setMessage("");
                  setDesktopPaneLayout("both");
                }}
              >
                Return home
              </button>
            </div>
          </section>
        </div>
      )}
      {showCloseReminderDialog && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowCloseReminderDialog(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setShowCloseReminderDialog(false);
          }}
        >
          <section
            className="confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="close-reminder-title"
            aria-describedby="close-reminder-description"
          >
            <div className="confirm-dialog-brand" aria-hidden="true">
              <span className="brand-mark">F</span>
            </div>
            <p className="eyebrow">Before you leave</p>
            <h2 id="close-reminder-title">Download your Markdown before closing?</h2>
            <p id="close-reminder-description">
              Save a portable copy of this resume before closing the tab so you can upload it and
              continue editing later.
            </p>
            <div className="confirm-dialog-note">
              <strong>Your latest changes stay in the downloaded file.</strong>
              <span>After downloading, you can close without another warning unless you edit again.</span>
            </div>
            <div className="confirm-dialog-actions">
              <button
                className="secondary-button"
                type="button"
                autoFocus
                onClick={() => setShowCloseReminderDialog(false)}
              >
                Continue editing
              </button>
              <button
                className="primary-button"
                type="button"
                onClick={() => {
                  downloadResume();
                  setShowCloseReminderDialog(false);
                }}
              >
                Download .md
              </button>
            </div>
          </section>
        </div>
      )}
      {sectionPendingDeletion && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSectionPendingDeletion(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setSectionPendingDeletion(null);
          }}
        >
          <section
            className="confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-section-title"
            aria-describedby="delete-section-description"
          >
            <div className="confirm-dialog-brand" aria-hidden="true">
              <span className="brand-mark">F</span>
            </div>
            <p className="eyebrow">Delete section</p>
            <h2 id="delete-section-title">Delete this section?</h2>
            <p id="delete-section-description">
              <strong>{sectionPendingDeletion.title}</strong> and all of its content will be
              removed. This cannot be undone in this version.
            </p>
            <div className="confirm-dialog-note">
              <strong>Nothing is removed until you confirm.</strong>
              <span>You can cancel and download your Markdown first if you need a backup.</span>
            </div>
            <div className="confirm-dialog-actions">
              <button
                className="secondary-button"
                type="button"
                autoFocus
                onClick={() => setSectionPendingDeletion(null)}
              >
                Cancel
              </button>
              <button
                className="dialog-danger-button"
                type="button"
                onClick={confirmSectionDeletion}
              >
                Delete section
              </button>
            </div>
          </section>
        </div>
      )}
      <header className="app-header">
        <button
          className="brand brand-button"
          type="button"
          onClick={() => setShowHomeDialog(true)}
        >
          <span className="brand-mark">F</span><span>Folio</span>
        </button>
        <div className="document-title">
          <strong>{resume.personal.fullName || "Untitled resume"}</strong>
          <span>Saved only in this browser session</span>
        </div>
        <div className="header-actions">
          <div className="pane-toggle-controls" aria-label="Workspace panes">
            <button
              className={`icon-button pane-toggle-button ${desktopPaneLayout !== "preview" ? "active" : ""}`}
              type="button"
              aria-label={desktopPaneLayout === "preview" ? "Show editor pane" : "Hide editor pane"}
              title={desktopPaneLayout === "preview" ? "Show editor" : "Hide editor"}
              aria-pressed={desktopPaneLayout !== "preview"}
              onClick={() => toggleDesktopPane("editor")}
            >
              <FontAwesomeIcon icon={faCaretLeft} aria-hidden="true" />
            </button>
            <button
              className={`icon-button pane-toggle-button ${desktopPaneLayout !== "editor" ? "active" : ""}`}
              type="button"
              aria-label={desktopPaneLayout === "editor" ? "Show preview pane" : "Hide preview pane"}
              title={desktopPaneLayout === "editor" ? "Show preview" : "Hide preview"}
              aria-pressed={desktopPaneLayout !== "editor"}
              onClick={() => toggleDesktopPane("preview")}
            >
              <FontAwesomeIcon icon={faCaretRight} aria-hidden="true" />
            </button>
          </div>
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

      <main className={`workspace ${desktopPaneLayout}-panes`}>
        <aside className={`editor-pane ${mobileView === "editor" ? "mobile-active" : ""}`}>
          <nav className="editor-tabs" aria-label="Resume editor">
            <button className={activeTab === "content" ? "active" : ""} onClick={() => setActiveTab("content")}>Content</button>
            <button className={activeTab === "design" ? "active" : ""} onClick={() => setActiveTab("design")}>Design</button>
            <button className={activeTab === "ats" ? "active" : ""} onClick={() => setActiveTab("ats")}>ATS</button>
          </nav>
          <div className="editor-scroll" ref={editorScrollRef}>
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
                onDuplicateSection={copySection}
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
              <ClassicTemplate
                resume={resume}
                onSectionReorder={reorderSectionsFromPreview}
                onItemReorder={reorderItemsFromPreview}
                onSectionSelect={selectSectionFromPreview}
              />
            </Suspense>
            <SiteFooter compact />
          </div>
        </section>
      </main>
    </div>
  );
}
