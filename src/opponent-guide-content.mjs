export const OPPONENT_SOURCES = {
  ranges: "https://www.pokerstars.com/poker/learn/strategies/how-to-think-about-hand-ranges-in-poker/",
  catching: "https://blog.gtowizard.com/the-art-of-bluff-catching-2/",
  tells: "https://www.pokerstars.com/poker/learn/strategies/spot-giveaway-tells-live-online/",
};

export const OPPONENT_SECTIONS = [
  {
    id: "habits",
    number: "01",
    title: "观察习惯：从反复的选择认识对手",
    summary: "记住他怎样入池、在哪一街继续，以及摊牌时亮出了什么。",
    body: `
      <p>河牌大注推到面前，先问：这个人会拿哪些牌这样下注，其中有多少是自己能赢的？读人的线索，藏在他一次次作出的选择里。翻前入池很宽的人，河牌可能只拿强牌下注；平时寡言的人，也可能常用错过听牌诈唬。把这些习惯逐项记清，眼前这次下注才有了来路。</p>
      <div class="handbook-table-scroll"><table><caption>先观察四类习惯</caption><thead><tr><th scope="col">观察什么</th><th scope="col">怎样记得具体</th><th scope="col">怎样用于下一手</th></tr></thead><tbody>
      <tr><th scope="row">入池选择</th><td>早位开池与按钮偷盲分别看；记录平跟、3-bet 与面对加注的继续牌。</td><td>建立本手翻前起点，分清他在哪些位置会有弱牌。</td></tr>
      <tr><th scope="row">连续开火</th><td>分别记翻牌下注、转牌继续、河牌第三枪；看错过听牌最后怎样处理。</td><td>判断他的进攻会在哪一街收紧，哪些牌能够走到河牌。</td></tr>
      <tr><th scope="row">下注尺寸</th><td>小注、大注、超池与加注分别记录，附上牌面和当时人数。</td><td>比较同一个人用不同尺寸时展示过什么牌。</td></tr>
      <tr><th scope="row">摊牌习惯</th><td>记下主动亮出的牌、被跟注后的牌，以及此前的完整行动。</td><td>找出他会拿多薄的牌取价值，又会把哪些弱牌转成诈唬。</td></tr>
      </tbody></table></div>
      <h3>把印象写成有来由的记录</h3>
      <p>“他爱诈唬”可以改成：“单挑时，他会把错过的同花听牌打成河牌大注；多人底池还没见过。”下次再遇到相近场景，就能沿着这条记录，检查对应的那部分范围。</p>
      <p>“他很老实”也可以写得更有用：“他用较弱一对经常过牌，转河牌大加注摊出过两对和暗三条。”以后沿着同样的下注线继续观察，把新出现的诈唬也补进记录。对一个人的认识，就这样慢慢有了细节。</p>
      <div class="handbook-principle"><strong>先读行动，再读这个人的习惯。</strong><p>位置、牌面与下注线给出候选牌；个人习惯帮助调整这些牌出现的分量。轮到自己时，再把跟注价格放进来。</p></div>
    `,
  },
  {
    id: "range",
    number: "02",
    title: "沿街读牌：顺着下注线寻找来路",
    summary: "一张新牌、一次下注，都会改变候选牌在范围中的分量。",
    body: `
      <p><a href="${OPPONENT_SOURCES.ranges}">PokerStars 的范围阅读文章</a>从位置和翻前行动建立起点，再沿翻后行动缩小范围。练习时，可以先在脑中摆出三堆牌：强价值牌、愿意控池的中等牌、听牌与空气，再看每次行动怎样改变它们的分量。</p>
      <figure class="handbook-figure"><ol class="reading-street-flow"><li><span>翻牌前</span><strong>从哪里、怎样入池</strong><p>开池、跟注或再加注，各自留下哪些牌？</p></li><li><span>翻牌</span><strong>这张牌面帮了谁</strong><p>哪些强牌、弱成牌和听牌会用这个尺寸？</p></li><li><span>转牌</span><strong>谁还愿意继续</strong><p>新牌完成了什么，谁会继续大额投入？</p></li><li><span>河牌</span><strong>谁取价值，谁诈唬</strong><p>哪些候选牌真正走完了前面的下注线？</p></li></ol><figcaption>沿街更新：保留合理的慢打强牌，同时减少不符合前序行动的候选牌。</figcaption></figure>
      <h3>追问每手牌怎样走到这里</h3>
      <p>河牌落下第三张同花，先沿原路回看：对手翻前会不会拿这些同花牌入池？翻牌会不会用听牌下注或跟注？转牌的价格是否允许他继续？错过听牌也要走过同样的路，才能被放进河牌的诈唬范围。</p>
      <p>遇到过牌，为愿意控池的牌增加分量，同时留住他可能慢打的强牌；遇到连续大注，便筛出愿意继续取价值的强牌和愿意继续施压的诈唬。某一街突然换了尺寸，就停在这里，看哪些牌最能解释这个转折。</p>
      <h3>也看看他眼中的你</h3>
      <p>你连续两次过牌跟注后，对手可能把你放在一对和听牌上。他若会向这些牌施压，就有继续诈唬的动机；他若觉得你不肯弃顶对，可能只用更强牌下注。将自己的行动也放进推理，才能解释对方为何选择这个尺寸。</p>
    `,
  },
  {
    id: "value-bluff",
    number: "03",
    title: "分清两端：价值与诈唬各有来路",
    summary: "先列具体的牌，再沿前序行动检查这个人会不会这样打。",
    body: `
      <h3>先列价值牌：他希望哪类更差牌付钱</h3>
      <p>先检查牌面上的同花、顺子、暗三条和两对，再看强顶对是否会取薄价值。有人只拿很强的牌打河牌大注，有人会用顶对较弱踢脚下注。后一种人下注时，你的跟注还可能赢到一部分他自认为在取价值的牌。</p>
      <h3>再列诈唬牌：哪些弱牌愿意放弃摊牌</h3>
      <p>优先检查错过的同花听牌、顺子听牌，以及带关键阻断的弱牌。接着回看前序行动：这手牌在翻牌、转牌有继续的理由吗？这个人过去会把它打成第三枪，还是通常过牌放弃？让每一手候选牌都接得上前面的行动。</p>
      <div class="reading-range-split"><div><span>价值一端</span><h3>希望被更差牌跟注</h3><p>强成牌、会取薄价值的牌，以及与本手行动相符的慢打牌。</p></div><div><span>诈唬一端</span><h3>希望更好牌弃掉</h3><p>错过听牌、主动转成诈唬的弱牌，以及符合此前行动的空气。</p></div></div>
      <h3>看尺寸怎样改变两端的构成</h3>
      <p>面对较大河牌下注，重点比较强价值与诈唬；面对小注，把薄价值、试图便宜摊牌的阻挡下注一起纳入。对手使用大注时，检查哪些中等牌会选择过牌；突然加注时，检查哪些强牌刚刚改善，哪些弱牌有动力把你赶走。</p>
      <p>翻牌和转牌还要考虑半诈唬：对手现在落后，却能在后续公共牌改善。此时把自己手牌的改善机会、后续下注压力与位置一起考虑；到了河牌，才按最终摊牌强弱直接比较。</p>
    `,
  },
  {
    id: "price",
    number: "04",
    title: "算清价格：这一跟，需要赢多少次",
    summary: "列好候选范围后，再看它能否支持眼前的跟注价格。",
    body: `
      <p>单挑河牌，你最后行动，面对下注并准备跟注时，先算：<strong>所需权益 = 需补金额 ÷ 跟注后可争夺的底池</strong>。无抽水时，原底池为 P、对手下注 B，门槛就是 B ÷（P + 2B）。</p>
      <div class="handbook-table-scroll"><table class="reading-compact-table"><caption>河牌单挑面对首次下注的价格</caption><thead><tr><th scope="col">对手下注 / 原底池</th><th scope="col">跟注所需权益</th></tr></thead><tbody><tr><th scope="row">1/3 底池</th><td>20%</td></tr><tr><th scope="row">1/2 底池</th><td>25%</td></tr><tr><th scope="row">3/4 底池</th><td>30%</td></tr><tr><th scope="row">1 倍底池</th><td>33.3%</td></tr><tr><th scope="row">2 倍底池</th><td>40%</td></tr></tbody></table></div>
      <h3>诈唬占多少，才值得跟</h3>
      <p>如果你赢全部诈唬、输全部价值牌，并且没有平局，那么对手下注范围中的诈唬占比，就是你的获胜概率。例如，底池 100，对手下注 50，跟注门槛为 50 ÷ 200 = 25%。</p>
      <div class="handbook-example"><h3>组合练习 · 同样的牌，面对不同的人</h3><p>先给对手保留 12 个价值组合，并让候选组合按相同频率下注。</p><ul><li><strong>2 个诈唬组合：</strong>你赢 2 ÷ 14 ≈ 14.3%，低于 25%，弃牌。</li><li><strong>4 个诈唬组合：</strong>你赢 4 ÷ 16 = 25%，跟注与弃牌的增量期望收益相同。</li><li><strong>6 个诈唬组合：</strong>你赢 6 ÷ 18 ≈ 33.3%，高于 25%，跟注。</li></ul><p>如果其中一手听牌只偶尔诈唬，就相应降低它的分量；若他会用你能赢的较弱成牌取价值，再把这些获胜情况加入计算。</p></div>
      <p>Andrew Brokos 在 <a href="${OPPONENT_SOURCES.catching}">GTO Wizard 的抓诈唬文章</a>中，重点比较能否击败部分价值牌、阻断效果与对手的诈唬频率。实际决策时先检查这个人的下注构成，再挑自己适合继续的手牌。</p>
    `,
  },
  {
    id: "blockers",
    number: "05",
    title: "挑选手牌：看清两张牌挡住了什么",
    summary: "同时检查被排除的价值组合，以及自己希望保留的诈唬。",
    body: `
      <p>看过对手的行动，再低头看自己的两张牌：它们也在改变眼前的范围。关键同花牌可能挡住对手的强同花，错过听牌的关键牌也可能挡住你希望他持有的诈唬。选抓诈唬牌时，把这两个方向一起检查。</p>
      <div class="handbook-example"><h3>比较练习 · 同样顶对，黑桃的作用不同</h3><p>公共牌为 <span data-reading-cards="Ks 9s 4d 2c 8h">K♠ 9♠ 4♦ 2♣ 8♥</span>，对手连续下注。比较 <span data-reading-cards="Kh Qc">K♥ Q♣</span> 与 <span data-reading-cards="Kh Qs">K♥ Q♠</span>。</p><p>两手都是 K 顶对、Q 踢脚。持有 Q♠ 时，对手便没有 Q♠J♠、Q♠T♠、A♠Q♠ 这些两张黑桃的错过同花听牌。如果他会拿这些组合打第三枪，你手中的 Q♠ 就减少了能抓到的诈唬。</p><p>继续看他实际会用哪些价值牌和诈唬下注，再比较两手的整体效果。换成第三张黑桃落下的河牌时，Q♠ 又会减少对手一部分同花，读牌方向随之改变。</p></div>
      <h3>用三个问题完成阻断检查</h3>
      <ol><li>我拿掉了哪些会用这个尺寸下注的价值组合？</li><li>我同时拿掉了哪些会沿这条线诈唬的组合？</li><li>比较剩下的两端后，当前价格还值得跟注吗？</li></ol>
      <p>同样是一对，面对不同的下注范围，适合抓诈唬的花色也会变化。把具体组合写下来，看自己的牌让哪一端变轻、哪一端保留下来，再决定这次跟注。</p>
    `,
  },
  {
    id: "tells",
    number: "06",
    title: "观察言行：留意熟悉节奏里的变化",
    summary: "先熟悉一个人平时的样子，再把变化与下注、摊牌连起来看。",
    body: `
      <p><a href="${OPPONENT_SOURCES.tells}">PokerStars 的行为线索文章</a>强调，先了解一个人平时怎样表现，再看偏离。自己弃牌后，正好留一点注意力给桌上的人：他平时出手快慢如何，强牌下注后怎样坐着，愿意说多少话，面对跟注与加注时又有什么变化。</p>
      <div class="handbook-table-scroll"><table><caption>把一个动作记成可继续观察的问题</caption><thead><tr><th scope="col">看到的变化</th><th scope="col">接着观察什么</th><th scope="col">怎样放进判断</th></tr></thead><tbody>
      <tr><th scope="row">突然秒跟、秒下</th><td>他是否一贯很快？是否提前想好？发生在什么牌面与尺寸下？</td><td>回看哪些牌选择简单，哪些会考虑加注，保留符合其习惯的候选。</td></tr>
      <tr><th scope="row">想很久后加注</th><td>他在计算总额、比较尺度，还是每次大动作前都这样？此前摊出了什么？</td><td>先列本街改善的强牌，再找能走到这里的诈唬。</td></tr>
      <tr><th scope="row">突然沉默、变健谈</th><td>与他平时相比变化多大？是在下注前还是下注后？</td><td>记录原话和时点，摊牌后与同类情境一起看。</td></tr>
      <tr><th scope="row">手抖、呼吸或姿势改变</th><td>平时是否也如此？赢大底池、拿强牌和打出大诈唬时分别怎样？</td><td>把它当作唤起注意的信号，继续核对范围、下注线和价格。</td></tr>
      <tr><th scope="row">提前拿起筹码、做出要跟的动作</th><td>后续真的跟了、加了，还是弃了？相同动作重复时有什么牌？</td><td>根据自己的价值目标和诈唬目标决定下注，随后补全对手的动作记录。</td></tr>
      </tbody></table></div>
      <h3>说“我没牌”时，记下他之后做了什么</h3>
      <p>有人聊天时主动示弱，有人拿着强牌反而安静下来。听到一句话，先记住它落在牌局的哪一刻，再看随后的下注和最终亮出的牌。“说了什么、下了多少、摊出什么”连在一起，这个人的表达习惯才慢慢显出轮廓。</p>
      <p>牌局记录可以写：“他平时跟注都很快；这次河牌停顿后加注，最后亮出葫芦。”以后再看到相似停顿，便重点核对牌面是否支持葫芦、前序行动如何保留这些组合。</p>
    `,
  },
  {
    id: "cases",
    number: "07",
    title: "牌例练习：把印象落到一次跟弃",
    summary: "沿每一街重走一遍，把候选牌、个人习惯和价格接起来。",
    body: `
      <div class="handbook-example"><h3>牌例一 · 错过黑桃听牌的河牌第三枪</h3><p>双方 100 BB，小盲 0.5 BB、大盲 1 BB，无前注和抽水。你在 BB 持有 <span data-reading-cards="Kh Qc">K♥ Q♣</span>。BTN 加至 2.5 BB，SB 弃牌，你跟注，底池 5.5 BB。</p>
      <div class="reading-case-road"><div><span>翻牌</span><div data-reading-cards="Ks 9s 4d">K♠ 9♠ 4♦</div><p>你过牌，BTN 下 2 BB，你跟。底池变为 <b>9.5 BB</b>。</p></div><div><span>转牌</span><div data-reading-cards="2c">2♣</div><p>你过牌，BTN 下 7 BB，你跟。底池变为 <b>23.5 BB</b>。</p></div><div><span>河牌</span><div data-reading-cards="8h">8♥</div><p>你过牌，BTN 下 <b>17.5 BB</b>，轮到你决定。</p></div></div>
      <p><strong>第一步，回看价值：</strong>AK、K9s、99、44 等牌可以进入候选。再问他是否会用 KJ 取三街价值，以及转河牌改善的强牌是否会按前面的尺寸继续。</p><p><strong>第二步，追溯诈唬：</strong>A♠Q♠、Q♠J♠、Q♠T♠、J♠T♠ 等错过同花听牌值得检查。QJ、QT、JT 在转牌都是卡顺听牌，分别等 T、J、Q；带两张黑桃时还有同花听牌。逐项判断这个人会不会继续到河牌下注。</p><p><strong>第三步，算价格：</strong>你需跟 17.5 BB，跟注后底池为 23.5 + 17.5 + 17.5 = 58.5 BB，所需权益约 <strong>29.9%</strong>。若你只赢诈唬，就比较对手下注范围里的诈唬占比是否超过这个数；他若还用你能赢的 KJ 取价值，也把这部分加入。</p><p><strong>最后，结合这个人：</strong>若他经常把错过听牌打成第三枪，就为这些诈唬保留相应分量；若他转牌爱施压、河牌常放弃，就删去没有继续下注的弱牌。一路筛到这里，再用剩下的范围决定跟弃。</p></div>
      <div class="handbook-example"><h3>牌例二 · 多人底池中的顶对弱踢脚</h3><p>你在 BB 持有 <span data-reading-cards="Jh 8h">J♥ 8♥</span>。CO 加至 3 BB，BTN 跟注，SB 弃牌，你补到 3 BB，底池 9.5 BB。翻牌 <span data-reading-cards="Jd 9c 4s">J♦ 9♣ 4♠</span>，你过牌，CO 下 6 BB，BTN 跟 6 BB。</p><p><strong>先读开火的人：</strong>CO 面对两位对手下注，检查其更强 Jx、超对、暗三条，以及 QT、T8 等顺子听牌会占多少分量。</p><p><strong>再读跟注的人：</strong>BTN 愿意继续，可能有 Jx、听牌，也保留慢打强牌。即使你领先 CO 的一部分半诈唬，还要比较 BTN 的继续范围。</p><p><strong>再读后续压力：</strong>你还需投入 6 BB，跟注后的底池为 27.5 BB；看似约 21.8% 的价格，之后仍有转牌和河牌。想清哪些后续牌还能继续，哪些牌会让你面对更大下注。对两人的强继续范围，J8 可以在翻牌结束投入。</p></div>
    `,
  },
  {
    id: "quick-check",
    number: "08",
    title: "桌边速查：从行动读到价格",
    summary: "回看入池起点与下注路径，列出两端，再决定当前价格是否值得跟。",
    body: `
      <div class="reading-quick-card"><h3>面对一次下注，按这个顺序读</h3><ol><li><strong>起点：</strong>他在哪个位置，用什么行动入池？</li><li><strong>路径：</strong>哪些牌能按此前的尺寸走到这里？</li><li><strong>价值：</strong>他想让我的哪些更差牌跟注？</li><li><strong>诈唬：</strong>哪些弱牌会下注，又希望赶走什么？</li><li><strong>自己：</strong>我赢哪些牌，挡住哪些价值和诈唬？</li><li><strong>价格：</strong>我需补多少，至少需要赢多少次？</li><li><strong>习惯：</strong>这个人的相似牌局怎样修正两端的分量？</li></ol></div>
      <h3>留一条下次用得上的笔记</h3>
      <div class="reading-note-template"><p><b>位置与人数：</b>＿＿＿＿</p><p><b>牌面与完整下注线：</b>＿＿＿＿</p><p><b>下注尺寸、动作与原话：</b>＿＿＿＿</p><p><b>摊牌看到的手牌：</b>＿＿＿＿</p><p><b>下次相似场景优先检查：</b>＿＿＿＿</p></div>
      <p>自己的牌弃掉了，这手牌仍值得看完。有人没被跟注便主动亮出诈唬，就记下“主动亮牌”；有人被跟到摊牌，就记下实际组合。分开留下这些记录，再用后来的相似牌局补齐细节。</p>
      <p>练习时打开<a href="#review">牌局复盘</a>，先遮住对手底牌，用每街行动列价值与诈唬，再翻开核对。察觉自己只想证明“他肯定在骗我”时，回到<a href="#tilt">情绪管理</a>的暂停与检查流程。</p>
      <h3>继续阅读</h3><ul class="reading-source-list"><li><a href="${OPPONENT_SOURCES.ranges}">PokerStars Learn · How to think about hand ranges</a><span>位置、范围与逐街读牌</span></li><li><a href="${OPPONENT_SOURCES.catching}">GTO Wizard · The Art of Bluff Catching</a><span>抓诈唬选牌、阻断与对手倾向</span></li><li><a href="${OPPONENT_SOURCES.tells}">PokerStars Learn · How to Spot Giveaway Tells</a><span>个人习惯与行为变化</span></li></ul>
    `,
  },
];
