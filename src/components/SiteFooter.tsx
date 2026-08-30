export function SiteFooter({
  compact = false,
  onGuide,
}: {
  compact?: boolean;
  onGuide?: () => void;
}) {
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
        {onGuide && (
          <button type="button" onClick={onGuide}>
            Import guide
          </button>
        )}
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
