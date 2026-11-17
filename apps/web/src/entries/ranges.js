import { startPage } from "../app.js";
import { createCardMarkup } from "../card-markup.js";
import { createRangeExplorer } from "../range-ui.js";
import { RANGE_TRANSLATIONS } from "../range-i18n.mjs";

startPage({
  dictionaries: [RANGE_TRANSLATIONS],
  createView: (ctx) => createRangeExplorer({ ...ctx, renderCard: createCardMarkup(ctx.translate) }),
});
