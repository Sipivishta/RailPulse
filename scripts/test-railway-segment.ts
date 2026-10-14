import fs from "fs";
import {
  findRailwaySegment,
} from "../lib/live-trains/railwaySegment";

const stations = {
  KDHA: [75.9101566, 23.1048454] as [number, number],
  VRG: [75.8179959, 23.161783] as [number, number],
};

const railway = JSON.parse(
  fs.readFileSync(
    "public/data/india-railway-tracks-simplified.geojson",
    "utf-8"
  )
);

const result = findRailwaySegment(
  railway,
  stations.KDHA,
  stations.VRG
);

if (!result) {
  console.log("NO RAILWAY SEGMENT FOUND");
  process.exit(1);
}

console.log("RAILWAY SEGMENT FOUND");
console.log("Points:", result.geometry.length);
console.log("Distance:", result.distanceKm.toFixed(3), "km");
console.log("First point:", result.geometry[0]);
console.log(
  "Last point:",
  result.geometry[result.geometry.length - 1]
);