import { NextRequest, NextResponse } from "next/server";

type Coordinate = [number, number];

type RailRadarHalt = {
  stationCode?: string;
  stationName?: string;
  sequence?: number;
  status?: string;
  isHalt?: boolean;
  distance?: number;
  distanceFromOriginKm?: number;
  distanceFromLastStationKm?: number;
  segmentProgress?: number;
  delayMinutes?: number;
  platform?: string | number;
  scheduledArrival?: string;
  actualArrival?: string;
  scheduledDeparture?: string;
  actualDeparture?: string;
  delayArrival?: number;
  delayDeparture?: number;
  speedToNextStationKmph?: number;
};

type RailRadarCurrentLocation = {
  stationCode?: string;
  stationName?: string;
  sequence?: number;
  status?: string;
  distance?: number;
  segmentProgress?: number;
  speedKmh?: number;
  bearingDegrees?: number;
  isActualPosition?: boolean;
};

type RailRadarStation = {
  code?: string;
  name?: string;
  lat?: number;
  lng?: number;
};

type RailRadarGeoJSON = {
  type?: string;
  properties?: Record<string, unknown>;
  geometry?: {
    type?: string;
    coordinates?: Coordinate[];
  };
};

type RailRadarGeometry = {
  trainNumber?: string;
  format?: string;
  geojson?: RailRadarGeoJSON;
};

type RailRadarTrain = {
  number?: string;
  name?: string;
  source?: RailRadarStation;
  destination?: RailRadarStation;
};

type RailRadarData = {
  trainNumber?: string;
  trainName?: string;
  startDate?: string;
  lastUpdatedAt?: string;
  status?: string;

  train?: RailRadarTrain;

  isLive?: boolean;
  trackingMode?: string;

  previousHalt?: RailRadarHalt;
  nextHalt?: RailRadarHalt;

  currentLocation?: RailRadarCurrentLocation;

  route?: RailRadarHalt[];

  geometry?: RailRadarGeometry;
};

type RailRadarResponse = {
  success?: boolean;
  data?: RailRadarData;
};

export async function GET(request: NextRequest) {
  const trainNumber =
    request.nextUrl.searchParams.get("number");

  const date =
    request.nextUrl.searchParams.get("date");

  if (!trainNumber) {
    return NextResponse.json(
      {
        error: "Missing train number",
        usage:
          "/api/trains/live?number=12919",
      },
      { status: 400 }
    );
  }

  const apiKey =
    process.env.RAILRADAR_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "RAILRADAR_API_KEY is not configured.",
      },
      { status: 500 }
    );
  }

  const params = new URLSearchParams();

  params.set("authoritative", "true");
  params.set("geometry", "true");
  params.set("format", "geojson");
  params.set("includeCoordinates", "true");

  if (date) {
    params.set("date", date);
  }

  const url =
    `https://api.railradar.in/v1/trains/${encodeURIComponent(
      trainNumber
    )}/live?${params.toString()}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization:
          `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const responseText =
      await response.text();

    let raw: RailRadarResponse | null = null;

    try {
      raw =
        JSON.parse(
          responseText
        ) as RailRadarResponse;
    } catch {
      return NextResponse.json(
        {
          error:
            "RailRadar returned an invalid JSON response.",
          provider: "RAILRADAR",
          httpStatus: response.status,
          rawResponse: responseText,
        },
        {
          status: response.status || 502,
        }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            "RailRadar request failed.",
          provider: "RAILRADAR",
          httpStatus: response.status,
          details: raw,
        },
        {
          status: response.status,
        }
      );
    }

    const data = raw.data;

    if (!data) {
      return NextResponse.json(
        {
          error:
            "RailRadar returned no train data.",
          provider: "RAILRADAR",
        },
        { status: 502 }
      );
    }

    const current =
      data.currentLocation;

    const next =
      data.nextHalt;

    const previous =
      data.previousHalt;

    /*
     * RailRadar returns the route geometry as:
     *
     * geometry
     *   └── geojson
     *        └── geometry
     *             └── coordinates
     *
     * The coordinates are [longitude, latitude].
     */
    const geometryCoordinates =
      data.geometry?.geojson?.geometry
        ?.coordinates ?? null;

    const geometryType =
      data.geometry?.geojson?.geometry
        ?.type ?? null;

    const source =
      data.train?.source;

    const destination =
      data.train?.destination;

    const train = {
      number:
        data.trainNumber ??
        data.train?.number ??
        trainNumber,

      name:
        data.trainName ??
        data.train?.name ??
        "Unknown",

      origin: {
        code:
          source?.code ?? null,

        name:
          source?.name ?? null,

        coordinates:
          source?.lng !== undefined &&
          source?.lat !== undefined
            ? [
                source.lng,
                source.lat,
              ]
            : null,
      },

      destination: {
        code:
          destination?.code ?? null,

        name:
          destination?.name ?? null,

        coordinates:
          destination?.lng !== undefined &&
          destination?.lat !== undefined
            ? [
                destination.lng,
                destination.lat,
              ]
            : null,
      },

      status:
        data.status ??
        current?.status ??
        "UNKNOWN",

      isLive:
        data.isLive ?? false,

      trackingMode:
        data.trackingMode ??
        "UNKNOWN",

      currentLocation: {
        stationCode:
          current?.stationCode ??
          null,

        stationName:
          current?.stationName ??
          null,

        sequence:
          current?.sequence ??
          null,

        status:
          current?.status ??
          null,

        distance:
          current?.distance ??
          null,

        segmentProgress:
          current?.segmentProgress ??
          next?.segmentProgress ??
          null,

        speedKmh:
          current?.speedKmh ??
          null,

        bearingDegrees:
          current?.bearingDegrees ??
          null,

        isActualPosition:
          current?.isActualPosition ??
          false,
      },

      previousHalt:
        previous ?? null,

      nextHalt:
        next ?? null,

      /*
       * Real railway route geometry from RailRadar.
       */
      geometry: {
        type:
          geometryType,

        coordinates:
          geometryCoordinates,
      },

      /*
       * Full route/station information.
       * We keep this because it will be useful later
       * for station intelligence and train analysis.
       */
      route:
        data.route ?? [],

      lastUpdatedAt:
        data.lastUpdatedAt ??
        null,

      /*
       * We never call an estimated coordinate "ACTUAL".
       */
      positionQuality:
        current?.isActualPosition === true
          ? "ACTUAL"
          : current?.segmentProgress !==
                undefined &&
            geometryCoordinates !== null
          ? "CALCULATED"
          : "UNKNOWN",

      provider: "RAILRADAR",
    };

    return NextResponse.json({
      success: true,
      train,
    });
  } catch (error) {
    console.error(
      "RailRadar live request failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to contact RailRadar.",
        provider: "RAILRADAR",
        message:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}