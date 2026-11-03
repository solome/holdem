const SUIT_IDS = { s: "spades", h: "hearts", c: "clubs", d: "diamonds" };

export function parseHandbookCards(tokens) {
  const values = String(tokens).trim().split(/\s+/);
  if (!tokens || !values.length) throw new Error("Missing handbook cards");
  const cards = values.map((token) => {
    const match = /^(10|[2-9TJQKA])([shcd])$/.exec(token);
    if (!match) throw new Error(`Invalid handbook card: ${token}`);
    return { rank: match[1] === "T" ? "10" : match[1], suit: SUIT_IDS[match[2]] };
  });
  if (new Set(cards.map(({rank, suit}) => `${rank}:${suit}`)).size !== cards.length)
    throw new Error("Duplicate handbook card");
  return cards;
}

export function handbookHandTokens(hand) {
  const match = /^(10|[2-9TJQKA])(10|[2-9TJQKA])([so])$/.exec(hand);
  if (!match || match[1] === match[2]) throw new Error(`Invalid handbook hand: ${hand}`);
  return `${match[1]}s ${match[2]}${match[3] === "s" ? "s" : "h"}`;
}

export function renderHandbookCards(tokens, renderCard, className = "") {
  const cards = parseHandbookCards(tokens);
  return `<span class="handbook-card-group ${className}">${cards.map((value, index) => renderCard(value, { fan: false, index, count: cards.length })).join("")}</span>`;
}

function positionFigure() {
  const seats = [
    [124, 62, "UTG", "最先行动"], [350, 62, "HJ", "中间位置"],
    [483, 167, "CO", "关煞位"], [350, 270, "BTN", "按钮位"],
    [124, 270, "SB", "小盲"], [36, 167, "BB", "大盲"],
  ];
  return `<figure class="handbook-figure"><div class="handbook-position-grid"><svg class="handbook-position-svg" viewBox="0 0 600 340" role="img" aria-labelledby="handbook-position-caption"><rect x="102" y="95" width="388" height="154" rx="77" fill="#e1e9da" stroke="#9bad8d"/><rect x="117" y="110" width="358" height="124" rx="62" fill="#28513d"/><text x="296" y="160" text-anchor="middle" fill="#fffdf3" font-size="21">位置越靠后，信息越多</text><text x="296" y="190" text-anchor="middle" fill="#d4e0ce" font-size="14">翻前顺序 UTG → HJ → CO → BTN → SB → BB</text>${seats.map(([x, y, label, name]) => `<g transform="translate(${x} ${y})"><rect width="96" height="54" x="-30" y="-22" rx="8" fill="${label === "BTN" ? "#e9dbb7" : "#fffdf7"}" stroke="${label === "BTN" ? "#ab8b45" : "#c5cfbc"}"/><text x="18" text-anchor="middle" font-size="16" font-weight="600" fill="#254a36">${label}</text><text x="18" y="20" text-anchor="middle" font-size="12" fill="#5b6953">${name}</text></g>`).join("")}</svg><div class="handbook-mobile-positions"><strong>翻前行动顺序</strong><ol>${seats.map(([, , label, name], index) => `<li><span>${index + 1}</span><b>${label}</b><small>${name}</small></li>`).join("")}</ol></div><div class="handbook-figure-copy"><strong>先看位置，再看牌。</strong><p>按钮位翻后通常最后行动；小盲即使翻前较晚，翻后仍先行动。大盲已投入筹码，也不代表必须守住每一手。</p></div></div><figcaption id="handbook-position-caption">图 1 · 六人桌位置示意。九人桌增加前位，应相应收紧前位范围；图中不代表具体开池范围。</figcaption></figure>`;
}

export const CASE_86_COMPLETIONS = {
  straight: "4s 4h 4c 4d 9s 9h 9c 9d",
  otherFlush: "As Ks Qs Js 10s 7s 3s",
};

const figure = (title, body, caption, level = 3) => `<figure class="handbook-figure"><h${level} class="handbook-visual-title">${title}</h${level}>${body}<figcaption>${caption}</figcaption></figure>`;
const arrow = '<span class="handbook-connector" aria-hidden="true">→</span>';
const node = (label, body, extra = "") => `<div class="handbook-diagram-node ${extra}"><strong>${label}</strong>${body ? `<p>${body}</p>` : ""}</div>`;

