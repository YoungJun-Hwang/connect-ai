import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const project = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dist = path.join(project, "dist");
const htmlPath = path.join(dist, "index.html");
if (!fs.existsSync(htmlPath))
  throw new Error("먼저 npm run build를 실행해주세요.");
let html = fs.readFileSync(htmlPath, "utf8");
const scriptTag = html.match(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/);
const cssTag = html.match(/<link\b[^>]*\bhref="([^"]+\.css)"[^>]*>/);
if (!scriptTag || !cssTag) throw new Error("빌드된 JS·CSS를 찾지 못했습니다.");
const assetPath = (url) => {
  const resolved = path.resolve(
    dist,
    "." + (url.startsWith("/") ? url : "/" + url),
  );
  if (!resolved.startsWith(dist + path.sep))
    throw new Error("빌드 경로 밖의 파일은 포함할 수 없습니다.");
  return resolved;
};
const javascript = fs.readFileSync(assetPath(scriptTag[1]), "utf8");
const cssPath = assetPath(cssTag[1]);
let css = fs.readFileSync(cssPath, "utf8");
const characters = new Set(
  Array.from({ length: 95 }, (_, index) => index + 32),
);
function readCharacters(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) readCharacters(target);
    else if (/\.(tsx?|css)$/.test(entry.name)) {
      for (const char of fs.readFileSync(target, "utf8"))
        characters.add(char.codePointAt(0));
    }
  }
}
readCharacters(path.join(project, "src"));
let fontCount = 0;
css = css.replace(/@font-face\{([^}]+)\}/g, (rule, declarations) => {
  const range = declarations.match(/unicode-range:([^;]+)/)?.[1];
  if (range) {
    const spans = range.split(",").map((span) => {
      const [from, to] = span.trim().replace(/^U\+/i, "").split("-");
      return [Number.parseInt(from, 16), Number.parseInt(to || from, 16)];
    });
    if (
      ![...characters].some((code) =>
        spans.some(([from, to]) => code >= from && code <= to),
      )
    )
      return "";
  }
  const fontURL = declarations.match(
    /url\((?:["']?)([^)'"\s]+\.woff2)(?:["']?)\)/,
  )?.[1];
  if (!fontURL) throw new Error("WOFF2 글꼴을 찾지 못했습니다.");
  const fontFile = fontURL.startsWith("/")
    ? assetPath(fontURL)
    : path.resolve(path.dirname(cssPath), fontURL);
  if (!fontFile.startsWith(dist + path.sep))
    throw new Error("글꼴 경로가 빌드 폴더 밖입니다.");
  const encoded = fs.readFileSync(fontFile).toString("base64");
  fontCount++;
  return `@font-face{${declarations.replace(/src:[^;]+/, `src:url(data:font/woff2;base64,${encoded}) format("woff2")`)}}`;
});
if (/url\((?!["']?data:)/.test(css))
  throw new Error("외부 CSS 리소스가 남아 있습니다.");
html = html.replace(
  scriptTag[0],
  () =>
    `<script type="module">${javascript.replace(/<\/script/gi, "<\\/script")}</script>`,
);
html = html.replace(
  cssTag[0],
  () => `<style>${css.replace(/<\/style/gi, "<\\/style")}</style>`,
);
html = html.replace(
  /href="\/favicon.svg"/,
  () =>
    `href="data:image/svg+xml;base64,${fs.readFileSync(path.join(dist, "favicon.svg")).toString("base64")}"`,
);
const notices = fs.readFileSync(
  path.join(dist, "THIRD_PARTY_NOTICES.txt"),
  "utf8",
);
html = html.replace(
  "</body>",
  () =>
    `<template id="third-party-notices">${notices.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</template></body>`,
);
const standalonePath = path.join(dist, "standalone.html");
fs.writeFileSync(standalonePath, html);
console.log(
  JSON.stringify({
    file: standalonePath,
    bytes: Buffer.byteLength(html),
    embeddedFonts: fontCount,
  }),
);
