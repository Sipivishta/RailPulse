import { NextRequest, NextResponse } from "next/server";

import {
  getCachedTrain,
  setCachedTrain,
} from "@/lib/live-trains/cache";

import type { Coordinate } from "@/lib/live-trains/position";

const RAILRADAR_BASE_URL =
  "https://api.railradar.in/v1";

type RailRadarRoutePoint = {
  sequence?: number;
  stationCode?: string;
  stationName?: string;
  isHalt?: boolean;

  lat?: number | null;
  lng?: number | null;

  status?: string | null;
  distance?: number | null;

  scheduledArrival?: string | null;
  scheduledDeparture?: string | null;

  actualArrival?: string | null;
  actualDeparture?: string | null;

  delayArrival?: number | null;
  delayDeparture?: number | null;

  platform?: string | null;

  speedToNextStationKmph?: number | null;

  provenance?: string | null;
};

type RailRadarCurrentLocation = {
  stationCode?: string | null;
  sequence?: number | null;
  status?: string | null;
  isHalt?: boolean | null;
  isDiverted?: boolean | null;

  isActualPosition?: boolean | null;

  segmentProgress?: number | null;

  speedKmh?: number | null;

  bearingDegrees?: number | null;
};

type RailRadarResponse = {
  success?: boolean;

  error?: unknown;

  data?: {
    trainNumber?: string;

    trainName?: string;

    startDate?: string;

    lastUpdatedAt?: string | null;

    status?: string | null;

    delayMinutes?: number | null;

    train?: {
      number?: string;
      name?: string;
      type?: string;
      category?: string;

      source?: {
        code?: string;
        name?: string;
      };

      destination?: {
        code?: string;
        name?: string;
      };
    };

    currentLocation?:
      | RailRadarCurrentLocation
      | null;

    previousHalt?: {
      stationCode?: string | null;
      stationName?: string | null;
      sequence?: number | null;
      distance?: number | null;
    } | null;

    nextHalt?: {
      stationCode?: string | null;
      stationName?: string | null;
      sequence?: number | null;
      distance?: number | null;
    } | null;

    geometry?: {
      type?: string;

      coordinates?: Coordinate[];
    } | null;

    route?: RailRadarRoutePoint[];

    isLive?: boolean;
  };

  meta?: {
    timestamp?: string;
    source?: string;
  };
};

type NormalizedRoutePoint = {
  sequence: number;

  stationCode: string;

  stationName: string;

  lat?: number;

  lng?: number;

  status?: string;

  distance?: number;

  scheduledArrival?: string | null;

  scheduledDeparture?: string | null;

  actualArrival?: string | null;

  actualDeparture?: string | null;

  delayArrival?: number | null;

  delayDeparture?: number | null;

  platform?: string | null;

  provenance?: string | null;
};

type NormalizedLiveTrain = {
  number: string;

  name: string | null;

  type: string | null;

  category: string | null;

  origin: {
    code: string | null;

    name: string | null;
  };

  destination: {
    code: string | null;

    name: string | null;
  };

  status: string | null;

  delayMinutes: number | null;

  isLive: boolean;

  trackingMode: string | null;

  currentLocation: {
    stationCode: string | null;

    stationName: string | null;

    sequence: number | null;

    status: string | null;

    segmentProgress: number | null;

    speedKmh: number | null;

    bearingDegrees: number | null;

    isActualPosition: boolean | null;
  } | null;

  previousHalt: {
    stationCode: string | null;

    stationName: string | null;

    sequence: number | null;

    distance: number | null;
  } | null;

  nextHalt: {
    stationCode: string | null;

    stationName: string | null;

    sequence: number | null;

    distance: number | null;
  } | null;

  route: NormalizedRoutePoint[];

  geometry: {
    type: "LineString";

    coordinates: Coordinate[];
  } | null;

  lastUpdatedAt: string | null;

  positionQuality:
    | "ACTUAL"
    | "CALCULATED"
    | "UNKNOWN";

  provider: "RAILRADAR";
};

