import { cp, copyFile, mkdir, rm, writeFile } from "node:fs/promises";
import { pages } from "./site-pages.mjs";

import { verifySite } from "./verify-site.mjs";

const root = new URL("../", import.meta.url);
const out = new URL("_site/", root);
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await Promise.all([
  ...pages.map(p => copyFile(new URL(p.file, root), new URL(p.file, out))),
  cp(new URL("assets/", root), new URL("assets/", out), { recursive: true }),
  writeFile(new URL(".nojekyll", out), ""),
]);
await verifySite(out);
console.log(`GitHub Pages artifact ready: ${pages.length} documents and assets in _site/.`);
