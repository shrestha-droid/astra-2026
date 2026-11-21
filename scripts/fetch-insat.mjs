// Saves the latest INSAT-3DS infrared quick-look from ISRO's MOSDAC portal as an offline fallback.
//   Run: node scripts/fetch-insat.mjs   (or: npm run data:insat)
import { mkdir, writeFile } from "node:fs/promises";

const API = "https://mosdac.gov.in/gallery/getImage.php";
const PROD = "3SIMG_*_L1B_STD_IR1_V*.jpg";

const r = await fetch(API, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ prod: PROD, st_date: "", count: 3 }), signal: AbortSignal.timeout(30000),
});
const [files, dir] = await r.json();
const list = String(files).split(",").filter(Boolean);
const file = list[list.length - 1]; // newest is last
if (!file) throw new Error("MOSDAC returned no image");
const m = file.match(/3SIMG_(\d{2})([A-Z]{3})(\d{4})_(\d{2})(\d{2})_/);
const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
const captured = new Date(Date.UTC(+m[3], months.indexOf(m[2]), +m[1], +m[4], +m[5])).toISOString();
const img = await fetch("https://mosdac.gov.in/look/" + file, { signal: AbortSignal.timeout(30000) });
if (!img.ok) throw new Error("image fetch failed " + img.status);
await mkdir("public/data", { recursive: true });
await writeFile("public/data/insat-latest.jpg", Buffer.from(await img.arrayBuffer()));
await writeFile("public/data/insat-latest.json", JSON.stringify({
  file, directory: dir, capturedAtUtc: captured, satellite: "INSAT-3DS", product: "Imager IR1 (thermal infrared) quick-look",
  source: "ISRO MOSDAC (mosdac.gov.in)", savedAt: new Date().toISOString(),
}));
console.log("saved INSAT-3DS image captured", captured);
