"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type { Map as MapLibreMap } from "maplibre-gl";

import RailMap, {
  type RailMapHandle,
} from "@/components/map/RailMap";

import StationSearch, {
  type TrainSearchResult,
} from "@/components/search/StationSearch";

import StationIntelligencePanel from "@/components/station/StationIntelligencePanel";

import TrainLayer from "@/components/train/TrainLayer";

import type { Station } from "@/lib/stations";

import type {
  LiveTrain,
  LiveTrainApiResponse,
} from "@/lib/live-trains/liveTrain";

const TEST_TRAIN_NUMBER = "12919";

export default function Home() {
  const railMapRef =
    useRef<RailMapHandle>(null);

  const [mapInstance, setMapInstance] =
    useState<MapLibreMap | null>(null);

  const [selectedStation, setSelectedStation] =
    useState<Station | null>(null);

  const [selectedTrain, setSelectedTrain] =
    useState<TrainSearchResult | null>(null);

  const [liveTrains, setLiveTrains] =
    useState<LiveTrain[]>([]);

  const [selectedLiveTrain, setSelectedLiveTrain] =
    useState<LiveTrain | null>(null);

  const [liveTrainError, setLiveTrainError] =
    useState<string | null>(null);

  /*
   * Get the MapLibre instance.
   */
  useEffect(() => {
    let cancelled = false;

    let waitTimer: number | null = null;

    const findMap = () => {
      if (cancelled) {
        return;
      }

      const map =
        railMapRef.current?.getMap();

      if (!map) {
        return;
      }

      setMapInstance(map);

      if (waitTimer !== null) {
        window.clearInterval(
          waitTimer
        );

        waitTimer = null;
      }
    };

    waitTimer =
      window.setInterval(
        findMap,
        100
      );

    findMap();

    return () => {
      cancelled = true;

      if (waitTimer !== null) {
        window.clearInterval(
          waitTimer
        );
      }
    };
  }, []);

  /*
   * Initial test:
   *
   * Load real NTES train 12919 once when
   * the map becomes available.
   *
   * This is intentionally one request while
   * we validate the NTES → OSM pipeline.
   */
  useEffect(() => {
    if (!mapInstance) {
      return;
    }

    let cancelled = false;

    const controller =
      new AbortController();

    async function loadInitialTrain() {
      try {
        setLiveTrainError(null);

        console.log(
          `Loading real NTES train ${TEST_TRAIN_NUMBER}...`
        );

        const response =
          await fetch(
            `/api/trains/ntes?number=${TEST_TRAIN_NUMBER}`,
            {
              signal:
                controller.signal,
              cache: "no-store",
            }
          );

        if (!response.ok) {
          throw new Error(
            `Train API request failed: ${response.status}`
          );
        }

        const data =
          (await response.json()) as LiveTrainApiResponse;

        if (cancelled) {
          return;
        }

        if (
          !data.success ||
          !data.train
        ) {
          throw new Error(
            data.error ??
              "Train API returned no train data."
          );
        }

        console.log(
          "Real NTES train loaded:",
          data.train
        );

        /*
         * Put the real train into the
         * TrainLayer.
         */
        setLiveTrains([
          data.train,
        ]);

        /*
         * Open the live train information panel.
         */
        setSelectedLiveTrain(
          data.train
        );

        /*
         * Automatically move the map
         * to the train's calculated position.
         *
         * IMPORTANT:
         * NTES does not provide GPS position.
         * Our backend currently resolves the
         * confirmed station to its real OSM
         * coordinate.
         */
        if (
          data.train.position &&
          data.train.position.length >= 2 &&
          mapInstance
        ) {
          const lng =
            Number(
              data.train.position[0]
            );

          const lat =
            Number(
              data.train.position[1]
            );

          if (
            Number.isFinite(lng) &&
            Number.isFinite(lat)
          ) {
            console.log(
              "Flying map to NTES train position:",
              {
                lng,
                lat,
                quality:
                  data.train.positionQuality,
              }
            );

            mapInstance.flyTo({
              center: [
                lng,
                lat,
              ],
              zoom: 10,
              duration: 1800,
              essential: true,
            });
          } else {
            console.warn(
              "NTES train position contains invalid coordinates.",
              data.train.position
            );
          }
        } else {
          console.warn(
            "NTES train has no usable position:",
            {
              position:
                data.train.position,
              positionQuality:
                data.train.positionQuality,
            }
          );
        }
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        console.error(
          "Failed to load real NTES train:",
          error
        );

        setLiveTrainError(
          error instanceof Error
            ? error.message
            : "Unknown train loading error."
        );
      }
    }

    void loadInitialTrain();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [mapInstance]);

  /*
   * Station selection.
   */
  const handleStationSelect =
    useCallback(
      (station: Station) => {
        setSelectedStation(
          station
        );

        setSelectedTrain(null);

        setSelectedLiveTrain(
          null
        );

        railMapRef.current?.flyToStation(
          station.coordinates
        );
      },
      []
    );

  /*
   * Train selection from search.
   *
   * The search result itself does not necessarily
   * contain the current geographic position.
   *
   * Therefore we use its train number to fetch
   * live train data.
   *
   * For now this uses the RailRadar endpoint
   * because it provides the richer train position
   * response for searched trains.
   */
  const handleTrainSelect =
    useCallback(
      async (
        train: TrainSearchResult
      ) => {
        setSelectedTrain(
          train
        );

        setSelectedStation(
          null
        );

        setSelectedLiveTrain(
          null
        );

        setLiveTrainError(
          null
        );

        const trainNumber =
          train.number?.trim();

        if (!trainNumber) {
          setLiveTrainError(
            "Train number is missing."
          );

          return;
        }

        try {
          console.log(
            `Loading searched train ${trainNumber}...`
          );

          const response =
            await fetch(
              `/api/trains/live?number=${encodeURIComponent(
                trainNumber
              )}`,
              {
                cache: "no-store",
              }
            );

          if (!response.ok) {
            throw new Error(
              `Train API request failed: ${response.status}`
            );
          }

          const data =
            (await response.json()) as LiveTrainApiResponse;

          if (
            !data.success ||
            !data.train
          ) {
            throw new Error(
              data.error ??
                `No live data found for train ${trainNumber}.`
            );
          }

          const liveTrain =
            data.train;

          console.log(
            "Searched real train loaded:",
            liveTrain
          );

          /*
           * Put the real train into the
           * TrainLayer.
           */
          setLiveTrains([
            liveTrain,
          ]);

          /*
           * Open the live-train information panel.
           */
          setSelectedLiveTrain(
            liveTrain
          );

          /*
           * Automatically move the map
           * to the train's actual/calculated
           * position.
           */
          if (
            liveTrain.position &&
            liveTrain.position.length >= 2 &&
            mapInstance
          ) {
            const lng =
              Number(
                liveTrain.position[0]
              );

            const lat =
              Number(
                liveTrain.position[1]
              );

            if (
              Number.isFinite(lng) &&
              Number.isFinite(lat)
            ) {
              console.log(
                "Flying map to train position:",
                {
                  lng,
                  lat,
                  quality:
                    liveTrain.positionQuality,
                }
              );

              mapInstance.flyTo({
                center: [
                  lng,
                  lat,
                ],
                zoom: 10,
                duration: 1800,
                essential: true,
              });
            } else {
              console.warn(
                "Train position contains invalid coordinates.",
                liveTrain.position
              );
            }
          } else {
            console.warn(
              "Train has no usable position:",
              {
                position:
                  liveTrain.position,
                positionQuality:
                  liveTrain.positionQuality,
              }
            );
          }
        } catch (error) {
          console.error(
            "Failed to load searched train:",
            error
          );

          setLiveTrainError(
            error instanceof Error
              ? error.message
              : "Unable to load live train data."
          );
        }
      },
      [mapInstance]
    );

  /*
   * Train marker selected directly
   * from the map.
   */
  const handleLiveTrainSelect =
    useCallback(
      (train: LiveTrain) => {
        setSelectedLiveTrain(
          train
        );

        setSelectedStation(
          null
        );

        setSelectedTrain(
          null
        );

        /*
         * If the user clicks a train marker,
         * also center the map on it.
         */
        if (
          train.position &&
          train.position.length >= 2 &&
          mapInstance
        ) {
          const lng =
            Number(
              train.position[0]
            );

          const lat =
            Number(
              train.position[1]
            );

          if (
            Number.isFinite(lng) &&
            Number.isFinite(lat)
          ) {
            mapInstance.flyTo({
              center: [
                lng,
                lat,
              ],
              zoom: 10,
              duration: 1200,
              essential: true,
            });
          }
        }
      },
      [mapInstance]
    );

  return (
    <main className="relative h-screen overflow-hidden bg-[#070b0f] text-white">
      {/* MAP */}
      <div className="absolute inset-0 z-0">
        <RailMap
          ref={railMapRef}
          onStationSelect={
            handleStationSelect
          }
        />

        <TrainLayer
          map={mapInstance}
          trains={liveTrains}
          onTrainSelect={
            handleLiveTrainSelect
          }
        />
      </div>

      {/* TOP GRADIENT */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-48 bg-gradient-to-b from-black/85 via-black/40 to-transparent" />

      {/* BOTTOM GRADIENT */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-40 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* HEADER */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex h-24 items-center px-8">
        <div>
          <h1 className="text-4xl font-bold tracking-[0.22em] drop-shadow-2xl">
            RAILPULSE
          </h1>

          <p className="mt-1 text-[11px] tracking-[0.3em] text-white/55">
            INDIA RAILWAY NETWORK
          </p>
        </div>

        <div className="ml-auto">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-4 py-2 text-xs shadow-xl backdrop-blur-xl">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />

            <span className="text-white/85">
              SYSTEM ONLINE
            </span>
          </div>
        </div>
      </header>

      {/* SEARCH */}
      <div className="pointer-events-none absolute inset-x-0 top-28 z-30 flex justify-center px-6">
        <div className="pointer-events-auto w-full max-w-3xl">
          <StationSearch
            onSelect={
              handleStationSelect
            }
            onTrainSelect={
              handleTrainSelect
            }
          />
        </div>
      </div>

      {/* STATION INTELLIGENCE */}
      <StationIntelligencePanel
        station={selectedStation}
        onClose={() =>
          setSelectedStation(
            null
          )
        }
      />

      {/* LIVE TRAIN ERROR */}
      {liveTrainError && (
        <div className="absolute bottom-5 left-5 z-40 max-w-sm rounded-xl border border-red-400/20 bg-[#080d12]/90 px-4 py-3 text-xs text-red-300 shadow-2xl backdrop-blur-xl">
          <p className="font-semibold">
            Live train error
          </p>

          <p className="mt-1 text-red-300/70">
            {liveTrainError}
          </p>
        </div>
      )}

      {/* LIVE TRAIN PANEL */}
      {selectedLiveTrain && (
        <div className="absolute right-5 top-48 z-30 w-[340px] overflow-hidden rounded-2xl border border-cyan-400/20 bg-[#080d12]/90 shadow-2xl backdrop-blur-xl">
          <div className="border-b border-white/10 px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] tracking-[0.2em] text-cyan-300/60">
                  LIVE TRAIN
                </p>

                <h2 className="mt-1 text-base font-semibold text-white">
                  {
                    selectedLiveTrain.number ??
                    selectedLiveTrain.number
                  }
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedLiveTrain(
                    null
                  )
                }
                className="text-lg text-white/30 transition hover:text-white"
              >
                ×
              </button>
            </div>

            <p className="mt-1 truncate text-xs text-white/60">
              {
                selectedLiveTrain.name ??
                "Unknown train"
              }
            </p>
          </div>

          <div className="space-y-3 px-4 py-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] tracking-wider text-white/35">
                STATUS
              </span>

              <span className="text-xs font-medium uppercase text-emerald-300">
                {
                  selectedLiveTrain.status ??
                  "UNKNOWN"
                }
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] tracking-wider text-white/35">
                DELAY
              </span>

              <span className="text-xs font-medium text-white/80">
                {selectedLiveTrain.delayMinutes !==
                  null &&
                selectedLiveTrain.delayMinutes !==
                  undefined
                  ? `${selectedLiveTrain.delayMinutes} min`
                  : "UNKNOWN"}
              </span>
            </div>

            <div>
              <p className="text-[10px] tracking-wider text-white/35">
                ROUTE
              </p>

              <p className="mt-1 text-xs text-white/75">
                {
                  selectedLiveTrain
                    .origin?.name ??
                  "Unknown"
                }{" "}
                →{" "}
                {
                  selectedLiveTrain
                    .destination?.name ??
                  "Unknown"
                }
              </p>
            </div>

            <div>
              <p className="text-[10px] tracking-wider text-white/35">
                CURRENT LOCATION
              </p>

              <p className="mt-1 text-xs text-white/75">
                {
                  selectedLiveTrain
                    .currentLocation
                    ?.stationName ??
                  "Unknown"
                }
              </p>
            </div>

            <div>
              <p className="text-[10px] tracking-wider text-white/35">
                NEXT STATION
              </p>

              <p className="mt-1 text-xs text-white/75">
                {
                  selectedLiveTrain
                    .nextHalt
                    ?.stationName ??
                  "Unknown"
                }
              </p>
            </div>

            <div>
              <p className="text-[10px] tracking-wider text-white/35">
                POSITION
              </p>

              <p className="mt-1 text-xs font-medium text-cyan-300">
                {
                  selectedLiveTrain.positionQuality
                }
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-white/5 pt-3">
              <span className="text-[9px] tracking-wider text-white/30">
                TRACKING
              </span>

              <span className="text-[9px] tracking-wider text-white/50">
                {
                  selectedLiveTrain
                    .trackingMode ??
                  "UNKNOWN"
                }
              </span>
            </div>

            <div className="text-right text-[9px] tracking-wider text-white/25">
              SOURCE:{" "}
              {
                selectedLiveTrain.provider
              }
            </div>

            {/* NTES POSITION DISCLAIMER */}
            {selectedLiveTrain.provider ===
              "NTES" && (
              <div className="border-t border-white/5 pt-3 text-[9px] leading-relaxed text-white/30">
                Position is based on the
                latest confirmed NTES
                station and OSM railway
                geometry. It is not
                locomotive GPS.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SEARCH RESULT PANEL */}
      {selectedTrain &&
        !selectedLiveTrain && (
          <div className="absolute right-5 top-48 z-30 w-[340px] overflow-hidden rounded-2xl border border-cyan-400/20 bg-[#080d12]/90 shadow-2xl backdrop-blur-xl">
            <div className="border-b border-white/10 px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] tracking-[0.2em] text-cyan-300/60">
                    TRAIN SEARCH
                  </p>

                  <h2 className="mt-1 text-base font-semibold text-white">
                    {
                      selectedTrain.number
                    }
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedTrain(
                      null
                    )
                  }
                  className="text-lg text-white/30 transition hover:text-white"
                >
                  ×
                </button>
              </div>

              <p className="mt-1 truncate text-xs text-white/60">
                {
                  selectedTrain.name ??
                  "Unknown train"
                }
              </p>
            </div>

            <div className="px-4 py-4 text-xs text-white/60">
              Loading live train position...
            </div>
          </div>
        )}
    </main>
  );
}