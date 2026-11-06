import { renderHandExample } from "../hand-example.mjs";
import { renderCashHands } from "./inline-hands.mjs";
import { basicExamples } from "./basic-examples.mjs";
import { frameworkExamples } from "./framework-examples.mjs";
import { frameworkMap, riverComparison } from "./framework-visuals.mjs";
import { playExamples } from "./play-examples.mjs";
import { tagExamples } from "./tag-examples.mjs";
import { tagSources } from "./tag-sources.mjs";
import { entryDrill } from "./entry-drill.mjs";
import { renderReadingNotes } from "../reading-notes.mjs";
import { cashSources } from "./sources.mjs";
import { openingMatrix } from "./opening-matrix.mjs";

export const chapters = [
  { slug: "basics", title: "基本概念", key: "cashBasics", cases: { ...basicExamples, ...frameworkExamples },
    caseOrder: ["draw-price", "side-pot-outs", "straight-outs", "implied-price", "semi-bluff", "price-the-draw",
      "framework-river-value", "framework-deep-overpair", "framework-equity-denial"],
    description: "以期望值比较行动，把范围、位置、价格、筹码和对手回应带入每一个决定。" },
  { slug: "key-plays", title: "玩法要点", key: "cashPlay", cases: playExamples,
    description: "用有效筹码规划底池，沿对手的行动读牌，并判断什么时候该为自己的牌桌形象付出代价。" },
  { slug: "preflop-tag", title: "翻前的紧凶打法", key: "cashPreflopTag", cases: tagExamples, sources: tagSources, groupSize: 6,
    description: "从无人入池到平跟、加注和再加注，根据对手的范围、位置与价格决定这手牌怎样入池。" },
];
const url = c => `cash-${c.slug}.html`;
export function caseGroups(chapter) {
  if (!chapter.groupSize) return [];
  const ids = Object.keys(chapter.cases).sort((a, b) =>
    chapter.cases[a].originalNumber - chapter.cases[b].originalNumber);
  const chapterNumber = chapters.findIndex(c => c.slug === chapter.slug) + 1;
  const groups = [];
  for (let start = 0; start < ids.length; start += chapter.groupSize) {
    const batch = ids.slice(start, start + chapter.groupSize);
    const span = `${chapterNumber}-${start + 1} 至 ${chapterNumber}-${start + batch.length}`;
    const id = `cash-${chapter.slug}-cases-${groups.length + 1}`;
    groups.push({ id, file: id + ".html", span, ids: batch });
  }
  return groups;
}
const note = '<p class="cash-language-note" data-i18n="guideLanguageNote"></p>';

const caseSlot = /<cash-example name="([\w-]+)"><\/cash-example>/g;

// Inline placement follows the topic. When the original hand has a number,
// its identifier remains stable even if it appears earlier or later in the lesson.
export function prepareCashChapter(chapter, chapterNumber, body) {
  const groups = caseGroups(chapter);
  const placed = new Set();
  for (const [, id] of body.matchAll(caseSlot)) {
    if (!Object.hasOwn(chapter.cases, id) || placed.has(id))
      throw new Error("Unknown or repeated case in " + chapter.slug + ": " + id);
    placed.add(id);
  }
  if (placed.size !== Object.keys(chapter.cases).length)
    throw new Error("A case is missing from " + chapter.slug);

  const ids = chapter.caseOrder ?? (groups.length ? groups.flatMap(group => group.ids) : [...placed]);
  if (ids.length !== placed.size || new Set(ids).size !== placed.size || ids.some(id => !placed.has(id)))
    throw new Error("Case numbering does not cover " + chapter.slug);
  const cases = {};
  for (const [index, id] of ids.entries()) {
    const source = chapter.cases[id];
    if (groups.length && source.originalNumber !== index + 1)
      throw new Error("Missing or repeated original problem number at " + id);
    cases[id] = { ...source, number: `${chapterNumber}-${index + 1}`, file: url(chapter) };
  }
  return { ...chapter, body, cases, groups };
}

export function cashIndex(lessons, renderCard) {
  const casesById = Object.assign({}, ...lessons.map(lesson => lesson.cases));
  function caseLink(id) {
    const example = casesById[id];
    return `<a href="${example.file}#example-${id}">牌例 ${example.number}</a>`;
  }
  return `<section class="cash-page" lang="zh-CN"><header class="cash-hero">
    <h1 data-i18n="cashNav">无限注现金桌</h1>${note}</header>
    <ol class="cash-chapters">${chapters.map((c, i) => `<li><a href="${url(c)}">
    <span class="cash-number" aria-hidden="true">0${i + 1}</span><div><h2>${c.title}</h2><p>${c.description}</p>
    </div><span class="cash-arrow" aria-hidden="true">→</span></a></li>`).join("")}</ol>
    <nav id="cases" class="cash-case-index" aria-labelledby="cases-title"><h2 id="cases-title">牌例索引</h2>
      <details class="cash-compare" id="compare"><summary>对照练习</summary>
        <p>${caseLink("draw-price")} 和 ${caseLink("implied-price")} 都有九张同花补牌。哪一手跟完就全下？另一手成花时，平均还要从对手那里赢多少才能打平？</p>
        <p>${caseLink("ak-small")} 和 ${caseLink("ak-deep")} 都在前位用 ${renderCashHands("<cash-hand>AK</cash-hand>", renderCard)} 击中顶对。第一手有哪些较差的牌肯跟翻牌下注？第二手对手跟过翻牌、又加注转牌后，哪些牌还可能这么打？</p>
      </details>
      <div class="cash-case-lists">${lessons.map(chapter => {
        const cases = Object.entries(chapter.cases);
        return `<div id="cases-${chapter.slug}"><h3>${chapter.title}</h3><ol>${cases.map(([id, example]) =>
          `<li><a href="${example.file}#example-${id}"><span>${example.number}</span>${example.title}</a></li>`).join("")}</ol>
          ${chapter.groups.length ? `<a class="case-ordered" href="${chapter.groups[0].file}">按原编号连续练习 →</a>` : ""}
        </div>`;
      }).join("")}</div>
    </nav></section>`;
}

