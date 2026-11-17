import { ENTRY_METADATA, getEntryStrategy } from "../ranges.mjs";

const spots = [
  { scenario: "unopened", label: "前面全弃", raise: "开池" },
  { scenario: "limped", opponent: "CO", label: "CO 平跟 1 BB", raise: "隔离加注" },
  { scenario: "raised", opponent: "CO", label: "CO 加到 2.5 BB", raise: "再加注" },
  { scenario: "raised", opponent: "UTG", label: "UTG 加到 2.5 BB", raise: "再加注" },
];

// Reuse the ranges tool's actual preset and open the exact cell discussed in the lesson.
export function entryDrill() {
  const hands = ["55", "76s", "KQo", "AQo"];
  const rows = spots.map(spot => {
    const range = getEntryStrategy("tag", "BTN", spot.scenario, spot.opponent);
    const cells = hands.map(hand => {
      const action = range.raise.has(hand) ? spot.raise : range.call.has(hand) ? "跟注" : "弃牌";
      const params = new URLSearchParams({ position: "BTN", style: "tag", scenario: spot.scenario, hand });
      if (spot.opponent) params.set("opponent", spot.opponent);
      const href = "ranges.html?" + params.toString().replaceAll("&", "&amp;");
      return `<td><a href="${href}" aria-label="${spot.label}，按钮位 ${hand}：${action}，查看完整矩阵">${action}</a></td>`;
    }).join("");
    return `<tr><th scope="row">${spot.label}</th>${cells}</tr>`;
  }).join("");
  return `<figure class="entry-drill cash-range" id="entry-drill">
    <figcaption><h3>按钮位选牌练习</h3></figcaption>
    <p>六人桌，有效筹码 ${ENTRY_METADATA.effectiveStackBB} BB，无前注或跨注。把前面的行动依次换成全弃、CO 平跟、CO 开池、枪口位开池。在每种情况下，给 ${hands.map(hand => `<cash-hand>${hand}</cash-hand>`).join("、")} 各选一个动作，再打开对照表。每格都可以进入对应的完整矩阵。s 表示同花，o 表示非同花。</p>
    <details><summary>查看四种场景的建议</summary>
    <div class="cash-data-scroll" role="region" aria-label="按钮位翻前行动对照，可横向滚动" tabindex="0"><table>
      <caption>按钮位 · 本站紧凶训练预设</caption>
      <thead><tr><th scope="col">前面行动</th>${hands.map(hand => `<th scope="col">${hand}</th>`).join("")}</tr></thead>
      <tbody>${rows}</tbody></table></div>
    <p>先横向看 CO 加注那一行：<cash-hand>76s</cash-hand> 和 <cash-hand>55</cash-hand> 要付同样的价格，预设却给了不同的动作。再纵向看 <cash-hand>KQo</cash-hand>：只把加注者从 CO 改成枪口位，继续的理由就弱了。回到实战，还要判断这名对手实际从该位置开哪些牌，以及两盲会不会再加注。</p>
  </details></figure>`;
}
