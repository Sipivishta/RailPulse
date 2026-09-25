export type Station = {
  id: string;
  name: string;
  code?: string;
  coordinates: [number, number];
};

type GeoJSONFeature = {
  id?: string | number;
  geometry?: {
    type?: string;
    coordinates?: unknown;
  };
  properties?: Record<string, unknown>;
};

type StationGeoJSON = {
  features?: GeoJSONFeature[];
};

function getString(
  properties: Record<string, unknown>,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = properties[key];

    if (
      typeof value === "string" &&
      value.trim().length > 0
    ) {
      return value.trim();
    }
  }

  return undefined;
}

export function parseStations(
  data: StationGeoJSON
): Station[] {
  if (!Array.isArray(data.features)) {
    return [];
  }

  return data.features
    .map((feature): Station | null => {
      const properties = feature.properties ?? {};
      const coordinates = feature.geometry?.coordinates;

      const name = getString(
        properties,
        "name",
        "name:en"
      );

      if (
        !name ||
        !Array.isArray(coordinates) ||
        coordinates.length < 2
      ) {
        return null;
      }

      const longitude = Number(coordinates[0]);
      const latitude = Number(coordinates[1]);

      if (
        !Number.isFinite(longitude) ||
        !Number.isFinite(latitude)
      ) {
        return null;
      }

      const code = getString(
        properties,
        "ref:IN:railway",
        "ref",
        "code"
      );

      return {
        id:
          feature.id?.toString() ??
          `${longitude}-${latitude}`,

        name,

        ...(code ? { code } : {}),

        coordinates: [
          longitude,
          latitude,
        ],
      };
    })
    .filter(
      (station): station is Station =>
        station !== null
    );
}

export async function loadStations(): Promise<Station[]> {
  const response = await fetch(
    "/data/india-railway-stations.geojson"
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load station data: ${response.status}`
    );
  }

  const data: StationGeoJSON =
    await response.json();

  return parseStations(data);
}