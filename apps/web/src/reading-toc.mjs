export function renderMobileContents({ label, links, related = "" }) {
  return `<details class="reading-toc-mobile" data-reading-toc>
    <summary id="reading-contents"><span>${label}</span><span class="reading-toc-current" data-reading-current aria-hidden="true"></span>
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none"><path d="m4 6 4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></summary>
    <nav class="reading-toc-links" aria-label="${label}"><ol>${links}</ol>${related}</nav>
  </details>`;
}
