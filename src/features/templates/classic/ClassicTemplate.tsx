import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type HTMLAttributes,
} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import type { ResumeDocument, ResumeSectionItem } from "../../../domain/resume.types";
import type { SectionDropPosition } from "../../../domain/resume.transforms";
import { getFontAwesomeIconDefinition } from "../../icons/fontAwesomeRegistry";
import { paginatePreviewBlocks } from "./paginatePreviewBlocks";

const CSS_PIXELS_PER_MILLIMETRE = 96 / 25.4;
const PAGE_VERTICAL_PADDING_MM = 34;
const PAGINATION_SAFETY_PIXELS = 4;

type PreviewBlock =
  | { id: string; kind: "heading"; sectionId: string; title: string }
  | { id: string; kind: "summary"; content: string }
  | { id: string; kind: "simple-items"; items: ResumeSectionItem[] }
  | { id: string; kind: "entry"; item: ResumeSectionItem };

function safeHref(value: string): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function ContactValue({
  value,
  href,
  icon,
}: {
  value: string;
  href?: string;
  icon?: IconDefinition;
}) {
  if (!value) return null;
  const content = (
    <>
      {icon && <FontAwesomeIcon className="contact-icon" icon={icon} aria-hidden="true" />}
      <span>{value}</span>
    </>
  );
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer">{content}</a>
  ) : <span>{content}</span>;
}

function createPreviewBlocks(resume: ResumeDocument): PreviewBlock[] {
  const orderedSections = [...resume.sections]
    .filter((section) => section.visible)
    .sort((a, b) => a.order - b.order);

  return orderedSections.flatMap((section) => {
    const blocks: PreviewBlock[] = [
      { id: `${section.id}-heading`, kind: "heading", sectionId: section.id, title: section.title },
    ];

    if (section.content) {
      blocks.push({
        id: `${section.id}-summary`,
        kind: "summary",
        content: section.content,
      });
    }

    let simpleItems: ResumeSectionItem[] = [];
    const flushSimpleItems = () => {
      if (simpleItems.length === 0) return;
      blocks.push({
        id: `${section.id}-simple-${simpleItems[0]?.id ?? blocks.length}`,
        kind: "simple-items",
        items: simpleItems,
      });
      simpleItems = [];
    };

    section.items.forEach((item) => {
      const isSimple = !item.subtitle
        && !item.meta
        && !item.description
        && item.bullets.length === 0;
      if (isSimple) {
        simpleItems.push(item);
        return;
      }

      flushSimpleItems();
      blocks.push({ id: `${section.id}-entry-${item.id}`, kind: "entry", item });
    });
    flushSimpleItems();

    return blocks;
  });
}

function ResumeHeader({ resume, measurement = false }: { resume: ResumeDocument; measurement?: boolean }) {
  const contacts = [
    { key: "email", value: resume.personal.email, href: resume.personal.email ? `mailto:${resume.personal.email}` : undefined, iconUrl: resume.design.contactIconUrls.email },
    { key: "phone", value: resume.personal.phone, href: undefined, iconUrl: resume.design.contactIconUrls.phone },
    { key: "location", value: resume.personal.location, href: undefined, iconUrl: resume.design.contactIconUrls.location },
    { key: "website", value: resume.personal.website, href: safeHref(resume.personal.website), iconUrl: resume.design.contactIconUrls.website },
    { key: "linkedin", value: resume.personal.linkedin, href: safeHref(resume.personal.linkedin), iconUrl: resume.design.contactIconUrls.linkedin },
    { key: "github", value: resume.personal.github, href: safeHref(resume.personal.github), iconUrl: resume.design.contactIconUrls.github },
    ...resume.personal.customLinks.map((link) => ({
      key: link.id,
      value: [link.header, link.content].filter(Boolean).join(": "),
      href: safeHref(link.url),
      iconUrl: link.iconUrl,
    })),
  ].filter((contact) => contact.value);

  return (
    <header className="resume-header" data-preview-header={measurement ? "true" : undefined}>
      <h1>{resume.personal.fullName || "Your Name"}</h1>
      <p className="resume-role">{resume.personal.professionalTitle}</p>
      <div className={`resume-contact ${resume.design.showContactIcons ? "with-icons" : "without-icons"}`}>
        {contacts.map((contact) => (
          <span className="contact-item" key={contact.key}>
            <ContactValue
              value={contact.value}
              href={contact.href}
              icon={
                resume.design.showContactIcons
                  ? getFontAwesomeIconDefinition(contact.iconUrl)
                  : undefined
              }
            />
          </span>
        ))}
      </div>
    </header>
  );
}

