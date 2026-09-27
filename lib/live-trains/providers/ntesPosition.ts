import type { Coordinate } from "../position";

export type NTESPositionInput = {
  route: Array<{
    sequence: number;
    stationCode: string;
    stationName: string;
    distance?: number | null;
  }>;

  lastStationCode: string | null;
  upcomingStationCode: string | null;

  /**
   * Optional geometry for the segment between the two stations.
   * This must come from RailPulse's actual OSM railway data.
   */
  segmentGeometry?: Coordinate[] | null;
};

export type NTESPositionResult = {
  position: Coordinate | null;

  positionQuality: "CALCULATED" | "UNKNOWN";

  currentStationCode: string | null;
  currentStationName: string | null;

  nextStationCode: string | null;
  nextStationName: string | null;

  segmentProgress: number | null;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * NTES does not provide GPS coordinates or segmentProgress.
 *
 * Therefore this resolver deliberately refuses to manufacture
 * a moving position from timetable time alone.
 *
 * If a future provider supplies a defensible segment progress,
 * it can be passed here and used against real OSM geometry.
 */
export function resolveNTESPosition(
  input: NTESPositionInput
): NTESPositionResult {
  const current = input.route.find(
    (station) => station.stationCode === input.lastStationCode
  );

  const next = input.route.find(
    (station) => station.stationCode === input.upcomingStationCode
  );

  if (!current) {
    return {
      position: null,
      positionQuality: "UNKNOWN",

      currentStationCode: input.lastStationCode,
      currentStationName: null,

      nextStationCode: input.upcomingStationCode,
      nextStationName: next?.stationName ?? null,

      segmentProgress: null,
    };
  }

  /*
   * Without a trustworthy progress value, use the current
   * station as the calculated position only when its actual
   * geographic coordinate has already been resolved elsewhere.
   *
   * This function intentionally does not fabricate coordinates.
   */

  if (!input.segmentGeometry || input.segmentGeometry.length < 2) {
    return {
      position: null,
      positionQuality: "UNKNOWN",

      currentStationCode: current.stationCode,
      currentStationName: current.stationName,

      nextStationCode: next?.stationCode ?? null,
      nextStationName: next?.stationName ?? null,

      segmentProgress: null,
    };
  }

  /*
   * Geometry exists, but NTES still hasn't supplied a reliable
   * progress value. Do not arbitrarily place the train halfway
   * along the segment.
   */
  return {
    position: input.segmentGeometry[0] ?? null,
    positionQuality: "CALCULATED",

    currentStationCode: current.stationCode,
    currentStationName: current.stationName,

    nextStationCode: next?.stationCode ?? null,
    nextStationName: next?.stationName ?? null,

    segmentProgress: clamp(0, 0, 1),
  };
}