import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = new URL("../", import.meta.url);
const [template, css, rangeCss, selectCss, oddsCss] = await Promise.all(
  [
    "src/template.html",
    "src/styles.css",
    "src/ranges.css",
    "src/select-menu.css",
    "src/odds.css",
  ].map((file) => readFile(new URL(file, root), "utf8")),
);
const bundle = await build({
  entryPoints: [fileURLToPath(new URL("src/app.js", root))],
  bundle: true,
  write: false,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  legalComments: "none",
});
const script = bundle.outputFiles[0].text;
const html = template
  .replace(
    "/* INLINE_STYLES */",
    () => `${css}\n${rangeCss}\n${selectCss}\n${oddsCss}`,
  )
  .replace("/* INLINE_SCRIPT */", () =>
    script.replace(/<\/script/gi, "<\\/script"),
  );
await writeFile(new URL("index.html", root), html);
console.log(
  `Built ${fileURLToPath(new URL("index.html", root))} (${(Buffer.byteLength(html) / 1024).toFixed(1)} KB, no external assets)`,
);