type HeadingDragAttributes = Pick<
  HTMLAttributes<HTMLElement>,
  "draggable" | "onDragStart" | "onDragOver" | "onDrop" | "onDragEnd"
>;

function PreviewBlockContent({
  block,
  measurement = false,
  headingDragAttributes,
  headingDragClass = "",
}: {
  block: PreviewBlock;
  measurement?: boolean;
  headingDragAttributes?: HeadingDragAttributes;
  headingDragClass?: string;
}) {
  const measurementAttributes = measurement ? { "data-preview-block": block.id } : {};

  if (block.kind === "heading") {
    return (
      <section
        className={`resume-preview-block resume-section-heading ${headingDragClass}`.trim()}
        title={headingDragAttributes ? `Drag ${block.title} to reorder` : undefined}
        {...measurementAttributes}
        {...headingDragAttributes}
      >
        {headingDragAttributes && <span className="preview-drag-handle" aria-hidden="true">⋮⋮</span>}
        <h2>{block.title}</h2>
      </section>
    );
  }

  if (block.kind === "summary") {
    return (
      <div className="resume-preview-block resume-summary-block" {...measurementAttributes}>
        <p className="resume-summary">{block.content}</p>
      </div>
    );
  }

  if (block.kind === "simple-items") {
    return (
      <div className="resume-preview-block resume-entry-list simple-entry-list" {...measurementAttributes}>
        {block.items.map((item) => <span className="simple-pill" key={item.id}>{item.title}</span>)}
      </div>
    );
  }

  const { item } = block;
  return (
    <article className="resume-preview-block resume-entry" {...measurementAttributes}>
      <div className="entry-heading-row">
        <h3>{item.title}</h3>
        {item.meta && <p>{item.meta}</p>}
      </div>
      {item.subtitle && <p className="entry-subtitle">{item.subtitle}</p>}
      {item.description && <p>{item.description}</p>}
      {item.bullets.length > 0 && (
        <ul className="resume-bullets">
          {item.bullets.map((bullet, index) => <li key={`${item.id}-${index}`}>{bullet}</li>)}
        </ul>
      )}
    </article>
  );
}

