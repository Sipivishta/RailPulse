"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

import {
  Map as MapLibreMap,
  NavigationControl,
  Marker,
  setWorkerUrl,
} from "maplibre-gl";

import type { Station } from "@/lib/stations";

import "maplibre-gl/dist/maplibre-gl.css";

export type RailMapHandle = {
  flyToStation: (
    coordinate: [number, number]
  ) => void;
};

type RailMapProps = {
  onStationSelect?: (
    station: Station
  ) => void;
};

const INDIA_CENTER: [number, number] = [
  78.9629,
  22.5937,
];

const INDIA_ZOOM = 4.2;

const OSM_TILE_URL =
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

const OPEN_RAILWAY_MAP_TILE_URL =
  "https://tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png";

const RailMap = forwardRef<
  RailMapHandle,
  RailMapProps
>(function RailMap(
  { onStationSelect },
  ref
) {
  const containerRef =
    useRef<HTMLDivElement | null>(null);

  const mapRef =
    useRef<MapLibreMap | null>(null);

  const stationMarkersRef =
    useRef<Map<string, Marker>>(
      new globalThis.Map<
        string,
        Marker
      >()
    );

  /*
   * MapLibre worker
   */
  setWorkerUrl(
    "/maplibre/maplibre-gl-worker.mjs"
  );

  /*
   * Expose map controls to page.tsx.
   */
  useImperativeHandle(
    ref,
    () => ({
      flyToStation(coordinate) {
        const map = mapRef.current;

        if (!map) {
          return;
        }

        const [lng, lat] =
          coordinate;

        if (
          !Number.isFinite(lng) ||
          !Number.isFinite(lat)
        ) {
          return;
        }

        map.flyTo({
          center: [lng, lat],
          zoom: 12,
          speed: 1.4,
          curve: 1.4,
          essential: true,
        });

        /*
         * Temporary selected-station marker.
         */
        const markerElement =
          document.createElement("div");

        markerElement.style.width =
          "16px";

        markerElement.style.height =
          "16px";

        markerElement.style.borderRadius =
          "9999px";

        markerElement.style.background =
          "#22d3ee";

        markerElement.style.border =
          "3px solid rgba(255,255,255,0.95)";

        markerElement.style.boxShadow =
          "0 0 0 6px rgba(34,211,238,0.20), 0 0 25px rgba(34,211,238,0.95)";

        const selectedMarker =
          new Marker({
            element: markerElement,
            anchor: "center",
          })
            .setLngLat([
              lng,
              lat,
            ])
            .addTo(map);

        window.setTimeout(() => {
          selectedMarker.remove();
        }, 6000);
      },
    }),
    []
  );

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    if (mapRef.current) {
      return;
    }

    const map = new MapLibreMap({
      container:
        containerRef.current,

      center: INDIA_CENTER,

      zoom: INDIA_ZOOM,

      minZoom: 3,

      maxZoom: 18,

      renderWorldCopies: false,

      style: {
        version: 8,

        sources: {
          osm: {
            type: "raster",

            tiles: [
              OSM_TILE_URL,
            ],

            tileSize: 256,

            attribution:
              "© OpenStreetMap contributors",
          },

          openrailwaymap: {
            type: "raster",

            tiles: [
              OPEN_RAILWAY_MAP_TILE_URL,
            ],

            tileSize: 256,

            attribution:
              "OpenRailwayMap / OpenStreetMap",
          },
        },

        layers: [
          {
            id: "osm-base",

            type: "raster",

            source: "osm",

            paint: {
              "raster-saturation": -0.25,

              "raster-contrast": 0.05,

              "raster-brightness-min": 0.05,

              "raster-brightness-max": 0.92,
            },
          },

          {
            id: "railway-overlay",

            type: "raster",

            source:
              "openrailwaymap",

            paint: {
              "raster-opacity": 0.78,
            },
          },
        ],
      },
    });

    mapRef.current = map;

    /*
     * Navigation controls.
     *
     * MapLibre only accepts positions such as
     * top-right, bottom-right, etc.
     *
     * We use top-right here and move the
     * control to the vertical center using
     * CSS in globals.css.
     */
    map.addControl(
      new NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: false,
      }),
      "top-right"
    );

    /*
     * Load station GeoJSON.
     */
    async function loadStationData() {
      try {
        const response =
          await fetch(
            "/data/india-railway-stations.geojson"
          );

        if (!response.ok) {
          throw new Error(
            `Station data request failed: ${response.status}`
          );
        }

        const geojson =
          await response.json();

        if (
          !geojson ||
          geojson.type !==
            "FeatureCollection" ||
          !Array.isArray(
            geojson.features
          )
        ) {
          throw new Error(
            "Invalid station GeoJSON."
          );
        }

        /*
         * Station source.
         */
        if (
          !map.getSource(
            "stations"
          )
        ) {
          map.addSource(
            "stations",
            {
              type: "geojson",
              data: geojson,
            }
          );
        }

        /*
         * Station points.
         */
        if (
          !map.getLayer(
            "station-points"
          )
        ) {
          map.addLayer({
            id: "station-points",

            type: "circle",

            source: "stations",

            minzoom: 7,

            paint: {
              "circle-radius": [
                "interpolate",
                ["linear"],
                ["zoom"],
                7,
                2,
                12,
                4,
                16,
                6,
              ],

              "circle-color":
                "rgba(34,211,238,0.85)",

              "circle-stroke-color":
                "rgba(255,255,255,0.85)",

              "circle-stroke-width": 1,

              "circle-opacity": 0.8,
            },
          });
        }

        /*
         * Station click.
         */
        map.on(
          "click",
          "station-points",
          (event) => {
            const feature =
              event.features?.[0];

            if (!feature) {
              return;
            }

            if (
              feature.geometry.type !==
              "Point"
            ) {
              return;
            }

            const coordinates =
              feature.geometry
                .coordinates;

            if (
              coordinates.length < 2
            ) {
              return;
            }

            const lng =
              Number(
                coordinates[0]
              );

            const lat =
              Number(
                coordinates[1]
              );

            if (
              !Number.isFinite(
                lng
              ) ||
              !Number.isFinite(
                lat
              )
            ) {
              return;
            }

            const properties =
              feature.properties ??
              {};

            /*
             * Station type uses:
             *
             * coordinates:
             * [longitude, latitude]
             */
            const station: Station = {
              id:
                String(
                  properties.id ??
                    `${properties.code ?? "station"}-${lng}-${lat}`
                ),

              name:
                String(
                  properties.name ??
                    "Unknown Station"
                ),

              code:
                properties.code
                  ? String(
                      properties.code
                    )
                  : undefined,

              coordinates: [
                lng,
                lat,
              ],
            };

            onStationSelect?.(
              station
            );

            /*
             * Fly to clicked station.
             */
            map.flyTo({
              center: [
                lng,
                lat,
              ],

              zoom: 12,

              speed: 1.4,

              curve: 1.4,

              essential: true,
            });
          }
        );

        /*
         * Pointer cursor when hovering
         * over station points.
         */
        map.on(
          "mouseenter",
          "station-points",
          () => {
            map.getCanvas().style.cursor =
              "pointer";
          }
        );

        map.on(
          "mouseleave",
          "station-points",
          () => {
            map.getCanvas().style.cursor =
              "";
          }
        );
      } catch (error) {
        console.error(
          "Failed to load station GeoJSON:",
          error
        );
      }
    }

    if (map.isStyleLoaded()) {
      void loadStationData();
    } else {
      map.once("load", () => {
        void loadStationData();
      });
    }

    /*
     * Keep MapLibre sized correctly.
     */
    const resizeObserver =
      new ResizeObserver(() => {
        map.resize();
      });

    resizeObserver.observe(
      containerRef.current
    );

    /*
     * Cleanup.
     */
    return () => {
      resizeObserver.disconnect();

      stationMarkersRef.current.forEach(
        (
          marker: Marker
        ) => {
          marker.remove();
        }
      );

      stationMarkersRef.current.clear();

      map.remove();

      mapRef.current = null;
    };
  }, [onStationSelect]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 h-full w-full"
    />
  );
});

RailMap.displayName =
  "RailMap";

export default RailMap;