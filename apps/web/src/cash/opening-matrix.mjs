import { ENTRY_METADATA, HANDS_169, RANGE_RANKS, getOpeningRange, getRangeSummary } from "../ranges.mjs";

// Generate the comparison from the same preset as the full explorer.
export function openingMatrix() {
  const early = getOpeningRange("tag", "UTG");
  const button = getOpeningRange("tag", "BTN");
  const earlyStats = getRangeSummary(early);
  const buttonStats = getRangeSummary(button);
  const actions = { both: "两处都开池", late: "仅按钮位开池", fold: "两处都弃牌" };
  function cell(hand) {
    const action = early.has(hand.id) ? "both" : button.has(hand.id) ? "late" : "fold";
    return `<td class="range-${action}" aria-label="${hand.id}，${actions[action]}" title="${hand.id}，${actions[action]}">${hand.id}</td>`;
  }
  const rows = RANGE_RANKS.map((_, row) => {
    const cards = HANDS_169.slice(row * 13, (row + 1) * 13);
    return `<tr>${cards.map(cell).join("")}</tr>`;
  }).join("");
  function link(position, scenario, label) {
    const params = new URLSearchParams({ position, scenario, style: "tag", hand: "76s" });
    if (scenario === "raised") params.set("opponent", "CO");
    return `<a href="ranges.html?${params.toString().replaceAll("&", "&amp;")}">${label}</a>`;
  }
  return `<figure id="opening-matrix" class="cash-range">
    <figcaption><h3>100 BB 开池范围</h3>
      <p>六人现金桌，无前注、无跨注，前面全弃。这张图用本站的紧凶训练预设，对照枪口位（UTG）和按钮位（BTN）首次加注的范围。对角线是对子，上方的 s 是同花，下方的 o 是非同花。T 代表 10。</p></figcaption>
    <ul class="cash-range-legend" aria-label="矩阵图例">${Object.entries(actions).map(([key, label]) =>
      `<li><i aria-hidden="true" class="range-${key}"></i>${label}</li>`).join("")}</ul>
    <div class="cash-grid-scroll" role="region" aria-label="起手牌范围对照，可横向滚动" tabindex="0">
      <table class="cash-range-grid" aria-label="枪口位与按钮位的 169 类起手牌开池建议"><tbody>${rows}</tbody></table></div>
    <p>按 1,326 种花色组合计，枪口位开池 ${earlyStats.combos} 种（${earlyStats.percent.toFixed(1)}%），按钮位开池 ${buttonStats.combos} 种（${buttonStats.percent.toFixed(1)}%）。枪口位身后还有五人；按钮位身后只有两盲，被跟注后还能在翻牌后最后行动。抽水越高，或身后玩家越常再加注，范围边缘越值得重估。<cite data-source="six-max"></cite></p>
    <p><strong>用 <cash-hand>76s</cash-hand> 练习。</strong>这两张牌同花且相连。在这个预设中，前面全弃时，枪口位弃牌，按钮位可以开池。仍坐在按钮位，若关煞位（CO）已加到 ${ENTRY_METADATA.openerSizeBB} BB，紧凶预设又回到弃牌。打开下列场景，可在完整矩阵里换成 <cash-hand>55</cash-hand> 或 <cash-hand>KJo</cash-hand> 再比较一次。</p>
    <nav class="cash-matrix-links" aria-label="在完整矩阵中对照 76s">
      ${link("UTG", "unopened", "76s · 枪口位开池范围")}
      ${link("BTN", "unopened", "76s · 按钮位开池范围")}
      ${link("BTN", "raised", "76s · 按钮面对 CO 加注")}
    </nav>
  </figure>`;
}