export function createHandbookVisuals(renderCard) {
  const cards = (tokens, extra = "") => renderHandbookCards(tokens, renderCard, extra);
  const board = (label, tokens) => `<div class="handbook-board-group"><span class="handbook-deal-label">${label}</span>${cards(tokens)}</div>`;
  const stage = (title, tokens, decision, extra = "") => `<div class="handbook-case-stage ${extra}"><span class="handbook-stage-title">${title}</span>${tokens ? cards(tokens) : ""}<p>${decision}</p></div>`;

  function edgeHands() {
    return figure("同花与非同花，先看清两张牌的差别", `<div class="handbook-hand-comparison">${[
      ["95", "9h 5h", "9h 5c", "按钮位、两盲过紧时才考虑扩张；95o 通常放弃。"],
      ["J8", "Js 8s", "Jh 8c", "同花更易继续；击中 J 后仍要警惕更好踢脚。"],
      ["86", "8c 6c", "8d 6s", "相隔一点的同花牌可玩性更好，仍需位置和价格。"],
    ].map(([rank, suited, offsuit, text]) => `<div class="handbook-comparison-row"><div><span class="handbook-deal-label">${rank}s · 同花</span>${cards(suited)}</div><div><span class="handbook-deal-label">${rank}o · 非同花</span>${cards(offsuit)}</div><p>${text}</p></div>`).join("")}</div>`, "每组只展示一组代表花色，不是全部组合，也不是无条件入池范围。同花牌同样可能被更高同花支配。", 4);
  }

  function preflop() {
    return figure("前面的行动变了，决策的起点也要变", `<div class="handbook-decision-tree"><div class="handbook-tree-root">先确认：位置 · 有效筹码 · 对手</div><div class="handbook-tree-branches"><div>${node("无人入池", "按自己位置选择开池范围")}${arrow}${node("加注或弃牌", "边缘组合先有扩张依据", "handbook-node-action")}</div><div>${node("有人跛入", "看能否隔离，以及是否有位置")}${arrow}${node("隔离 / 谨慎继续 / 弃牌", "多人仍跟时，减少纯偷池", "handbook-node-action")}</div><div>${node("有人加注", "从开池者的范围重新判断")}${arrow}${node("跟注 / 3-bet / 弃牌", "价格和后面未行动玩家一起算", "handbook-node-action")}</div></div></div>`, "示意为决策顺序；不是每种手牌都同时拥有三个选项。已经开池，也可以在面对 3-bet 时弃牌。");
  }

  function streets() {
    return figure("四条街，都保留继续与停止的分支", `<div class="handbook-street-road">${[
      ["翻前", "位置与范围", "不适合入池 → 弃牌"],
      ["翻牌", "范围与下注目的", "目标不足 → 比较过牌"],
      ["转牌", "按新牌更新范围", "理由消失 → 减少投入"],
      ["河牌", "支付目标或弃牌目标", "被加注 → 重算范围与价格"],
    ].map(([name, action, exit], index) => `<div class="handbook-street-stop"><span class="handbook-road-dot">${index + 1}</span><strong>${name}</strong><span>${action}</span><p>${exit}</p></div>`).join("")}</div>`, "横线表示行动顺序；下方是每一街的退出或重新评估条件。上一街的投入不能替下一街作决定。");
  }

  function case86() {
    return figure("86s：听牌变强，并不等于必须继续下注", `${board("BTN 手牌", "8s 6s")}<div class="handbook-case-timeline">${stage("翻牌 · 底池 5.5 BB", "Kc 7d 2s", "有位置、后门潜力；对过度弃牌者可小注，也可过牌。")}${stage("转牌 · 翻牌下注被跟", "5s", "同花＋两头顺子听牌；可评估半诈唬，保留过牌分支。", "handbook-stage-improved")}${stage("河牌 · 未成牌示例", "Qh", "面对黏性对手，停止投入；不要为了三枪继续。")}</div><details class="handbook-outs"><summary>展开补牌图：顺子与同花有两张重叠</summary><div class="handbook-outs-row"><strong>4 或 9：8 张补顺牌</strong>${cards(CASE_86_COMPLETIONS.straight)}</div><div class="handbook-outs-row"><strong>其余 7 张黑桃：补同花</strong>${cards(CASE_86_COMPLETIONS.otherFlush)}</div><p>两张黑桃补顺牌已在第一组，只计一次。两组共 15 张不同的补牌；补成非坚果牌仍可能输，这不是胜率计算。</p></details>`, "按原牌例的无抽水教学分支展示；转牌仍需评估对手继续范围。补牌图排除已知手牌与公共牌。", 4);
  }

  function caseJ8() {
    return figure("J8s：同一个顶对，面对两条不同的行动线", `<div class="handbook-board-pair">${board("你在 BB", "Js 8s")}${board("翻牌 · 三人底池 9.5 BB", "Jd 9c 4h")}</div><div class="handbook-split"><div><span class="handbook-branch-label">分支 A · 对手继续施压</span><div class="handbook-action-line"><span>BB 过牌</span>${arrow}<span>CO 下 6 BB</span>${arrow}<span>BTN 跟注</span></div>${node("重新评估，允许弃牌", "弱踢脚顶对面对两人继续，不套用单挑跟到底。", "handbook-node-stop")}</div><div><span class="handbook-branch-label">分支 B · 翻牌全过</span>${board("转牌", "2c")}<div class="handbook-action-line"><span>BB 下 3.5 BB</span>${arrow}<span>CO 弃 / BTN 跟</span></div>${node("先找更差牌的支付", "9x、口袋对子若不跟，过牌也合理。河牌再更新范围。", "handbook-node-action")}</div></div>`, "两条行动线互为替代，不连续发生。均为教学推演；对手范围与下注倾向决定最终选择。", 4);
  }

  function case95() {
    return figure("95s：开池的依据，不能替代面对反击的依据", `${board("BTN 手牌", "9h 5h")}<div class="handbook-action-steps"><div><span>1 · 原计划</span><strong>BTN 加至 2.5 BB</strong><p>两盲在类似机会中经常弃牌</p></div><div><span>2 · 新信息</span><strong>BB 3-bet 至 11 BB</strong><p>面对的已是对手再加注范围</p></div><div class="handbook-action-stop"><span>3 · 新决定</span><strong>通常弃牌</strong><p>对正常或偏紧 BB，删去边缘继续</p></div></div><div class="handbook-price-bar" aria-label="跟注后22.5BB底池由当前14BB和需补8.5BB组成"><span style="flex:14">当前底池<br><b>14 BB</b></span><span style="flex:8.5">需补<br><b>8.5 BB</b></span></div><p class="handbook-formula">8.5 ÷ (14 + 8.5) ≈ <strong>37.8%</strong>，是价格门槛，不是手牌权益。</p>`, "假设无抽水、SB 已弃牌。前两街仍有后续下注与权益实现问题；一次合理偷盲可以以弃牌结束。", 4);
  }

  function psychologyScene() {
    return figure("对手开始宽跟，你的进攻也要换一种方式", `<div class="handbook-table-scene"><div class="handbook-scene-player"><span class="handbook-player-disc">你</span><strong>近期形象较松</strong><p>连续开池，或诈唬被看到</p></div><div class="handbook-scene-link"><span>重复观察到</span><svg viewBox="0 0 180 48" aria-hidden="true"><path d="M8 24H164m-12-10 12 10-12 10" fill="none" stroke="currentColor" stroke-width="2"/></svg><strong>更弱的一对也跟注</strong></div><div class="handbook-scene-player"><span class="handbook-player-disc handbook-player-opponent">对手</span><strong>可能调宽防守</strong><p>只对会观察、会调整的人成立</p></div></div><div class="handbook-adjustment"><div><span aria-hidden="true">↓</span><strong>减少最弱纯诈唬</strong><p>原先依赖的弃牌率可能下降</p></div><div><span aria-hidden="true">↑</span><strong>增加合理价值下注</strong><p>让实际愿意跟注的更差牌支付</p></div></div><p class="handbook-visual-counter">反例：对手也可能只是连续拿到牌。比较相似位置、尺寸和牌面；发现防守恢复时撤回调整。</p>`, "图中只有行动证据与待验证假设，没有推定对手的内心。反复观察并不自动等于统计显著。", 4);
  }

  function loop() {
    return figure("观察、假设、调整之后，还要回到证据", `<ol class="handbook-evidence-loop">${[
      ["观察", "记相似场景的行动与摊牌"], ["假设", "写出暂时的范围或弃牌倾向"],
      ["调整", "只小幅改变一个主要变量"], ["复核", "找反例，再更新原有假设"],
    ].map(([name, text], i) => `<li><span>${i + 1}</span><strong>${name}</strong><p>${text}</p></li>`).join("")}</ol>`, "观察循环是本手册的训练建议。记录可比较的机会数，避免只记住符合印象的牌局。");
  }

  function odds() {
    return figure("跟注门槛：分母包含你即将补入的筹码", `<div class="handbook-pot-composition"><div class="handbook-pot-part"><span class="handbook-chip-stack" aria-hidden="true"></span><strong>原底池 100</strong></div><div class="handbook-pot-part"><span class="handbook-chip-stack handbook-chip-bet" aria-hidden="true"></span><strong>对手下注 50</strong></div><div class="handbook-pot-part"><span class="handbook-chip-stack handbook-chip-call" aria-hidden="true"></span><strong>你跟注 50</strong></div></div><div class="handbook-total-pot"><span>跟注后总池 200</span><div class="handbook-price-bar"><span style="flex:100">100</span><span style="flex:50">50</span><span style="flex:50">50</span></div></div><p class="handbook-formula">跟注门槛 = 50 ÷ 200 = <strong>25%</strong></p>`, "简化为无抽水、无后续下注、可争夺整个底池的情境。这个门槛不表示你的牌已经拥有 25% 权益。", 4);
  }

  return { position: positionFigure, edgeHands, preflop, streets, case86, caseJ8, case95, psychologyScene, loop, odds };
}
