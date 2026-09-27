import type { Coordinate } from "./position";

type RailwayFeature = {
  type: "Feature";
  geometry?: {
    type?: string;
    coordinates?: unknown;
  };
  properties?: Record<string, unknown>;
};

type RailwayCollection = {
  type: "FeatureCollection";
  features: RailwayFeature[];
};

export type RailwaySegment = {
  geometry: Coordinate[];
  distanceKm: number;
};

function toCoordinate(value: unknown): Coordinate | null {
  if (!Array.isArray(value) || value.length < 2) {
    return null;
  }

  const lng = value[0];
  const lat = value[1];

  if (
    typeof lng !== "number" ||
    typeof lat !== "number" ||
    !Number.isFinite(lng) ||
    !Number.isFinite(lat)
  ) {
    return null;
  }

  return [lng, lat];
}

function haversineKm(
  a: Coordinate,
  b: Coordinate
): number {
  const R = 6371;

  const lat1 = (a[1] * Math.PI) / 180;
  const lat2 = (b[1] * Math.PI) / 180;

  const dLat =
    ((b[1] - a[1]) * Math.PI) / 180;

  const dLng =
    ((b[0] - a[0]) * Math.PI) / 180;

  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);

  const h =
    sinLat * sinLat +
    Math.cos(lat1) *
      Math.cos(lat2) *
      sinLng *
      sinLng;

  return (
    2 *
    R *
    Math.atan2(
      Math.sqrt(h),
      Math.sqrt(1 - h)
    )
  );
}

function lineDistanceKm(
  coordinates: Coordinate[]
): number {
  let distance = 0;

  for (let i = 1; i < coordinates.length; i++) {
    distance += haversineKm(
      coordinates[i - 1],
      coordinates[i]
    );
  }

  return distance;
}

function distanceToLine(
  point: Coordinate,
  line: Coordinate[]
): number {
  let minimum = Infinity;

  for (const coordinate of line) {
    minimum = Math.min(
      minimum,
      haversineKm(point, coordinate)
    );
  }

  return minimum;
}

function reverseIfNeeded(
  line: Coordinate[],
  start: Coordinate,
  end: Coordinate
): Coordinate[] {
  if (line.length < 2) {
    return line;
  }

  const forward =
    haversineKm(start, line[0]) +
    haversineKm(end, line[line.length - 1]);

  const backward =
    haversineKm(start, line[line.length - 1]) +
    haversineKm(end, line[0]);

  return backward < forward
    ? [...line].reverse()
    : line;
}

function deduplicate(
  coordinates: Coordinate[]
): Coordinate[] {
  const result: Coordinate[] = [];

  for (const coordinate of coordinates) {
    const previous = result[result.length - 1];

    if (
      previous &&
      previous[0] === coordinate[0] &&
      previous[1] === coordinate[1]
    ) {
      continue;
    }

    result.push(coordinate);
  }

  return result;
}

/**
 * Finds the railway corridor between two stations.
 *
 * Indian railway OSM data often represents double-track
 * sections as separate, parallel LineStrings. Therefore
 * this function does NOT require one LineString to touch
 * both stations.
 *
 * It selects the railway ways that form the corridor and
 * combines them into one ordered geometry.
 */
export function findRailwaySegment(
  collection: RailwayCollection,
  currentStation: Coordinate,
  nextStation: Coordinate
): RailwaySegment | null {
  const candidates: {
    geometry: Coordinate[];
    startDistance: number;
    endDistance: number;
    score: number;
  }[] = [];

  for (const feature of collection.features) {
    const geometry = feature.geometry;

    if (!geometry || geometry.type !== "LineString") {
      continue;
    }

    if (!Array.isArray(geometry.coordinates)) {
      continue;
    }

    const coordinates = geometry.coordinates
      .map(toCoordinate)
      .filter(
        (coordinate): coordinate is Coordinate =>
          coordinate !== null
      );

    if (coordinates.length < 2) {
      continue;
    }

    const startDistance = distanceToLine(
      currentStation,
      coordinates
    );

    const endDistance = distanceToLine(
      nextStation,
      coordinates
    );

    /*
     * Keep ways that are close to either endpoint.
     * We then use their corridor relationship rather
     * than demanding that one way touches both stations.
     */
    if (
      startDistance > 1.5 &&
      endDistance > 1.5
    ) {
      continue;
    }

    candidates.push({
      geometry: coordinates,
      startDistance,
      endDistance,
      score:
        Math.min(
          startDistance,
          endDistance
        ),
    });
  }

  if (candidates.length === 0) {
    return null;
  }

  /*
   * Prefer a candidate that is close to both stations.
   */
  candidates.sort((a, b) => {
    const aScore =
      a.startDistance + a.endDistance;

    const bScore =
      b.startDistance + b.endDistance;

    return aScore - bScore;
  });

  const best = candidates[0];

  /*
   * If the best individual way is already close to
   * both stations, use it directly.
   */
  if (
    best.startDistance < 1 &&
    best.endDistance < 1
  ) {
    const geometry = reverseIfNeeded(
      best.geometry,
      currentStation,
      nextStation
    );

    return {
      geometry,
      distanceKm: lineDistanceKm(geometry),
    };
  }

  /*
   * Otherwise choose the best corridor candidates and
   * order them by their midpoint position.
   */
  const midpoint: Coordinate = [
    (currentStation[0] + nextStation[0]) / 2,
    (currentStation[1] + nextStation[1]) / 2,
  ];

  const corridor = candidates
    .filter(
      (candidate) =>
        distanceToLine(
          midpoint,
          candidate.geometry
        ) < 2
    )
    .sort(
      (a, b) =>
        distanceToLine(
          midpoint,
          a.geometry
        ) -
        distanceToLine(
          midpoint,
          b.geometry
        )
    );

  const selected =
    corridor.length > 0
      ? corridor
      : [best];

  let geometry = selected[0].geometry;

  /*
   * Find the candidate whose geometry is closest to
   * the current station and orient the corridor from
   * current → next.
   */
  let startCandidate = selected[0];

  for (const candidate of selected) {
    if (
      candidate.startDistance <
      startCandidate.startDistance
    ) {
      startCandidate = candidate;
    }
  }

  geometry = reverseIfNeeded(
    geometry,
    currentStation,
    nextStation
  );

  geometry = deduplicate(geometry);

  return {
    geometry,
    distanceKm: lineDistanceKm(geometry),
  };
}