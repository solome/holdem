import { HANDBOOK_SECTIONS } from "./lag-handbook-content.mjs";
import { createHandbookVisuals, handbookHandTokens, renderHandbookCards } from "./lag-handbook-visuals.mjs";

export const HANDBOOK_TRANSLATIONS = {
  "zh-CN": { hNav: "松凶手册", hPageTitle: "Holdem — 松凶实战手册", hFooter: "" },
  "zh-TW": { hNav: "鬆兇手冊", hPageTitle: "Holdem — 鬆兇實戰手冊", hFooter: "" },
  en: { hNav: "LAG handbook", hPageTitle: "Holdem — LAG handbook", hFooter: "" },
};

export function createLagHandbook({ element, translate, renderCard, getLanguage = () => "zh-CN" }) {
  const figures = createHandbookVisuals(renderCard);
  let scrollFrame;

  function updateCurrentChapter() {
    if (element.hidden) return;
    const chapters = [...element.querySelectorAll(".handbook-chapter")];
    const current = chapters.filter((chapter) => chapter.getBoundingClientRect().top <= Math.max(80, innerHeight * 0.25)).at(-1) ?? chapters[0];
    if (current) markChapter(current.id.replace("handbook-", ""));
  }

  window.addEventListener("scroll", () => {
    if (element.hidden || scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = null;
      updateCurrentChapter();
    });
  }, { passive: true });

  function markChapter(id) {
    element.querySelectorAll("[data-handbook-chapter]").forEach((link) => {
      if (link.dataset.handbookChapter === id) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }

  function render() {
    element.innerHTML = `<div class="handbook-page" lang="zh-CN"><header class="handbook-hero"><div class="handbook-hero-copy"><h1 id="handbook-title">${translate("hNav")}</h1><p class="handbook-intro">从翻前选牌到河牌收手，顺着每条街的新信息，把位置、范围、下注目的与退出条件连成一条清楚的决策路径。</p><div class="handbook-meta"><span>6–9 人现金局</span><span>约 100 BB 有效筹码</span><span>无限注德州扑克</span></div><div class="handbook-hero-actions"><a href="#handbook/position">看位置与起手牌 <span aria-hidden="true">↗</span></a><a href="#handbook/practice">桌边速查 <span aria-hidden="true">→</span></a></div>${getLanguage() !== "zh-CN" ? `<p class="handbook-language-note">${getLanguage() === "en" ? "The handbook is written in Simplified Chinese." : "手冊正文為簡體中文。"}</p>` : ""}</div><figure class="handbook-entry-map"><h2>下注前，先选目的</h2><div><span>更差牌会跟</span><span aria-hidden="true">→</span><strong>取价值</strong></div><div><span>更好牌会弃</span><span aria-hidden="true">→</span><strong>评估诈唬</strong></div><div><span>依据还不够</span><span aria-hidden="true">→</span><strong>比较过牌</strong></div></figure></header><div class="handbook-reading-layout"><aside class="handbook-sidebar"><nav class="handbook-toc" aria-label="手册章节"><span class="handbook-eyebrow">阅读目录</span><ol>${HANDBOOK_SECTIONS.map((section) => `<li><a href="#handbook/${section.id}" data-handbook-chapter="${section.id}"><span>${section.number}</span>${section.title}</a></li>`).join("")}</ol><a class="handbook-review-link" href="#review">去牌局复盘检验判断 <span aria-hidden="true">↗</span></a></nav></aside><article class="handbook-article" aria-label="松凶实战方法论">${HANDBOOK_SECTIONS.map((section) => `<section id="handbook-${section.id}" class="handbook-chapter" aria-labelledby="handbook-${section.id}-title"><header class="handbook-chapter-heading"><span class="handbook-chapter-number">${section.number}</span><div><h2 id="handbook-${section.id}-title" tabindex="-1">${section.title}</h2><p>${section.summary}</p></div></header><div class="handbook-prose">${section.body}</div></section>`).join("")}<a href="#handbook" class="handbook-back-top">回到手册开头 ↑</a></article></div></div>`;
    // Only locally authored editorial HTML is rendered; no user input is interpolated.
    element.querySelectorAll("[data-handbook-visual]").forEach((placeholder) => {
      const figure = figures[placeholder.dataset.handbookVisual];
      if (figure) placeholder.outerHTML = figure();
    });
    element.querySelectorAll("[data-handbook-cards]").forEach((placeholder) => {
      placeholder.classList.add("handbook-inline-cards");
      placeholder.innerHTML = renderHandbookCards(placeholder.dataset.handbookCards, renderCard);
    });
    element.querySelectorAll("[data-handbook-hand]").forEach((placeholder) => {
      const hand = placeholder.dataset.handbookHand;
      placeholder.classList.add("handbook-inline-hand");
      placeholder.innerHTML = `${renderHandbookCards(handbookHandTokens(hand), renderCard)}<small>${hand}</small>`;
    });
    element.querySelectorAll(".handbook-prose figure > figcaption").forEach((caption, index) => {
      caption.textContent = `图 ${index + 1} · ${caption.textContent.replace(/^图\s*\d+\s*·\s*/, "")}`;
    });
    element.querySelectorAll(".handbook-table-scroll").forEach((table) => {
      table.tabIndex = 0;
      table.setAttribute("role", "region");
      table.setAttribute("aria-label", table.querySelector("caption")?.textContent ?? "手册表格，可横向滚动");
    });

  }

  function syncHash() {
    if (element.hidden) return;
    const id = location.hash.split("/")[1];
    const chapter = HANDBOOK_SECTIONS.find((section) => section.id === id);
    if (chapter) {
      const heading = document.getElementById(`handbook-${chapter.id}-title`);
      document.getElementById(`handbook-${chapter.id}`).scrollIntoView({ behavior: "instant", block: "start" });
      heading.focus({ preventScroll: true });
      markChapter(chapter.id);
    } else if (location.hash === "#handbook") {
      window.scrollTo({ top: 0, behavior: "instant" });
      markChapter("foundation");
    }
  }

  // Following the currently selected chapter should still reposition the reader.
  element.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#handbook"]');
    if (link && link.getAttribute("href") === location.hash) {
      event.preventDefault();
      syncHash();
    }
  });
  return { render, syncHash };
}
