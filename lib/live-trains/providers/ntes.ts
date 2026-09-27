import type { Coordinate } from "../position";
import type {
  LiveTrain,
  LiveTrainRoutePoint,
} from "../liveTrain";

export type NTESRouteStation = {
  sequence: number;
  stationCode: string;
  stationName: string;

  scheduledArrival?: string | null;
  scheduledDeparture?: string | null;

  actualArrival?: string | null;
  actualDeparture?: string | null;

  distance?: number | null;
};

export type NTESLiveState = {
  trainNumber: string;

  lastStationCode: string | null;
  lastStationName: string | null;

  upcomingStationCode: string | null;
  upcomingStationName: string | null;

  nextStoppageCode: string | null;
  nextStoppageName: string | null;

  destinationCode: string | null;
  destinationName: string | null;

  lastUpdateText: string | null;
  lastUpdateTime: string | null;

  event: string | null;

  isDiverted: boolean;
};

/*
 * NTES has its own provider-specific state,
 * but RailPulse converts it into the common
 * LiveTrain model used by the UI.
 */
export type NTESNormalizedTrain = LiveTrain & {
  liveState: NTESLiveState;
};

function cleanString(
  value: unknown
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0
    ? trimmed
    : null;
}

function cleanNumber(
  value: unknown
): number | null {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(
      value.trim()
    );

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function cleanBoolean(
  value: unknown
): boolean {
  return (
    value === true ||
    value === 1 ||
    value === "1"
  );
}

function getArray(
  value: unknown
): Record<string, unknown>[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (
      item
    ): item is Record<string, unknown> =>
      typeof item === "object" &&
      item !== null &&
      !Array.isArray(item)
  );
}

function normalizeRouteStation(
  raw: Record<string, unknown>,
  index: number
): NTESRouteStation {
  return {
    sequence:
      cleanNumber(raw.Sr) ??
      cleanNumber(raw.SrWTT) ??
      index + 1,

    stationCode:
      cleanString(raw.SC) ??
      "",

    stationName:
      cleanString(raw.SN) ??
      "",

    scheduledArrival:
      cleanString(raw.STA),

    scheduledDeparture:
      cleanString(raw.STD),

    actualArrival:
      cleanString(raw.ETA),

    actualDeparture:
      cleanString(raw.ETD),

    distance:
      cleanNumber(raw.DIST),
  };
}

export function normalizeNTESLiveState(
  raw: Record<string, unknown>
): NTESLiveState {
  return {
    trainNumber:
      cleanString(raw.TN) ??
      "",

    lastStationCode:
      cleanString(raw.LSTN),

    lastStationName:
      cleanString(raw.LSTNN),

    upcomingStationCode:
      cleanString(raw.NSTN),

    upcomingStationName:
      cleanString(raw.NSTNN),

    nextStoppageCode:
      cleanString(raw.NPSTN),

    nextStoppageName:
      cleanString(raw.NPSTNNH),

    destinationCode:
      cleanString(raw.DSTN),

    destinationName:
      cleanString(raw.DSTNHN),

    lastUpdateText:
      cleanString(raw.LASTUPD),

    lastUpdateTime:
      cleanString(raw.LTIME),

    event:
      cleanString(raw.LEVNT),

    isDiverted:
      cleanBoolean(raw.ISDIVERT),
  };
}

