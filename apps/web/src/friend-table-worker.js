import { createFriendTableStore, redealFriendTable } from "./friend-table.mjs";

self.onmessage = ({ data: { peopleIds, savedRecord, previous } }) => {
  try {
    if (previous) {
      const table = redealFriendTable(previous, { peopleIds });
      self.postMessage({ table, record: JSON.stringify(table) });
      return;
    }
    let record;
    const storage = {
      getItem: () => savedRecord,
      setItem: (_key, value) => { record = value; },
    };
    // Reuse the same version, validation and migration logic as the local store.
    const { table } = createFriendTableStore({ peopleIds, storage }).load();
    self.postMessage({ table, record });
  } catch (error) {
    self.postMessage({ error: error.message });
  }
};
