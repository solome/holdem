import { OPPONENT_SECTIONS } from "./opponent-guide-content.mjs";
import { renderHandbookCards } from "./lag-handbook-visuals.mjs";

export const OPPONENT_TRANSLATIONS = {
  "zh-CN": { oNav: "读人识牌", oPageTitle: "Holdem — 读人识牌：诈唬还是价值", oFooter: "" },
  "zh-TW": { oNav: "讀人識牌", oPageTitle: "Holdem — 讀人識牌：詐唬還是價值", oFooter: "" },
  en: { oNav: "Hand reading", oPageTitle: "Holdem — Hand reading: bluffs and value", oFooter: "" },
};

export function createOpponentGuide({ element, renderCard }) {
  let rendered = false;
  let scrollFrame;

  function markChapter(id) {
    element.querySelectorAll("[data-reading-chapter]").forEach((link) => {
      if (link.dataset.readingChapter === id) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }

  window.addEventListener("scroll", () => {
    if (element.hidden || scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = null;
      const threshold = Math.max(80, window.innerHeight * 0.25);
      const chapters = [...element.querySelectorAll(".handbook-chapter")];
      const current = chapters.filter((chapter) => chapter.getBoundingClientRect().top <= threshold).at(-1) ?? chapters[0];
      if (current) markChapter(current.id.replace("reading-", ""));
    });
  }, { passive: true });

  function render() {
    if (rendered) return;
    element.innerHTML = `<div class="handbook-page" lang="zh-CN">
      <header class="handbook-hero reading-hero"><div class="handbook-hero-copy"><h1 id="reading-title">读人识牌</h1><p class="handbook-intro">沿完整下注线追溯价值牌与诈唬牌的来路，结合位置、对手习惯和跟注价格，决定这一手怎样应对。</p><div class="handbook-hero-actions"><a href="#reading/habits">开始读人识牌 <span aria-hidden="true">↗</span></a><a href="#reading/quick-check">打开桌边速查 <span aria-hidden="true">→</span></a></div></div><figure class="reading-hero-map"><div><b>起点</b><strong>他从哪里、怎样入池？</strong></div><div><b>范围</b><strong>哪些牌会这样下注？</strong></div><div><b>价格</b><strong>我需要赢多少次？</strong></div></figure></header>
      <div class="handbook-reading-layout"><aside class="handbook-sidebar"><nav class="handbook-toc" aria-label="读人识牌章节"><span class="handbook-eyebrow">阅读目录</span><ol>${OPPONENT_SECTIONS.map((section) => `<li><a href="#reading/${section.id}" data-reading-chapter="${section.id}"><span>${section.number}</span>${section.title.split("：")[0]}</a></li>`).join("")}</ol><a class="handbook-review-link" href="#tilt">回到情绪管理 <span aria-hidden="true">↗</span></a><a class="handbook-review-link" href="#handbook/psychology">继续学习心理博弈 <span aria-hidden="true">↗</span></a></nav></aside><article class="handbook-article" aria-label="读人识牌与价值诈唬判断">${OPPONENT_SECTIONS.map((section) => `<section id="reading-${section.id}" class="handbook-chapter" aria-labelledby="reading-${section.id}-title"><header class="handbook-chapter-heading"><span class="handbook-chapter-number">${section.number}</span><div><h2 id="reading-${section.id}-title" tabindex="-1">${section.title}</h2><p>${section.summary}</p></div></header><div class="handbook-prose">${section.body}</div></section>`).join("")}<a href="#reading" class="handbook-back-top">回到读人识牌开头 ↑</a></article></div>
    </div>`;
    element.querySelectorAll("[data-reading-cards]").forEach((placeholder) => {
      placeholder.classList.add("handbook-inline-cards");
      placeholder.innerHTML = renderHandbookCards(placeholder.dataset.readingCards, renderCard);
    });
    element.querySelectorAll(".handbook-table-scroll").forEach((table) => {
      table.tabIndex = 0;
      table.setAttribute("role", "region");
      table.setAttribute("aria-label", table.querySelector("caption").textContent);
    });
    markChapter(OPPONENT_SECTIONS[0].id);
    rendered = true;
  }

  function syncHash() {
    if (element.hidden) return;
    const id = location.hash.split("/")[1];
    const chapter = OPPONENT_SECTIONS.find((section) => section.id === id);
    if (chapter) {
      const section = element.querySelector(`#reading-${chapter.id}`);
      section.scrollIntoView({ behavior: "instant", block: "start" });
      section.querySelector("h2").focus({ preventScroll: true });
      markChapter(chapter.id);
    } else {
      window.scrollTo({ top: 0, behavior: "instant" });
      markChapter(OPPONENT_SECTIONS[0].id);
    }
  }

  element.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#reading"]');
    if (link && link.getAttribute("href") === location.hash) {
      event.preventDefault();
      syncHash();
    }
  });

  return { render, syncHash };
}
