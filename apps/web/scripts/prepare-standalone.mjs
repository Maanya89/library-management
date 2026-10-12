import { cp, mkdir } from "node:fs/promises";

const source = new URL("../.next/static/", import.meta.url);
const publicAssets = new URL("../public/", import.meta.url);
const standalone = new URL("../.next/standalone/apps/web/", import.meta.url);
const staticAssets = new URL(".next/static/", standalone);
const standalonePublic = new URL("public/", standalone);

await mkdir(staticAssets, { recursive: true });
await mkdir(standalonePublic, { recursive: true });
await cp(source, staticAssets, { recursive: true, force: true });
await cp(publicAssets, standalonePublic, { recursive: true, force: true });
