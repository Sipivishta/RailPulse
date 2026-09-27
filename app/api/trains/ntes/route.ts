import { NextRequest, NextResponse } from "next/server";
import { normalizeNTESResponse } from "@/lib/live-trains/providers/ntes";
import { buildStationLookup } from "@/lib/live-trains/stationLookup";
import { findRailwaySegment } from "@/lib/live-trains/railwaySegment";

import fs from "fs";
import path from "path";

const NTES_SERVICE_URL =
  process.env.NTES_SERVICE_URL || "http://127.0.0.1:5001";

function loadStations() {
  const filePath = path.join(
    process.cwd(),
    "public",
    "data",
    "india-railway-stations.geojson"
  );

  return JSON.parse(
    fs.readFileSync(filePath, "utf-8")
  );
}

function loadRailwayTracks() {
  const filePath = path.join(
    process.cwd(),
    "public",
    "data",
    "india-railway-tracks.geojson"
  );

  return JSON.parse(
    fs.readFileSync(filePath, "utf-8")
  );
}

export async function GET(request: NextRequest) {
  const trainNumber =
    request.nextUrl.searchParams.get("number");

  const date =
    request.nextUrl.searchParams.get("date");

  if (!trainNumber) {
    return NextResponse.json(
      {
        success: false,
        provider: "NTES",
        error: "Train number is required",
      },
      { status: 400 }
    );
  }

  if (!/^\d{5}$/.test(trainNumber)) {
    return NextResponse.json(
      {
        success: false,
        provider: "NTES",
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

    const response = await fetch(
      url.toString(),
      {
        method: "GET",
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok || !data?.success) {
      return NextResponse.json(
        {
          success: false,
          provider: "NTES",
          error:
            data?.error ||
            "NTES request failed",
        },
        {
          status: response.ok
            ? 502
            : response.status,
        }
      );
    }

    const rawData =
      data?.data?.data &&
      typeof data.data.data === "object"
        ? data.data.data
        : data?.data &&
            typeof data.data === "object"
          ? data.data
          : {};

    const normalized =
      normalizeNTESResponse(rawData);

    /*
     * Resolve the real OSM coordinates of the
     * last and upcoming stations.
     */
    const stationCollection =
      loadStations();

    const stationLookup =
      buildStationLookup(
        stationCollection
      );

    const currentStation =
      normalized.liveState
        .lastStationCode
        ? stationLookup.get(
            normalized.liveState
              .lastStationCode
          )
        : undefined;

    const nextStation =
      normalized.liveState
        .upcomingStationCode
        ? stationLookup.get(
            normalized.liveState
              .upcomingStationCode
          )
        : undefined;

    let position = null;

    /*
     * NTES does not provide segment progress.
     *
     * Therefore we do NOT place the train
     * arbitrarily somewhere between stations.
     *
     * If we can resolve the current station,
     * we use its real OSM coordinate.
     */
    if (currentStation) {
      position =
        currentStation.coordinate;
    }

    /*
     * Find the real railway corridor between
     * current and upcoming station.
     */
    let railwaySegment = null;

    if (
      currentStation &&
      nextStation
    ) {
      const railwayCollection =
        loadRailwayTracks();

      railwaySegment =
        findRailwaySegment(
          railwayCollection,
          currentStation.coordinate,
          nextStation.coordinate
        );
    }

    return NextResponse.json({
      success: true,
      provider: "NTES",

      train: {
        ...normalized,

        position,

        positionQuality:
          position
            ? "CALCULATED"
            : "UNKNOWN",

        currentStation: currentStation
          ? {
              code: currentStation.code,
              name: currentStation.name,
              coordinate:
                currentStation.coordinate,
            }
          : null,

        nextStation: nextStation
          ? {
              code: nextStation.code,
              name: nextStation.name,
              coordinate:
                nextStation.coordinate,
            }
          : null,

        railwaySegment:
          railwaySegment
            ? {
                geometry:
                  railwaySegment.geometry,
                distanceKm:
                  railwaySegment.distanceKm,
              }
            : null,
      },

      meta: {
        fetchedAt:
          new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error(
      "NTES provider request failed:",
      error
    );

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