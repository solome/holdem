import { calculateOdds } from "./poker-odds.mjs";

self.onmessage = ({ data: deal }) => {
  try {
    self.postMessage({ result: calculateOdds(deal) });
  } catch (error) {
    self.postMessage({ error: error.message });
  }
};
