
import {
  calculateTrainPosition,
  type Coordinate,
} from "./position";

export type RoutePoint = {
  sequence: number;
  stationCode: string;
  stationName: string;
  lat?: number;
  lng?: number;
  status?: string;
  distance?: number;
};

export type PositionResolution = {
  coordinate: Coordinate;
  source: "GEOMETRY";
  positionQuality: "CALCULATED";
  currentStation: string;
  currentSequence: number;
  nextStation: string;
  nextSequence: number;
};

type ResolvePositionInput = {
  route: RoutePoint[];
  currentStationCode: string;
  currentSequence: number;
  segmentProgress?: number | null;
  geometry?: Coordinate[] | null;
};

export function resolveTrainPosition({
  route,
  currentStationCode,
  currentSequence,
  segmentProgress,
  geometry,
}: ResolvePositionInput): PositionResolution | null {
  /*
   * A route alone is not evidence of the train's
   * current physical location.
   */
  if (route.length === 0) {
    return null;
  }

  /*
   * Do not turn missing, invalid, or out-of-range
   * progress into a plausible-looking position.
   */
  if (
    typeof segmentProgress !== "number" ||
    !Number.isFinite(segmentProgress) ||
    segmentProgress < 0 ||
    segmentProgress > 1
  ) {
    return null;
  }

  /*
   * A valid along-track estimate requires geometry.
   */
  if (!geometry || geometry.length < 2) {
    return null;
  }

  /*
   * Match both station code and sequence to avoid
   * selecting a repeated station on the wrong section.
   */
  const currentIndex = route.findIndex(
    (point) =>
      point.sequence === currentSequence &&
      point.stationCode === currentStationCode
  );

  if (currentIndex === -1) {
    return null;
  }

  const currentPoint = route[currentIndex];
  const nextPoint = route[currentIndex + 1];

  /*
   * Without a following route point, we cannot establish
   * the segment on which to interpolate the train.
   */
  if (!nextPoint) {
    return null;
  }

  /*
   * Validate station coordinates before attempting
   * to match the relevant section of railway geometry.
   */
  const coordinatesAreValid = (
    point: RoutePoint
  ): point is RoutePoint & {
    lat: number;
    lng: number;
  } =>
    typeof point.lat === "number" &&
    Number.isFinite(point.lat) &&
    point.lat >= -90 &&
    point.lat <= 90 &&
    typeof point.lng === "number" &&
    Number.isFinite(point.lng) &&
    point.lng >= -180 &&
    point.lng <= 180;

  if (
    !coordinatesAreValid(currentPoint) ||
    !coordinatesAreValid(nextPoint)
  ) {
    return null;
  }

  /*
   * The result is a calculated position, not actual GPS.
   * This is defensible only if segmentProgress really
   * describes progress along this specific station segment.
   */
  const coordinate = calculateTrainPosition(
    geometry,
    [currentPoint.lng, currentPoint.lat],
    [nextPoint.lng, nextPoint.lat],
    segmentProgress
  );

  if (
    !coordinate ||
    coordinate.length !== 2 ||
    !Number.isFinite(coordinate[0]) ||
    !Number.isFinite(coordinate[1]) ||
    coordinate[0] < -180 ||
    coordinate[0] > 180 ||
    coordinate[1] < -90 ||
    coordinate[1] > 90
  ) {
    return null;
  }

  return {
    coordinate,
    source: "GEOMETRY",
    positionQuality: "CALCULATED",
    currentStation: currentPoint.stationCode,
    currentSequence: currentPoint.sequence,
    nextStation: nextPoint.stationCode,
    nextSequence: nextPoint.sequence,
  };
}
