import fs from "node:fs/promises";
import osmtogeojson from "osmtogeojson";

const query = `
[out:json][timeout:180];

(
  node["railway"="station"](6.0,68.0,37.5,98.0);
  node["railway"="halt"](6.0,68.0,37.5,98.0);
);

out body;
`;

const response = await fetch(
  "https://overpass-api.de/api/interpreter",
  {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
      "User-Agent": "RailPulse/0.1 development",
    },
    body: query,
  }
);

if (!response.ok) {
  throw new Error(
    `Overpass request failed: ${response.status} ${response.statusText}`
  );
}

const osmData = await response.json();

const geojson = osmtogeojson(osmData);

geojson.features = geojson.features.filter(
  (feature) =>
    feature.geometry?.type === "Point" &&
    (
      feature.properties?.railway === "station" ||
      feature.properties?.railway === "halt"
    )
);

await fs.mkdir("public/data", { recursive: true });

await fs.writeFile(
  "public/data/india-railway-stations.geojson",
  JSON.stringify(geojson)
);

console.log(
  `Saved ${geojson.features.length} railway stations/halts.`
);