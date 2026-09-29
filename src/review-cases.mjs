/** Curated friends' hands. Action amounts are cumulative contributions on that street. */
const L = (zh, tw, en) => ({ "zh-CN": zh, "zh-TW": tw, en });
const card = (rank, suit) => ({ rank: String(rank), suit });
const action = (player, label, to, kind) => ({
  player,
  label: to == null ? label : Object.fromEntries(Object.entries(label).map(([locale, value]) => [locale, `${value} ${to} BB`])),
  to,
  kind,
});
const analysis = (player, verdict, body) => ({ player, verdict, body });

export const REVIEW_CASES = [
  {
    id: "fourWay",
    title: L("最后一把，快乐一把", "最後一把，快樂一把", "One last hand, one good memory"),
    subtitle: L("A♣ 5♣ · 四个朋友的最后一把", "A♣ 5♣ · 四個朋友的最後一把", "A♣ 5♣ · Four friends, one last hand"),
    heroId: "D",
    players: [
      { id: "A", personId: "tengteng", hand: [card("J", "spades"), card("J", "clubs")], stack: 28 },
      { id: "B", personId: "kelin", hand: [card("7", "diamonds"), card("8", "diamonds")], stack: 20 },
      { id: "C", personId: "xingxing", hand: [card("A", "hearts"), card("A", "diamonds")], stack: 31 },
      { id: "D", personId: "juyipeng", hand: [card("A", "clubs"), card("5", "clubs")], stack: null, stackNote: L("深筹码 · 数额未记", "深籌碼 · 數額未記", "Deep stack · amount unrecorded") },
    ],
    overview: L(
      "这一轮的最后一把，掬一捧原本想用 A♣ 5♣ 跟星星做一次对抗，却等来了腾腾的 JJ 全下和克林的最后一搏。四个人入池，最后由一张 5 串起了这段记忆。",
      "這一輪的最後一把，掬一捧原本想用 A♣ 5♣ 跟星星做一次對抗，卻等來了騰騰的 JJ 全下和克林的最後一搏。四個人入池，最後由一張 5 串起了這段記憶。",
      "It was the last hand of the session. 掬一捧 called with A♣ 5♣ for one more contest with 星星, then 腾腾 shoved JJ and 克林 joined for a final shot. Four friends entered the pot; a five became the heart of the memory.",
    ),
    assumptions: [
      L(
        "按腾腾、克林、星星、掬一捧的记录顺序还原；具体位置未记录，小盲、大盲可能已经弃牌。",
        "按騰騰、克林、星星、掬一捧的記錄順序還原；具體位置未記錄，小盲、大盲可能已經棄牌。",
        "Actions follow the recorded order: 腾腾, 克林, 星星, 掬一捧. Exact positions are unknown; the blinds may have folded.",
      ),
      L(
        "两次平跟按各 1 BB 记录；8、20、28 BB 均为翻前累计投入。",
        "兩次平跟按各 1 BB 記錄；8、20、28 BB 均為翻前累計投入。",
        "Each limp is recorded as 1 BB. The 8, 20 and 28 BB amounts are total preflop contributions.",
      ),
      L(
        "行动推得腾腾、克林、星星起始筹码为 28、20、31 BB。掬一捧确认后手很深，具体总额未记录；与各对手的有效筹码仍由较短一方限制。",
        "行動推得騰騰、克林、星星起始籌碼為 28、20、31 BB。掬一捧確認後手很深，具體總額未記錄；與各對手的有效籌碼仍由較短一方限制。",
        "Actions imply starting stacks of 28, 20 and 31 BB for 腾腾, 克林 and 星星. 掬一捧 confirms a deep stack, with the total unrecorded. Effective stacks against each opponent are still capped by the shorter stack.",
      ),
      L(
        "“腾腾先开到 6 BB、星星再加注”是掬一捧事后的假设回看，未改动实际行动记录。",
        "「騰騰先開到 6 BB、星星再加注」是掬一捧事後的假設回看，未改動實際行動記錄。",
        "The alternative 6 BB opening raise followed by a re-raise is 掬一捧’s retrospective scenario; it does not alter the recorded actions.",
      ),
      L(
        "概率使用所有已知手牌，未知弃牌保持未知；这是摊牌后的数学回看，并非行动时看见了对手底牌。",
        "機率使用所有已知手牌，未知棄牌保持未知；這是攤牌後的數學回看，並非行動時看見了對手底牌。",
        "Probabilities use all recorded hole cards while leaving unrecorded folded cards unknown. This is a mathematical review after showdown, not information available when the players acted.",
      ),
    ],
    streets: [
      {
        id: "preflop",
        board: [],
        actions: [
          action("A", L("平跟", "平跟", "Limp"), 1, "call"),
          action("B", L("平跟", "平跟", "Limp"), 1, "call"),
          action("C", L("加注至", "加注至", "Raise to"), 8, "raise"),
          action("D", L("跟注至", "跟注至", "Call to"), 8, "call"),
          action("A", L("全下至", "全下至", "All-in to"), 28, "all-in"),
          action("B", L("全下至", "全下至", "All-in to"), 20, "all-in"),
          action("C", L("跟注至", "跟注至", "Call to"), 28, "call"),
          action("D", L("跟注至", "跟注至", "Call to"), 28, "call"),
        ],
        analysis: [
          analysis("A", L("JJ：意料之外的回推", "JJ：意料之外的回推", "JJ: the unexpected shove"),
            L(
              "腾腾先平跟，再面对星星的 8 BB 加注和掬一捧的跟注，全下到 28 BB。这是牌局突然变大的转折。JJ 有争取底池、减少多人看翻牌的实力，但回推能否获利仍取决于大家会用什么牌跟进；这次恰好遇到星星的 AA。这次意外，就藏在先平跟、再全下的顺序里。",
              "騰騰先平跟，再面對星星的 8 BB 加注和掬一捧的跟注，全下到 28 BB。這是牌局突然變大的轉折。JJ 有爭取底池、減少多人看翻牌的實力，但回推能否獲利仍取決於大家會用什麼牌跟進；這次恰好遇到星星的 AA。這次意外，就藏在先平跟、再全下的順序裡。",
              "腾腾 limped, then shoved to 28 BB after 星星 raised to 8 BB and 掬一捧 called. That was the moment the hand became a big pot. JJ can contest the pot and try to thin the field, but the shove’s value depends on the calling ranges; this time 星星 held AA. The surprise lay in the sequence: a limp, then the shove.",
            )
          ),
          analysis("B", L("87s：短筹码的最后一搏", "87s：短籌碼的最後一搏", "87s: one final shot"),
            L(
              "克林剩余筹码不多，想在最后一轮搏一把，于是把 20 BB 投进多人底池。这个选择有明确的娱乐背景。只看数字，短筹码同花连张缺少后续操作与隐含赔率，面对多人的强范围要付出不小成本；他的 20 BB 只参与主池，不能争夺后面的边池。",
              "克林剩餘籌碼不多，想在最後一輪搏一把，於是把 20 BB 投進多人底池。這個選擇有明確的娛樂背景。只看數字，短籌碼同花連張缺少後續操作與隱含賠率，面對多人的強範圍要付出不小成本；他的 20 BB 只參與主池，不能爭奪後面的邊池。",
              "With a short stack, 克林 wanted one final shot and committed 20 BB to the multiway pot. That recreational context explains the choice. Numerically, short-stacked suited connectors have little room to maneuver or gain implied odds, making a call against strong multiway ranges costly. His 20 BB buys eligibility for the main pot only.",
            )
          ),
          analysis("C", L("AA：这次确实是强牌", "AA：這次確實是強牌", "AA: a real hand this time"),
            L(
              "星星在两个平跟之后加注到 8 BB，拿的是 AA。做大底池、面对 28 BB 全下继续投入，都有很强的价值基础。更多朋友跟进会分走 AA 的权益，但不会把它变成应当害怕投入的牌；最后被反超，也不改变翻前的实力。",
              "星星在兩個平跟之後加注到 8 BB，拿的是 AA。做大底池、面對 28 BB 全下繼續投入，都有很強的價值基礎。更多朋友跟進會分走 AA 的權益，但不會把它變成應當害怕投入的牌；最後被反超，也不改變翻前的實力。",
              "星星 raised to 8 BB over two limpers with AA. Building the pot and continuing against a 28 BB shove both have a strong value basis. More friends joining reduce AA’s equity, but do not turn it into a hand afraid to commit. Being overtaken later does not change its preflop strength.",
            )
          ),
          analysis("D", L("A5s：最后一把，愿意参与", "A5s：最後一把，願意參與", "A5s: choosing to join the last hand"),
            L(
              "掬一捧跟 8 BB 是想和星星做一次对抗；再补 20 BB，则有后手深、已经投了 8 BB 和最后一把想玩开心的心情。数学上，先前的 8 BB 已经投入，是否继续仍取决于新增 20 BB 的价格；深后手也不能扩大对手只有 20–31 BB 的有效筹码。对多人强范围，这次跟注成本高。把这份成本和当时的快乐并排记下，比只用输赢评价它更完整。",
              "掬一捧跟 8 BB 是想和星星做一次對抗；再補 20 BB，則有後手深、已經投了 8 BB 和最後一把想玩開心的心情。數學上，先前的 8 BB 已經投入，是否繼續仍取決於新增 20 BB 的價格；深後手也不能擴大對手只有 20–31 BB 的有效籌碼。對多人強範圍，這次跟注成本高。把這份成本和當時的快樂並排記下，比只用輸贏評價它更完整。",
              "掬一捧 called 8 BB for a contest with 星星. Calling the extra 20 BB reflected his deep stack, the 8 BB already invested and the wish to enjoy the final hand. Mathematically, the first 8 BB is already committed; the next choice concerns the additional 20 BB. A deep personal stack cannot increase opponents’ effective stacks of 20–31 BB. Calling strong multiway ranges is expensive here. Recording both that cost and the enjoyment gives a fuller memory than judging by the result alone.",
            )
          ),
        ],
        note: L(
          "翻前已知投入 104 BB；克林只参与主池，星星与掬一捧仍能行动。",
          "翻前已知投入 104 BB；克林只參與主池，星星與掬一捧仍能行動。",
          "Recorded preflop contributions total 104 BB. 克林 is eligible only for the main pot; 星星 and 掬一捧 can still act.",
        ),
      },
      {
        id: "flop",
        board: [card("6", "spades"), card("5", "spades"), card("5", "diamonds")],
        actions: [
          action("C", L("全下", "全下", "All-in"), 3, "all-in"),
          action("D", L("跟注", "跟注", "Call"), 3, "call"),
        ],
        analysis: [
          analysis("A", L("JJ：筹码已入池，等待后两张", "JJ：籌碼已入池，等待後兩張", "JJ: all-in, waiting for the runout"),
            L(
              "腾腾的 JJ 与公共牌组成 J、5 两对，暂时落后掬一捧的三条。翻前已经全下，这一街没有新的下注选择；剩余的 J 等改善牌，仍能让故事转向。",
              "騰騰的 JJ 與公共牌組成 J、5 兩對，暫時落後掬一捧的三條。翻前已經全下，這一街沒有新的下注選擇；剩餘的 J 等改善牌，仍能讓故事轉向。",
              "腾腾 has jacks and fives, behind 掬一捧’s trips. Already all-in preflop, he has no new betting choice. Improvements such as a remaining jack can still turn the story around.",
            )
          ),
          analysis("B", L("87s：还有两端顺听的期待", "87s：還有兩端順聽的期待", "87s: a straight draw keeps hope alive"),
            L(
              "克林的 7、8 接上牌面的 5、6，形成两端顺听，4 或 9 可以成顺。这次最后一搏还留着机会。不过牌面已成对，即使成顺也可能再被葫芦反超；八张成顺牌不直接等于最终胜率。克林已经全下，只争主池。",
              "克林的 7、8 接上牌面的 5、6，形成兩端順聽，4 或 9 可以成順。這次最後一搏還留著機會。不過牌面已成對，即使成順也可能再被葫蘆反超；八張成順牌不直接等於最終勝率。克林已經全下，只爭主池。",
              "克林’s seven and eight connect with the board’s five and six for an open-ended draw: a four or nine completes a straight. His final shot still has possibilities. The paired board allows a later full house to overtake a straight, so eight completing cards are not the same as final winning equity. Already all-in, 克林 contests only the main pot.",
            )
          ),
          analysis("C", L("AA：最后 3 BB 继续投入", "AA：最後 3 BB 繼續投入", "AA: committing the last 3 BB"),
            L(
              "星星只剩 3 BB，已知底池却已有 104 BB。在没有看见对手底牌时，AA 仍是强超对，这个剩余筹码与底池的比例让全下容易理解。只是这次掬一捧正好有一张 5，领先已经换了人。",
              "星星只剩 3 BB，已知底池卻已有 104 BB。在沒有看見對手底牌時，AA 仍是強超對，這個剩餘籌碼與底池的比例讓全下容易理解。只是這次掬一捧正好有一張 5，領先已經換了人。",
              "星星 has only 3 BB left against 104 BB of recorded contributions. Without seeing the other hands, AA remains a strong overpair, and that stack-to-pot ratio makes committing understandable. This time, though, 掬一捧 has a five and the lead has changed.",
            )
          ),
          analysis("D", L("三条：一张 5 接住了这次对抗", "三條：一張 5 接住了這次對抗", "Trips: the five comes through"),
            L(
              "A5 在 6♠ 5♠ 5♦ 上击中三条，面对星星最后的 3 BB，跟注有充分价值。腾腾、克林已经全下，星星也推完筹码，没有人能匹配更多加注。掬一捧此时领先，接下来就等转牌与河牌。",
              "A5 在 6♠ 5♠ 5♦ 上擊中三條，面對星星最後的 3 BB，跟注有充分價值。騰騰、克林已經全下，星星也推完籌碼，沒有人能匹配更多加注。掬一捧此時領先，接下來就等轉牌與河牌。",
              "A5 flops trips on 6♠ 5♠ 5♦, making a call of 星星’s last 3 BB well supported. 腾腾 and 克林 are already all-in, and 星星 has now committed everything, so no one can match a further raise. 掬一捧 leads, with the turn and river still to come.",
            )
          ),
        ],
        note: L(
          "下注结束。已知主池 80 BB，第一边池 24 BB，第二边池 6 BB，共 110 BB。",
          "下注結束。已知主池 80 BB，第一邊池 24 BB，第二邊池 6 BB，共 110 BB。",
          "Betting ends. Recorded pots: 80 BB main, 24 BB first side pot and 6 BB second side pot; 110 BB total.",
        ),
      },
      {
        id: "turn",
        board: [card("6", "spades"), card("5", "spades"), card("5", "diamonds"), card("10", "clubs")],
        actions: [],
        analysis: [
          analysis("D", L("10♣：还差最后一张", "10♣：還差最後一張", "10♣: one card left"),
            L(
              "10♣ 没有改变领先者，掬一捧的三条还在前面。腾腾可用剩余的 J 成葫芦，星星可用剩余的 A 成葫芦，克林仍盼 4 或 9 成顺。克林的改善只影响主池，两个边池分别比较有资格争夺的人。这一街已经没有下注，剩下的是最后一张牌的悬念。",
              "10♣ 沒有改變領先者，掬一捧的三條還在前面。騰騰可用剩餘的 J 成葫蘆，星星可用剩餘的 A 成葫蘆，克林仍盼 4 或 9 成順。克林的改善只影響主池，兩個邊池分別比較有資格爭奪的人。這一街已經沒有下注，剩下的是最後一張牌的懸念。",
              "The 10♣ leaves 掬一捧’s trips ahead. 腾腾 can make a full house with a remaining jack, 星星 with the remaining ace, and 克林 can still make a straight with a four or nine. 克林’s improvement affects only the main pot; each side pot compares its eligible players. No betting remains, only the suspense of the final card.",
            )
          ),
        ],
        note: L(
          "只发公共牌；概率按当前四张公共牌重新计算，不提前使用河牌信息。",
          "只發公共牌；機率按目前四張公共牌重新計算，不提前使用河牌資訊。",
          "Runout only. Probabilities use the four visible board cards, without peeking at the river.",
        ),
      },
      {
        id: "river",
        board: [card("6", "spades"), card("5", "spades"), card("5", "diamonds"), card("10", "clubs"), card("6", "hearts")],
        actions: [],
        analysis: [
          analysis("D", L("6♥：葫芦为最后一把收尾", "6♥：葫蘆為最後一把收尾", "6♥: a full house to close the session"),
            L(
              "6♥ 落下，掬一捧组成 55566 葫芦，收下主池和两个边池。腾腾是 J、6 两对，星星是 A、6 两对；克林使用公共牌的 6、5 两对与 10 踢脚。这一轮的最后一把，由掬一捧的 A5s 收尾。",
              "6♥ 落下，掬一捧組成 55566 葫蘆，收下主池和兩個邊池。騰騰是 J、6 兩對，星星是 A、6 兩對；克林使用公共牌的 6、5 兩對與 10 踢腳。這一輪的最後一把，由掬一捧的 A5s 收尾。",
              "The 6♥ gives 掬一捧 fives full of sixes and the main pot plus both side pots. 腾腾 has jacks and sixes, 星星 has aces and sixes, and 克林 plays the board’s sixes and fives with a ten kicker. 掬一捧’s A5s closes the session’s final hand.",
            )
          ),
        ],
        note: L("河牌揭晓结果，四个人的最后一把到这里落定。", "河牌揭曉結果，四個人的最後一把到這裡落定。", "The river settles the result and brings the four friends’ final hand to a close."),
      },
    ],
    result: {
      winner: "D",
      label: L("葫芦 · 55566", "葫蘆 · 55566", "Full house · 55566"),
      body: L(
        "掬一捧用葫芦收下已知底池 110 BB，含自己的 31 BB，净赢 79 BB。这次“最后一把快乐一把”，留下了四个人都参与的大底池。",
        "掬一捧用葫蘆收下已知底池 110 BB，含自己的 31 BB，淨贏 79 BB。這次「最後一把快樂一把」，留下了四個人都參與的大底池。",
        "掬一捧’s full house takes the recorded 110 BB pot, including his 31 BB, for a net gain of 79 BB. One last hand became a big pot that all four friends joined.",
      ),
    },
    takeaways: [
      L("本来只是想跟星星做一次对抗，最后变成了四个人一起入池。", "本來只是想跟星星做一次對抗，最後變成了四個人一起入池。", "What began as one more contest with 星星 became a pot shared by all four friends."),
      L("腾腾的回推、克林的最后一搏，都让这把牌有了自己的走向。", "騰騰的回推、克林的最後一搏，都讓這把牌有了自己的走向。", "腾腾’s shove and 克林’s final shot each helped shape this hand’s path."),
      L(
        "数字记下跟注的代价，牌谱也记下那句：最后一把快乐一把。",
        "數字記下跟注的代價，牌譜也記下那句：最後一把快樂一把。",
        "The numbers preserve the cost of the calls; the record also preserves the wish to enjoy one last hand.",
      ),
    ],
    potNote: L(
      "底池仅计四人的已知投入，未包含可能弃牌的盲注、前注及抽水。",
      "底池僅計四人的已知投入，未包含可能棄牌的盲注、前注及抽水。",
      "Pots include only the four recorded contributions, excluding any folded blinds, antes or rake.",
    ),
    story: {
      eyebrow: L("当时的心情", "當時的心情", "How it felt"),
      title: L("最后一把，想和大家再打一回", "最後一把，想和大家再打一回", "One more hand together"),
      paragraphs: [
        L(
          "星星加注到 8 BB，掬一捧拿着 A5s 跟进：都最后一把了，想做一次对抗。没想到先前平跟的腾腾拿着 JJ，直接全下到 28 BB；克林筹码不多，也想在最后一轮搏一把，把 20 BB 推了进去。",
          "星星加注到 8 BB，掬一捧拿著 A5s 跟進：都最後一把了，想做一次對抗。沒想到先前平跟的騰騰拿著 JJ，直接全下到 28 BB；克林籌碼不多，也想在最後一輪搏一把，把 20 BB 推了進去。",
          "星星 raised to 8 BB and 掬一捧 called A5s for one last contest. The surprise came from 腾腾, who had limped JJ and now shoved to 28 BB. With a short stack, 克林 also wanted one final shot and put in his 20 BB.",
        ),
        L(
          "掬一捧后手很深，也觉得前面已经投了 8 BB，于是跟到了 28 BB。当时不只是算一笔牌的价格，也是想在散场前参与这个大底池。",
          "掬一捧後手很深，也覺得前面已經投了 8 BB，於是跟到了 28 BB。當時不只是算一筆牌的價格，也是想在散場前參與這個大底池。",
          "掬一捧 had a deep stack and felt the 8 BB already invested pulled him toward calling to 28 BB. In that moment, joining a big pot before the session ended mattered alongside the price of the hand.",
        ),
        L(
          "回头想，如果腾腾一开始就开到 6 BB、星星再加注，掬一捧多半就弃牌了。正是先平跟、再全下的这条路径，让这一把走成了现在的故事。",
          "回頭想，如果騰騰一開始就開到 6 BB、星星再加注，掬一捧多半就棄牌了。正是先平跟、再全下的這條路徑，讓這一把走成了現在的故事。",
          "Looking back, 掬一捧 would probably have folded if 腾腾 had opened to 6 BB and 星星 had re-raised. The actual limp-then-shove sequence is what led to this particular story.",
        ),
      ],
      quote: L("最后一把快乐一把。", "最後一把快樂一把。", "One last hand, let’s enjoy it."),
    },
  },
  {
    id: "headsUp",
    title: L("这次真有牌，但我也有听牌", "這次真有牌，但我也有聽牌", "A real hand meets a real draw"),
    subtitle: L("7♠ 9♠ · 熟人之间的一次对抗", "7♠ 9♠ · 熟人之間的一次對抗", "7♠ 9♠ · A contest between familiar opponents"),
    heroId: "B",
    players: [
      { id: "A", personId: "xingxing", hand: [card("Q", "diamonds"), card("Q", "clubs")], stack: 260, position: "SB" },
      { id: "B", personId: "juyipeng", hand: [card("7", "spades"), card("9", "spades")], stack: 120, stackApprox: true },
    ],
    overview: L(
      "掬一捧熟悉星星在盲位的诈唬习惯，用 7♠ 9♠ 跟进，翻牌听顺后决定再顶一次。没想到星星这次真有 QQ；转牌与河牌，又把结局交给了顺子。",
      "掬一捧熟悉星星在盲位的詐唬習慣，用 7♠ 9♠ 跟進，翻牌聽順後決定再頂一次。沒想到星星這次真有 QQ；轉牌與河牌，又把結局交給了順子。",
      "Knowing 星星’s tendency to bluff from the blinds, 掬一捧 called with 7♠ 9♠ and pushed back when the flop brought a straight draw. This time 星星 really had QQ. The turn and river would give the ending to a straight.",
    ),
    assumptions: [
      L(
        "星星确认为小盲；掬一捧的位置、其他玩家此前的行动及可能弃牌的盲注未记录。",
        "星星確認為小盲；掬一捧的位置、其他玩家此前的行動及可能棄牌的盲注未記錄。",
        "星星 is confirmed as the small blind. 掬一捧’s position, earlier actions by other players and any folded blind contributions were not recorded.",
      ),
      L(
        "按本手开始时星星有 260 BB、掬一捧约 120 BB 解读补充筹码；有效筹码约 120 BB。",
        "按本手開始時星星有 260 BB、掬一捧約 120 BB 解讀補充籌碼；有效籌碼約 120 BB。",
        "The supplied stacks are interpreted as 260 BB for 星星 and about 120 BB for 掬一捧 at the start of the hand: approximately 120 BB effective.",
      ),
      L(
        "“Raise 60 BB”按翻牌累计加注到 60 BB 记录，不是额外加 60 BB。",
        "「Raise 60 BB」按翻牌累計加注到 60 BB 記錄，不是額外加 60 BB。",
        "“Raise 60 BB” means a total flop contribution of 60 BB, not an additional 60 BB.",
      ),
      L(
        "全下金额由上述筹码推算，掬一捧筹码是约数，因此底池与跟注门槛也是近似值。",
        "全下金額由上述籌碼推算，掬一捧籌碼是約數，因此底池與跟注門檻也是近似值。",
        "All-in amounts are inferred from those stacks. 掬一捧’s stack is approximate, so pot sizes and the call threshold are approximate too.",
      ),
      L(
        "星星在盲位常诈唬，是掬一捧提供的熟人观察；这手已知 QQ，不能把印象写成本手诈唬的事实。",
        "星星在盲位常詐唬，是掬一捧提供的熟人觀察；這手已知 QQ，不能把印象寫成本手詐唬的事實。",
        "Frequent bluffing from the blinds is 掬一捧’s reported read on 星星. This hand is known to be QQ; that read does not mean this particular bet was a bluff.",
      ),
      L(
        "概率按双方已知手牌计算；当时的行动依据是对手范围与熟人观察，并非预先看见 QQ。",
        "機率按雙方已知手牌計算；當時的行動依據是對手範圍與熟人觀察，並非預先看見 QQ。",
        "Probabilities use both revealed hands. The live decisions were based on ranges and personal reads, without advance knowledge of QQ.",
      ),
    ],
    streets: [
      {
        id: "preflop",
        board: [],
        actions: [
          action("A", L("加注至", "加注至", "Raise to"), 8, "raise"),
          action("B", L("跟注至", "跟注至", "Call to"), 8, "call"),
        ],
        analysis: [
          analysis("A", L("QQ：盲位习惯之外的一手真牌", "QQ：盲位習慣之外的一手真牌", "QQ: more than a familiar blind steal"),
            L(
              "星星在小盲加注到 8 BB，这次底牌是 QQ。掬一捧熟悉他的盲位诈唬习惯，但一个经常诈唬的朋友也会拿到强牌。QQ 做大底池有价值基础；8 BB 的尺寸较大，是否适合仍取决于此前行动和大家的跟注习惯。",
              "星星在小盲加注到 8 BB，這次底牌是 QQ。掬一捧熟悉他的盲位詐唬習慣，但一個經常詐唬的朋友也會拿到強牌。QQ 做大底池有價值基礎；8 BB 的尺寸較大，是否適合仍取決於此前行動和大家的跟注習慣。",
              "星星 raised to 8 BB from the small blind with QQ. 掬一捧 knew his tendency to bluff from the blinds, but a friend who bluffs can also pick up a strong hand. QQ has a clear reason to build a value pot. The large 8 BB size still depends on earlier action and the table’s calling habits.",
            )
          ),
          analysis("B", L("97s：想抓熟人的一次诈唬", "97s：想抓熟人的一次詐唬", "97s: challenging a familiar pattern"),
            L(
              "掬一捧跟进的出发点，是对星星盲位习惯的了解，想用 79s 抓一次诈唬。这让跟注有了具体背景，而不只是看见同花就入池。数学上，8 BB 仍是一笔不小的入场费，约 120 BB 有翻后空间，但 97s 通常需要改善；这时的“抓诈唬”是对抗动机，并非已经拿着能稳稳抓诈唬的成手牌。",
              "掬一捧跟進的出發點，是對星星盲位習慣的了解，想用 79s 抓一次詐唬。這讓跟注有了具體背景，而不只是看見同花就入池。數學上，8 BB 仍是一筆不小的入場費，約 120 BB 有翻後空間，但 97s 通常需要改善；這時的「抓詐唬」是對抗動機，並非已經拿著能穩穩抓詐唬的成手牌。",
              "掬一捧 called 79s because of his read on 星星’s habits in the blinds: he wanted to catch a familiar bluff. That gives the call a specific context. Numerically, 8 BB is still an expensive entry. Around 120 BB leaves postflop room, but 97s usually needs to improve. “Catching a bluff” describes the intention here, not an already strong bluff-catching made hand.",
            )
          ),
        ],
        note: L("已知翻前底池 16 BB，掬一捧翻后约剩 112 BB。", "已知翻前底池 16 BB，掬一捧翻後約剩 112 BB。", "Recorded preflop pot: 16 BB. 掬一捧 has about 112 BB left for the flop."),
      },
      {
        id: "flop",
        board: [card("10", "diamonds"), card("8", "clubs"), card("5", "hearts")],
        actions: [
          action("A", L("下注", "下注", "Bet"), 30, "raise"),
          action("B", L("加注至", "加注至", "Raise to"), 60, "raise"),
          action("A", L("全下至", "全下至", "All-in to"), 252, "all-in"),
          action("B", L("跟全下至约", "跟全下至約", "Call all-in to ≈"), 112, "all-in"),
        ],
        analysis: [
          analysis("A", L("QQ：大注背后，这次有超对", "QQ：大注背後，這次有超對", "QQ: this big bet holds an overpair"),
            L(
              "在 T♦ 8♣ 5♥ 上，星星的 QQ 是超对。30 BB 约为已知 16 BB 底池的 1.88 倍，这个大尺寸被掬一捧读成了熟悉的施压。星星面对加注随即全下，可以向听牌收费，也可能遇到暗三条或两对；评价这步仍需对手范围。这里两个人对同一次下注的理解，恰好完全不同。",
              "在 T♦ 8♣ 5♥ 上，星星的 QQ 是超對。30 BB 約為已知 16 BB 底池的 1.88 倍，這個大尺寸被掬一捧讀成了熟悉的施壓。星星面對加注隨即全下，可以向聽牌收費，也可能遇到暗三條或兩對；評價這步仍需對手範圍。這裡兩個人對同一次下注的理解，恰好完全不同。",
              "星星 has an overpair on T♦ 8♣ 5♥. His 30 BB bet is about 1.88 times the recorded 16 BB pot; 掬一捧 read that size as familiar pressure. 星星 immediately shoved over the raise, charging draws while also risking running into sets or two pair. Assessing it still requires an opponent range. The same bet carried very different meanings to the two friends.",
            )
          ),
          analysis("B", L("加到 60 BB：不信，也有听牌", "加到 60 BB：不信，也有聽牌", "To 60 BB: disbelief backed by a draw"),
            L(
              "掬一捧觉得星星又想用 30 BB 吓走人，自己手里的 7、9 又接上 8、T，有 6 或 J 成顺的机会，于是加到 60 BB。这是有熟人观察依据的半诈唬反击：既争取让更好的牌弃掉，也保留改善机会，并非纯抓诈唬。加注后只剩约 52 BB；当星星随即全下，新的强度信息值得重新计入范围。若星星总是不弃牌而直接推回，对实际 QQ 这条加注再跟全下的完整线路并不划算，不能只凭最后跟注价格合适评价前面的加注。",
              "掬一捧覺得星星又想用 30 BB 嚇走人，自己手裡的 7、9 又接上 8、T，有 6 或 J 成順的機會，於是加到 60 BB。這是有熟人觀察依據的半詐唬反擊：既爭取讓更好的牌棄掉，也保留改善機會，並非純抓詐唬。加注後只剩約 52 BB；當星星隨即全下，新的強度資訊值得重新計入範圍。若星星總是不棄牌而直接推回，對實際 QQ 這條加注再跟全下的完整路線並不划算，不能只憑最後跟注價格合適評價前面的加注。",
              "掬一捧 felt the 30 BB bet was another attempt to scare him away. His seven and nine connected with the eight and ten, so a six or jack could make a straight, and he raised to 60 BB. This was a read-based semi-bluff: a chance to fold better hands plus a chance to improve, rather than a pure bluff catch. The raise left about 52 BB. 星星’s immediate shove supplied new information for the range assessment. If 星星 never folds and always shoves, the full raise-call line is unprofitable against the actual QQ; the final call’s price alone does not validate the raise.",
            )
          ),
          analysis("B", L("跟全下：心情之外，再看价格", "跟全下：心情之外，再看價格", "Calling the shove: a look at the price"),
            L(
              "按起始约 120 BB 计算，掬一捧已经投入翻前 8 BB、翻牌 60 BB，还需跟约 52 BB；跟后双方有效总池约 240 BB，所需权益约为 52 ÷ 240＝21.7%。星星多出的约 140 BB 无人匹配，应退回，不计入可赢底池。对摊开的 QQ，精算权益约 33.03%，因此单看这一步跟注有正的增量期望；实战则仍要用星星全下后的范围来判断。",
              "按起始約 120 BB 計算，掬一捧已經投入翻前 8 BB、翻牌 60 BB，還需跟約 52 BB；跟後雙方有效總池約 240 BB，所需權益約為 52 ÷ 240＝21.7%。星星多出的約 140 BB 無人匹配，應退回，不計入可贏底池。對攤開的 QQ，精算權益約 33.03%，因此單看這一步跟注有正的增量期望；實戰則仍要用星星全下後的範圍來判斷。",
              "With about 120 BB initially, 掬一捧 has invested 8 BB preflop and 60 BB on the flop, leaving about 52 BB to call. The matched final pot is about 240 BB, requiring 52 ÷ 240 = 21.7% equity. 星星’s unmatched approximately 140 BB is returned, not included in the prize. Exact equity against the revealed QQ is about 33.03%, giving this call positive incremental expectation. At the table, the decision still uses 星星’s shoving range.",
            )
          ),
          analysis("B", L("八张成顺牌，仍有后续变化", "八張成順牌，仍有後續變化", "Eight straight cards, with redraws still possible"),
            L(
              "6 或 J 可以完成顺子，但两张牌未发时，八张成顺牌乘以四不是精确胜率。例如转牌 J 让 97 成顺，随后若来 9，星星的 Q 又会组成更大的顺子。这里的概率完整枚举转河牌，也计入平局；期待成顺与最终赢牌，是这段等待里的两个不同数字。",
              "6 或 J 可以完成順子，但兩張牌未發時，八張成順牌乘以四不是精確勝率。例如轉牌 J 讓 97 成順，隨後若來 9，星星的 Q 又會組成更大的順子。這裡的機率完整枚舉轉河牌，也計入平局；期待成順與最終贏牌，是這段等待裡的兩個不同數字。",
              "A six or jack completes the straight, but eight completing cards multiplied by four is not an exact probability with two cards to come. A turn jack can make 97’s straight, followed by a river nine giving 星星 a higher straight with his queen. The displayed probabilities enumerate the full runout and include ties. Making the straight and winning the hand remain different possibilities.",
            )
          ),
        ],
        note: L(
          "按筹码推算：星星翻牌推入 252 BB，掬一捧跟至约 112 BB；星星未匹配的约 140 BB 退回，已知有效底池约 240 BB。",
          "按籌碼推算：星星翻牌推入 252 BB，掬一捧跟至約 112 BB；星星未匹配的約 140 BB 退回，已知有效底池約 240 BB。",
          "Inferred from stacks: 星星 contributes 252 BB on the flop and 掬一捧 matches about 112 BB. 星星’s unmatched approximately 140 BB is returned. The recorded matched pot is about 240 BB.",
        ),
      },
      {
        id: "turn",
        board: [card("10", "diamonds"), card("8", "clubs"), card("5", "hearts"), card("J", "spades")],
        actions: [],
        analysis: [
          analysis("B", L("J♠：等到了想要的顺子", "J♠：等到了想要的順子", "J♠: the straight arrives"),
            L(
              "J♠ 把掬一捧的 7、8、9、T 接成 J 高顺子，反超星星的 QQ。这张牌接住了前一街的听牌期待，但还剩最后一张：任一剩余的 9，都会让星星用 Q 组成更大的顺子。双方有效筹码已全下，这里只更新牌力与概率。",
              "J♠ 把掬一捧的 7、8、9、T 接成 J 高順子，反超星星的 QQ。這張牌接住了前一街的聽牌期待，但還剩最後一張：任一剩餘的 9，都會讓星星用 Q 組成更大的順子。雙方有效籌碼已全下，這裡只更新牌力與機率。",
              "J♠ completes 掬一捧’s jack-high straight and overtakes 星星’s QQ. It delivers on the flop draw, but one card remains: any remaining nine gives 星星 a higher straight with his queen. Effective stacks are already all-in, so this street only updates hand strength and probability.",
            )
          ),
          analysis("A", L("QQ：还留着三张 9", "QQ：還留著三張 9", "QQ: three nines remain"),
            L(
              "星星暂时落后，但剩余三张 9 仍可在河牌反超。另一处容易看错的细节是黑桃：J♠ 没有给掬一捧同花听牌，即使河牌再来黑桃，最终七张牌也只有四张黑桃。",
              "星星暫時落後，但剩餘三張 9 仍可在河牌反超。另一處容易看錯的細節是黑桃：J♠ 沒有給掬一捧同花聽牌，即使河牌再來黑桃，最終七張牌也只有四張黑桃。",
              "星星 is behind, but the three remaining nines can still reverse the result on the river. One other detail: J♠ does not give 掬一捧 a flush draw. Even a spade river would leave only four spades among his seven cards.",
            )
          ),
        ],
        note: L("顺子已经到手，河牌仍留着三张 9 的悬念。", "順子已經到手，河牌仍留著三張 9 的懸念。", "The straight is made, with three nines still keeping the river uncertain."),
      },
      {
        id: "river",
        board: [card("10", "diamonds"), card("8", "clubs"), card("5", "hearts"), card("J", "spades"), card("7", "clubs")],
        actions: [],
        analysis: [
          analysis("B", L("7♣：顺子守到了最后", "7♣：順子守到了最後", "7♣: the straight holds"),
            L(
              "河牌落下 7♣，星星未能反超，最终是一对 Q，配 J、T、8 踢脚；掬一捧仍以 7、8、9、T、J 顺子获胜。一次想抓诈唬的入场，最后以听牌成真收池。",
              "河牌落下 7♣，星星未能反超，最終是一對 Q，配 J、T、8 踢腳；掬一捧仍以 7、8、9、T、J 順子獲勝。一次想抓詐唬的入場，最後以聽牌成真收池。",
              "The river is 7♣. 星星 finishes with a pair of queens and J, T, 8 kickers; 掬一捧’s 7–8–9–T–J straight holds. A hand entered to challenge a bluff ends with a draw that came through.",
            )
          ),
        ],
        note: L("这次对手真有牌，自己的听牌也真的到了。", "這次對手真有牌，自己的聽牌也真的到了。", "This time the strong hand was real, and the draw came through too."),
      },
    ],
    result: {
      winner: "B",
      label: L("顺子 · 789TJ", "順子 · 789TJ", "Straight · 789TJ"),
      body: L(
        "掬一捧用顺子收取约 240 BB 的已知有效底池，含自己的约 120 BB，净赢约 120 BB。对星星习惯的一次试探，留下了“真有牌，也有听牌”的这一手。",
        "掬一捧用順子收取約 240 BB 的已知有效底池，含自己的約 120 BB，淨贏約 120 BB。對星星習慣的一次試探，留下了「真有牌，也有聽牌」的這一手。",
        "掬一捧’s straight collects the recorded matched pot of about 240 BB, including his approximately 120 BB, for a net gain of about 120 BB. Testing a familiar read on 星星 left a memory of a real hand meeting a draw that arrived.",
      ),
    },
    takeaways: [
      L(
        "一起玩久了，一个盲位、一个下注尺寸，就会让人想起熟悉的打法。",
        "一起玩久了，一個盲位、一個下注尺寸，就會讓人想起熟悉的打法。",
        "After enough games together, a blind position or a bet size can bring a familiar pattern to mind.",
      ),
      L(
        "这次星星真有 QQ，掬一捧也不是空手：两端顺听让这场对抗继续了下去。",
        "這次星星真有 QQ，掬一捧也不是空手：兩端順聽讓這場對抗繼續了下去。",
        "星星 really had QQ this time, and 掬一捧 had an open-ended draw that kept the contest going.",
      ),
      L(
        "记住的不只是谁收池，还有彼此熟悉、又偶尔猜不准的那一点乐趣。",
        "記住的不只是誰收池，還有彼此熟悉、又偶爾猜不準的那一點樂趣。",
        "The memory is more than who won: it is knowing each other’s game, and still being surprised.",
      ),
    ],
    potNote: L(
      "约数按掬一捧起始 120 BB 推算；仅计两人记录的总投入，不另加未记录的弃牌筹码与抽水。",
      "約數按掬一捧起始 120 BB 推算；僅計兩人記錄的總投入，不另加未記錄的棄牌籌碼與抽水。",
      "Estimates assume 掬一捧 starts with 120 BB. Pots use only the two players’ recorded total contributions, with no extra unrecorded folded chips or rake.",
    ),
    story: {
      eyebrow: L("熟人才懂的对抗", "熟人才懂的對抗", "A familiar contest"),
      title: L("知道他的习惯，也想试试他的底气", "知道他的習慣，也想試試他的底氣", "A familiar read, put to the test"),
      paragraphs: [
        L(
          "这手星星坐小盲。在掬一捧的印象里，星星在大小盲经常拿普通牌诈唬。于是，面对 8 BB，掬一捧用 79s 跟进，想抓一次熟人的诈唬；只是这次没想到，对面真的是 QQ。",
          "這手星星坐小盲。在掬一捧的印象裡，星星在大小盲經常拿普通牌詐唬。於是，面對 8 BB，掬一捧用 79s 跟進，想抓一次熟人的詐唬；只是這次沒想到，對面真的是 QQ。",
          "星星 was in the small blind. In 掬一捧’s experience, 星星 often bluffed with ordinary hands from either blind. 掬一捧 called 8 BB with 79s to challenge that familiar pattern, without expecting the actual QQ.",
        ),
        L(
          "翻牌 T♦ 8♣ 5♥，星星打出 30 BB。这个想把人吓走的尺寸，在掬一捧看来太熟悉了；自己又有两端顺听，于是加注到 60 BB。星星随即全下，原本对熟人习惯的判断，就这样碰上了一手真强牌。",
          "翻牌 T♦ 8♣ 5♥，星星打出 30 BB。這個想把人嚇走的尺寸，在掬一捧看來太熟悉了；自己又有兩端順聽，於是加注到 60 BB。星星隨即全下，原本對熟人習慣的判斷，就這樣碰上了一手真強牌。",
          "On T♦ 8♣ 5♥, 星星 bet 30 BB. To 掬一捧, the sizing felt like a familiar attempt to scare him away. Holding an open-ended draw, he raised to 60 BB. 星星 immediately shoved: a read based on a friend’s habits had met a genuinely strong hand.",
        ),
      ],
    },
  },
];

export const REVIEW_SOURCES = [
  {
    label: "PokerStars · Pot odds",
    url: "https://www.pokerstars.com/poker/learn/lesson/pot-odds/",
  },
  {
    label: "PokerStars · Calculating outs",
    url: "https://www.pokerstars.com/poker/learn/lesson/calculating-outs/",
  },
  {
    label: "PokerStars · Poker rules",
    url: "https://www.pokerstars.com/help/articles/poker-rules-master/217459/",
  },
];
