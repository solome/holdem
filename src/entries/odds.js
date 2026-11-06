import { startPage } from "../app.js";
import { createCardMarkup } from "../card-markup.js";
import { createOddsCalculator } from "../odds-ui.js";
import { ODDS_TRANSLATIONS } from "../odds-i18n.mjs";
import { CATEGORY_TRANSLATIONS } from "../hand-category-i18n.mjs";

startPage({
  dictionaries: [ODDS_TRANSLATIONS, CATEGORY_TRANSLATIONS],
  createView: (ctx) => createOddsCalculator({ ...ctx, renderCard: createCardMarkup(ctx.translate) }),
});
