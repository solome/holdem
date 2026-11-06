// Expanded from the seven-page handbook with opponent-psychology material.
export const HANDBOOK_SECTIONS = [
  {
    id: "foundation",
    number: "01",
    title: "先站稳，再把范围放宽",
    summary: "把松凶理解为有条件的主动，把弃牌保留在计划之内。",
    body: `
      <p>松凶型（LAG，Loose Aggressive）玩家会在合适的位置参与较宽的范围，并以有依据的下注和加注争取价值与弃牌收益。每次放宽范围，都要说清新增的组合靠什么立足，以及遭到反击后怎样退出。边缘牌失去位置、价格或对手弱点的支持时，及时弃牌，也是把计划执行到底。</p>
      <div class="handbook-note"><strong>适用牌局</strong><p>6–9 人无限注德州扑克现金局，有效筹码约 100 BB，正常大小盲、无前注、无强制跨式盲注（straddle）。6 人桌与 9 人桌采用不同的早位范围；抽水、筹码、人数和对手变化时，相应调整打法。</p></div>
      <h3>先分清四个概念</h3>
      <p><strong>松</strong>是相对于同一位置的稳健基线，有选择地增加组合；<strong>凶</strong>是主动争取收益，仍然包含过牌、跟注和放弃。<strong>范围</strong>是对手可能持有的一组牌；<strong>权益</strong>是特定对阵下摊牌可获得的底池份额，不能直接当作实际利润。</p>
      <p>BB 是大盲；BTN 是按钮位，CO 在按钮右侧，HJ 在 CO 右侧；SB 是小盲。s 表示同花，o 表示非同花，例如 <span data-handbook-hand="J8s">J8s</span> 与 <span data-handbook-hand="J8o">J8o</span>。翻前对开池的再加注称为 3-bet，再次加注称为 4-bet。有效筹码通常指你与相关对手中较少的可投入筹码；多人局还要分别识别每个对手可争夺的主池与边池。</p>
      <h3>每手牌先确认五件事</h3>
      <ol><li><strong>位置：</strong>翻后谁先行动，谁能先看完别人的动作？</li><li><strong>人数：</strong>单挑还是多人？后面还有没有人能跟注或挤压加注？</li><li><strong>筹码：</strong>有效筹码多少，下注后剩多少，是否足以支持后续计划？</li><li><strong>前序行动：</strong>无人入池、跛入、开池和 3-bet，是不同决策。</li><li><strong>对手倾向：</strong>谁爱弃牌，谁愿意用弱牌跟，谁经常再加注？</li></ol>
      <div class="handbook-principle"><strong>VPIP 是描述，不是目标。</strong><p>自愿入池率（VPIP）统计除强制盲注外，自愿跟注或加注入池的比例，包括被动跟注。它可以帮助复盘，但 30% 不是训练任务。相同入池率可能来自合理的后位偷盲，也可能来自昂贵的前位弱牌跟注。先检查位置、价格与行动质量，再看统计值。</p></div>
    `,
  },
  {
    id: "position",
    number: "02",
    title: "位置决定你能松到哪里",
    summary: "优先在后位扩张，先区分同花与非同花，再决定价格是否值得。",
    body: `
      <p>位置的价值，藏在行动的先后里：后行动者能先看到别人怎样处理牌面，也更容易选择过牌控制底池。扩张最好从 BTN 和有条件的 CO 开始。前位后面人数多，CO 后面仍有按钮；小盲虽然只剩大盲，却通常要在翻后先行动。</p>
      <div data-handbook-visual="position"></div>
      <div class="handbook-table-scroll" tabindex="0" role="region" aria-labelledby="handbook-table-1"><table><caption id="handbook-table-1">无人入池时的位置选择</caption><thead><tr><th scope="col">位置</th><th scope="col">入池基线</th><th scope="col">扩张条件</th></tr></thead><tbody>
      <tr><th scope="row">前位</th><td>以强高张、较强同花牌和合适口袋对子为核心。</td><td>后面人数多，弱非同花高张易被支配。95、J8、86 不作为日常扩张起点；9 人 UTG 通常应比 6 人最早位更谨慎。</td></tr>
      <tr><th scope="row">中位 / HJ</th><td>逐步增加可玩的同花牌和部分相连牌。</td><td>后面偏紧、少 3-bet 时再放宽；后面强手多则收紧。</td></tr>
      <tr><th scope="row">CO</th><td>增加偷盲与有位置入池机会。</td><td>先观察 BTN 是否爱跟注或 3-bet，别默认自己翻后一定有位置。</td></tr>
      <tr><th scope="row">BTN</th><td>主要的松凶扩张位置。</td><td>两盲过度弃牌时增加候选组合；两盲黏、爱反击或抽水高时删去最弱组合。</td></tr>
      <tr><th scope="row">SB</th><td>无人入池时先练稳健加注策略。</td><td>翻后无位置，不能照搬按钮范围。跛入策略需另行训练。</td></tr>
      <tr><th scope="row">BB</th><td>结合已投入的盲注与当前价格防守。</td><td>折扣不等于免费。大尺寸、前位强范围、多人挤压和抽水都可能让边缘跟注变差。</td></tr>
      </tbody></table></div>
      <h3>三组边缘牌：同花不等于值得入池</h3>
      <p>同花提高可玩性，却不会消除被高同花支配的风险。弱非同花牌更常形成踢脚差的一对，也更难在压力下实现权益。不要把“有机会做顺子”当作任何价格都能跟的理由。</p>
      <div data-handbook-visual="edgeHands"></div>
      <div class="handbook-table-scroll" tabindex="0" role="region" aria-labelledby="handbook-table-2"><table><caption id="handbook-table-2">三组边缘牌的入池选择</caption><thead><tr><th scope="col">牌型</th><th scope="col">可考虑的情境</th><th scope="col">优先避免</th></tr></thead><tbody>
      <tr><th scope="row"><span data-handbook-hand="95s">95s</span> / <span data-handbook-hand="95o">95o</span></th><td>95s 在 BTN 无人入池、两盲明显过紧时，可作为边缘扩张候选。</td><td>95o 通常弃牌；95s 也不因同花就跟前位大加注或硬扛 3-bet。</td></tr>
      <tr><th scope="row"><span data-handbook-hand="J8s">J8s</span> / <span data-handbook-hand="J8o">J8o</span></th><td>后位无人入池时优先考虑 J8s；BB 面对后位小开池可评估防守。</td><td>J8o 的 J 容易被更好踢脚支配；面对前位强范围、3-bet 与多人压力不轻易继续。</td></tr>
      <tr><th scope="row"><span data-handbook-hand="86s">86s</span> / <span data-handbook-hand="86o">86o</span></th><td>86s 在 BTN 可评估开池；有位置、价格合适且对手范围宽时，可评估跟注。</td><td>86o 通常不值得追逐；86s 面对大加注、短码或强范围，隐含回报常不足。</td></tr>
      </tbody></table></div>
      <p>项目的起手牌矩阵采用 6 人桌、100 BB 筹码预设。选择位置与前序行动后，可对照紧凶、标准、松凶三套范围练习。</p>
    `,
  },
  {
    id: "preflop",
    number: "03",
    title: "翻牌前：把后续计划一起买进来",
    summary: "先选范围，再选尺寸；加注之前就知道被跟、被反击时怎样处理。",
    body: `
      <p>入池时，就要把下一段路一起想清楚。先辨明前面发生了什么，再选择对应范围；下面的分支帮助你找到决策的起点，具体牌型和尺寸仍要结合位置、价格与对手判断。</p>
      <div data-handbook-visual="preflop"></div>
      <h3>无人入池：范围先于尺寸</h3>
      <p>按位置确定入池范围，再使用一致的开池尺度。可从加至 2.2–3 BB 的训练基线起步，依据现场跟注倾向调整。不要拿到强牌就突然加大、拿边缘牌就缩小；如果大多数人仍跟注，收紧边缘牌、增强价值范围，比机械地越加越大更有意义。</p>
      <h3>前面跛入：隔离是一项目标</h3>
      <p>跛入是只跟一个大盲。隔离加注希望让较弱牌付费，并减少翻后人数；可以用加至 4–5 BB、每多一名跛入者再加约 1 BB 作为测试起点。无位置、多人仍愿意跟或抽水高时，需要更谨慎。若加注后经常四人看翻牌，就减少纯偷池和弱同花牌，重新评价隔离是否有效。</p>
      <h3>前面开池：从对手范围重新开始</h3>
      <p>先看开池位置、尺寸、后面未行动玩家和对手倾向。对强范围少用易被支配的牌跟注；对宽范围，可以增加价值 3-bet。对经常跟 3-bet 的人，以较强牌组成线性加注范围；对过度弃牌的人，可以加入少量 A5s 这类有阻断和可玩性的诈唬组合。</p>
      <div class="handbook-table-scroll" tabindex="0" role="region" aria-labelledby="handbook-table-3"><table><caption id="handbook-table-3">约 100 BB 的尺寸训练起点，均为加注后的总额</caption><thead><tr><th scope="col">情境</th><th scope="col">起点</th><th scope="col">要补充的判断</th></tr></thead><tbody>
      <tr><th scope="row">有位置 3-bet</th><td>约开池总额的 3–3.5 倍；对手加至 3 BB，可测试加至 9–10.5 BB。</td><td>根据跟注者、开池范围和对手继续倾向调整。</td></tr>
      <tr><th scope="row">无位置 3-bet</th><td>约开池总额的 4–4.5 倍；对手加至 3 BB，可测试加至 12–13.5 BB。</td><td>后面有跟注者时需另作调整；大尺寸不能补救不合适的牌。</td></tr>
      <tr><th scope="row">面对 3-bet</th><td>比较弃牌、跟注和 4-bet。</td><td>根据新的价格、位置与剩余筹码重新选择。</td></tr>
      <tr><th scope="row">面对 4-bet</th><td>重新评估对手的价值与诈唬范围。</td><td>用足够强的牌继续，边缘牌及时退出。</td></tr>
      </tbody></table></div>
      <div class="handbook-principle"><strong>加注前先写出两个分支。</strong><p>被跟后，哪些翻牌有价值目标或可弃牌目标，哪些准备过牌？被再加注后，准备弃牌、跟注还是再加注？如果只能回答“先打再说”，先删去最弱的入池组合。</p></div>
      <p>短码降低投机牌的潜在回报；深码提高位置和坚果潜力的重要性，也放大一对牌输大底池的风险。筹码变了就重新设定范围，不把“深码能赢很多”作为弱同花牌无条件跟注的依据。</p>
    `,
  },
  {
    id: "postflop",
    number: "04",
    title: "翻后：每条街重新作决定",
    summary: "每次下注都要有目标，被跟或被加注以后更新范围。",
    body: `
      <p>每到新的一街，都重新问一句：更差的哪些牌会跟，更好的哪些牌会弃？前者支持价值下注，后者支持诈唬。拒绝对手实现权益也可能带来收益，但“想知道他有什么”不能独自支撑下注；还应比较过牌是否更有价值。下注目的可参见 <a href="https://www.pokerstars.com/poker/learn/lesson/purposes-of-betting/">PokerStars 的下注目的说明</a>。</p>
      <div data-handbook-visual="streets"></div>
      <h3>翻牌：数人数，辨牌面，再决定是否持续下注</h3>
      <p>先按翻前行动写出双方范围，再看高张、连接性和花色怎样改变相对优势。单挑、有位置、牌面对开池范围有利时，可以有较积极的小注策略；多人、无位置、牌面更有利于跟注范围时，需要更有选择地下注。持有中等摊牌价值时，过牌常能保留对手更弱的牌。</p>
      <p>25%–33% 底池的小注，可作为部分干燥、范围优势明显的单挑牌面的训练尺寸；50%–75% 底池适合更有选择的价值与半诈唬。同一尺寸内搭配相容的价值牌和诈唬牌；在湿润或多人牌面上，进一步筛选适合下注的组合。</p>
      <h3>转牌：读新牌，也读留下来的范围</h3>
      <p>翻牌被跟后，对手最弱的空气牌通常已经减少。先更新其继续范围，再判断新牌帮助谁：补到强成牌或强听牌、让你拥有更多可信强牌时，可以考虑继续；空白牌、对手黏、自己又缺权益时，过牌往往更合理。</p>
      <p>半诈唬同时依赖弃牌收益与被跟后的权益。强听牌也可以过牌：如果对手几乎不弃，或被加注后很难处理，保留权益未必比下注差。下注前还要想好河牌成牌和未成牌时分别怎样行动。</p>
      <h3>河牌：先决定有没有下注理由，再决定多少</h3>
      <p>价值下注要能列出愿意跟注的更差牌；薄价值下注还需准备面对加注时放弃。诈唬要明确打算逼走哪一组更好牌，以及这个对手是否会弃。大注通常要求更两极化的范围，不能仅因底池大就增加压力。</p>
      <p>评估阻断时，先看目标范围。持有关键花色可能减少对手的强成牌，也可能减少他本来会弃掉的错过听牌。优先选择有利于逼走目标牌的组合继续诈唬。</p>
      <h3>被加注：暂停原剧本</h3>
      <p>重新列出对手的价值牌、合理诈唬和当前价格。面对很少诈唬者的转牌或河牌大加注，一对常需弃牌；面对持续过度进攻的对手，可以增加较强抓诈唬牌的跟注。</p>
    `,
  },
  {
    id: "cases",
    number: "05",
    title: "三手牌：看清进退的分界",
    summary: "沿着牌面、行动和底池变化，判断何时继续，何时放弃。",
    body: `
      <p>三个案例统一按 100 BB、SB 0.5 BB / BB 1 BB、无前注、无抽水计算；未列出的玩家均弃牌。</p>
      <div class="handbook-example"><h3>案例一 · BTN 的 86s：主动进攻需要下一街的依据</h3>
      <p><strong>起手牌：</strong><span data-handbook-cards="8s 6s">8♠ 6♠</span>。BTN 无人入池，加至 2.5 BB，SB 弃、BB 跟，底池 5.5 BB。翻牌为 <span data-handbook-cards="Kc 7d 2s">K♣ 7♦ 2♠</span>，BB 过牌。</p>
      <div data-handbook-visual="case86"></div>
      <p><strong>翻牌判断：</strong>你有位置，牌面较干，有后门同花及后门顺子路径。若 BB 在类似牌面对小注弃牌偏多，可考虑下注 1.5 BB；对黏性 BB，也可过牌。</p>
      <p><strong>转牌分支：</strong>假设下注被跟，底池 8.5 BB；转牌 <span data-handbook-cards="5s">5♠</span>。你得到同花听牌和 5–6–7–8 的两头顺子听牌，4 或 9 可补顺。可考虑下注约 5–6 BB 半诈唬，也保留过牌分支。顺子和同花的出路有重叠；更高黑桃听牌会压制你的非坚果同花，不能把表面出路全算成稳赢。</p>
      <p><strong>河牌分支：</strong>若转牌下注 5.5 BB 被跟，底池为 19.5 BB。河牌 <span data-handbook-cards="Qh">Q♥</span> 未成牌时，先问 BB 会不会弃掉 Kx、7x 等目标。你拿两张黑桃会减少对手错过黑桃听牌的组合，对逼走这部分牌并无帮助。对黏性对手，过牌放弃通常比为了完成三枪继续投入更有依据；若成顺或成花，则根据牌面、对手继续范围和可跟注的更差牌重新选价值尺寸。</p></div>
      <div class="handbook-example"><h3>案例二 · BB 的 J8s：多人顶对需要控制</h3>
      <p><strong>起手牌：</strong><span data-handbook-cards="Js 8s">J♠ 8♠</span>。CO 加至 3 BB，BTN 跟，SB 弃；你在 BB 需补 2 BB。价格较低，但 CO 范围、抽水和踢脚支配仍然重要，跟注是可评估动作。假设跟注，底池 9.5 BB。</p>
      <p><strong>翻牌：</strong><span data-handbook-cards="Jd 9c 4h">J♦ 9♣ 4♥</span>，你过牌。若 CO 下注约 6 BB 且 BTN 跟，顶对弱踢脚面对两人继续，需要重新评估强度。对手范围偏价值时可以弃牌；有人加注更要谨慎。</p>
      <div data-handbook-visual="caseJ8"></div>
      <p><strong>另一条分支：</strong>若翻牌全过，转牌 <span data-handbook-cards="2c">2♣</span>，可评估对 9x、口袋对子的小额价值兼保护下注；若对手不以这些牌付费，继续过牌也合理。假设下注 3.5 BB、CO 弃、BTN 跟，底池 16.5 BB；河牌 <span data-handbook-cards="Ad">A♦</span> 后重新更新范围，不自动补一枪。检查更差的 Jx、9x 是否还愿意跟；面对大注则依据该对手的价值与诈唬比例判断，而非只因自己中了顶对就支付。</p></div>
      <div class="handbook-example"><h3>案例三 · BTN 的 95s：一次合理偷盲可以以弃牌结束</h3>
      <p><strong>起手牌：</strong><span data-handbook-cards="9h 5h">9♥ 5♥</span>。两盲在类似机会中多次对偷盲弃牌，你把它作为边缘候选，加至 2.5 BB。SB 弃，BB 3-bet 至 11 BB。</p>
      <p><strong>重算价格：</strong>当前底池 14 BB，你需补 8.5 BB，跟注后的底池为 22.5 BB；简单权益门槛为 8.5 ÷ 22.5 ≈ 37.8%。95s 还要承担更高同花支配、许多翻牌难以继续，以及后续下注的成本。</p>
      <div data-handbook-visual="case95"></div>
      <p><strong>行动：</strong>面对正常或偏紧的 BB，通常弃牌。若以后反复发现其宽 3-bet 与对 4-bet 过度弃牌，再选择合适牌型反击。把 95s 弃掉，保留下一次有利入池的筹码。</p></div>
    `,
  },
  {
    id: "opponents",
    number: "06",
    title: "对手不同，主动的方式也不同",
    summary: "根据跟注、弃牌与加注习惯，调整价值下注和诈唬。",
    body: `
      <p>记录对手时，顺着行动留下的线索，按位置、人数、牌面和尺寸分开看。有人翻前很松，河牌却很少诈唬；有人愿意跟小注，面对大注就容易弃牌。找到这些具体习惯，才能确定在哪条街、用什么尺寸调整。</p>
      <div class="handbook-table-scroll" tabindex="0" role="region" aria-labelledby="handbook-table-4"><table><caption id="handbook-table-4">常见对手倾向与应对</caption><thead><tr><th scope="col">重复观察</th><th scope="col">可执行调整</th><th scope="col">后续怎么调整</th></tr></thead><tbody>
      <tr><th scope="row">较弱一对也经常跟到摊牌</th><td>扩大合理价值下注，减少纯诈唬；用强牌测试其是否仍接受较大尺寸。</td><td>分别观察其对小注与大注的接受程度，选出强牌能得到支付的尺寸。</td></tr>
      <tr><th scope="row">相似后位偷盲或小持续下注机会中弃牌偏多</th><td>后位增加候选开池与有计划的小注，保留面对反击的弃牌路线。</td><td>对手开始增加 3-bet 或跟注后，删去新增的最弱组合。</td></tr>
      <tr><th scope="row">针对你频繁 3-bet</th><td>先删去最弱开池，以有位置、可玩的牌继续；价值反击优先。</td><td>检查其摊牌和后续 3-bet 频率，优先用强牌反击。</td></tr>
      <tr><th scope="row">类似河牌线上多次摊出诈唬</th><td>选择较强、阻断方向合适的抓诈唬牌跟注，保留其诈唬而非无意义加注。</td><td>按相似下注线、尺寸和底池人数，选择适合抓诈唬的牌。</td></tr>
      <tr><th scope="row">平时紧且被动，突然大幅加注</th><td>提高对价值范围的权重，对大额投入更谨慎；不为最低防守频率强付费。</td><td>列出价值牌与可能的诈唬组合，再结合赔率决定是否跟注。</td></tr>
      <tr><th scope="row">整桌多人且黏</th><td>收紧最弱入池组合，以更强价值为主，减少跨多人的纯诈唬。</td><td>多人底池提高下注门槛，把主要投入放在能被更差牌支付的价值牌上。</td></tr>
      </tbody></table></div>
      <p>调整时，先减少无效诈唬，再改善价值尺寸，最后增加边缘组合。每场只改一个主要动作，复盘时比较它在相似场景中的表现。</p>
    `,
  },
  {
    id: "psychology",
    number: "07",
    title: "心理博弈：看懂调整，也管住自己",
    summary: "从行动变化识别对手倾向，及时调整自己的范围与下注。",
    body: `
      <p>心理博弈要沿着行动的痕迹来读：对手怎样看待你的打法，因此多跟了哪些牌、多加注了哪些牌？沿着“观察—假设—动作—复核”的顺序，把牌桌印象转成范围和尺寸上的调整。</p>
      <div data-handbook-visual="loop"></div>
      <h3>把注意力放在完整行动上</h3>
      <p>优先记录位置、下注线、尺寸和摊牌。观察动作快慢或身体反应时，先了解这个人平时的习惯，再比较相似场景中的变化。最终把判断写成具体的跟注、弃牌或加注倾向。</p>
      <p>例如，记录“面对 6 次类似的后位小开池，弃了 4 次”，然后继续看他遇到更大尺寸、不同位置或你的连续开池时怎样回应。这样的记录能直接帮助选择下一次偷盲的范围。</p>
      <h3>场景一：你被认为很松，对手开始抓你</h3>
      <p>连续开池或一次诈唬被看到后，某位对手开始用更弱的一对跟注，或更频繁地对你 3-bet。此时减少最薄弱的纯诈唬，增加能被更差牌支付的价值下注；面对翻前反击，以更强的范围继续。</p>
      <div data-handbook-visual="psychologyScene"></div>
      <p>比较相近位置、尺寸和牌面的后续行动，持续调整价值与诈唬的比例。面对会观察你的对手，也要根据他们眼中的自己调整打法，把筹码用在有收益的动作上。进一步阅读 <a href="https://www.pokerstars.com/poker/learn/strategies/the-image-you-want-to-portray-at-the-poker-table/">PokerStars 的牌桌形象说明</a>。</p>
      <h3>场景二：对手容易在大底池弃牌</h3>
      <p>如果对手在相似牌面多次跟小注、面对转河牌较大下注却弃牌，可以寻找大尺寸施压的机会。先列出希望逼走的牌，再从有可信价值线、阻断合适的组合中挑选诈唬，同时保留强价值牌。</p>
      <p>继续记录他在哪些牌面、面对多大尺寸愿意跟注。一旦发现他开始用一对稳定支付，就减少纯诈唬，转向价值下注。</p>
      <h3>场景三：对手刚输大底池</h3>
      <p>留意下一段时间的实际动作：入池变宽、跟注变多、加注变大，还是收紧了范围。对宽跟的人少诈唬、多取价值；对过度进攻的人，用合适的强摊牌牌保留其诈唬。</p>
      <p>在每条街按其最新行动更新范围。自己仍按位置、价格与牌面作决定，避免被对方的情绪带着加快节奏。</p>
      <h3>场景四：3-bet 战变成了面子之争</h3>
      <p>当你开始只盯着同一对手，反复想到“又是他”“这次不能再弃”，先暂停一下。回到位置、价格、范围和预设继续牌；如果仍在想着报复，就离桌休息。对频繁反击的对手，用更强的继续范围和合适的价值 4-bet 处理。</p>
      <p>复盘时遮住结果，回到那次加注之前，重新解释其收益与可选动作，再检查当时的情绪怎样影响了选择。</p>
      <div class="handbook-note"><strong>给自己建立情绪档案。</strong><p>写下触发事件、身体和语言信号、常见错误及停止条件。Jared Tendler 在 <a href="https://www.pokerstars.com/poker/learn/lesson/understanding-poker-tilt/">Understanding Poker Tilt</a> 中介绍了这项练习。到 <a href="tilt.html">情绪管理专题</a>，继续整理自己的预警信号与应对计划。</p></div>
    `,
  },
  {
    id: "math",
    number: "08",
    title: "必要的数学：把价格算清楚",
    summary: "赔率是决策输入，权益实现与后续行动决定这笔价格是否真的划算。",
    body: `
      <h3>纯诈唬需要多少弃牌</h3>
      <p>设下注前底池为 P，下注额为 B；零权益、被跟即输、没有后续行动、忽略抽水时，纯诈唬的盈亏平衡弃牌率为 <strong>B ÷（P + B）</strong>。推导是：弃牌概率 × P − 被跟概率 × B = 0。底池 100、下注 50，需对手弃牌超过 33.3% 才直接盈利；下注 100 则需超过 50%。</p>
      <h3>跟注需要补多少，最后争夺多少</h3>
      <p>简单跟注门槛为 <strong>需补金额 C ÷ 跟注后可争夺的底池</strong>。例如底池原有 100，对手下注 50，轮到你时当前底池是 150；跟 50 后为 200，门槛是 25%。河牌或全下、无后续费用时可用摊牌权益比较；前两街还需估计后续下注、位置、隐含及反向隐含回报。</p>
      <div data-handbook-visual="odds"></div>
      <div class="handbook-table-scroll" tabindex="0" role="region" aria-labelledby="handbook-table-5"><table><caption id="handbook-table-5">单挑首次下注，无抽水、无后续行动的简化门槛</caption><thead><tr><th scope="col">下注 / 下注前底池</th><th scope="col">简单跟注门槛</th><th scope="col">同尺寸零权益诈唬的盈亏平衡弃牌率</th></tr></thead><tbody>
      <tr><th scope="row">1/3</th><td>20%</td><td>25%</td></tr>
      <tr><th scope="row">1/2</th><td>25%</td><td>33.3%</td></tr>
      <tr><th scope="row">3/4</th><td>30%</td><td>42.9%</td></tr>
      <tr><th scope="row">1 倍</th><td>33.3%</td><td>50%</td></tr>
      </tbody></table></div>
      <p>加注时，按新的风险与回报重新计算。面对明显诈唬不足的对手，可以比最低防守频率（MDF）更多地弃牌。赔率与权益实现的进一步说明，见 <a href="https://blog.gtowizard.com/mathematical-misconceptions-in-poker/">GTO Wizard 的数学误区说明</a>。</p>
      <h3>SPR：筹码相对于底池有多深</h3>
      <p><strong>SPR = 当前有效剩余筹码 ÷ 当前底池。</strong>例如双方 100 BB，BTN 加至 2.5 BB、BB 跟、SB 弃，翻牌前底池 5.5 BB，双方各剩 97.5 BB，翻牌起始 SPR 约 17.7。这样的一对牌不应仅凭“我有顶对”就默认投入全部筹码。</p>
      <p>SPR 越高，投入整副筹码的风险相对越大，位置、坚果潜力与权益保持能力也更重要。决定打多大底池时，把 SPR 与双方范围、牌面一起考虑。进一步阅读 <a href="https://blog.gtowizard.com/stack-to-pot-ratio/">GTO Wizard 的 SPR 说明</a>。</p>
      <div class="handbook-note"><strong>不要把出路张数当成胜率。</strong><p>重复的顺子 / 同花出路只算一次，非坚果成牌仍可能输；对手手牌也会改变剩余牌与有效出路。可在项目的牌力计算中输入双方手牌与公共牌，核对具体对阵的权益。</p></div>
    `,
  },
  {
    id: "practice",
    number: "09",
    title: "桌边速查与四次训练",
    summary: "每场只改一个主要动作，先判断决策，再看输赢。",
    body: `
      <div class="handbook-table-scroll" tabindex="0" role="region" aria-labelledby="handbook-table-6"><table><caption id="handbook-table-6">每手牌的短流程</caption><thead><tr><th scope="col">节点</th><th scope="col">先问什么</th><th scope="col">刹车条件</th></tr></thead><tbody>
      <tr><th scope="row">翻前</th><td>人数 → 位置 → 有效筹码 → 前序行动 → 对手 → 范围 → 尺寸与反击计划。</td><td>边缘牌没有位置、价格或可利用弱点支撑。</td></tr>
      <tr><th scope="row">翻牌</th><td>双方范围 → 人数 → 牌面 → 价值 / 弃牌目标 → 比较过牌。</td><td>只因自己是开池者就必须下注。</td></tr>
      <tr><th scope="row">转牌</th><td>被跟后的范围 → 新牌帮助谁 → 是否仍有价值或弃牌目标。</td><td>空白牌、对手不弃、自己权益不足，却惯性继续。</td></tr>
      <tr><th scope="row">河牌</th><td>更差会跟吗 → 更好会弃吗 → 阻断方向 → 当前价格。</td><td>只为完成三枪，或为了证明自己敢打。</td></tr>
      </tbody></table></div>
      <h3>三句自我提醒</h3>
      <p><strong>“已经投了这么多，不能弃。”</strong>已投入筹码按沉没成本处理，从当前节点重算。<strong>“我要证明自己敢打。”</strong>形象不能替代下注理由，暂停或离桌。<strong>“他不可能又有。”</strong>按范围和证据估计，上一手的输赢不决定这一手。</p>
      <h3>四次训练，逐步放宽</h3>
      <ol><li><strong>第一次：</strong>只记录每次入池的位置与前序行动，不追求任何 VPIP 数字。</li><li><strong>第二次：</strong>只在 BTN / CO 有明确依据时增加边缘组合，其余位置保留基线。</li><li><strong>第三次：</strong>每次翻后下注前，说清“更差跟注牌”或“更好弃牌目标”，并比较过牌。</li><li><strong>第四次：</strong>专门检查转河牌继续下注，删去只因前面投入而继续的动作。</li></ol>
      <h3>每场复盘三手，记录当时能知道的事</h3>
      <p>各选一手最大疑问、一手边缘入池、一手大底池。记录人数、盲注、有效筹码、位置、完整行动、每街牌面和尺寸、当时观察到的对手倾向，以及可选动作。先盖住最终结果，沿当时的信息重走一遍决策，再结合摊牌回看范围判断。</p>
      <p>重点检查位置错误、没有目的的下注、被反击后不肯退出，以及情绪对判断的影响。把下一场要改的动作写成一句具体提醒。</p>
      <div class="handbook-note"><strong>开始前写好结束条件。</strong><p>事先设定损失上限与结束时间，并按约定执行。出现疲劳、焦躁或追损冲动时，暂停或结束本场。</p></div>
    `,
  },
  {
    id: "sources",
    number: "10",
    title: "延伸阅读",
    summary: "继续学习下注目的、赔率、筹码深度与牌桌心态。",
    body: `
      <ol><li><a href="https://www.pokerstars.com/poker/learn/lesson/purposes-of-betting/">PokerStars Learn · Purposes of Betting in Poker</a>：下注目的、价值与诈唬的区别。</li><li><a href="https://blog.gtowizard.com/mathematical-misconceptions-in-poker/">GTO Wizard · Mathematical Misconceptions in Poker</a>：赔率、零权益诈唬、MDF 与权益实现。</li><li><a href="https://blog.gtowizard.com/stack-to-pot-ratio/">GTO Wizard · Stack-to-pot ratio</a>：SPR 定义、风险回报和非坚果牌的权益。</li><li><a href="https://www.pokerstars.com/poker/learn/strategies/the-image-you-want-to-portray-at-the-poker-table/">PokerStars Learn · The table image you want to portray</a>：形象来自近期行为，且只影响会观察并调整的人。</li><li><a href="https://www.pokerstars.com/poker/learn/lesson/understanding-poker-tilt/">Jared Tendler / PokerStars Learn · Understanding Poker Tilt</a>：记录个人触发因素、早期信号与行为错误。</li></ol>
    `,
  },
];
