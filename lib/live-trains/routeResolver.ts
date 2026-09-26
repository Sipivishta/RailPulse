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
  source: "ROUTE_STATION" | "GEOMETRY";
  positionQuality: "CALCULATED";
  currentStation: string;
  currentSequence: number;
  nextStation: string | null;
  nextSequence: number | null;
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
  if (!route.length) {
    return null;
  }

  /*
   * Find the train's current route point.
   *
   * We prefer sequence because station codes are not always
   * guaranteed to be unique across all railway data.
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

  /*
   * If RailRadar has not supplied a segment progress value,
   * the safest real position we have is the route station
   * coordinate itself.
   */
  if (
    segmentProgress === null ||
    segmentProgress === undefined ||
    !Number.isFinite(segmentProgress)
  ) {
    if (
      typeof currentPoint.lng !== "number" ||
      typeof currentPoint.lat !== "number"
    ) {
      return null;
    }

    const nextPoint = route[currentIndex + 1] ?? null;

    return {
      coordinate: [currentPoint.lng, currentPoint.lat],
      source: "ROUTE_STATION",
      positionQuality: "CALCULATED",
      currentStation: currentPoint.stationCode,
      currentSequence: currentPoint.sequence,
      nextStation: nextPoint?.stationCode ?? null,
      nextSequence: nextPoint?.sequence ?? null,
    };
  }

  /*
   * Never allow invalid progress values.
   */
  const progress = Math.max(0, Math.min(1, segmentProgress));

  const nextPoint = route[currentIndex + 1];

  if (!nextPoint) {
    /*
     * There is no following route point.
     * Fall back to the current route coordinate.
     */
    if (
      typeof currentPoint.lng !== "number" ||
      typeof currentPoint.lat !== "number"
    ) {
      return null;
    }

    return {
      coordinate: [currentPoint.lng, currentPoint.lat],
      source: "ROUTE_STATION",
      positionQuality: "CALCULATED",
      currentStation: currentPoint.stationCode,
      currentSequence: currentPoint.sequence,
      nextStation: null,
      nextSequence: null,
    };
  }

  /*
   * We need geometry for an actual along-track calculation.
   */
  if (!geometry || geometry.length < 2) {
    if (
      typeof currentPoint.lng !== "number" ||
      typeof currentPoint.lat !== "number"
    ) {
      return null;
    }

    return {
      coordinate: [currentPoint.lng, currentPoint.lat],
      source: "ROUTE_STATION",
      positionQuality: "CALCULATED",
      currentStation: currentPoint.stationCode,
      currentSequence: currentPoint.sequence,
      nextStation: nextPoint.stationCode,
      nextSequence: nextPoint.sequence,
    };
  }

  /*
   * For now we calculate using the geometry supplied to the
   * position engine between the current route point and the
   * next route point.
   */
  if (
    typeof currentPoint.lng !== "number" ||
    typeof currentPoint.lat !== "number" ||
    typeof nextPoint.lng !== "number" ||
    typeof nextPoint.lat !== "number"
  ) {
    return null;
  }

  const coordinate = calculateTrainPosition(
    geometry,
    [currentPoint.lng, currentPoint.lat],
    [nextPoint.lng, nextPoint.lat],
    progress
  );

  if (!coordinate) {
    /*
     * If the geometry cannot be matched to this route segment,
     * do not invent a position.
     */
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