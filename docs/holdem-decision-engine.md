# 德州决策引擎

策略版本：`policyVersion: 5`。入口：`src/holdem-decision-engine.mjs`。所有代码在浏览器本地运行，不请求外部模型或服务。七位玩家使用同一算法，各自保留模拟风格和独立随机序列。

## 目标与信息

目标是提高一次行动的**预期净收益（BB）**，而非单纯提高赢下这一手的概率。已经投入底池的筹码视为沉没成本；便宜跟注、价值下注、让对手弃牌的进攻可能各有收益。选择以当前范围模型的估计为依据，不能据此保证长期“水上”。七位玩家互相博弈，在没有抽水的封闭牌桌中总输赢为零，不可能人人同时盈利。

决策输入包含自己的两张手牌、当前街已发出的公共牌、位置、底池、需补金额、合法加注边界、公开筹码和行动历史。下注状态机对历史使用白名单，只传人物、动作、金额和底池等公开字段，不传对手手牌、未来牌、私有意图、计划或 EV。输入的街与公共牌数量必须一致。

## 一次决策如何产生

1. **推测范围。** 从所有合法两张牌组合开始，按对手位置、翻前平跟／开池／再加注、翻后下注／跟注／加注给组合不同权重。权重保留小概率尾部，允许诈唬；这是一套可替换的启发式模型，不是精确还原对手手牌。
2. **共同抽样。** 默认每次抽样 128 组可能的对手手牌及未来公共牌。各对手先独立按权重抽样，撞牌则整组重抽，保证联合分布在互不撞牌条件下成立。排除的已知牌只有本人底牌与当前公共牌。所有候选动作共用样本和回应随机数，降低不同尺寸比较的噪声。
3. **产生合法候选。** 过牌或弃牌、跟注、隔离／再加注、多个翻后下注尺度均先作为候选。翻前提议结合位置、平跟人数、前序加注与有效筹码；翻后比较约 1/3、玩家偏好尺度（通用默认 1/2）、3/4 底池，面对下注比较合法加注尺度。金额按半个 BB 取整，受最小加注和可覆盖筹码约束。
4. **估计对手回应。** 对每个样本，依据假想对手的当前成牌、听牌、面对价格和公开施压估计跟注概率。回应模型看不到抽样的未来发牌，更看不到本人的实际底牌。跟注者越强，继续争夺底池时的权益可能越低，因此单独计算被跟注后的条件权益。
5. **比较增量 EV。** 汇总全弃、有人跟注、获胜、失利和平局分池的收益。仅在估计非负的动作中选择，优先收益较高的候选；接近时混合。模拟进攻频率保留过牌／跟注的可能，未使用的进攻概率回到最高 EV 的被动动作。

## 计算口径

设当前底池为 `P`，自己从本决策点起新增投入 `C`，回应者新增投入合计 `R`，摊牌时自己的底池份额为 `S`（独赢 1、输 0、平局按人数分），权益实现系数为 `α`：

```text
所有人弃牌：收益 = P
有人继续：  收益 = S × α × (P + C + R) − C
动作 EV：  对共同抽样世界取平均
弃牌 EV：  0
```

未被跟注的新增筹码返回自己，不算额外获利。当前底池中的本人旧投入不再扣一次。权益实现系数默认翻前 0.85、翻牌 0.92、转牌 0.97、河牌 1，是用于补偿未模拟未来行动的简化折扣，支持替换；它不是已验证的现实世界参数。

所有默认候选的未来价格采用一轮跟注／弃牌回应；后续加注、反加注、未来街下注和抽水未进入此 EV 估计。真实推进牌局时，每一位玩家仍会在轮到自己时重新调用同一引擎，可以实际加注与再加注。这两个层次应区分：**合法动作由状态机完整推进，策略收益使用有限近似。**

## 持续下注与诈唬

