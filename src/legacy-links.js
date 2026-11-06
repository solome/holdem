// Resolve bookmarks from the old single-page site before loading the homepage.
function redirectOldBookmark() {
  const match = /^#(ranges|odds|review|handbook|tilt|reading)(?:\/([a-z0-9-]+))?$/.exec(location.hash);
  if (match) location.replace(match[1] + ".html" + location.search + (match[2] ? "#" + match[1] + "-" + match[2] : ""));
}
redirectOldBookmark();
window.addEventListener("hashchange", redirectOldBookmark);