type ApiResponse = {
  success: boolean;

  train?: NormalizedLiveTrain;

  error?: string;

  meta?: {
    source: "RAILRADAR" | "CACHE";

    fetchedAt: number;

    expiresAt?: number;
  };
};

function getPositionQuality(
  currentLocation:
    | NonNullable<
        RailRadarResponse["data"]
      >["currentLocation"]
    | null
    | undefined,

  geometryCoordinates:
    | Coordinate[]
    | null
) {
  if (
    currentLocation?.isActualPosition ===
    true
  ) {
    return "ACTUAL" as const;
  }

  if (
    currentLocation?.segmentProgress !==
      undefined &&
    currentLocation?.segmentProgress !==
      null &&
    geometryCoordinates !== null
  ) {
    return "CALCULATED" as const;
  }

  return "UNKNOWN" as const;
}

export async function GET(
  request: NextRequest
) {
  const number =
    request.nextUrl.searchParams
      .get("number")
      ?.trim();

  const date =
    request.nextUrl.searchParams
      .get("date")
      ?.trim() || null;

  if (!number) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Train number is required.",
      },
      {
        status: 400,
      }
    );
  }

  const cached =
    getCachedTrain<NormalizedLiveTrain>(
      number,
      date
    );

  if (cached) {
    return NextResponse.json<ApiResponse>(
      {
        success: true,

        train: cached.data,

        meta: {
          source: "CACHE",

          fetchedAt:
            cached.fetchedAt,

          expiresAt:
            cached.expiresAt,
        },
      }
    );
  }

  const apiKey =
    process.env.RAILRADAR_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        success: false,

        error:
          "RAILRADAR_API_KEY is not configured on the server.",
      },
      {
        status: 500,
      }
    );
  }

  try {
    const params =
      new URLSearchParams({
        authoritative: "true",

        geometry: "true",

        format: "geojson",

        includeCoordinates: "true",
      });

    if (date) {
      params.set(
        "date",
        date
      );
    }

    const url =
      `${RAILRADAR_BASE_URL}/trains/${encodeURIComponent(
        number
      )}/live?${params.toString()}`;

    const response =
      await fetch(url, {
        method: "GET",

        headers: {
          Authorization:
            `Bearer ${apiKey}`,

          Accept:
            "application/json",
        },

        cache: "no-store",
      });

    const raw =
      (await response.json()) as RailRadarResponse;

    if (!response.ok) {
      const providerMessage =
        typeof raw.error ===
        "string"
          ? raw.error
          : JSON.stringify(
              raw.error ?? raw
            );

      return NextResponse.json(
        {
          success: false,

          error:
            `RailRadar request failed (${response.status}). ${providerMessage}`,
        },
        {
          status:
            response.status,
        }
      );
    }

    if (
      !raw.success ||
      !raw.data
    ) {
      return NextResponse.json(
        {
          success: false,

          error:
            "RailRadar returned no usable train data.",
        },
        {
          status: 404,
        }
      );
    }

    const data =
      raw.data;

    const geometryCoordinates =
      data.geometry?.coordinates &&
      Array.isArray(
        data.geometry.coordinates
      )
        ? data.geometry.coordinates
        : null;

    const route =
      Array.isArray(data.route)
        ? data.route
            .filter(
              (point) =>
                typeof point.sequence ===
                  "number" &&
                typeof point.stationCode ===
                  "string" &&
                typeof point.stationName ===
                  "string"
            )
            .map(
              (point) => ({
                sequence:
                  point.sequence!,

                stationCode:
                  point.stationCode!,

                stationName:
                  point.stationName!,

                ...(typeof point.lat ===
                "number"
                  ? {
                      lat:
                        point.lat,
                    }
                  : {}),

                ...(typeof point.lng ===
                "number"
                  ? {
                      lng:
                        point.lng,
                    }
                  : {}),

                ...(point.status
                  ? {
                      status:
                        point.status,
                    }
                  : {}),

                ...(typeof point.distance ===
                "number"
                  ? {
                      distance:
                        point.distance,
                    }
                  : {}),

                scheduledArrival:
                  point.scheduledArrival ??
                  null,

                scheduledDeparture:
                  point.scheduledDeparture ??
                  null,

                actualArrival:
                  point.actualArrival ??
                  null,

                actualDeparture:
                  point.actualDeparture ??
                  null,

                delayArrival:
                  point.delayArrival ??
                  null,

                delayDeparture:
                  point.delayDeparture ??
                  null,

                platform:
                  point.platform ??
                  null,

                provenance:
                  point.provenance ??
                  null,
              })
            )
        : [];

    const currentStationCode =
      data.currentLocation
        ?.stationCode ??
      null;

    const currentRoutePoint =
      currentStationCode
        ? route.find(
            (point) =>
              point.stationCode ===
              currentStationCode
          )
        : undefined;

    const normalized:
      NormalizedLiveTrain = {
      number:
        data.train?.number ??
        data.trainNumber ??
        number,

      name:
        data.train?.name ??
        data.trainName ??
        null,

      type:
        data.train?.type ??
        null,

      category:
        data.train?.category ??
        null,

      origin: {
        code:
          data.train?.source?.code ??
          null,

        name:
          data.train?.source?.name ??
          null,
      },

      destination: {
        code:
          data.train?.destination?.code ??
          null,

        name:
          data.train?.destination?.name ??
          null,
      },

      status:
        data.status ??
        null,

      delayMinutes:
        data.delayMinutes ??
        null,

      isLive:
        data.isLive === true,

      trackingMode:
        data.currentLocation
          ? "real-time"
          : null,

      currentLocation:
        data.currentLocation
          ? {
              stationCode:
                data.currentLocation
                  .stationCode ??
                null,

              stationName:
                currentRoutePoint
                  ?.stationName ??
                null,

              sequence:
                data.currentLocation
                  .sequence ??
                null,

              status:
                data.currentLocation
                  .status ??
                null,

              segmentProgress:
                data.currentLocation
                  .segmentProgress ??
                null,

              speedKmh:
                data.currentLocation
                  .speedKmh ??
                null,

              bearingDegrees:
                data.currentLocation
                  .bearingDegrees ??
                null,

              isActualPosition:
                data.currentLocation
                  .isActualPosition ??
                null,
            }
          : null,

      previousHalt:
        data.previousHalt
          ? {
              stationCode:
                data.previousHalt
                  .stationCode ??
                null,

              stationName:
                data.previousHalt
                  .stationName ??
                null,

              sequence:
                data.previousHalt
                  .sequence ??
                null,

              distance:
                data.previousHalt
                  .distance ??
                null,
            }
          : null,

      nextHalt:
        data.nextHalt
          ? {
              stationCode:
                data.nextHalt
                  .stationCode ??
                null,

              stationName:
                data.nextHalt
                  .stationName ??
                null,

              sequence:
                data.nextHalt
                  .sequence ??
                null,

              distance:
                data.nextHalt
                  .distance ??
                null,
            }
          : null,

      route,

      geometry:
        geometryCoordinates
          ? {
              type:
                "LineString",

              coordinates:
                geometryCoordinates,
            }
          : null,

      lastUpdatedAt:
        data.lastUpdatedAt ??
        null,

      positionQuality:
        getPositionQuality(
          data.currentLocation,
          geometryCoordinates
        ),

      provider:
        "RAILRADAR",
    };

    setCachedTrain(
      number,
      normalized,
      date
    );

    const cachedAfterWrite =
      getCachedTrain<NormalizedLiveTrain>(
        number,
        date
      );

    return NextResponse.json<ApiResponse>(
      {
        success: true,

        train: normalized,

        meta: {
          source:
            "RAILRADAR",

          fetchedAt:
            cachedAfterWrite?.fetchedAt ??
            Date.now(),

          expiresAt:
            cachedAfterWrite?.expiresAt,
        },
      }
    );
  } catch (error) {
    console.error(
      "RailRadar live train request failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unexpected server error.",
      },
      {
        status: 502,
      }
    );
  }
}