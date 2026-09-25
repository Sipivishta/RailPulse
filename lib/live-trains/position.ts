export type Coordinate = [number, number];

type ProjectedPoint = {
  coordinate: Coordinate;
  segmentIndex: number;
  segmentFraction: number;
  distanceMeters: number;
};

const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function haversineDistance(
  a: Coordinate,
  b: Coordinate
): number {
  const lat1 = toRadians(a[1]);
  const lat2 = toRadians(b[1]);

  const deltaLat = toRadians(b[1] - a[1]);
  const deltaLng = toRadians(b[0] - a[0]);

  const sinLat =
    Math.sin(deltaLat / 2);

  const sinLng =
    Math.sin(deltaLng / 2);

  const value =
    sinLat * sinLat +
    Math.cos(lat1) *
      Math.cos(lat2) *
      sinLng *
      sinLng;

  return (
    2 *
    EARTH_RADIUS_METERS *
    Math.atan2(
      Math.sqrt(value),
      Math.sqrt(1 - value)
    )
  );
}

/**
 * Converts longitude/latitude into a local
 * equirectangular coordinate system.
 *
 * This is accurate enough for projecting onto
 * individual railway segments.
 */
function projectToLocal(
  coordinate: Coordinate,
  referenceLatitude: number
): [number, number] {
  const longitude =
    toRadians(coordinate[0]);

  const latitude =
    toRadians(coordinate[1]);

  const referenceLat =
    toRadians(referenceLatitude);

  return [
    EARTH_RADIUS_METERS *
      longitude *
      Math.cos(referenceLat),

    EARTH_RADIUS_METERS *
      latitude,
  ];
}

function localToCoordinate(
  point: [number, number],
  referenceLatitude: number
): Coordinate {
  const referenceLat =
    toRadians(referenceLatitude);

  const longitude =
    point[0] /
      (EARTH_RADIUS_METERS *
        Math.cos(referenceLat));

  const latitude =
    point[1] /
    EARTH_RADIUS_METERS;

  return [
    (longitude * 180) / Math.PI,
    (latitude * 180) / Math.PI,
  ];
}

/**
 * Finds the closest point on a LineString
 * to a supplied coordinate.
 */
function findNearestPoint(
  line: Coordinate[],
  target: Coordinate,
  startIndex = 0,
  endIndex = line.length - 1
): ProjectedPoint | null {
  if (line.length < 2) {
    return null;
  }

  const safeStart =
    Math.max(
      0,
      Math.min(
        startIndex,
        line.length - 2
      )
    );

  const safeEnd =
    Math.min(
      line.length - 2,
      Math.max(
        safeStart,
        endIndex
      )
    );

  const referenceLatitude =
    target[1];

  const targetLocal =
    projectToLocal(
      target,
      referenceLatitude
    );

  let best: ProjectedPoint | null =
    null;

  for (
    let index = safeStart;
    index <= safeEnd;
    index++
  ) {
    const start = line[index];
    const end = line[index + 1];

    const startLocal =
      projectToLocal(
        start,
        referenceLatitude
      );

    const endLocal =
      projectToLocal(
        end,
        referenceLatitude
      );

    const dx =
      endLocal[0] -
      startLocal[0];

    const dy =
      endLocal[1] -
      startLocal[1];

    const lengthSquared =
      dx * dx + dy * dy;

    let fraction = 0;

    if (lengthSquared > 0) {
      fraction =
        ((targetLocal[0] -
          startLocal[0]) *
          dx +
          (targetLocal[1] -
            startLocal[1]) *
            dy) /
        lengthSquared;

      fraction =
        Math.max(
          0,
          Math.min(1, fraction)
        );
    }

    const projectedLocal: [
      number,
      number
    ] = [
      startLocal[0] +
        dx * fraction,

      startLocal[1] +
        dy * fraction,
    ];

    const projected =
      localToCoordinate(
        projectedLocal,
        referenceLatitude
      );

    const distance =
      haversineDistance(
        target,
        projected
      );

    if (
      best === null ||
      distance < best.distanceMeters
    ) {
      best = {
        coordinate: projected,
        segmentIndex: index,
        segmentFraction: fraction,
        distanceMeters: distance,
      };
    }
  }

  return best;
}

/**
 * Finds a point at a given fraction along
 * a section of railway geometry.
 */
