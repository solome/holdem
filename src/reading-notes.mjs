const escape = text => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;").replaceAll('"', "&quot;");

// Number only editorial citations, after all figures and other fragments have been inserted.
export function renderReadingNotes(content, sources) {
  const entries = new Map();
  const body = content.replace(/<cite data-source="([\w-]+)"><\/cite>/g, (_, key) => {
    if (!Object.hasOwn(sources, key)) throw new Error("Unknown citation source: " + key);
    if (!entries.has(key)) entries.set(key, { number: entries.size + 1, refs: [], source: sources[key] });
    const { number, refs, source } = entries.get(key);
    const id = `cite-${number}-${refs.length + 1}`;
    refs.push(id);
    const tip = `<b>${escape(source.publisher)} · ${escape(source.title)}</b><span>${escape(source.note)}</span>`;
    return `<sup class="citation"><a class="citation-mark" id="${id}" href="#note-${number}" role="doc-noteref" aria-label="注释 ${number}" aria-describedby="${id}-tip">[${number}]</a><span class="citation-tip" role="tooltip" id="${id}-tip">${tip}</span></sup>`;
  });
  if (!entries.size) return { body, notes: "" };

  const items = [...entries.values()].map(({ number, source, refs }) => {
    const back = refs.map((id, i) => {
      const label = refs.length === 1 ? "返回正文" : `返回第 ${i + 1} 处引用`;
      const marker = refs.length === 1 ? "↩" : `↩${i + 1}`;
      return `<a class="note-back" href="#${id}" role="doc-backlink" aria-label="注释 ${number}，${label}" title="${label}">${marker}</a>`;
    }).join(" ");
    const title = `${escape(source.publisher)} · ${escape(source.title)}`;
    return `<li id="note-${number}" tabindex="-1"><span class="note-number">[${number}]</span><a class="note-source" href="${escape(source.url)}" title="${title} — ${escape(source.note)}">${title}</a><span class="note-returns">${back}</span></li>`;
  }).join("");
  const notes = `<section class="cash-endnotes" id="notes" role="doc-endnotes" aria-labelledby="notes-heading"><h2 id="notes-heading">注释</h2><ol>${items}</ol></section>`;
  return { body, notes };
}
