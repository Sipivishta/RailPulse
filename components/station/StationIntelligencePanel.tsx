"use client";

import { useEffect, useMemo, useState } from "react";
import type { Station } from "@/lib/stations";

type StationIntelligencePanelProps = {
  station: Station | null;
  onClose: () => void;
};

type NtesTrain = {
  TrainNumber?: string;
  TrainName?: string;
  TrainHindiName?: string;

  Source?: string;
  SourceName?: string;

  Destination?: string;
  DestinationName?: string;

  Platform?: string;

  ETA?: string;
  ETD?: string;

  STA?: string;
  STD?: string;

  ETAFlag?: boolean;
  ETDFlag?: boolean;

  DelayArr?: string;
  DelayDep?: string;

  Cancel?: number;
  ArrCancelFlag?: number;
  DepCancelFlag?: number;

  TrainType?: string;
  TrainTypeDesc?: string;

  Diverted?: number;
};

type NtesStationData = {
  Station?: string;
  StationName?: string;
  TrainsAtStation?: NtesTrain[];
};

type ApiResponse = {
  success: boolean;
  provider?: string;
  station?: string;
  cached?: boolean;
  fetchedAt?: number;
  data?: NtesStationData;
  error?: string;
};

function isDelayed(value?: string): boolean {
  if (!value) {
    return false;
  }

  const normalized = value.trim().toUpperCase();

  if (
    normalized === "" ||
    normalized === "RT" ||
    normalized === "ON TIME" ||
    normalized === "ONTIME"
  ) {
    return false;
  }

  if (/^\d{1,2}:\d{2}$/.test(normalized)) {
    return normalized !== "00:00";
  }

  return true;
}

function isCancelled(train: NtesTrain): boolean {
  return (
    train.Cancel === 1 ||
    train.ArrCancelFlag === 1 ||
    train.DepCancelFlag === 1
  );
}

function getDelay(train: NtesTrain): string {
  if (isDelayed(train.DelayArr)) {
    return train.DelayArr ?? "";
  }

  if (isDelayed(train.DelayDep)) {
    return train.DelayDep ?? "";
  }

  return "";
}

function getTime(train: NtesTrain): string {
  if (train.ETA && train.ETA !== "SRC" && train.ETA !== "DSTN") {
    return train.ETA;
  }

  if (train.ETD && train.ETD !== "SRC" && train.ETD !== "DSTN") {
    return train.ETD;
  }

  if (train.STA && train.STA !== "SRC" && train.STA !== "DSTN") {
    return train.STA;
  }

  if (train.STD && train.STD !== "SRC" && train.STD !== "DSTN") {
    return train.STD;
  }

  return "--";
}

