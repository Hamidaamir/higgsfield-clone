import { chromium } from "playwright";
import { readFileSync } from "node:fs";
const files = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("about:blank");
for (const f of files) {
  const ext = f.split(".").pop();
  const mime = { mp3: "audio/mpeg", wav: "audio/wav", mp4: "video/mp4" }[ext];
  const b64 = readFileSync(f).toString("base64");
  const r = await page.evaluate(([src, isVideo]) => new Promise((res) => {
    const el = document.createElement(isVideo ? "video" : "audio");
    el.preload = "metadata";
    el.onloadedmetadata = () => res({ ok: true, duration: el.duration, w: el.videoWidth, h: el.videoHeight });
    el.onerror = () => res({ ok: false, code: el.error?.code });
    el.src = src;
  }), [`data:${mime};base64,${b64}`, ext === "mp4"]);
  console.log(f.split(/[\/]/).pop(), JSON.stringify(r));
}
await browser.close();
