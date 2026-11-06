import { HANDBOOK_SECTIONS } from "./lag-handbook-content.mjs";
import { TILT_SECTIONS, TILT_SOURCE } from "./tilt-guide-content.mjs";
import { OPPONENT_SECTIONS } from "./opponent-guide-content.mjs";
import { createHandbookVisuals, handbookHandTokens, renderHandbookCards } from "./lag-handbook-visuals.mjs";

// Used at build time. Only the finished article is sent to the reader.
const guides = {
  handbook: {
    title: "松凶手册", titleKey: "hNav", sections: HANDBOOK_SECTIONS,
    intro: "从翻前选牌到河牌收手，顺着每条街的新信息，把位置、范围、下注目的与退出条件连成一条清楚的决策路径。",
    meta: '<div class="handbook-meta"><span>6–9 人现金局</span><span>约 100 BB 有效筹码</span><span>无限注德州扑克</span></div>',
    start: ["position", "看位置与起手牌"], quick: ["practice", "桌边速查"],
    map: `<figure class="handbook-entry-map"><h2>下注前，先选目的</h2>
      <div><span>更差牌会跟</span><span aria-hidden="true">→</span><strong>取价值</strong></div>
      <div><span>更好牌会弃</span><span aria-hidden="true">→</span><strong>评估诈唬</strong></div>
      <div><span>依据还不够</span><span aria-hidden="true">→</span><strong>比较过牌</strong></div></figure>`,
    links: [["review.html", "去牌局复盘检验判断"]],
    back: "回到手册开头",
  },
  tilt: {
    title: "情绪管理", titleKey: "tNav", sections: TILT_SECTIONS, viewClass: "tilt-view", heroClass: "tilt-hero",
    intro: "看清上一手留下的情绪，记下自己的预警信号，练习在下一次行动前调整、暂停或结束。",
    start: ["understand", "开始阅读"], quick: ["quick-check", "打开桌边速查"],
    source: `<p class="tilt-source">阅读起点：<a href="${TILT_SOURCE}">Understanding Poker Tilt</a> · Jared Tendler</p>`,
    map: `<figure class="tilt-hero-map"><div><span>看见</span><strong>我的信号是什么？</strong></div>
      <div><span>暂停</span><strong>把注意力带回本手</strong></div>
      <div><span>选择</span><strong>继续判断，或及时结束</strong></div></figure>`,
    links: [["handbook.html#handbook-psychology", "回看松凶手册的心理博弈"]],
    back: "回到专题开头",
  },
  reading: {
    title: "读人识牌", titleKey: "oNav", sections: OPPONENT_SECTIONS, viewClass: "opponent-view", heroClass: "reading-hero",
    intro: "沿完整下注线追溯价值牌与诈唬牌的来路，结合位置、对手习惯和跟注价格，决定这一手怎样应对。",
    start: ["habits", "开始读人识牌"], quick: ["quick-check", "打开桌边速查"],
    map: `<figure class="reading-hero-map"><div><b>起点</b><strong>他从哪里、怎样入池？</strong></div>
      <div><b>范围</b><strong>哪些牌会这样下注？</strong></div>
      <div><b>价格</b><strong>我需要赢多少次？</strong></div></figure>`,
    links: [["tilt.html", "回到情绪管理"], ["handbook.html#handbook-psychology", "继续学习心理博弈"]],
    back: "回到读人识牌开头",
  },
};

export function renderGuidePage(view, renderCard) {
  const guide = guides[view];
  const figures = createHandbookVisuals(renderCard);
  let figureNumber = 0;
  // Expand the deliberately small set of markers in our authored HTML fragments.
  function renderVisuals(body) {
    return body
      .replace(/<div data-handbook-visual="(\w+)"><\/div>/g, (_, name) =>
        figures[name]().replace(/(<figcaption[^>]*>)(?:图 \d+ · )?/, (_, tag) => `${tag}图 ${++figureNumber} · `))
      .replace(/<(span|div) data-(?:handbook|reading)-cards="([^"]+)">[^<]*<\/\1>/g, (_, tag, cards) =>
        `<${tag} class="handbook-inline-cards">${renderHandbookCards(cards, renderCard)}</${tag}>`)
      .replace(/<span data-handbook-hand="([^"]+)">[^<]*<\/span>/g, (_, hand) =>
        `<span class="handbook-inline-hand">${renderHandbookCards(handbookHandTokens(hand), renderCard)}<small>${hand}</small></span>`);
  }
  function action([id, label], arrow) {
    return `<a href="#${view}-${id}">${label} <span aria-hidden="true">${arrow}</span></a>`;
  }
  function chapter(item) {
    const id = `${view}-${item.id}`;
    return `<section id="${id}" class="handbook-chapter" tabindex="-1" aria-labelledby="${id}-title">
      <header class="handbook-chapter-heading"><span class="handbook-chapter-number">${item.number}</span>
        <div><h2 id="${id}-title">${item.title}</h2><p>${item.summary}</p></div></header>
      <div class="handbook-prose">${renderVisuals(item.body)}</div></section>`;
  }
  const contents = guide.sections.map((item) => {
    const label = view === "handbook" ? item.title : item.title.split("：")[0];
    return `<li><a href="#${view}-${item.id}"><span>${item.number}</span>${label}</a></li>`;
  }).join("");
  const related = guide.links.map(([url, label]) =>
    `<a class="handbook-review-link" href="${url}">${label} <span aria-hidden="true">↗</span></a>`).join("");
  return `<section id="${view}-view" class="handbook-view ${guide.viewClass ?? ""}" aria-labelledby="${view}-title">
    <div class="handbook-page" lang="zh-CN">
      <header class="handbook-hero ${guide.heroClass ?? ""}">
        <div class="handbook-hero-copy"><h1 id="${view}-title" data-i18n="${guide.titleKey}">${guide.title}</h1>
          <p class="handbook-intro">${guide.intro}</p>${guide.meta ?? ""}
          <div class="handbook-hero-actions">${action(guide.start, "↗")}${action(guide.quick, "→")}</div>
          ${guide.source ?? ""}
          <p class="handbook-language-note" lang="en">This guide is written in Simplified Chinese.</p>
          <p class="handbook-language-note" lang="zh-TW">手冊正文為簡體中文。</p>
        </div>${guide.map}
      </header>
      <div class="handbook-reading-layout">
        <aside class="handbook-sidebar"><nav class="handbook-toc" aria-label="${guide.title}章节">
          <span class="handbook-eyebrow">阅读目录</span><ol>${contents}</ol>${related}</nav></aside>
        <article class="handbook-article" aria-labelledby="${view}-title">
          ${guide.sections.map(chapter).join("")}
          <a href="#${view}-title" class="handbook-back-top">${guide.back} ↑</a>
        </article>
      </div>
    </div></section>`;
}
