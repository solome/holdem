import { FRIEND_TABLE_STORAGE_KEY } from "./friend-table-view.mjs";

// Workers cannot read localStorage. Keep storage on the document and send the
// saved record to the worker for validation, migration and simulation.
export function createFriendTableClient(doc, peopleIds) {
  const win = doc.defaultView;
  const assets = new URL("assets/build/", doc.baseURI);
  let offlineSource;

  function loadOfflineSource() {
    offlineSource ??= new Promise((resolve, reject) => {
      const script = doc.createElement("script");
      script.src = new URL("friend-table-offline.js", assets);
      script.onload = () => {
        const source = win.holdemFriendTableWorkerSource;
        delete win.holdemFriendTableWorkerSource;
        script.remove();
        if (typeof source === "string") resolve(source);
        else reject(new Error("Missing friend table worker source."));
      };
      script.onerror = () => {
        script.remove();
        reject(new Error("Could not load the friend table worker."));
      };
      doc.head.append(script);
    }).catch((error) => {
      offlineSource = undefined;
      throw error;
    });
    return offlineSource;
  }

  return {
    async deal(previous) {
      let savedRecord;
      if (!previous) {
        try { savedRecord = win.localStorage.getItem(FRIEND_TABLE_STORAGE_KEY); } catch { /* Optional offline storage. */ }
      }
      // A separate classic script can load from disk; a file:// Worker URL
      // cannot in all browsers. Reuse a Blob URL as in the odds calculator.
      let localURL;
      let worker;
      try {
        if (assets.protocol === "file:") {
          const source = await loadOfflineSource();
          localURL = win.URL.createObjectURL(new win.Blob([source], { type: "text/javascript" }));
        }
        worker = new win.Worker(localURL ?? new URL("friend-table-worker.js", assets));
        const { table, record } = await new Promise((resolve, reject) => {
          worker.onmessage = ({ data }) => {
            if (data.error || !data.table) reject(new Error(data.error || "Missing friend table result."));
            else resolve(data);
          };
          worker.onerror = (event) => {
            event.preventDefault();
            reject(new Error(event.message || "Friend table worker failed."));
          };
          worker.onmessageerror = () => reject(new Error("Could not read the friend table result."));
          worker.postMessage({ peopleIds, savedRecord, previous });
        });
        if (record) {
          try { win.localStorage.setItem(FRIEND_TABLE_STORAGE_KEY, record); } catch { /* Keep the hand in memory. */ }
        }
        return table;
      } finally {
        worker?.terminate();
        if (localURL) win.URL.revokeObjectURL(localURL);
      }
    },
  };
}