function normalizeRoute(
  raw: Record<string, unknown>
): LiveTrainRoutePoint[] {
  /*
   * NTES places the main route inside its
   * station-detail structure.
   *
   * Different responses can expose the route
   * under slightly different keys.
   */
  const possibleRouteContainers = [
    raw.STNS,
    raw.STNSD,
    raw.STNSDISP,
    raw.stationList,
    raw.route,
    raw.ROUTE,
  ];

  let routeRaw:
    Record<string, unknown>[] = [];

  for (const candidate of possibleRouteContainers) {
    const stations =
      getArray(candidate);

    if (
      stations.length >
      routeRaw.length
    ) {
      routeRaw = stations;
    }
  }

  /*
   * Some NTES station entries contain
   * WTTSTNS for non-stopping timetable
   * stations. Include those too.
   */
  const expandedRoute:
    Record<string, unknown>[] = [];

  for (const station of routeRaw) {
    expandedRoute.push(station);

    const wttStations =
      getArray(
        station.WTTSTNS
      );

    for (
      const wttStation of wttStations
    ) {
      expandedRoute.push(
        wttStation
      );
    }
  }

  return expandedRoute
    .map(normalizeRouteStation)
    .filter(
      (station) =>
        station.stationCode.length >
          0 &&
        station.stationName.length >
          0
    )
    .sort((a, b) => {
      if (
        a.distance != null &&
        b.distance != null
      ) {
        return (
          a.distance -
          b.distance
        );
      }

      return (
        a.sequence -
        b.sequence
      );
    })
    .map(
      (
        station,
        index
      ): LiveTrainRoutePoint => ({
        sequence:
          index + 1,

        stationCode:
          station.stationCode,

        stationName:
          station.stationName,

        scheduledArrival:
          station.scheduledArrival ??
          null,

        scheduledDeparture:
          station.scheduledDeparture ??
          null,

        actualArrival:
          station.actualArrival ??
          null,

        actualDeparture:
          station.actualDeparture ??
          null,

        /*
         * NTES route data does not currently
         * expose these RailRadar-style delay
         * fields in the normalized station
         * object.
         */
        delayArrival:
          null,

        delayDeparture:
          null,

        platform:
          null,

        distance:
          station.distance,

        provenance:
          "NTES",
      })
    );
}

export function normalizeNTESResponse(
  raw: Record<string, unknown>
): NTESNormalizedTrain {
  const liveState =
    normalizeNTESLiveState(
      raw
    );

  const route =
    normalizeRoute(raw);

  const trainNumber =
    liveState.trainNumber ||
    cleanString(
      raw.trainNumber
    ) ||
    "";

  const trainName =
    cleanString(raw.TNM) ??
    cleanString(
      raw.trainName
    );

  /*
   * Convert NTES live state into the
   * common RailPulse LiveTrain model.
   */

  const currentLocation =
    liveState.lastStationCode ||
    liveState.lastStationName
      ? {
          stationCode:
            liveState.lastStationCode,

          stationName:
            liveState.lastStationName,

          sequence:
            findRouteSequence(
              route,
              liveState.lastStationCode
            ),
        }
      : null;

  const nextHalt =
    liveState.upcomingStationCode ||
    liveState.upcomingStationName
      ? {
          stationCode:
            liveState.upcomingStationCode,

          stationName:
            liveState.upcomingStationName,

          sequence:
            findRouteSequence(
              route,
              liveState.upcomingStationCode
            ),
        }
      : null;

  const origin =
    route.length > 0
      ? {
          code:
            route[0]
              .stationCode,

          name:
            route[0]
              .stationName,
        }
      : null;

  const destination =
    liveState.destinationCode ||
    liveState.destinationName
      ? {
          code:
            liveState.destinationCode,

          name:
            liveState.destinationName,
        }
      : route.length > 0
        ? {
            code:
              route[
                route.length - 1
              ]
                .stationCode,

            name:
              route[
                route.length - 1
              ]
                .stationName,
          }
        : null;

  return {
    /*
     * Common RailPulse identity fields.
     */
    number:
      trainNumber,

    name:
      trainName,

    category:
      null,

    origin,

    destination,

    /*
     * NTES event is the closest provider
     * status field currently available.
     */
    status:
      liveState.event ??
      null,

    /*
     * NTES response does not currently give
     * us a reliable numeric delay value in
     * this normalizer.
     */
    delayMinutes:
      null,

    currentLocation,

    nextHalt,

    /*
     * Position is resolved later by
     * app/api/trains/ntes/route.ts using
     * the OSM station lookup.
     */
    position:
      null,

    positionQuality:
      "UNKNOWN",

    trackingMode:
      liveState.lastUpdateText ??
      "NTES",

    lastUpdatedAt:
      liveState.lastUpdateTime,

    route,

    delayAnalysis:
      null,

    provider:
      "NTES",

    /*
     * Keep the complete NTES-specific
     * state available for future UI/backend
     * features.
     */
    liveState,
  };
}

function findRouteSequence(
  route: LiveTrainRoutePoint[],
  stationCode: string | null
): number | null {
  if (!stationCode) {
    return null;
  }

  const station =
    route.find(
      (point) =>
        point.stationCode
          .toUpperCase() ===
        stationCode.toUpperCase()
    );

  return station?.sequence ??
    null;
}