// Proxies one MOSDAC preview image (so the browser never calls mosdac.gov.in directly).
const ALLOWED = /^3S_IMG\/preview\/\d{4}\/\d{2}[A-Z]{3}\/3SIMG_\d{2}[A-Z]{3}\d{4}_\d{4}_L1B_STD_IR1_V\d{2}R\d{2}\.jpg$/;

export async function GET(request: Request) {
  const f = new URL(request.url).searchParams.get("f") ?? "";
  if (!ALLOWED.test(f)) return new Response("bad request", { status: 400 });
  try {
    const r = await fetch("https://mosdac.gov.in/look/" + f, { signal: AbortSignal.timeout(10000) });
    if (!r.ok) return new Response("upstream error", { status: 502 });
    return new Response(await r.arrayBuffer(), {
      headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=900, s-maxage=900" },
    });
  } catch {
    return new Response("unavailable", { status: 502 });
  }
}
