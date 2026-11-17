import players from "../../../shared/players.json" with { type: "json" };

// Stable identities shared by the website's hands and friends list.
for (const person of Object.values(players)) {
  Object.freeze(person.traits);
  if (person.avatarSource) Object.freeze(person.avatarSource);
  Object.freeze(person);
}

export const REVIEW_PEOPLE = Object.freeze(players);
