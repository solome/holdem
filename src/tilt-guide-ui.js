import { TILT_SECTIONS, TILT_SOURCE } from "./tilt-guide-content.mjs";

export const TILT_TRANSLATIONS = {
  "zh-CN": { tNav: "情绪管理", tPageTitle: "Holdem — 情绪管理与 Tilt 练习", tFooter: "" },
  "zh-TW": { tNav: "情緒管理", tPageTitle: "Holdem — 情緒管理與 Tilt 練習", tFooter: "" },
  en: { tNav: "Tilt control", tPageTitle: "Holdem — Tilt control", tFooter: "" },
};

export function createTiltGuide({ element }) {
  let rendered = false;
  let scrollFrame;

  function markChapter(id) {
    element.querySelectorAll("[data-tilt-chapter]").forEach((link) => {
      if (link.dataset.tiltChapter === id) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }

  function updateCurrentChapter() {
    if (element.hidden) return;
    const chapters = [...element.querySelectorAll(".handbook-chapter")];
    const threshold = Math.max(80, window.innerHeight * 0.25);
    const current = chapters.filter((chapter) => chapter.getBoundingClientRect().top <= threshold).at(-1) ?? chapters[0];
    if (current) markChapter(current.id.replace("tilt-", ""));
  }

  window.addEventListener("scroll", () => {
    if (element.hidden || scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = null;
      updateCurrentChapter();
    });
  }, { passive: true });

  function render() {
    if (rendered) return;
    element.innerHTML = `<div class="handbook-page" lang="zh-CN">
      <header class="handbook-hero tilt-hero">
        <div class="handbook-hero-copy"><h1 id="tilt-title">情绪管理</h1><p class="handbook-intro">看清上一手留下的情绪，记下自己的预警信号，练习在下一次行动前调整、暂停或结束。</p><div class="handbook-hero-actions"><a href="#tilt/understand">开始阅读 <span aria-hidden="true">↗</span></a><a href="#tilt/quick-check">打开桌边速查 <span aria-hidden="true">→</span></a></div><p class="tilt-source">阅读起点：<a href="${TILT_SOURCE}">Understanding Poker Tilt</a> · Jared Tendler</p></div>
        <figure class="tilt-hero-map"><div><span>看见</span><strong>我的信号是什么？</strong></div><div><span>暂停</span><strong>把注意力带回本手</strong></div><div><span>选择</span><strong>继续判断，或及时结束</strong></div></figure>
      </header>
      <div class="handbook-reading-layout"><aside class="handbook-sidebar"><nav class="handbook-toc" aria-label="情绪管理章节"><span class="handbook-eyebrow">阅读目录</span><ol>${TILT_SECTIONS.map((section) => `<li><a href="#tilt/${section.id}" data-tilt-chapter="${section.id}"><span>${section.number}</span>${section.title.split("：")[0]}</a></li>`).join("")}</ol><a class="handbook-review-link" href="#handbook/psychology">回看松凶手册的心理博弈 <span aria-hidden="true">↗</span></a></nav></aside><article class="handbook-article" aria-label="理解 Tilt 与情绪管理练习">${TILT_SECTIONS.map((section) => `<section id="tilt-${section.id}" class="handbook-chapter" aria-labelledby="tilt-${section.id}-title"><header class="handbook-chapter-heading"><span class="handbook-chapter-number">${section.number}</span><div><h2 id="tilt-${section.id}-title" tabindex="-1">${section.title}</h2><p>${section.summary}</p></div></header><div class="handbook-prose">${section.body}</div></section>`).join("")}<a href="#tilt" class="handbook-back-top">回到专题开头 ↑</a></article></div>
    </div>`;
    element.querySelectorAll(".handbook-table-scroll").forEach((table) => {
      table.tabIndex = 0;
      table.setAttribute("role", "region");
      table.setAttribute("aria-label", table.querySelector("caption").textContent);
    });
    markChapter(TILT_SECTIONS[0].id);
    rendered = true;
  }

  function syncHash() {
    if (element.hidden) return;
    const id = location.hash.split("/")[1];
    const chapter = TILT_SECTIONS.find((section) => section.id === id);
    if (chapter) {
      const section = element.querySelector(`#tilt-${chapter.id}`);
      section.scrollIntoView({ behavior: "instant", block: "start" });
      section.querySelector("h2").focus({ preventScroll: true });
      markChapter(chapter.id);
    } else {
      window.scrollTo({ top: 0, behavior: "instant" });
      markChapter(TILT_SECTIONS[0].id);
    }
  }

  element.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#tilt"]');
    if (link && link.getAttribute("href") === location.hash) {
      event.preventDefault();
      syncHash();
    }
  });

  return { render, syncHash };
}
