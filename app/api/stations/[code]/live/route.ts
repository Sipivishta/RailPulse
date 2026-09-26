import { NextRequest, NextResponse } from "next/server";

type CachedStation = {
  data: unknown;
  fetchedAt: number;
  expiresAt: number;
};

const cache = new Map<string, CachedStation>();

// Keep station data for 60 seconds.
// This prevents repeated requests to NTES while developing.
const CACHE_TTL_MS = 60 * 1000;

const NTES_SERVICE_URL =
  process.env.NTES_SERVICE_URL ?? "http://127.0.0.1:5001";

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{ code: string }>;
  }
) {
  const { code } = await context.params;

  const stationCode = code.trim().toUpperCase();

  if (!stationCode) {
    return NextResponse.json(
      {
        success: false,
        error: "Station code is required",
      },
      { status: 400 }
    );
  }

  const now = Date.now();

  // ---------------------------------------------------------
  // 1. Check local Next.js cache
  // ---------------------------------------------------------

  const cached = cache.get(stationCode);

  if (cached && now < cached.expiresAt) {
    return NextResponse.json({
      success: true,
      provider: "NTES",
      station: stationCode,
      cached: true,
      fetchedAt: cached.fetchedAt,
      data: cached.data,
    });
  }

  // ---------------------------------------------------------
  // 2. Ask our local NTES Flask service
  // ---------------------------------------------------------

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 15_000);

  try {
    const response = await fetch(
      `${NTES_SERVICE_URL}/station/${encodeURIComponent(stationCode)}`,
      {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      return NextResponse.json(
        {
          success: false,
          provider: "NTES",
          station: stationCode,
          error: `NTES service returned HTTP ${response.status}`,
          details: errorText,
        },
        { status: 502 }
      );
    }

    const result = await response.json();

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          provider: "NTES",
          station: stationCode,
          error: result.error ?? "NTES request failed",
        },
        { status: 502 }
      );
    }

    // -------------------------------------------------------
    // 3. Cache the real NTES result
    // -------------------------------------------------------

    const fetchedAt = Date.now();

    cache.set(stationCode, {
      data: result.data,
      fetchedAt,
      expiresAt: fetchedAt + CACHE_TTL_MS,
    });

    // -------------------------------------------------------
    // 4. Return the same general structure the frontend uses
    // -------------------------------------------------------

    return NextResponse.json({
      success: true,
      provider: "NTES",
      station: stationCode,
      cached: false,
      fetchedAt,
      data: result.data,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown NTES service error";

    return NextResponse.json(
      {
        success: false,
        provider: "NTES",
        station: stationCode,
        error: message,
      },
      { status: 502 }
    );
  } finally {
    clearTimeout(timeout);
  }
}