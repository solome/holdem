import { chapters, caseGroups } from "../src/cash/pages.mjs";
import { SITE_TRANSLATIONS } from "../src/site-i18n.mjs";

export const pages = [
  { id: "achievements", file: "index.html", label: "collection", titleKey: "pageTitle", title: "掬一捧的德州好牌图鉴", footer: "footer", css: ["achievements"], description: "皇家同花顺、同花顺与四条金刚的个人成就图鉴。" },
  { id: "ranges", label: "mNav", titleKey: "mPageTitle", footer: "mFooter", css: ["ranges"], description: "根据位置、前面行动和打法风格，查看 169 类起手牌的行动范围。" },
  { id: "odds", label: "cNav", titleKey: "cPageTitle", footer: "cFooter", css: ["odds"], description: "从翻前、翻牌、转牌或河牌开始，计算最终成牌概率和指定手牌的单挑胜率。" },
  { id: "review", label: "rNav", titleKey: "rPageTitle", footer: "rFooter", css: ["table-felt", "review"], description: "逐街回看朋友局的行动、牌面、底池与权益。" },
  { id: "handbook", label: "hNav", css: ["lag-handbook"], description: "松凶打法：从位置、起手牌到逐街下注的判断。" },
  { id: "tilt", label: "tNav", css: ["lag-handbook", "tilt-guide"], description: "识别牌桌上的情绪信号，练习暂停与调整。" },
  { id: "reading", label: "oNav", css: ["lag-handbook", "opponent-guide"], description: "从位置、范围、下注线和价格判断对手的牌。" },
  { id: "cash", label: "cashNav", css: ["cash"], description: "无限注现金桌学习目录与分章牌例索引。" },
  ...chapters.flatMap(chapter => {
    const css = ["cash", "table-felt", "hand-example"];
    return [
      { id: `cash-${chapter.slug}`, label: chapter.key, chapter, css, description: chapter.description },
      ...caseGroups(chapter).map(group => ({
        id: group.id, label: "cashTagPractice", titleSuffix: " " + group.span, chapter, group, css,
        description: `${chapter.title}，牌例 ${group.span} 的牌友重演与决策分析。`,
      })),
    ];
  }),
].map(p => ({ file: p.id + ".html", titleKey: p.label, entry: p.footer ? p.id : "article", ...p }));

const zh = SITE_TRANSLATIONS["zh-CN"];
export function navigation(page) {
  const current = page.chapter ? "cash" : page.id;
  const options = Object.fromEntries(pages.map(p => [p.id, p]));
  const link = (id, top = false) => {
    const { file, label } = options[id], selected = id === current;
    return `<a href="${file}" class="${top ? "nav-link " : ""}${selected ? "active" : ""}" data-i18n="${label}"${selected ? ' aria-current="' + (page.chapter ? "location" : "page") + '"' : ""}>${zh[label]}</a>`;
  };
  function menu(id, key, ids) {
    const selected = ids.includes(current);
    return `<details class="review-nav-menu" id="${id}-nav-menu" name="site-navigation">
      <summary class="nav-link review-nav-trigger${selected ? " active" : ""}"><span data-i18n="${key}">${zh[key]}</span><svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true"><path d="m4 6 4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></summary>
      <div class="review-nav-links">${ids.map(id => link(id)).join("")}</div></details>`;
  }
  return [
    link("achievements", true),
    menu("study", "studyMenu", ["ranges", "cash"]),
    menu("review", "reviewMenu", ["review", "handbook", "tilt", "reading"]),
    link("odds", true),
  ].join("\n");
}
