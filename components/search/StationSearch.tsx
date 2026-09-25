"use client";

import { useEffect, useState } from "react";
import {
  loadStations,
  type Station,
} from "@/lib/stations";

type StationSearchProps = {
  onSelect: (station: Station) => void;
};

export default function StationSearch({
  onSelect,
}: StationSearchProps) {
  const [stations, setStations] = useState<Station[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Station[]>([]);
  const [error, setError] = useState("");
  const [showResults, setShowResults] = useState(true);

  useEffect(() => {
    loadStations()
      .then(setStations)
      .catch((error) => {
        console.error(
          "Failed to load station data:",
          error
        );
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

  function handleSearch() {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      return;
    }

    const bestMatch = findBestMatch(trimmedQuery);

    if (!bestMatch) {
      setError(
        `Station or code "${trimmedQuery}" does not exist.`
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
    if (!showResults) {
      return;
    }

    const trimmedQuery = query.trim().toLowerCase();

    if (!trimmedQuery) {
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
  }, [query, stations, showResults]);

  return (
    <div className="relative w-full">
      <div
        className={`rounded-2xl border bg-[#080d12]/75 shadow-2xl backdrop-blur-xl transition-all ${
          error
            ? "border-red-400/40"
            : "border-white/15 focus-within:border-white/30"
        }`}
      >
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
          }}
          placeholder="Search train, station or route..."
          className="w-full rounded-2xl bg-transparent px-6 py-5 text-lg text-white outline-none placeholder:text-white/45"
        />
      </div>

      {error && (
        <div className="mt-2 rounded-xl border border-red-400/20 bg-black/75 px-4 py-3 text-sm text-red-300 shadow-xl backdrop-blur-xl">
          {error}
        </div>
      )}

      {showResults &&
        !error &&
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