export default function StationIntelligencePanel({
  station,
  onClose,
}: StationIntelligencePanelProps) {
  const [data, setData] = useState<NtesStationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stationCode = station?.code;

    if (typeof stationCode !== "string" || stationCode.length === 0) {
      setData(null);
      return;
    }

    // Explicitly create a guaranteed string.
    const code: string = stationCode;

    let cancelled = false;

    async function loadStationData() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/stations/${encodeURIComponent(code)}/live`
        );

        const result: ApiResponse = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.error ?? "Unable to load station intelligence"
          );
        }

        if (!cancelled) {
          setData(result.data ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load station intelligence"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadStationData();

    return () => {
      cancelled = true;
    };
  }, [station]);

  const trains = useMemo(() => {
    return data?.TrainsAtStation ?? [];
  }, [data]);

  const activeTrains = useMemo(() => {
    return trains.filter((train) => !isCancelled(train));
  }, [trains]);

  const delayedTrains = useMemo(() => {
    return activeTrains.filter(
      (train) =>
        isDelayed(train.DelayArr) || isDelayed(train.DelayDep)
    );
  }, [activeTrains]);

  const upcomingTrains = useMemo(() => {
    return activeTrains.filter((train) => {
      return (
        Boolean(train.ETA) ||
        Boolean(train.ETD) ||
        Boolean(train.STA) ||
        Boolean(train.STD)
      );
    });
  }, [activeTrains]);

  if (!station) {
    return null;
  }

  return (
    <aside className="absolute right-5 top-48 z-30 w-[340px] max-h-[520px] overflow-hidden rounded-2xl border border-white/10 bg-[#101418]/95 shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-white/10 px-4 py-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.9)]" />

            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-300">
              Station Intelligence
            </span>
          </div>

          <h2 className="text-lg font-semibold text-white">
            {station.name}
          </h2>

          <p className="mt-0.5 text-xs font-medium tracking-widest text-white/40">
            {station.code}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close station intelligence"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/50 transition hover:bg-white/10 hover:text-white"
        >
          ×
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2 px-4 py-4">
        <Metric
          label="TRAINS"
          value={loading ? "—" : String(activeTrains.length)}
        />

        <Metric
          label="UPCOMING"
          value={loading ? "—" : String(upcomingTrains.length)}
        />

        <Metric
          label="DELAYED"
          value={loading ? "—" : String(delayedTrains.length)}
        />
      </div>

      {/* Live window */}
      <div className="border-t border-white/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
            Live Window
          </span>

          <span className="text-[11px] font-medium text-cyan-300">
            4h ahead
          </span>
        </div>

        <div className="mt-2 h-px bg-white/5" />
      </div>

      {/* Train list */}
      <div className="max-h-[330px] overflow-y-auto px-4 pb-4">
        {loading && (
          <div className="py-10 text-center text-sm text-white/40">
            Loading live station data...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-400/10 bg-red-400/5 p-4 text-center">
            <p className="text-sm text-red-300">
              Unable to load station data.
            </p>

            <p className="mt-1 text-xs text-white/35">
              {error}
            </p>
          </div>
        )}

        {!loading && !error && activeTrains.length === 0 && (
          <div className="py-10 text-center">
            <p className="text-sm text-white/45">
              No trains in the live board.
            </p>

            <p className="mt-1 text-xs text-white/25">
              Try another station.
            </p>
          </div>
        )}

        {!loading && !error && activeTrains.length > 0 && (
          <div className="space-y-2">
            {activeTrains.map((train, index) => {
              const delay = getDelay(train);
              const delayed = Boolean(delay);

              return (
                <div
                  key={`${train.TrainNumber ?? "train"}-${index}`}
                  className="rounded-xl border border-white/5 bg-white/[0.025] px-3 py-3 transition hover:bg-white/[0.05]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-cyan-300">
                          {train.TrainNumber ?? "----"}
                        </span>

                        {delayed && (
                          <span className="rounded-md bg-amber-400/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-300">
                            Delay
                          </span>
                        )}
                      </div>

                      <p className="mt-1 truncate text-sm font-medium text-white/85">
                        {train.TrainName ?? "Unknown train"}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-white">
                        {getTime(train)}
                      </p>

                      {train.Platform && (
                        <p className="mt-0.5 text-[10px] text-white/35">
                          PF {train.Platform}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-3 text-[10px] text-white/35">
                    <span className="truncate">
                      {train.SourceName ??
                        train.Source ??
                        "—"}
                      {" → "}
                      {train.DestinationName ??
                        train.Destination ??
                        "—"}
                    </span>

                    {delayed && (
                      <span className="shrink-0 text-amber-300">
                        +{delay}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Provider */}
      <div className="border-t border-white/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-[0.18em] text-white/25">
            Live data
          </span>

          <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-cyan-300/60">
            NTES
          </span>
        </div>
      </div>
    </aside>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] px-3 py-3">
      <p className="text-[9px] font-semibold tracking-[0.16em] text-white/30">
        {label}
      </p>

      <p className="mt-1 text-xl font-semibold text-white">
        {value}
      </p>
    </div>
  );
}