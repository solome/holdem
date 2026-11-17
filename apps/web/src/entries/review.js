import { startPage } from "../app.js";
import { createCardMarkup } from "../card-markup.js";
import { createHandReview } from "../review-ui.js";
import { REVIEW_TRANSLATIONS } from "../review-i18n.mjs";
import { CATEGORY_TRANSLATIONS } from "../hand-category-i18n.mjs";

startPage({
  dictionaries: [REVIEW_TRANSLATIONS, CATEGORY_TRANSLATIONS],
  createView: (ctx) => createHandReview({ ...ctx, renderCard: createCardMarkup(ctx.translate) }),
});
