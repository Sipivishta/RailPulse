"use client";

import { useEffect, useState } from "react";
import {
  loadStations,
  type Station,
} from "@/lib/stations";

export type TrainSearchResult = {
  number: string;
  name: string | null;
  status: string | null;
  delayMinutes: number | null;
  origin: {
    code: string;
    name: string;
  } | null;
  destination: {
    code: string;
    name: string;
  } | null;
  currentLocation: {
    stationCode: string | null;
    stationName: string | null;
    sequence: number | null;
  } | null;
  positionQuality: "ACTUAL" | "CALCULATED" | "UNKNOWN";
  provider: "RAILRADAR";
};

type StationSearchProps = {
  onSelect: (station: Station) => void;
  onTrainSelect?: (train: TrainSearchResult) => void;
};

export default function StationSearch({
  onSelect,
  onTrainSelect,
}: StationSearchProps) {
  const [stations, setStations] = useState<Station[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Station[]>([]);
  const [error, setError] = useState("");
  const [showResults, setShowResults] = useState(true);
  const [loadingTrain, setLoadingTrain] = useState(false);

  useEffect(() => {
    loadStations()
      .then(setStations)
      .catch((error) => {
        console.error("Failed to load station data:", error);
      });
  }, []);

  function findBestMatch(
    searchQuery: string
  ): Station | null {
    const normalizedQuery = searchQuery
      .trim()
      .toLowerCase();

    if (!normalizedQuery || stations.length === 0) {
      return null;
    }

    // 1. Exact station code
    const exactCodeMatch = stations.find(
      (station) =>
        station.code?.toLowerCase() === normalizedQuery
    );

    if (exactCodeMatch) {
      return exactCodeMatch;
    }

    // 2. Exact station name
    const exactNameMatch = stations.find(
      (station) =>
        station.name.toLowerCase() === normalizedQuery
    );

    if (exactNameMatch) {
      return exactNameMatch;
    }

    // 3. Code starts with query
    const codeStartsWithMatch = stations.find(
      (station) =>
        station.code
          ?.toLowerCase()
          .startsWith(normalizedQuery)
    );

    if (codeStartsWithMatch) {
      return codeStartsWithMatch;
    }

    // 4. Name starts with query
    const nameStartsWithMatch = stations.find(
      (station) =>
        station.name
          .toLowerCase()
          .startsWith(normalizedQuery)
    );

    if (nameStartsWithMatch) {
      return nameStartsWithMatch;
    }

    // 5. Name contains query
    const nameContainsMatch = stations.find(
      (station) =>
        station.name
          .toLowerCase()
          .includes(normalizedQuery)
    );

    if (nameContainsMatch) {
      return nameContainsMatch;
    }

    return null;
  }

  async function searchTrain(trainNumber: string) {
    setLoadingTrain(true);
    setError("");
    setResults([]);
    setShowResults(false);

    try {
      const response = await fetch(
        `/api/trains/live?number=${encodeURIComponent(
          trainNumber
        )}`
      );

      const data = await response.json();

      if (!response.ok || !data.success || !data.train) {
        throw new Error(
          data.error || "Train could not be found."
        );
      }

      const train = data.train;

      const result: TrainSearchResult = {
        number: train.number,
        name: train.name ?? null,
        status: train.status ?? null,
        delayMinutes:
          typeof train.delayMinutes === "number"
            ? train.delayMinutes
            : null,
        origin: train.origin
          ? {
              code: train.origin.code,
              name: train.origin.name,
            }
          : null,
        destination: train.destination
          ? {
              code: train.destination.code,
              name: train.destination.name,
            }
          : null,
        currentLocation: train.currentLocation
          ? {
              stationCode:
                train.currentLocation.stationCode ?? null,
              stationName:
                train.currentLocation.stationName ?? null,
              sequence:
                train.currentLocation.sequence ?? null,
            }
          : null,
        positionQuality:
          train.positionQuality ?? "UNKNOWN",
        provider: "RAILRADAR",
      };

      onTrainSelect?.(result);
      setQuery(`${result.number} ${result.name ?? ""}`.trim());
      setError("");
    } catch (error) {
      console.error("Train search failed:", error);

      setError(
        `Train "${trainNumber}" could not be found.`
      );

      setQuery(trainNumber);
    } finally {
      setLoadingTrain(false);
    }
  }

  function handleSearch() {
    const trimmedQuery = query.trim();

    if (!trimmedQuery || loadingTrain) {
      return;
    }

    /*
     * Train numbers are numeric.
     *
     * Example:
     * 12919 -> train search
     * 12627 -> train search
     *
     * Station searches remain name/code based.
     */
    if (/^\d+$/.test(trimmedQuery)) {
      void searchTrain(trimmedQuery);
      return;
    }

    const bestMatch = findBestMatch(trimmedQuery);

    if (!bestMatch) {
      setError(
        `Station "${trimmedQuery}" does not exist.`
      );

      setResults([]);
      setShowResults(false);

      return;
    }

    setError("");
    setShowResults(false);
    setResults([]);

    onSelect(bestMatch);

    setQuery(bestMatch.name);
  }

  useEffect(() => {
    if (!showResults || loadingTrain) {
      return;
    }

    const trimmedQuery = query.trim().toLowerCase();

    if (!trimmedQuery) {
      setResults([]);
      return;
    }

    /*
     * Don't show station suggestions when the user
     * is typing a train number.
     */
    if (/^\d+$/.test(trimmedQuery)) {
      setResults([]);
      return;
    }

    const matches = stations
      .filter((station) => {
        const nameMatch = station.name
          .toLowerCase()
          .includes(trimmedQuery);

        const codeMatch = station.code
          ?.toLowerCase()
          .includes(trimmedQuery);

        return nameMatch || codeMatch;
      })
      .slice(0, 8);

    setResults(matches);
  }, [query, stations, showResults, loadingTrain]);

  return (
    <div className="relative w-full">
      <div
        className={`rounded-2xl border bg-[#080d12]/75 shadow-2xl backdrop-blur-xl transition-all ${
          error
            ? "border-red-400/40"
            : "border-white/15 focus-within:border-white/30"
        }`}
      >
        <div className="flex items-center">
          <input
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setShowResults(true);
              setError("");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleSearch();
              }

              if (event.key === "Escape") {
                setResults([]);
                setShowResults(false);
              }
            }}
            placeholder="Search train, station or route..."
            className="w-full rounded-2xl bg-transparent px-6 py-5 text-lg text-white outline-none placeholder:text-white/45"
          />

          {loadingTrain && (
            <div className="mr-5 flex items-center gap-2 text-xs text-white/45">
              <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
              LIVE
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-2 rounded-xl border border-red-400/20 bg-black/75 px-4 py-3 text-sm text-red-300 shadow-xl backdrop-blur-xl">
          {error}
        </div>
      )}

      {showResults &&
        !error &&
        !loadingTrain &&
        results.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-[200] mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#080d12]/95 shadow-2xl backdrop-blur-xl">
            {results.map((station) => (
              <button
                key={station.id}
                type="button"
                onClick={() => {
                  onSelect(station);
                  setQuery(station.name);
                  setResults([]);
                  setShowResults(false);
                  setError("");
                }}
                className="flex w-full items-center justify-between border-b border-white/5 px-5 py-4 text-left transition hover:bg-white/10"
              >
                <div>
                  <p className="text-sm font-medium text-white">
                    {station.name}
                  </p>

                  {station.code && (
                    <p className="mt-1 text-[10px] tracking-wider text-white/40">
                      {station.code}
                    </p>
                  )}
                </div>

                <span className="text-xs text-white/30">
                  STATION
                </span>
              </button>
            ))}
          </div>
        )}
    </div>
  );
}