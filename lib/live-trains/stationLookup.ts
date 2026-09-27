import type { Coordinate } from "./position";

type StationFeature = {
  type: "Feature";
  geometry?: {
    type: string;
    coordinates?: unknown;
  };
  properties?: Record<string, unknown>;
};

type StationCollection = {
  type: "FeatureCollection";
  features: StationFeature[];
};

export type ResolvedStation = {
  code: string;
  name: string;
  coordinate: Coordinate;
};

function getStationCode(
  properties: Record<string, unknown>
): string | null {
  const possibleKeys = [
    "code",
    "stationCode",
    "station_code",
    "ref",
    "uic_ref",
  ];

  for (const key of possibleKeys) {
    const value = properties[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim().toUpperCase();
    }
  }

  return null;
}

function getStationName(
  properties: Record<string, unknown>
): string {
  const possibleKeys = [
    "name",
    "stationName",
    "station_name",
    "official_name",
  ];

  for (const key of possibleKeys) {
    const value = properties[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "Unknown station";
}

function getCoordinate(
  geometry: StationFeature["geometry"]
): Coordinate | null {
  if (!geometry || geometry.type !== "Point") {
    return null;
  }

  if (!Array.isArray(geometry.coordinates)) {
    return null;
  }

  const [lng, lat] = geometry.coordinates;

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

export function buildStationLookup(
  collection: StationCollection
): Map<string, ResolvedStation> {
  const lookup = new Map<string, ResolvedStation>();

  for (const feature of collection.features) {
    const properties = feature.properties ?? {};

    const code = getStationCode(properties);
    const coordinate = getCoordinate(feature.geometry);

    if (!code || !coordinate) {
      continue;
    }

    lookup.set(code, {
      code,
      name: getStationName(properties),
      coordinate,
    });
  }

  return lookup;
}