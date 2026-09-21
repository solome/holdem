import { copyFile, mkdir, rm, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const output = new URL("_site/", root);

// _site is generated and ignored by Git. Publish only the standalone page.
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await copyFile(new URL("index.html", root), new URL("index.html", output));
await writeFile(new URL(".nojekyll", output), "");
console.log("GitHub Pages artifact ready: _site/index.html");
