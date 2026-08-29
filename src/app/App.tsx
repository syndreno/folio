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
import {
  faArrowRotateLeft,
  faArrowRotateRight,
  faCaretLeft,
  faCaretRight,
  faDownload,
} from "@fortawesome/free-solid-svg-icons";
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
import { useResumeHistory } from "../features/editor/useResumeHistory";
import { TEMPLATE_REGISTRY } from "../features/templates/registry";
import { parseResumeMarkdown } from "../parsers/markdown/parseResumeMarkdown";
import { serializeResumeMarkdown } from "../serializers/markdown/serializeResumeMarkdown";
import { downloadTextFile, isAcceptedMarkdownFile, sanitizeFileName } from "../utils/files";
import { updateFolioBrowserBranding } from "../utils/favicon";
import {
  deleteResumeDraft,
  loadResumeDraft,
  saveResumeDraft,
  type ResumeDraft,
} from "../services/resumeDraftStore";

type EditorTab = "content" | "design" | "ats";
type MobileView = "editor" | "preview";
type DesktopPaneLayout = "both" | "editor" | "preview";
type ExportFormat = "pdf" | "docx" | "png" | "jpeg";

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
const AUTOSAVE_SETTING_KEY = "folio-resume-autosave-enabled";

function readAutosaveSetting(): boolean {
  return localStorage.getItem(AUTOSAVE_SETTING_KEY) !== "false";
}

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
  draft,
  draftStatus,
  autosaveEnabled,
  onAutosaveChange,
  onRestoreDraft,
  onDeleteDraft,
}: {
  onCreate: () => void;
  onLoadExample: () => void;
  onUpload: (file: File) => void;
  workspace: WorkspaceSettings;
  onWorkspaceChange: (patch: Partial<WorkspaceSettings>) => void;
  busy: boolean;
  draft: ResumeDraft | null;
  draftStatus: "checking" | "ready" | "unavailable";
  autosaveEnabled: boolean;
  onAutosaveChange: (enabled: boolean) => void;
  onRestoreDraft: () => void;
  onDeleteDraft: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <main className="welcome-shell">
      <nav className="welcome-nav" aria-label="Main navigation">
        <a className="brand" href={import.meta.env.BASE_URL} aria-label="Folio home">
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
          <div className="draft-controls" aria-label="Local draft controls">
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={autosaveEnabled}
                onChange={(event) => onAutosaveChange(event.target.checked)}
              />
              <span>
                Browser-local autosave
                <small>Stores resume content only in this browser using IndexedDB.</small>
              </span>
            </label>
            {draftStatus === "checking" && <p role="status">Checking for a local draft…</p>}
            {draftStatus === "unavailable" && <p>Local drafts are unavailable in this browser.</p>}
            {draft && (
              <div className="draft-available">
                <div>
                  <strong>{draft.fileName}</strong>
                  <span>Saved {new Date(draft.savedAt).toLocaleString()}</span>
                </div>
                <button className="secondary-button" type="button" onClick={onRestoreDraft}>Restore draft</button>
                <button className="text-button danger" type="button" onClick={onDeleteDraft}>Delete local draft</button>
              </div>
            )}
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
  const {
    resume,
    canUndo,
    canRedo,
    loadResume,
    updateResume: updateResumeHistory,
    undoResume,
    redoResume,
  } = useResumeHistory();
  const [activeTab, setActiveTab] = useState<EditorTab>("content");
  const [mobileView, setMobileView] = useState<MobileView>("editor");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [message, setMessage] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showHomeDialog, setShowHomeDialog] = useState(false);
  const [showCloseReminderDialog, setShowCloseReminderDialog] = useState(false);
  const [sectionPendingDeletion, setSectionPendingDeletion] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [desktopPaneLayout, setDesktopPaneLayout] = useState<DesktopPaneLayout>("both");
  const [workspace, setWorkspace] = useState<WorkspaceSettings>(readWorkspaceSettings);
  const [autosaveEnabled, setAutosaveEnabled] = useState(readAutosaveSetting);
  const [draft, setDraft] = useState<ResumeDraft | null>(null);
  const [draftStatus, setDraftStatus] = useState<"checking" | "ready" | "unavailable">("checking");
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<string | null>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const editorScrollRef = useRef<HTMLDivElement>(null);
  const markdownIsCurrentRef = useRef(false);
  const resumeIsOpen = resume !== null;

  useEffect(() => {
    localStorage.setItem("folio-workspace-appearance", JSON.stringify(workspace));
  }, [workspace]);

  useEffect(() => {
    localStorage.setItem(AUTOSAVE_SETTING_KEY, String(autosaveEnabled));
  }, [autosaveEnabled]);

  useEffect(() => {
    let cancelled = false;
    void loadResumeDraft()
      .then((savedDraft) => {
        if (cancelled) return;
        setDraft(savedDraft);
        setLastDraftSavedAt(savedDraft?.savedAt ?? null);
        setDraftStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setDraftStatus("unavailable");
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!resume || !autosaveEnabled || draftStatus === "unavailable") return;
    const saveTimer = window.setTimeout(() => {
      const fileName = `${sanitizeFileName(resume.personal.fullName)}-resume.md`;
      void saveResumeDraft(serializeResumeMarkdown(resume), fileName)
        .then((savedDraft) => {
          setDraft(savedDraft);
          setLastDraftSavedAt(savedDraft.savedAt);
          setDraftStatus("ready");
        })
        .catch(() => setDraftStatus("unavailable"));
    }, 800);
    return () => window.clearTimeout(saveTimer);
  }, [autosaveEnabled, draftStatus, resume]);

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

  useEffect(() => {
    if (!resumeIsOpen || showHomeDialog || showCloseReminderDialog || showExportDialog || sectionPendingDeletion) {
      return;
    }

    const handleHistoryShortcut = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
      const key = event.key.toLocaleLowerCase("en");
      const wantsRedo = (key === "z" && event.shiftKey) || key === "y";
      const wantsUndo = key === "z" && !event.shiftKey;
      if (wantsUndo && canUndo) {
        event.preventDefault();
        markdownIsCurrentRef.current = false;
        undoResume();
      } else if (wantsRedo && canRedo) {
        event.preventDefault();
        markdownIsCurrentRef.current = false;
        redoResume();
      }
    };

    window.addEventListener("keydown", handleHistoryShortcut);
    return () => window.removeEventListener("keydown", handleHistoryShortcut);
  }, [
    canRedo,
    canUndo,
    redoResume,
    resumeIsOpen,
    sectionPendingDeletion,
    showCloseReminderDialog,
    showExportDialog,
    showHomeDialog,
    undoResume,
  ]);

  useEffect(() => {
    const hasDialog = showHomeDialog || showCloseReminderDialog || showExportDialog || Boolean(sectionPendingDeletion);
    if (!hasDialog) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    if (!dialog) return;

    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(
        'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
      )).filter((element) => !element.hasAttribute("hidden"));
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    dialog.addEventListener("keydown", trapFocus);
    return () => {
      dialog.removeEventListener("keydown", trapFocus);
      previouslyFocused?.focus();
    };
  }, [sectionPendingDeletion, showCloseReminderDialog, showExportDialog, showHomeDialog]);

  const updateResume = (
    update: (current: ResumeDocument) => ResumeDocument,
    groupKey?: string,
  ) => {
    markdownIsCurrentRef.current = false;
    updateResumeHistory(update, groupKey);
  };

  const importMarkdown = (markdown: string, fileName?: string) => {
    const result = parseResumeMarkdown(markdown, fileName);
    markdownIsCurrentRef.current = false;
    loadResume(result.resume);
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
            loadResume(createBlankResume());
            setWarnings([]);
            setDesktopPaneLayout("both");
          }}
          onLoadExample={loadExample}
          onUpload={handleUpload}
          workspace={workspace}
          onWorkspaceChange={(patch) => setWorkspace((current) => ({ ...current, ...patch }))}
          busy={busy}
          draft={draft}
          draftStatus={draftStatus}
          autosaveEnabled={autosaveEnabled}
          onAutosaveChange={setAutosaveEnabled}
          onRestoreDraft={() => {
            if (!draft) return;
            const result = parseResumeMarkdown(draft.markdown, draft.fileName);
            markdownIsCurrentRef.current = false;
            loadResume(result.resume);
            setWarnings(result.warnings);
            setMessage("Local draft restored.");
            setDesktopPaneLayout("both");
          }}
          onDeleteDraft={() => {
            void deleteResumeDraft()
              .then(() => {
                setDraft(null);
                setLastDraftSavedAt(null);
                setMessage("Local draft deleted.");
              })
              .catch(() => setMessage("The local draft could not be deleted."));
          }}
        />
      </div>
    );
  }

  const updatePersonal = (field: Exclude<keyof PersonalDetails, "customLinks">, value: string) => {
    updateResume((current) => ({
      ...current,
      personal: { ...current.personal, [field]: value },
    }), `personal:${field}`);
  };

  const updateSection = (sectionId: string, patch: Partial<ResumeSection>) => {
    const changedField = Object.keys(patch)[0];
    const groupKey = changedField === "title" || changedField === "content"
      ? `section:${sectionId}:${changedField}`
      : undefined;
    updateResume((current) => ({
      ...current,
      sections: current.sections.map((section) =>
        section.id === sectionId ? { ...section, ...patch } : section,
      ),
    }), groupKey);
  };

  const updateItem = (sectionId: string, itemId: string, patch: Partial<ResumeSectionItem>) => {
    const changedField = Object.keys(patch)[0] ?? "item";
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
    }), `item:${sectionId}:${itemId}:${changedField}`);
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

  const moveItem = (sectionId: string, itemId: string, direction: -1 | 1) => {
    updateResume((current) => ({
      ...current,
      sections: current.sections.map((section) => {
        if (section.id !== sectionId) return section;
        const itemIndex = section.items.findIndex((item) => item.id === itemId);
        const targetIndex = itemIndex + direction;
        if (itemIndex < 0 || targetIndex < 0 || targetIndex >= section.items.length) return section;
        const items = [...section.items];
        const item = items[itemIndex];
        const target = items[targetIndex];
        if (!item || !target) return section;
        items[itemIndex] = target;
        items[targetIndex] = item;
        return { ...section, items };
      }),
    }));
    setMessage("Entry order updated.");
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
    setExportingFormat("pdf");
    setMessage("Preparing selectable-text PDF…");
    try {
      const { exportResumeToPdf } = await import("../features/export/pdf/exportResumeToPdf");
      const base = sanitizeFileName(resume.personal.fullName);
      await exportResumeToPdf(resume, `${base}-resume.pdf`);
      setMessage("ATS PDF downloaded. Long resumes are paginated automatically.");
    } catch {
      setMessage("The PDF export could not be completed. Please try again.");
    } finally {
      setExportingFormat(null);
    }
  };

  const downloadDocx = async () => {
    setExportingFormat("docx");
    setMessage("Preparing editable Word document…");
    try {
      const { exportResumeToDocx } = await import("../features/export/docx/exportResumeToDocx");
      const base = sanitizeFileName(resume.personal.fullName);
      await exportResumeToDocx(resume, `${base}-resume.docx`);
      setMessage("Editable ATS-friendly Word resume downloaded.");
      setShowExportDialog(false);
    } catch {
      setMessage("The Word export could not be completed. Please try again.");
    } finally {
      setExportingFormat(null);
    }
  };

  const downloadImages = async (format: "png" | "jpeg") => {
    setExportingFormat(format);
    setMessage(`Preparing ${format === "png" ? "PNG" : "JPEG"} resume pages…`);
    try {
      // Image export captures the paginated preview, including all pages.
      setDesktopPaneLayout("both");
      setMobileView("preview");
      await new Promise<void>((resolve) => window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => resolve());
      }));
      const { exportResumeImages } = await import("../features/export/image/exportResumeImages");
      const base = sanitizeFileName(resume.personal.fullName);
      const pageCount = await exportResumeImages(`${base}-resume`, format);
      setMessage(`${pageCount} ${format === "png" ? "PNG" : "JPEG"} resume ${pageCount === 1 ? "page" : "pages"} downloaded.`);
      setShowExportDialog(false);
    } catch {
      setMessage(`The ${format === "png" ? "PNG" : "JPEG"} export could not be completed. Please try again.`);
    } finally {
      setExportingFormat(null);
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
  const SelectedTemplate = TEMPLATE_REGISTRY[resume.design.templateId].component;

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
                  loadResume(null);
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
      {showExportDialog && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !exportingFormat) setShowExportDialog(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape" && !exportingFormat) setShowExportDialog(false);
          }}
        >
          <section
            className="confirm-dialog export-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="export-resume-title"
            aria-describedby="export-resume-description"
          >
            <div className="confirm-dialog-brand" aria-hidden="true">
              <span className="brand-mark">F</span>
            </div>
            <p className="eyebrow">Export resume</p>
            <h2 id="export-resume-title">Choose a file format</h2>
            <p id="export-resume-description">
              PDF and DOCX keep real selectable text. PNG and JPEG create one image for every preview page.
            </p>
            <div className="export-options">
              <button type="button" onClick={() => void downloadPdf()} disabled={Boolean(exportingFormat)}>
                <strong>ATS PDF</strong><span>Selectable text and automatic pagination</span>
              </button>
              <button type="button" onClick={() => void downloadDocx()} disabled={Boolean(exportingFormat)}>
                <strong>Word DOCX</strong><span>Editable selected template, headings, bullets, and links</span>
              </button>
              <button type="button" onClick={() => void downloadImages("png")} disabled={Boolean(exportingFormat)}>
                <strong>PNG pages</strong><span>High-resolution copies; multiple pages use ZIP</span>
              </button>
              <button type="button" onClick={() => void downloadImages("jpeg")} disabled={Boolean(exportingFormat)}>
                <strong>JPEG pages</strong><span>Smaller copies; multiple pages use ZIP</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  downloadResume();
                  setShowExportDialog(false);
                }}
                disabled={Boolean(exportingFormat)}
              >
                <strong>Markdown</strong><span>Portable source file for future editing</span>
              </button>
            </div>
            <p className="export-image-note">
              For job applications and ATS systems, use PDF or DOCX. Image files are intended for visual sharing.
            </p>
            <div className="confirm-dialog-actions">
              <button
                className="secondary-button"
                type="button"
                autoFocus
                disabled={Boolean(exportingFormat)}
                onClick={() => setShowExportDialog(false)}
              >
                Close
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
          <button
            className="save-status-button"
            type="button"
            aria-pressed={autosaveEnabled}
            title="Toggle browser-local autosave"
            onClick={() => setAutosaveEnabled((enabled) => !enabled)}
          >
            {autosaveEnabled
              ? lastDraftSavedAt ? "Draft saved locally" : "Saving local draft…"
              : "Autosave off · current session only"}
          </button>
        </div>
        <div className="header-actions">
          <div className="history-controls" aria-label="Edit history">
            <button
              className="icon-button"
              type="button"
              disabled={!canUndo}
              aria-label="Undo last change"
              title="Undo (Ctrl+Z)"
              onClick={() => {
                markdownIsCurrentRef.current = false;
                undoResume();
              }}
            >
              <FontAwesomeIcon icon={faArrowRotateLeft} aria-hidden="true" />
            </button>
            <button
              className="icon-button"
              type="button"
              disabled={!canRedo}
              aria-label="Redo last change"
              title="Redo (Ctrl+Shift+Z)"
              onClick={() => {
                markdownIsCurrentRef.current = false;
                redoResume();
              }}
            >
              <FontAwesomeIcon icon={faArrowRotateRight} aria-hidden="true" />
            </button>
          </div>
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
            onClick={() => setShowExportDialog(true)}
          >
            <FontAwesomeIcon icon={faDownload} aria-hidden="true" /> Export
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
                  }), `personal-link:${linkId}:${Object.keys(patch)[0] ?? "link"}`)
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
                onMoveItem={moveItem}
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
                  photo={resume.personal.photo}
                  onPhotoChange={(photo) =>
                    updateResume(
                      (current) => ({
                        ...current,
                        personal: { ...current.personal, photo },
                      }),
                      "personal:photo",
                    )
                  }
                  onDesignChange={(patch: Partial<ResumeDesignSettings>) => {
                    const changedFields = Object.keys(patch).sort().join("+") || "design";
                    updateResume(
                      (current) => ({ ...current, design: { ...current.design, ...patch } }),
                      `design:${changedFields}`,
                    );
                  }}
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
              <SelectedTemplate
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
