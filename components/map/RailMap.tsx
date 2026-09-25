"use client";

import {
  useEffect,
  useImperativeHandle,
  useRef,
  forwardRef,
} from "react";

import type { Station } from "@/lib/stations";
import {
  trains,
  type Train,
} from "@/components/train/trainData";

import {
  Map,
  NavigationControl,
  setWorkerUrl,
} from "maplibre-gl";

import "maplibre-gl/dist/maplibre-gl.css";

setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

export type RailMapHandle = {
  flyToStation: (coordinates: [number, number]) => void;
};

type RailMapProps = {
  onStationSelect?: (station: Station) => void;
  onTrainSelect?: (train: Train) => void;
};

const RailMap = forwardRef<RailMapHandle, RailMapProps>(
  function RailMap(
    {
      onStationSelect,
      onTrainSelect,
    },
    ref
  ) {
    const mapContainer = useRef<HTMLDivElement | null>(
      null
    );

    const map = useRef<Map | null>(null);

    const stationSelectRef =
      useRef(onStationSelect);

    const trainSelectRef =
      useRef(onTrainSelect);

    useEffect(() => {
      stationSelectRef.current =
        onStationSelect;
    }, [onStationSelect]);

    useEffect(() => {
      trainSelectRef.current =
        onTrainSelect;
    }, [onTrainSelect]);

    useImperativeHandle(ref, () => ({
      flyToStation(coordinates) {
        map.current?.flyTo({
          center: coordinates,
          zoom: 12,
          duration: 1800,
        });
      },
    }));

    useEffect(() => {
      const container = mapContainer.current;

      if (!container || map.current) {
        return;
      }

      const trainFeatures = trains.map(
        (train) => ({
          type: "Feature" as const,
          id: train.id,
          geometry: {
            type: "Point" as const,
            coordinates: train.currentPosition,
          },
          properties: {
            id: train.id,
            number: train.number,
            name: train.name,
            speed: train.speed,
            delay: train.delay,
            status: train.status,
            direction: train.direction,
            nextStation:
              train.nextStation ?? "",
            dataStatus: train.dataStatus,
          },
        })
      );

      const mapInstance = new Map({
        container,

        style: {
          version: 8,

          sources: {
            osm: {
              type: "raster",
              tiles: [
                "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
              ],
              tileSize: 256,
              attribution:
                "© OpenStreetMap contributors",
            },

            indiaBoundaries: {
              type: "geojson",
              data: "/data/india-state-boundaries.geojson",
            },

            railway: {
              type: "raster",
              tiles: [
                "https://tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png",
              ],
              tileSize: 256,
            },

            stations: {
              type: "geojson",
              data: "/data/india-railway-stations.geojson",
            },

            trains: {
              type: "geojson",
              data: {
                type: "FeatureCollection",
                features: trainFeatures,
              },
            },
          },

          layers: [
            {
              id: "osm",
              type: "raster",
              source: "osm",
            },

            {
              id: "india-boundary-fill",
              type: "fill",
              source: "indiaBoundaries",
              paint: {
                "fill-color": "#8b5cf6",
                "fill-opacity": 0.04,
              },
            },

            {
              id: "india-boundary-lines",
              type: "line",
              source: "indiaBoundaries",
              paint: {
                "line-color": "#a855f7",
                "line-width": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  3,
                  0.7,
                  5,
                  1.2,
                  8,
                  2,
                ],
                "line-opacity": 0.75,
              },
            },

            {
              id: "railway",
              type: "raster",
              source: "railway",
              minzoom: 2,
              maxzoom: 19,
              paint: {
                "raster-opacity": 0.9,
              },
            },

            /* -------------------------
               STATIONS
            ------------------------- */

            {
              id: "station-points",
              type: "circle",
              source: "stations",
              minzoom: 7,
              paint: {
                "circle-radius": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  4.5,
                  1.5,
                  7,
                  3,
                  10,
                  5,
                  14,
                  7,
                ],
                "circle-color": "#ffffff",
                "circle-opacity": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  4.5,
                  0.25,
                  6,
                  0.65,
                  8,
                  0.9,
                ],
                "circle-stroke-color":
                  "#111827",
                "circle-stroke-width": 1,
              },
            },

            {
              id: "station-labels",
              type: "symbol",
              source: "stations",
              minzoom: 8,
              layout: {
                "text-field": [
                  "coalesce",
                  ["get", "name"],
                  ["get", "name:en"],
                  "",
                ],
                "text-size": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  8,
                  9,
                  12,
                  11,
                  16,
                  13,
                ],
                "text-offset": [0, 1.2],
                "text-anchor": "top",
                "text-max-width": 10,
                "text-allow-overlap": false,
              },
              paint: {
                "text-color": "#111827",
                "text-halo-color":
                  "#ffffff",
                "text-halo-width": 1.5,
                "text-halo-blur": 0.2,
              },
            },

            /* -------------------------
               TRAINS
            ------------------------- */

            {
              id: "train-glow",
              type: "circle",
              source: "trains",

              paint: {
                "circle-radius": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  4,
                  9,
                  8,
                  12,
                  12,
                  15,
                ],

                "circle-color": [
                  "case",

                  [
                    "==",
                    ["get", "status"],
                    "DELAYED",
                  ],

                  "#f59e0b",

                  "#22d3ee",
                ],

                "circle-opacity": 0.16,

                "circle-blur": 1,
              },
            },

            {
              id: "train-points",
              type: "circle",
              source: "trains",

              paint: {
                "circle-radius": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  4,
                  3.5,
                  8,
                  5,
                  12,
                  7,
                ],

                "circle-color": [
                  "case",

                  [
                    "==",
                    ["get", "status"],
                    "DELAYED",
                  ],

                  "#fbbf24",

                  "#67e8f9",
                ],

                "circle-opacity": 1,

                "circle-stroke-color":
                  "#071218",

                "circle-stroke-width": 2,
              },
            },

            {
              id: "train-direction",
              type: "symbol",
              source: "trains",

              layout: {
                "text-field": [
                  "case",

                  [
                    "==",
                    ["get", "direction"],
                    "NORTHBOUND",
                  ],

                  "▲",

                  "▼",
                ],

                "text-size": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  4,
                  7,
                  8,
                  9,
                  12,
                  11,
                ],

                "text-offset": [0, -1.8],

                "text-allow-overlap": true,
              },

              paint: {
                "text-color": [
                  "case",

                  [
                    "==",
                    ["get", "status"],
                    "DELAYED",
                  ],

                  "#fbbf24",

                  "#67e8f9",
                ],

                "text-halo-color":
                  "#071218",

                "text-halo-width": 1,
              },
            },

            {
              id: "train-labels",
              type: "symbol",
              source: "trains",

              minzoom: 8,

              layout: {
                "text-field": [
                  "get",
                  "number",
                ],

                "text-size": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  8,
                  9,
                  12,
                  11,
                ],

                "text-offset": [0, 1.8],

                "text-anchor": "top",

                "text-allow-overlap": false,
              },

              paint: {
                "text-color": "#ffffff",

                "text-halo-color":
                  "#071218",

                "text-halo-width": 1.5,
              },
            },
          ],
        },

        center: [78.9629, 22.5937],

        zoom: 4.2,

        minZoom: 3,

        maxZoom: 18,
      });

      /* -------------------------
         MAP CONTROLS
      ------------------------- */

      mapInstance.addControl(
        new NavigationControl(),
        "top-right"
      );

      map.current = mapInstance;

      /* -------------------------
         STATION CLICK
      ------------------------- */

      mapInstance.on(
        "click",
        "station-points",
        (event) => {
          const feature =
            event.features?.[0];

          if (!feature) {
            return;
          }

          const coordinates = (
            feature.geometry as {
              type: "Point";
              coordinates: [number, number];
            }
          ).coordinates;

          const properties =
            feature.properties ?? {};

          const name =
            properties.name ??
            properties["name:en"] ??
            "Railway Station";

          const code =
            properties[
              "ref:IN:railway"
            ] ??
            properties.ref ??
            properties.code;

          const station: Station = {
            id:
              feature.id?.toString() ??
              `${coordinates[0]}-${coordinates[1]}`,

            name: String(name),

            ...(code
              ? {
                  code: String(code),
                }
              : {}),

            coordinates,
          };

          stationSelectRef.current?.(
            station
          );
        }
      );

      /* -------------------------
         TRAIN CLICK
      ------------------------- */

      mapInstance.on(
        "click",
        "train-points",
        (event) => {
          const feature =
            event.features?.[0];

          if (!feature) {
            return;
          }

          const trainId =
            feature.properties?.id;

          if (!trainId) {
            return;
          }

          const train = trains.find(
            (item) =>
              item.id === String(trainId)
          );

          if (!train) {
            return;
          }

          trainSelectRef.current?.(
            train
          );
        }
      );

      /* -------------------------
         STATION HOVER
      ------------------------- */

      mapInstance.on(
        "mouseenter",
        "station-points",
        () => {
          mapInstance.getCanvas().style.cursor =
            "pointer";
        }
      );

      mapInstance.on(
        "mouseleave",
        "station-points",
        () => {
          mapInstance.getCanvas().style.cursor =
            "";
        }
      );

      /* -------------------------
         TRAIN HOVER
      ------------------------- */

      mapInstance.on(
        "mouseenter",
        "train-points",
        () => {
          mapInstance.getCanvas().style.cursor =
            "pointer";
        }
      );

      mapInstance.on(
        "mouseleave",
        "train-points",
        () => {
          mapInstance.getCanvas().style.cursor =
            "";
        }
      );

      /* -------------------------
         RESIZE
      ------------------------- */

      const resizeObserver =
        new ResizeObserver(() => {
          mapInstance.resize();
        });

      resizeObserver.observe(container);

      mapInstance.once("load", () => {
        mapInstance.resize();
      });

      return () => {
        resizeObserver.disconnect();

        mapInstance.remove();

        map.current = null;
      };
    }, []);

    return (
      <div
        ref={mapContainer}
        className="absolute inset-0 h-full w-full"
      />
    );
  }
);

RailMap.displayName = "RailMap";

export default RailMap;