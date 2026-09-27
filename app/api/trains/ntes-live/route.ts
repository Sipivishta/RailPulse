import { NextRequest, NextResponse } from "next/server";

const NTES_SERVICE_URL =
  process.env.NTES_SERVICE_URL || "http://127.0.0.1:5001";

export async function GET(request: NextRequest) {
  const trainNumber = request.nextUrl.searchParams.get("number");
  const date = request.nextUrl.searchParams.get("date");

  if (!trainNumber) {
    return NextResponse.json(
      {
        success: false,
        error: "Train number is required",
      },
      { status: 400 }
    );
  }

  if (!/^\d{5}$/.test(trainNumber)) {
    return NextResponse.json(
      {
        success: false,
        error: "Train number must be exactly 5 digits",
      },
      { status: 400 }
    );
  }

  try {
    const url = new URL(
      `/train/${encodeURIComponent(trainNumber)}`,
      NTES_SERVICE_URL
    );

    if (date) {
      url.searchParams.set("date", date);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          provider: "NTES",
          error: data?.error || "NTES request failed",
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("NTES live train request failed:", error);

    return NextResponse.json(
      {
        success: false,
        provider: "NTES",
        error:
          error instanceof Error
            ? error.message
            : "Unable to connect to NTES service",
      },
      { status: 502 }
    );
  }
}