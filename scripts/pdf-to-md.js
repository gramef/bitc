const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
try {
  if (typeof global.DOMMatrix === "undefined") {
    global.DOMMatrix = require("dommatrix");
  }
} catch {}

function arg(name, def) {
  const idx = process.argv.indexOf(name);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return def;
}

async function main() {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const inPath = arg("--in");
  const outPath = arg("--out", path.resolve(process.cwd(), "docs", "project.md"));
  if (!inPath) {
    process.stderr.write("Missing --in <pdf path>\n");
    process.exit(1);
  }
  if (!fs.existsSync(inPath)) {
    process.stderr.write(`Input file not found: ${inPath}\n`);
    process.exit(1);
  }
  const buf = fs.readFileSync(inPath);
  const data = new Uint8Array(buf);
  const loadingTask = pdfjsLib.getDocument({
    data,
    standardFontDataUrl: pathToFileURL(
      path.join(process.cwd(), "node_modules/pdfjs-dist/standard_fonts/")
    ).href,
  });
  const doc = await loadingTask.promise;
  let text = "";
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const pageText = content.items.map((it) => (typeof it.str === "string" ? it.str : "")).join(" ");
    text += pageText.replace(/\s{2,}/g, " ").trim() + "\n\n";
  }
  text = text.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
  const outDir = path.dirname(outPath);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, text + "\n", "utf8");
  process.stdout.write(`Written: ${outPath}\n`);
}

main().catch((e) => {
  process.stderr.write(String(e) + "\n");
  process.exit(1);
});
