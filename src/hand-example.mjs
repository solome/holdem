import { renderHandText } from "./cash/inline-hands.mjs";
import { parseCardTokens } from "./card-notation.mjs";
import { REVIEW_PEOPLE } from "./review-people.mjs";
import { AVATAR_URLS } from "./review-avatar-urls.js";

const streetInfo = {
  "翻牌前": ["preflop", 0], "翻牌": ["flop", 3], "转牌": ["turn", 4], "河牌": ["river", 5],
};

// Each radio group controls a single static table. Only cards and actions
// available on that street are visible, even when JavaScript is disabled.
export function renderHandExample(id, example, renderCard) {
  const { question, hand, board, seats, stages, decision, amounts, action, reason, showdown } = example;
  const fail = message => { throw new Error(`Hand example ${id}: ${message}`); };
  const people = seats.map(({ personId }) => {
    if (!Object.hasOwn(REVIEW_PEOPLE, personId)) fail("unknown player: " + personId);
    return REVIEW_PEOPLE[personId];
  });
  if (new Set(people).size !== seats.length) fail("the same player occupies two seats");
  function names(text) {
    return text.replace(/\{p(\d+)\}/g, (_, index) => {
      if (!people[index]) fail("action refers to a missing seat: " + index);
      return people[index].name;
    });
  }
  const prose = text => renderHandText(names(text), renderCard);
  const hole = parseCardTokens(hand);
  const community = board ? parseCardTokens(board) : [];
  const opponent = showdown ? parseCardTokens(showdown.hand) : [];
  parseCardTokens([hand, board, showdown?.hand].filter(Boolean).join(" "));
  if (hole.length !== 2 || seats.length < 2 || (showdown &&
      (opponent.length !== 2 || !seats[showdown.seat] || showdown.seat === 0))) fail("invalid seats or hand");
  if (!stages.some(stage => stage.street === decision)) fail("missing decision street");
  let lastCount = -1;
  for (const stage of stages) {
    const count = streetInfo[stage.street]?.[1];
    if (count === undefined || count <= lastCount || count > community.length || !stage.line) fail("invalid stage: " + stage.street);
    if (stage.folded?.some(index => !seats[index])) fail("unknown folded player");
    lastCount = count;
  }
  if (lastCount !== community.length) fail("unaccounted board cards");

  const cards = list => list.map((c, index) => renderCard(c, { fan: false, index, count: list.length })).join("");
  const phase = street => streetInfo[street][0];
  const at = street => `data-at="${phase(street)}"`;
  const titleId = `example-${id}`;

  const number = example.number;

  function seat(player, index) {
    const person = people[index];
    const folded = stages.filter(s => s.folded?.includes(index)).map(s => phase(s.street)).join(" ");
    return `<div class="replay-seat" data-seat="${index}" data-person="${person.id}"${folded ? ` data-folded="${folded}"` : ""}>
      <img class="replay-portrait" src="${AVATAR_URLS[person.id]}" width="48" height="48" loading="lazy" decoding="async" alt=""><span class="replay-name">${person.name}</span>
      ${player.position ? `<span class="replay-position">${player.position}</span>` : ""}
      ${folded ? '<span class="replay-folded">已弃牌</span>' : ""}</div>`;
  }
  const controls = stages.map(s => `<label><input type="radio" name="${titleId}-street" value="${phase(s.street)}"${s.street === decision ? " checked" : ""}><span>${s.street}</span></label>`).join("");
  const boardSlots = Array.from({ length: 5 }, (_, i) => `<span class="replay-slot" data-dealt="${i < 3 ? "flop" : i === 3 ? "turn" : "river"}"><span class="replay-unknown" role="img" aria-label="未发出的公共牌">♠</span>${community[i] ? cards([community[i]]) : ""}</span>`).join("");
  const onlyPreflop = community.length === 0;
  const streetDisplay = onlyPreflop
    ? `<p class="replay-preflop-line">${prose(stages[0].line)}</p>`
    : `<div class="replay-board" role="group" aria-label="公共牌">${boardSlots}</div>`;
  const finalStreet = stages.at(-1).street;
  return `<figure class="hand-example" id="${titleId}"><figcaption id="${titleId}-question"><a class="example-permalink" href="#${titleId}" aria-label="牌例 ${number}，${names(example.title ?? question)}"><span>牌例 ${number}</span>${names(example.title ?? question)}</a></figcaption>
    <fieldset class="replay" aria-labelledby="${titleId}-question">
      <div class="replay-room">
        <div class="replay-rivals" role="group" aria-label="其他玩家">${seats.slice(1).map((p, i) => seat(p, i + 1)).join("")}</div>
        <div class="replay-felt table-felt">
          <div class="replay-controls" role="radiogroup" aria-label="牌局阶段">${controls}</div>
          ${streetDisplay}
          <div class="replay-pot">${stages.map(s => s.pot != null ? `<span ${at(s.street)}>底池 <b>${s.pot}</b></span>` : "").join("")}</div>
        </div>
        <div class="replay-hero">${seat(seats[0], 0)}<div class="replay-cards" role="group" aria-label="${people[0].name}的手牌">${cards(hole)}</div></div>
      </div>
      <div class="replay-notes">
        ${onlyPreflop ? "" : stages.map(s => `<p class="replay-line" ${at(s.street)}><strong>${s.street}</strong> · ${prose(s.line)}</p>`).join("")}
        ${stages.filter(s => s.review).map(s => `<div class="street-review" ${at(s.street)}><details class="example-answer"><summary>${s.review.question}</summary><p>${prose(s.review.reason)}</p></details></div>`).join("")}
        <div class="replay-analysis" ${at(decision)}>
          ${example.title ? `<h3 class="example-question">${prose(question)}</h3>` : ""}
          ${example.given ? `<p class="example-given">${prose(example.given)}</p>` : ""}
          <details class="example-answer"><summary>看判断与计算</summary>
          ${amounts?.length ? `<dl class="example-amounts">${amounts.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join("")}</dl>` : ""}
          <p class="example-decision"><strong>${prose(action)}</strong>${prose(reason)}</p>
          ${example.variation ? `<p class="replay-variation"><b>换一个范围。</b>${prose(example.variation)}</p>` : ""}</details></div>
        ${showdown ? `<details class="example-showdown" ${at(finalStreet)}><summary>看${people[showdown.seat].name}的摊牌</summary><div><div class="replay-cards" role="group" aria-label="${people[showdown.seat].name}的手牌">${cards(opponent)}</div><p>${prose(showdown.note)}</p></div></details>` : ""}
        ${example.source ? `<p class="replay-source">${example.source}</p>` : ""}
      </div></fieldset></figure>`;
}