最后一位翻前加注者拥有翻前主动权；先开池但随后跟了别人 3-bet，不继续视为自己拥有主动权。干燥单挑、湿润多人底池、超对保护、转牌改善听牌和转牌高张分别影响候选计划及频率。持续下注也可能是价值下注，不只统计动作原因恰好叫“持续下注”的分支。

纯诈唬、真实听牌半诈唬与价值进攻分别记录。纯诈唬频率只是合适机会下的偏好，不强制执行估计为负收益的进攻；权益来自被跟注范围，不因手中存在 A/K/J 等高张便自动标为价值下注。频率参数属于本项目模拟配置，没有宣称是统一适用的 GTO 建议。

## API

```js
import { createHoldemDecisionEngine } from "./src/holdem-decision-engine.mjs";

const engine = createHoldemDecisionEngine({ samples: 128, cacheSize: 128 });
const decision = engine.decide(publicDecisionContext, {
  profile: simulationProfile,
  seed: reproducibleEquitySeed,
  random: independentActionRandom,
});
```

`publicDecisionContext` 由 `poker-engine.mjs` 产生。核心字段为 `personId`、`position`、`street`、`holeCards`、`board`、`pot`、`callCost`、`ownInvestment`（本街已投入）、`raiseTo`（需匹配的本街总额）、`remaining`、`minRaiseTo`、`maxRaiseTo`、`canRaise`、`players`、`history`、`priorHistory`。`players` 只有公开筹码、位置和弃牌状态；正常接入应传完整玩家列表。

输出包括 `type`、`to`（本街投入到多少）、`reason`、`intent`、可选 `plan`、`decisionProbabilities`、`bluffProbability`，以及用于验证的 `analysis`：

- `equity`、`potOdds`、`samples`：当前全体范围权益、即时底池赔率与样本数。
- `candidates`：各动作的成本、EV、全体弃牌概率、被跟注权益、预计跟注人数与权益实现系数。
- `selected`：所选动作及其估计 EV。
- `method`、`assumptions`：算法和近似假设。

`analysis` 保存在本地牌谱便于检查，不会进入其他玩家的公开历史。页面只显示简短行动原因和风格基准，不向用户堆叠内部调试字段。

可用 `engine.evaluate(context, options)` 只评估候选，不选择动作；`sampleOpponentWorlds` 可独立验证联合抽样。自定义 `rangeModel` 支持组合权重、回应概率和权益实现系数，便于后续换成经过对战标定的模型。`samples` 支持 1–4096；低样本适合批量冒烟检查，不能与生产 128 样本结果混用。

## 验证与边界

`tests/holdem-decision-engine.test.mjs` 检查无撞牌、隐藏信息隔离、沉没成本、全弃退款、多人跟注、条件权益、负收益动作拒绝与统一调用。`tests/friend-strategy-plan.test.mjs` 和 `scripts/friend-strategy-diagnostics.mjs` 用 AK/JJ、不同纹理、主动权和施压构造可复现回归场景；这些场景不作为引擎的手工输出表。`scripts/analyze-friend-table.mjs` 检查随机整桌行为。

本版没有训练、对真实对手自动学习或完整博弈树搜索，尚未建立相对基线的长期收益证据。前端牌桌也仍不支持全下边池、跨手资金余额和抽水，下一手重新安排模拟筹码。原有 10% 翻前结束等娱乐目标不再作为强制配额，旧版频率不能当作本版数据。

本次测试结果、场景对比和性能记录见[验证报告](holdem-decision-verification.md)。

策略原则参考 [Upswing：AK 的翻前和翻后处理](https://upswingpoker.com/how-to-play-ace-king-big-slick/)、[Upswing：面对多个平跟者](https://upswingpoker.com/vs-multiple-limpers/)、[PokerStars：持续下注](https://www.pokerstars.com/poker/learn/lesson/c-betting/)和[底池赔率](https://www.pokerstars.com/poker/learn/lesson/pot-odds/)。模型中的权重和频率是本项目的工程近似，不是直接复制这些来源的求解结果。
