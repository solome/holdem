export function registerPWA(win = window) {
  const { location, document, navigator } = win;
  if (location.protocol === "file:" || !win.isSecureContext || !("serviceWorker" in navigator)) return;

  const root = new URL("./", location.href);
  const sw = navigator.serviceWorker;

  async function register() {
    try {
      const registration = await sw.register(new URL("service-worker.js", root), {
        scope: root.href,
        updateViaCache: "none",
      });
      let lastUpdate = Date.now();
      function checkOnResume() {
        if (document.visibilityState !== "visible" || Date.now() - lastUpdate < 5 * 60 * 1000) return;
        lastUpdate = Date.now();
        registration.update().catch(() => {});
      }
      document.addEventListener("visibilitychange", checkOnResume);
      win.addEventListener("pageshow", checkOnResume);
    } catch { /* Installation and cache storage are optional. */ }
  }

  // Initial content and page-specific rendering take priority over precaching.
  const queue = () => {
    if (win.requestIdleCallback) win.requestIdleCallback(register, { timeout: 1500 });
    else win.setTimeout(register, 0);
  };
  if (document.readyState === "complete") queue();
  else win.addEventListener("load", queue, { once: true });
}