export function ClassicTemplate({
  resume,
  onSectionReorder,
}: {
  resume: ResumeDocument;
  onSectionReorder?: (
    sourceSectionId: string,
    targetSectionId: string,
    position: SectionDropPosition,
  ) => void;
}) {
  const blocks = useMemo(() => createPreviewBlocks(resume), [resume]);
  const blockMap = useMemo(
    () => new Map(blocks.map((block) => [block.id, block])),
    [blocks],
  );
  const measurementPageRef = useRef<HTMLElement>(null);
  const draggedSectionIdRef = useRef<string | null>(null);
  const [pageBlockIds, setPageBlockIds] = useState<string[][]>(() => [blocks.map((block) => block.id)]);
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    sectionId: string;
    position: SectionDropPosition;
  } | null>(null);
  const style = {
    "--resume-accent": resume.design.accentColor,
    "--resume-paper": resume.design.paperColor,
    "--resume-text": resume.design.textColor,
    "--resume-font": resume.design.fontFamily,
    "--resume-heading-font": resume.design.headingFontFamily,
    "--resume-font-size": `${resume.design.fontSize}pt`,
    "--resume-bullet-size": `${resume.design.bulletSize}pt`,
    "--resume-line-height": resume.design.lineHeight,
  } as CSSProperties;

  useLayoutEffect(() => {
    const measurementPage = measurementPageRef.current;
    if (!measurementPage) return;

    const headerHeight = measurementPage
      .querySelector<HTMLElement>("[data-preview-header]")
      ?.getBoundingClientRect().height ?? 0;
    const blockElements = measurementPage.querySelectorAll<HTMLElement>("[data-preview-block]");
    const measuredHeights = new Map(
      Array.from(blockElements, (element) => [
        element.dataset.previewBlock ?? "",
        element.getBoundingClientRect().height,
      ]),
    );
    const measuredBlocks = blocks.map((block) => ({
      id: block.id,
      kind: block.kind === "heading" ? "heading" as const : "content" as const,
      height: measuredHeights.get(block.id) ?? 0,
    }));
    const pageHeightMm = resume.design.pageSize === "LETTER" ? 279.4 : 297;
    const contentHeight = (pageHeightMm - PAGE_VERTICAL_PADDING_MM)
      * CSS_PIXELS_PER_MILLIMETRE
      - PAGINATION_SAFETY_PIXELS;
    const nextPages = paginatePreviewBlocks(measuredBlocks, headerHeight, contentHeight);

    setPageBlockIds((currentPages) => {
      const currentSignature = currentPages.map((page) => page.join("|")).join("||");
      const nextSignature = nextPages.map((page) => page.join("|")).join("||");
      return currentSignature === nextSignature ? currentPages : nextPages;
    });
  }, [blocks, resume.design.pageSize]);

  const pageSizeClass = resume.design.pageSize === "LETTER" ? "letter" : "a4";

  const getDropPosition = (event: DragEvent<HTMLElement>): SectionDropPosition => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return event.clientY < bounds.top + bounds.height / 2 ? "before" : "after";
  };

  const finishDragging = () => {
    draggedSectionIdRef.current = null;
    setDraggedSectionId(null);
    setDropTarget(null);
  };

  return (
    <>
      {pageBlockIds.map((page, pageIndex) => (
        <div className={`resume-page-wrapper ${pageSizeClass}`} key={`page-${pageIndex}`}>
          <span className="preview-page-number" aria-hidden="true">
            Page {pageIndex + 1} of {pageBlockIds.length}
          </span>
          <article
            className={`resume-page ${pageSizeClass}`}
            style={style}
            aria-label={`${resume.personal.fullName || "Resume"} preview, page ${pageIndex + 1} of ${pageBlockIds.length}`}
          >
            {pageIndex === 0 && <ResumeHeader resume={resume} />}
            {page.map((blockId) => {
              const block = blockMap.get(blockId);
              if (!block) return null;
              if (block.kind !== "heading" || !onSectionReorder) {
                return <PreviewBlockContent block={block} key={block.id} />;
              }

              const dropClass = dropTarget?.sectionId === block.sectionId
                ? `drop-${dropTarget.position}`
                : "";
              const dragClass = draggedSectionId === block.sectionId ? "is-dragging" : "";
              return (
                <PreviewBlockContent
                  block={block}
                  key={block.id}
                  headingDragClass={`preview-draggable-heading ${dragClass} ${dropClass}`}
                  headingDragAttributes={{
                    draggable: true,
                    onDragStart: (event) => {
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", block.sectionId);
                      // Native dragover can fire before React commits state. Keep
                      // the active ID in a ref so quick drops work immediately.
                      draggedSectionIdRef.current = block.sectionId;
                      setDraggedSectionId(block.sectionId);
                    },
                    onDragOver: (event) => {
                      const activeSectionId = draggedSectionIdRef.current;
                      if (!activeSectionId || activeSectionId === block.sectionId) return;
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "move";
                      const position = getDropPosition(event);
                      setDropTarget((current) =>
                        current?.sectionId === block.sectionId && current.position === position
                          ? current
                          : { sectionId: block.sectionId, position },
                      );
                    },
                    onDrop: (event) => {
                      event.preventDefault();
                      const sourceSectionId = event.dataTransfer.getData("text/plain")
                        || draggedSectionIdRef.current;
                      const position = getDropPosition(event);
                      if (sourceSectionId && sourceSectionId !== block.sectionId) {
                        onSectionReorder(sourceSectionId, block.sectionId, position);
                      }
                      finishDragging();
                    },
                    onDragEnd: finishDragging,
                  }}
                />
              );
            })}
          </article>
        </div>
      ))}

      <article
        ref={measurementPageRef}
        className={`resume-page resume-measurement ${pageSizeClass}`}
        style={style}
        aria-hidden="true"
      >
        <ResumeHeader resume={resume} measurement />
        {blocks.map((block) => <PreviewBlockContent block={block} measurement key={block.id} />)}
      </article>
    </>
  );
}