export function cashChapter(c, renderCard) {
  const toc = [];
  const content = c.body.replace(/<section id="([\w-]+)">\s*<h2>([^<]+)<\/h2>/g, (_, id, heading) => {
    toc.push(`<li><a href="#${id}">${heading}</a></li>`);
    return `<section id="${id}"${id === "principles" ? ' class="cash-framework"' : ""} tabindex="-1"><h2>${heading}</h2>`;
  }).replace(/<table>[\s\S]*?<\/table>/g, table => {
    const label = table.match(/<caption>([^<]+)<\/caption>/)?.[1] ?? "数据表";
    return `<div class="cash-data-scroll" role="region" tabindex="0" aria-label="${label}">${table}</div>`;
  }).replace(/<cash-label name="([\w-]+)"><\/cash-label>/g, (_, id) => {
    const example = c.cases[id];
    if (!example) throw new Error("Unknown case label: " + id);
    return `<span class="case-summary-number">牌例 ${example.number}</span> ${example.title}`;
  }).replace(/<cash-ref name="([\w-]+)"><\/cash-ref>/g, (_, name) => {
    if (!Object.hasOwn(c.cases, name)) throw new Error("Unknown case reference: " + name);
    const example = c.cases[name];
    return `<a href="#example-${name}">牌例 ${example.number}</a>`;
  }).replace("<cash-range></cash-range>", () => openingMatrix())
    .replace("<cash-entry-drill></cash-entry-drill>", () => entryDrill())
    .replace("<cash-framework-map></cash-framework-map>", () => frameworkMap())
    .replace("<cash-river-comparison></cash-river-comparison>", () => riverComparison())
    .replace(caseSlot, (_, name) => renderHandExample(name, c.cases[name], renderCard));
  const { body, notes } = renderReadingNotes(renderCashHands(content, renderCard), { ...cashSources, ...c.sources });
  const index = chapters.findIndex(chapter => chapter.slug === c.slug);
  const previous = chapters[index - 1];
  const next = chapters[index + 1];
  return `<article class="cash-page" lang="zh-CN">
    <nav class="cash-trail" aria-label="学习导航"><a href="cash.html">← 无限注现金桌</a></nav>
    <header class="cash-hero"><h1 data-i18n="${c.key}">${c.title}</h1><p class="cash-viewpoint">牌例由牌友重演，你坐在掬一捧的位置。</p>${note}</header>
    <div class="cash-layout"><nav class="cash-toc handbook-toc" aria-label="本章目录"><ol>${toc.join("")}</ol></nav>
    <div class="cash-prose">${body}${notes}<nav class="cash-pager" aria-label="章节导航">
      ${previous ? `<a rel="prev" href="${url(previous)}">← ${previous.title}</a>` : ""}
      <a href="cash.html#cases">牌例索引</a>
      ${next ? `<a rel="next" href="${url(next)}">${next.title} →</a>` : ""}
    </nav></div></div></article>`;
}

export function cashCaseGroup(chapter, group, renderCard) {
  const tabs = chapter.groups.map(item => item.id === group.id
    ? `<span aria-current="page">${item.span}</span>`
    : `<a href="${item.file}">${item.span}</a>`).join("");
  const figures = group.ids.map(id => renderHandExample(id, chapter.cases[id], renderCard)).join("");
  const next = chapter.groups[chapter.groups.findIndex(item => item.id === group.id) + 1];
  return `<article class="cash-page cash-casebook" lang="zh-CN">
    <nav class="cash-trail" aria-label="学习导航"><a href="${url(chapter)}">← ${chapter.title}</a></nav>
    <header class="cash-hero"><h1><span data-i18n="cashTagPractice">翻前牌例</span> ${group.span}</h1>
    <p class="cash-viewpoint">你坐在掬一捧的位置。先看行动和价格，选好动作，再展开对照。</p></header>
    <nav class="casebook-tabs" aria-label="选择牌例组">${tabs}</nav>
    <div class="cash-prose">${figures}</div>
    <nav class="cash-pager" aria-label="继续学习"><a href="cash.html#cases-${chapter.slug}">全部翻前牌例</a>
      ${next ? `<a rel="next" href="${next.file}">下一组 · ${next.span} →</a>` : '<a href="cash.html#cases">现金桌牌例索引</a>'}
    </nav></article>`;
}
