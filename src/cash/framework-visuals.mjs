// Static reading aids: links work from local files and with JavaScript disabled.
export function frameworkMap() {
  const evidence = [
    ["framework-ranges", "范围", "这条行动线里还可能有什么牌"],
    ["framework-position", "位置", "谁先行动，谁能选择免费看牌"],
    ["framework-price", "价格", "此刻要付多少，能争多少"],
    ["framework-stacks", "筹码", "还剩多少筹码与下注机会"],
  ];
  return `<figure class="framework-map" aria-label="决策框架">
    <div class="framework-objective"><strong>比较各行动的期望值</strong><span>从当前决定算起，包含后续投入与收益</span></div>
    <div class="framework-evidence">${evidence.map(([id, title, text]) => `<a href="#${id}"><strong>${title}</strong><span>${text}</span></a>`).join("")}</div>
    <div class="framework-choices"><a href="#framework-actions"><strong>行动</strong><span>比较过牌、跟注与各个下注尺寸，并准备对方跟注或加注后的计划</span></a>
      <a href="#framework-adjustments"><strong>调整</strong><span>用新公共牌和对手的实际表现，重新检查范围与计划</span></a></div>
  </figure>`;
}

export function riverComparison() {
  const pot = 100;
  const bet = 50;
  const responses = [
    { label: "较弱牌弃掉", chance: 0.7, outcome: pot, kind: "fold" },
    { label: "较弱牌跟注", chance: 0.1, outcome: pot + bet, kind: "call" },
    { label: "较强牌跟注", chance: 0.2, outcome: -bet, kind: "loss" },
  ];
  const check = (responses[0].chance + responses[1].chance) * pot;
  const wager = responses.reduce((total, row) => total + row.chance * row.outcome, 0);
  return `<figure class="framework-ev" aria-labelledby="framework-ev-title">
    <figcaption id="framework-ev-title">同一范围，两条路线</figcaption>
    <div class="framework-ev-options">
      <div><strong>随后过牌</strong><p>80% 的范围比你弱，免费摊牌。</p><b>EV = 80% × 100 = ${check}</b></div>
      <div><strong>下注 50</strong><ol>${responses.map(row =>
        `<li><span>${row.chance * 100}% · ${row.label}</span><b class="${row.kind}">${row.outcome > 0 ? "+" : "−"}${Math.abs(row.outcome)}</b></li>`).join("")}</ol><b>EV = 70 + 15 − 10 = ${wager}</b></div>
    </div>
    <p>题设忽略抽水、平局和加注。这里过牌比下注平均多赢 ${check - wager}；对手用较弱牌跟注的比例增加时，再比较这两条路线。</p>
  </figure>`;
}
