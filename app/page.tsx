"use client";

import {
  useCallback,
  useRef,
  useState,
} from "react";

import RailMap, {
  type RailMapHandle,
} from "@/components/map/RailMap";

import StationSearch, {
  type TrainSearchResult,
} from "@/components/search/StationSearch";

import StationIntelligencePanel from "@/components/station/StationIntelligencePanel";

import type { Station } from "@/lib/stations";

export default function Home() {
  const railMapRef =
    useRef<RailMapHandle>(null);

  const [selectedStation, setSelectedStation] =
    useState<Station | null>(null);

  const [selectedTrain, setSelectedTrain] =
    useState<TrainSearchResult | null>(null);

  const handleStationSelect = useCallback(
    (station: Station) => {
      setSelectedStation(station);
      setSelectedTrain(null);

      /*
       * Station coordinates are:
       *
       * [longitude, latitude]
       */
      railMapRef.current?.flyToStation(
        station.coordinates
      );
    },
    []
  );

  const handleTrainSelect = useCallback(
    (train: TrainSearchResult) => {
      setSelectedTrain(train);
      setSelectedStation(null);
    },
    []
  );

  return (
    <main className="relative h-screen overflow-hidden bg-[#070b0f] text-white">
      {/* MAP */}
      <div className="absolute inset-0 z-0">
        <RailMap
          ref={railMapRef}
          onStationSelect={handleStationSelect}
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
            onSelect={handleStationSelect}
            onTrainSelect={handleTrainSelect}
          />
        </div>
      </div>

      {/* STATION INTELLIGENCE */}
      <StationIntelligencePanel
        station={selectedStation}
        onClose={() =>
          setSelectedStation(null)
        }
      />

      {/* TRAIN SEARCH RESULT */}
      {selectedTrain && (
        <div className="absolute right-5 top-48 z-30 w-[340px] overflow-hidden rounded-2xl border border-cyan-400/20 bg-[#080d12]/90 shadow-2xl backdrop-blur-xl">
          <div className="border-b border-white/10 px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] tracking-[0.2em] text-cyan-300/60">
                  LIVE TRAIN
                </p>

                <h2 className="mt-1 text-base font-semibold text-white">
                  {selectedTrain.number}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedTrain(null)
                }
                className="text-lg text-white/30 transition hover:text-white"
              >
                ×
              </button>
            </div>

            <p className="mt-1 truncate text-xs text-white/60">
              {selectedTrain.name ??
                "Unknown train"}
            </p>
          </div>

          <div className="space-y-3 px-4 py-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] tracking-wider text-white/35">
                STATUS
              </span>

              <span className="text-xs font-medium uppercase text-emerald-300">
                {selectedTrain.status ??
                  "UNKNOWN"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] tracking-wider text-white/35">
                DELAY
              </span>

              <span className="text-xs font-medium text-white/80">
                {selectedTrain.delayMinutes !==
                null
                  ? `${selectedTrain.delayMinutes} min`
                  : "UNKNOWN"}
              </span>
            </div>

            <div>
              <p className="text-[10px] tracking-wider text-white/35">
                ROUTE
              </p>

              <p className="mt-1 text-xs text-white/75">
                {selectedTrain.origin?.name ??
                  "Unknown"}{" "}
                →{" "}
                {selectedTrain.destination
                  ?.name ?? "Unknown"}
              </p>
            </div>

            <div>
              <p className="text-[10px] tracking-wider text-white/35">
                CURRENT LOCATION
              </p>

              <p className="mt-1 text-xs text-white/75">
                {selectedTrain
                  .currentLocation
                  ?.stationName ??
                  "Unknown"}
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-white/5 pt-3">
              <span className="text-[9px] tracking-wider text-white/30">
                POSITION
              </span>

              <span className="text-[9px] tracking-wider text-cyan-300/70">
                {
                  selectedTrain.positionQuality
                }
              </span>
            </div>

            <div className="text-right text-[9px] tracking-wider text-white/25">
              SOURCE:{" "}
              {selectedTrain.provider}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}