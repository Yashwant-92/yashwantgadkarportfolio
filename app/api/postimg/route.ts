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

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  // Only allow postimg.cc to avoid open proxy abuse
  if (parsed.hostname !== "postimg.cc") {
    return NextResponse.json(
      { error: "Only postimg.cc is allowed" },
      { status: 400 }
    );
  }

  const controller = new AbortController();

  const abortTo204 = () => {
    controller.abort();
    return new NextResponse(null, { status: 204 });
  };

  if (req.signal.aborted) return abortTo204();

  const abortResponse = new Promise<NextResponse>((resolve) => {
    req.signal.addEventListener("abort", () => resolve(abortTo204()), {
      once: true,
    });
  });

  const timeoutId = setTimeout(() => controller.abort(), 8000);

  const work = (async (): Promise<NextResponse> => {
    try {
      const res = await fetch(parsed.toString(), {
        headers: { "user-agent": "Mozilla/5.0" },
        cache: "no-store",
        signal: controller.signal,
      });

      if (!res.ok) {
        return NextResponse.json(
          { error: "Failed to fetch postimg page" },
          { status: 502 }
        );
      }

      let html: string;
      try {
        html = await res.text();
      } catch (err: unknown) {
        if (isAbortLikeError(err)) return new NextResponse(null, { status: 204 });
        throw err;
      }

      const img = extractOgImage(html);
      if (!img) {
        return NextResponse.json({ error: "No og:image found" }, { status: 404 });
      }

      return NextResponse.redirect(img, 302);
    } catch (err: unknown) {
      if (isAbortLikeError(err)) return new NextResponse(null, { status: 204 });
      return NextResponse.json(
        { error: "Unexpected error fetching postimg" },
        { status: 500 }
      );
    } finally {
      clearTimeout(timeoutId);
    }
  })();

  return Promise.race([abortResponse, work]);
}