function pointAlongLine(
  line: Coordinate[],
  start: ProjectedPoint,
  end: ProjectedPoint,
  progress: number
): Coordinate {
  const clampedProgress =
    Math.max(
      0,
      Math.min(1, progress)
    );

  /*
   * If both station projections fall on the
   * same geometry segment, interpolate directly.
   */
  if (
    start.segmentIndex ===
    end.segmentIndex
  ) {
    const segmentStart =
      line[start.segmentIndex];

    const segmentEnd =
      line[start.segmentIndex + 1];

    const startFraction =
      start.segmentFraction;

    const endFraction =
      end.segmentFraction;

    const fraction =
      startFraction +
      (endFraction -
        startFraction) *
        clampedProgress;

    return [
      segmentStart[0] +
        (segmentEnd[0] -
          segmentStart[0]) *
          fraction,

      segmentStart[1] +
        (segmentEnd[1] -
          segmentStart[1]) *
          fraction,
    ];
  }

  /*
   * Build the section between the two projected
   * points and calculate its total physical length.
   */
  const points: Coordinate[] = [];

  points.push(start.coordinate);

  for (
    let index =
      start.segmentIndex + 1;
    index <= end.segmentIndex;
    index++
  ) {
    points.push(line[index]);
  }

  points.push(end.coordinate);

  if (points.length < 2) {
    return start.coordinate;
  }

  const lengths: number[] = [];
  let totalLength = 0;

  for (
    let index = 0;
    index < points.length - 1;
    index++
  ) {
    const length =
      haversineDistance(
        points[index],
        points[index + 1]
      );

    lengths.push(length);
    totalLength += length;
  }

  if (totalLength === 0) {
    return start.coordinate;
  }

  const targetDistance =
    totalLength *
    clampedProgress;

  let accumulated = 0;

  for (
    let index = 0;
    index < lengths.length;
    index++
  ) {
    const segmentLength =
      lengths[index];

    if (
      accumulated + segmentLength >=
      targetDistance
    ) {
      const remaining =
        targetDistance -
        accumulated;

      const fraction =
        segmentLength === 0
          ? 0
          : remaining /
            segmentLength;

      const a =
        points[index];

      const b =
        points[index + 1];

      return [
        a[0] +
          (b[0] - a[0]) *
            fraction,

        a[1] +
          (b[1] - a[1]) *
            fraction,
      ];
    }

    accumulated +=
      segmentLength;
  }

  return end.coordinate;
}

/**
 * Calculates a train's position on the actual
 * railway LineString.
 *
 * startCoordinate:
 *   coordinate of the current/reference station
 *
 * endCoordinate:
 *   coordinate of the next station
 *
 * progress:
 *   0.0 -> at start
 *   1.0 -> at end
 */
export function calculateTrainPosition(
  line: Coordinate[],
  startCoordinate: Coordinate,
  endCoordinate: Coordinate,
  progress: number
): Coordinate | null {
  if (line.length < 2) {
    return null;
  }

  if (
    !Number.isFinite(progress)
  ) {
    return null;
  }

  const clampedProgress =
    Math.max(
      0,
      Math.min(1, progress)
    );

  const startPoint =
    findNearestPoint(
      line,
      startCoordinate
    );

  if (!startPoint) {
    return null;
  }

  /*
   * Search for the destination station
   * after the start station on the route.
   *
   * This prevents accidentally selecting
   * a nearby point from an earlier section
   * when railway tracks cross or run close
   * to each other.
   */
  const endPoint =
    findNearestPoint(
      line,
      endCoordinate,
      startPoint.segmentIndex
    );

  if (!endPoint) {
    return null;
  }

  /*
   * If the projected destination occurs
   * before the projected start, the supplied
   * geometry direction does not match the
   * station direction.
   *
   * Reverse the geometry in that case.
   */
  if (
    endPoint.segmentIndex <
    startPoint.segmentIndex
  ) {
    const reversedLine =
      [...line].reverse();

    const reversedStart =
      findNearestPoint(
        reversedLine,
        startCoordinate
      );

    const reversedEnd =
      findNearestPoint(
        reversedLine,
        endCoordinate
      );

    if (
      !reversedStart ||
      !reversedEnd
    ) {
      return null;
    }

    return pointAlongLine(
      reversedLine,
      reversedStart,
      reversedEnd,
      clampedProgress
    );
  }

  return pointAlongLine(
    line,
    startPoint,
    endPoint,
    clampedProgress
  );
}