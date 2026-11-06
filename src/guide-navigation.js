// Chapter URLs and scrolling work natively. Highlight the current section as the reader moves.
export function enhanceGuideNavigation(root = document) {
  const links = [...root.querySelectorAll(".handbook-toc li a[href^='#']")];
  const entries = links.map((link) => ({ link, section: document.getElementById(link.hash.slice(1)) }))
    .filter(({ section }) => section);
  if (!entries.length) return;

  let previous;
  function update() {
    const threshold = Math.max(80, innerHeight * 0.25);
    const current = entries.filter(({ section }) => section.getBoundingClientRect().top <= threshold).at(-1) ?? entries[0];
    if (previous !== current) {
      previous?.link.removeAttribute("aria-current");
      current.link.setAttribute("aria-current", "location");
      previous = current;
    }
  }
  let pending = false;
  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      update();
    });
  }
  update();
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  window.addEventListener("pageshow", schedule);
}
