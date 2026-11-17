import { REVIEW_PEOPLE } from "./review-people.mjs";

// Relative to the document, including when the site is opened from disk.
export const AVATAR_URLS = Object.freeze(Object.fromEntries(
  Object.keys(REVIEW_PEOPLE).map((id) => [id, `assets/avatars/${id}.webp`]),
));
