"use client";

import { useEffect, useRef } from "react";
import {
  Map,
  NavigationControl,
  Popup,
  setWorkerUrl,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

export default function RailMap() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<Map | null>(null);

  useEffect(() => {
    const container = mapContainer.current;

    if (!container || map.current) {
      return;
    }

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
            attribution: "© OpenStreetMap contributors",
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
              "circle-stroke-color": "#111827",
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
              "text-halo-color": "#ffffff",
              "text-halo-width": 1.5,
              "text-halo-blur": 0.2,
            },
          },
        ],
      },

      center: [78.9629, 22.5937],
      zoom: 4.2,
      minZoom: 3,
      maxZoom: 18,
    });

    mapInstance.addControl(
      new NavigationControl(),
      "top-right"
    );

    map.current = mapInstance;

    mapInstance.on("click", "station-points", (event) => {
      const feature = event.features?.[0];

      if (!feature) {
        return;
      }

      const coordinates = (
  feature.geometry as {
    type: "Point";
    coordinates: [number, number];
  }
).coordinates;

      const properties = feature.properties ?? {};

      const name =
        properties.name ??
        properties["name:en"] ??
        "Railway Station";

      const code =
        properties["ref:IN:railway"] ??
        properties.ref ??
        properties.code ??
        "Code unavailable";

      new Popup({
        closeButton: true,
        closeOnClick: true,
        offset: 10,
      })
        .setLngLat(coordinates)
        .setHTML(
          `
            <div style="
              min-width: 180px;
              font-family: Arial, Helvetica, sans-serif;
              color: #111827;
            ">
              <div style="
                font-size: 14px;
                font-weight: 700;
                margin-bottom: 5px;
              ">
                ${escapeHtml(String(name))}
              </div>

              <div style="
                font-size: 11px;
                color: #6b7280;
              ">
                Station code:
                <strong>${escapeHtml(String(code))}</strong>
              </div>
            </div>
          `
        )
        .addTo(mapInstance);
    });

    mapInstance.on(
      "mouseenter",
      "station-points",
      () => {
        mapInstance.getCanvas().style.cursor = "pointer";
      }
    );

    mapInstance.on(
      "mouseleave",
      "station-points",
      () => {
        mapInstance.getCanvas().style.cursor = "";
      }
    );

    const resizeObserver = new ResizeObserver(() => {
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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}