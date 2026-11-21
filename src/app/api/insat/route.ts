// Latest INSAT-3DS infrared image from ISRO's MOSDAC portal (public gallery, no login).
// Falls back to the snapshot saved by scripts/fetch-insat.mjs so the demo works offline.
import snapshot from "../../../../public/data/insat-latest.json";

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function capturedAt(file: string): string | null {
  const m = file.match(/3SIMG_(\d{2})([A-Z]{3})(\d{4})_(\d{2})(\d{2})_/);
  if (!m) return null;
  return new Date(Date.UTC(+m[3], MONTHS.indexOf(m[2]), +m[1], +m[4], +m[5])).toISOString();
}

export async function GET(request: Request) {
  new URL(request.url); // reading the request keeps this handler dynamic (runs per request, not at build time)
  try {
    const r = await fetch("https://mosdac.gov.in/gallery/getImage.php", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prod: "3SIMG_*_L1B_STD_IR1_V*.jpg", st_date: "", count: 3 }),
      signal: AbortSignal.timeout(7000), cache: "no-store",
    });
    if (!r.ok) throw new Error("MOSDAC " + r.status);
    const [files] = (await r.json()) as [string, string];
    const list = String(files).split(",").filter(Boolean);
    const file = list[list.length - 1];
    const at = file && capturedAt(file);
    if (!file || !at) throw new Error("no image");
    return Response.json({
      live: true, satellite: "INSAT-3DS", product: "Imager IR1 (thermal infrared) quick-look",
      capturedAtUtc: at, source: "ISRO MOSDAC (mosdac.gov.in)",
      imageUrl: "/api/insat/image?f=" + encodeURIComponent(file),
    });
  } catch {
    return Response.json({ live: false, ...snapshot, imageUrl: "/data/insat-latest.jpg" });
  }
}
