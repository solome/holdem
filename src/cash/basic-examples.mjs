export const basicExamples = {
  "draw-price": {
    title: "听花跟注的期望值",
    question: "还差一张梅花，最后 20 要不要跟？",
    hand: "Ac 3c",
    board: "Kc 7d 4s Jc",
    seats: [{ personId: "juyipeng" }, { personId: "kelin" }],
    stages: [
      { street: "转牌", line: "底池原有 50。{p1}下注 20，你只剩 20，跟注就会全下。", pot: "70" },
    ],
    decision: "转牌",
    given: "假设河牌只有九张梅花能赢，跟注后直接摊牌。",
    amounts: [["跟注成本", "20"], ["跟注后底池", "90"], ["保本胜率", "22.2%"]],
    action: "按题设弃牌。",
    reason: "六张牌已知，击中概率为 9 ÷ 46 ≈ 19.6%，低于跟注所需的 20 ÷ 90。跟赢净得 70，跟输损失 20，所以跟注 EV = (9 × 70 − 37 × 20) ÷ 46 ≈ −2.4。",
  },

  "implied-price": {
    title: "成花后的额外收益",
    question: "转牌跟 100，成花后还要多赢多少？",
    hand: "Ks Js",
    board: "As 7s 4c 8c",
    seats: [{ personId: "juyipeng" }, { personId: "minmin" }],
    stages: [
      { street: "转牌", line: "双方各有 500。{p1}向 180 的底池下注 100。按对方在翻牌击中顶对 A 来估算。", pot: "280" },
    ],
    decision: "转牌",
    given: "假设只有九张黑桃能赢，河牌没中就放弃，成花时可以再下注。",
    amounts: [["跟注成本", "100"], ["跟注后双方各剩", "400"], ["成花时平均还需多赢", "约 131"]],
    action: "先估计河牌能收到多少跟注。",
    reason: "每 9 次成花对应约 37 次损失 100，成花时需平均净赢约 411 才打平。眼前只有 280，还差约 131。假如你成花后总能下注 200，对手需要有约三分之二的机会跟注，才足以补回转牌的成本。",
  },

  "side-pot-outs": {
    title: "短筹码争主池",
    question: "两人都全下，你只剩 50，能争多大的池？",
    hand: "Ah As",
    board: "Ac Jc 8c 4c",
    seats: [{ personId: "juyipeng" }, { personId: "tengteng" }, { personId: "xingxing" }],
    stages: [
      { street: "转牌", line: "原底池 150。{p1}推入 200，{p2}用仅剩的 100 跟到全下。你有三条 A，最多只能跟 50。" },
    ],
    decision: "转牌",
    given: "假设两人都已成普通同花，河牌有十张牌能让你独赢。",
    amounts: [["跟注成本", "50"], ["眼前可赢", "250"], ["保本胜率", "16.7%"]],
    action: "按两家都是普通同花估算，可以跟。",
    reason: "你只能争原池 150 加两家各 50，跟后主池共 300。{p1}和{p2}各多出的 50 组成边池。剩余 100 无人跟注，退还给{p1}。河牌一张 A 可成四条，各三张 J、8、4 可成葫芦。按题设把这十张都算作胜牌，10 ÷ 46 ≈ 21.7%，高于主池给的门槛。",
  },

  "straight-outs": {
    title: "Q♠ 10♠ 的补牌",
    question: "K 或 9 都能成顺，手里的黑桃怎样算？",
    hand: "Qs Ts",
    board: "As Js 8c",
    seats: [{ personId: "juyipeng", position: "中位" }, { personId: "wangwang", position: "后位" }],
    stages: [
      { street: "翻牌前", line: "你在中位加注，后位的{p1}跟注。" },
      { street: "翻牌", line: "你过牌，{p1}下注。先估计对手可能拿什么，再数能反超的牌。" },
    ],
    decision: "翻牌",
    amounts: [["能成顺的牌", "8 张"], ["能成花的牌", "9 张"], ["去除重叠后", "15 张"]],
    action: "按眼前花色去重，再考虑对手能否反超。",
    reason: "翻牌有两张黑桃，加上两张底牌黑桃，下一张黑桃就能成花。K♠、9♠ 同时补顺和补花，各只算一次。若翻牌只有一张黑桃，则必须转牌、河牌连续发黑桃才能成花，不能算作九张直接补牌。这里的 15 张能组成顺子或同花，遇到更高同花、或对手随后补成葫芦，仍可能输。没有下注金额，无法判断跟注价格。",
  },

  "semi-bluff": {
    title: "同花听牌半诈唬",
    question: "同花听牌在翻牌下注，赢池的机会来自哪里？",
    hand: "Ac Tc",
    board: "Kc 7c 2s",
    seats: [{ personId: "juyipeng" }, { personId: "jianjian" }],
    stages: [
      { street: "翻牌", line: "你和{p1}单挑，正考虑用梅花听牌半诈唬。先估计对手面对下注会弃多少，再估计被跟注时能赢多少。" },
    ],
    decision: "翻牌",
    given: "假设对手有 30% 的机会弃牌。被跟时，你有十二张干净补牌，保证能看到河牌，用两街约 44% 的命中率估算。",
    amounts: [["假定对手弃牌", "30%"], ["被跟后赢牌机会", "约 44%"], ["两种途径合计", "约 60.8%"]],
    action: "可以考虑半诈唬，下注额也要算进去。",
    reason: "十二张胜牌包括九张梅花和三张非梅花 A。两种途径合计为 30% + 70% × 44% = 60.8%。这是赢池概率；下注输了多少、被加注后能否继续，都会影响下注的期望值。",
  },

  "price-the-draw": {
    title: "9♠ 7♠ 的跟注价格",
    question: "20 的底池只下注 4，给了听牌什么价格？",
    hand: "9s 7s",
    board: "Ks Qd Tc 6s 8c",
    seats: [
      { personId: "juyipeng", position: "CO" }, { personId: "minmin", position: "BTN" },
      { personId: "tengteng", position: "SB" }, { personId: "kelin", position: "BB" },
    ],
    stages: [
      { street: "翻牌前", line: "盲注 2/4。前面弃到你，你加到 8。按钮位的{p1}弃牌，小盲{p2}跟注，大盲{p3}弃牌。", pot: "20", folded: [1, 3] },
      { street: "翻牌", line: "小盲过牌，你随后过牌。此时只有 J 能马上补成顺子。", pot: "20", folded: [1, 3] },
      { street: "转牌", line: "小盲下注 4。现在 J 或 8 都能补顺，你还多了黑桃同花听牌，轮到你决定。", pot: "24", folded: [1, 3] },
      { street: "河牌", line: "你在转牌跟了 4，河牌开始时底池 28。小盲过牌，你成顺后下注 16，小盲跟注。", pot: "60", folded: [1, 3] },
    ],
    decision: "转牌",
    amounts: [["跟注成本", "4"], ["跟注后底池", "28"], ["保本胜率", "14.3%"]],
    action: "这个小注给了你继续听牌的价格。",
    reason: "先只看八张顺子补牌，河牌成顺约 17.4%，已高于 4 ÷ 28。此外，转牌还有九张黑桃能成花，其中 J♠、8♠ 与顺子重叠。成牌可能平分或遇上更大牌。若对手改下 12，跟注门槛升至 12 ÷ 44 ≈ 27.3%，要结合他的范围重新判断。",
    showdown: { seat: 2, hand: "Ts 9c", note: "河牌 8♣ 让你用 6、7、8、9、10 组成顺子。{p2}的一对 10 落败，你收下 60 的底池。转牌作决定时，这两张对手底牌仍是未知的。" },
  },
};
