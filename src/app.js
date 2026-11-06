import { enhanceNavMenu } from "./review-menu.js";
import { enhanceSelects } from "./select-menu.js";
import { SITE_TRANSLATIONS } from "./site-i18n.mjs";

// Each document calls this once with only its own renderer and vocabulary.
export function startPage({ dictionaries = [], createView } = {}) {
  const body = document.body;
  const picker = document.getElementById("language");
  const messages = Object.fromEntries(Object.entries(SITE_TRANSLATIONS).map(([locale, common]) =>
    [locale, Object.assign({}, common, ...dictionaries.map((table) => table[locale]))]));
  let language = "zh-CN";
  try {
    const saved = localStorage.getItem("holdem.language");
    if (Object.hasOwn(messages, saved)) language = saved;
  } catch { /* Storage is optional for local files. */ }
  const t = (key, values = {}) => (messages[language][key] ?? messages["zh-CN"][key] ?? key)
    .replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? ""));
  const view = createView?.({ element: document.getElementById(body.dataset.view + "-view"),
    translate: t, getLanguage: () => language });

  document.querySelectorAll(".review-nav-menu").forEach(enhanceNavMenu);
  function render() {
    document.documentElement.lang = language;
    document.documentElement.classList.toggle("en", language === "en");
    const title = t(body.dataset.title) + (body.dataset.titleSuffix ?? "");
    document.title = title.startsWith("Holdem") ? title : "Holdem — " + title;
    for (const element of document.querySelectorAll("[data-i18n]")) {
      const key = element.dataset.i18n;
      if (key === "heroTitle" || key === "heroDescription") element.innerHTML = t(key);
      else element.textContent = t(key);
    }
    for (const element of document.querySelectorAll("[data-i18n-aria]"))
      element.setAttribute("aria-label", t(element.dataset.i18nAria));
    picker.value = language;
    enhanceSelects(picker.parentElement);
    view?.render();
  }
  picker.addEventListener("change", () => {
    if (!Object.hasOwn(messages, picker.value)) return;
    language = picker.value;
    try { localStorage.setItem("holdem.language", language); } catch { /* optional */ }
    render();
  });
  render();
}
