import { readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { pages, navigation } from "./site-pages.mjs";
import { chapters, prepareCashChapter, cashIndex, cashChapter, cashCaseGroup } from "../src/cash/pages.mjs";
import { renderGuidePage } from "../src/static-guides.mjs";
import { createCardMarkup } from "../src/card-markup.js";
import { SITE_TRANSLATIONS } from "../src/site-i18n.mjs";
import { RANGE_TRANSLATIONS } from "../src/range-i18n.mjs";
import { DEFAULT_RANGE_STATE } from "../src/range-location.mjs";
import { createRangeMarkup } from "../src/range-ui.js";
import { buildPWA } from "./pwa.mjs";

const root = new URL("../", import.meta.url);
const read = file => readFile(new URL(file, root), "utf8");
const sharedCSS = ["styles", "select-menu", "review-menu"];
const unique = values => [...new Set(values)];
const browserBundle = {
  absWorkingDir: fileURLToPath(root), bundle: true, format: "iife", platform: "browser",
  target: "es2020", minify: true, charset: "utf8", legalComments: "none",
};
const [oddsWorker, friendWorker] = await Promise.all(["odds-worker", "friend-table-worker"].map((name) =>
  build({ ...browserBundle, entryPoints: [`src/${name}.js`], write: false })));

// Only this directory is generated; the compressed portraits live alongside it.
await rm(new URL("assets/build/", root), { recursive: true, force: true });
await build({
  ...browserBundle, outdir: "assets/build", entryNames: "[name]",
  entryPoints: [
    ...unique(pages.map(p => p.entry)).map(name => `src/entries/${name}.js`),
    ...unique([...sharedCSS, ...pages.flatMap(p => p.css)]).map(name => `src/${name}.css`),
  ],
  define: { __ODDS_WORKER_SOURCE__: JSON.stringify(oddsWorker.outputFiles[0].text) },
});
const friendWorkerSource = friendWorker.outputFiles[0].text;
await Promise.all([
  writeFile(new URL("assets/build/friend-table-worker.js", root), friendWorkerSource),
  writeFile(new URL("assets/build/friend-table-offline.js", root),
    `globalThis.holdemFriendTableWorkerSource = ${JSON.stringify(friendWorkerSource)};\n`),
]);
const template = await read("src/template.html");
const legacy = await read("src/legacy-links.js");
const zh = SITE_TRANSLATIONS["zh-CN"];
const card = createCardMarkup(key => zh[key]);
const cashLessons = await Promise.all(chapters.map(async (chapter, index) =>
  prepareCashChapter(chapter, index + 1, await read(`src/cash/${chapter.slug}.html`))));
async function content(p) {
  if (p.id === "achievements") return read("src/fragments/achievements.html");
  if (p.id === "ranges") {
    const messages = { ...zh, ...RANGE_TRANSLATIONS["zh-CN"] };
    const translate = (key, values = {}) => (messages[key] ?? key)
      .replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? ""));
    const { page } = createRangeMarkup({ state: DEFAULT_RANGE_STATE, translate, renderCard: createCardMarkup(translate) });
    return `<section id="ranges-view" class="ranges-view" aria-labelledby="ranges-title" data-default-range>${page({ staticPreview: true })}</section>`;
  }
  if (p.id === "cash") return cashIndex(cashLessons, card);
  if (p.chapter) {
    const chapter = cashLessons.find(lesson => lesson.slug === p.chapter.slug);
    return p.group ? cashCaseGroup(chapter, p.group, card) : cashChapter(chapter, card);
  }
  if (p.entry === "article") return renderGuidePage(p.id, card);
  return `<section id="${p.id}-view" class="${p.id}-view" aria-labelledby="${p.id}-title"><h1 id="${p.id}-title">${zh[p.label]}</h1></section>`;
}
await Promise.all(pages.map(async p => {
  const values = {
    title: "Holdem — " + (p.title ?? zh[p.label]) + (p.titleSuffix ?? ""),
    titleSuffixAttr: p.titleSuffix ? ` data-title-suffix="${p.titleSuffix}"` : "", titleKey: p.titleKey, view: p.id,
    entry: p.entry, description: p.description, nav: navigation(p),
    legacy: p.id === "achievements" ? `<script>${legacy}</script>` : "",
    styles: [...sharedCSS, ...p.css].map(name => `<link rel="stylesheet" href="assets/build/${name}.css">`).join("\n    "),
    content: await content(p) + (p.footer && p.id !== "ranges" ? "<noscript><p>请开启 JavaScript 以使用此工具。</p></noscript>" : ""),
    footer: p.footer ? `<p id="footer-copy" data-i18n="${p.footer}"></p>` : "",
  };
  const html = template.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key]).replace(/^[ \t]+$/gm, "");
  await writeFile(new URL(p.file, root), html);
}));
const { worker } = await buildPWA(root);
await writeFile(new URL("service-worker.js", root), worker);
console.log(`Built ${pages.length} static pages; local, per-page assets in assets/.`);
