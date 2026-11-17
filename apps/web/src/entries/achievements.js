import { startPage } from "../app.js";
import { createCardMarkup } from "../card-markup.js";
import { createAchievements } from "../achievements-ui.js";
import { ACHIEVEMENT_TRANSLATIONS } from "../achievement-i18n.mjs";
import { CATEGORY_TRANSLATIONS } from "../hand-category-i18n.mjs";

startPage({
  dictionaries: [ACHIEVEMENT_TRANSLATIONS, CATEGORY_TRANSLATIONS],
  createView: (ctx) => createAchievements({ ...ctx, renderCard: createCardMarkup(ctx.translate) }),
});
