import { NextRequest, NextResponse } from "next/server";

function extractOgImage(html: string): string | null {
  // property="og:image" content="..."
  const m =
    html.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ??
    html.match(/content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
  return m?.[1] ?? null;
}

function isAbortLikeError(err: unknown): boolean {
  if (!err) return false;
  const anyErr = err as {
    name?: string;
    message?: string;
    code?: string;
    cause?: { code?: string; name?: string; message?: string };
  };

  return (
    anyErr.name === "AbortError" ||
    anyErr.code === "ECONNRESET" ||
    anyErr.code === "UND_ERR_ABORTED" ||
    anyErr.message?.toLowerCase().includes("aborted") === true ||
    anyErr.cause?.code === "ECONNRESET" ||
    anyErr.cause?.code === "UND_ERR_ABORTED" ||
    anyErr.cause?.name === "AbortError" ||
    anyErr.cause?.message?.toLowerCase().includes("aborted") === true
  );
}

type CacheEntry = { img: string; ts: number };

const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24h

function getCache() {
  const g = globalThis as unknown as { __postimgCache?: Map<string, CacheEntry> };
  if (!g.__postimgCache) g.__postimgCache = new Map<string, CacheEntry>();
  return g.__postimgCache;
}

function svgPlaceholder(label: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="700">
  <rect width="100%" height="100%" fill="#0b1220"/>
  <text x="50%" y="50%" fill="#67e8f9" font-family="Arial" font-size="28" text-anchor="middle">${label}</text>
</svg>`;
}

function imageFallbackResponse(label: string) {
  return new NextResponse(svgPlaceholder(label), {
    status: 200,
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return imageFallbackResponse("Missing image url");

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return imageFallbackResponse("Invalid image url");
  }

  if (parsed.hostname !== "postimg.cc") {
    return imageFallbackResponse("Only postimg.cc is allowed");
  }

  const cache = getCache();
  const cached = cache.get(parsed.toString());
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return NextResponse.redirect(cached.img, 302);
  }

  const controller = new AbortController();
  const onAbort = () => controller.abort();
  req.signal.addEventListener("abort", onAbort, { once: true });

  try {
    if (req.signal.aborted) return imageFallbackResponse("Image request cancelled");

    let html: string | null = null;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(parsed.toString(), {
          headers: { "user-agent": "Mozilla/5.0", accept: "text/html" },
          signal: controller.signal,
          next: { revalidate: 60 * 60 * 24 }, // cache fetch for 24h
        });

        if (!res.ok) break;
        html = await res.text();
        break;
      } catch (err: unknown) {
        if (isAbortLikeError(err)) {
          return imageFallbackResponse("Image request cancelled");
        }
        if (attempt === 1) throw err;
        await new Promise((r) => setTimeout(r, 150));
      }
    }

    if (!html) return imageFallbackResponse("Preview unavailable");

    const img = extractOgImage(html);
    if (!img) return imageFallbackResponse("Preview unavailable");

    cache.set(parsed.toString(), { img, ts: Date.now() });
    return NextResponse.redirect(img, 302);
  } catch (err: unknown) {
    if (isAbortLikeError(err)) return imageFallbackResponse("Image request cancelled");
    return imageFallbackResponse("Preview unavailable");
  } finally {
    req.signal.removeEventListener("abort", onAbort);
  }
}
