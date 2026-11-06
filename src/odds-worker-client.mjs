// The build embeds this self-contained worker in the calculator bundle so
// even an offline file:// preview can calculate without fetching a script.
export function startOddsCalculation(deal) {
  let worker;
  let url;
  let rejectTask;

  function dispose() {
    worker?.terminate();
    if (url) URL.revokeObjectURL(url);
    worker = null;
    url = null;
  }

  const promise = new Promise((resolve, reject) => {
    rejectTask = reject;
    try {
      const script = new Blob([__ODDS_WORKER_SOURCE__], { type: "text/javascript" });
      url = URL.createObjectURL(script);
      worker = new Worker(url);
      worker.onmessage = ({ data }) => {
        dispose();
        if (data.error) reject(new Error(data.error));
        else resolve(data.result);
      };
      worker.onerror = event => {
        dispose();
        reject(new Error(event.message || "Odds worker failed."));
      };
      worker.postMessage(deal);
    } catch (error) {
      dispose();
      reject(error);
    }
  });

  return {
    promise,
    cancel() {
      if (!worker) return;
      dispose();
      rejectTask(new DOMException("Calculation cancelled.", "AbortError"));
    },
  };
}
