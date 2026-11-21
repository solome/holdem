import { REVIEW_CASES } from "./review-cases.mjs";

export function readReviewLocation(url) {
  const cases = new URLSearchParams(url.hash.slice(1)).getAll("case");
  if (cases.length !== 1) return 0;
  return Math.max(0, REVIEW_CASES.findIndex(({ id }) => id === cases[0]));
}

export function writeReviewLocation(current, caseId) {
  const next = new URL(current);
  // The same fragment works on hosted and offline copies of the page.
  next.hash = new URLSearchParams({ case: caseId }).toString();
  return next;
}
