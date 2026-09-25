"use client";

import type { Train } from "./trainData";

type TrainPanelProps = {
  train: Train;
  onClose: () => void;
};

export default function TrainPanel({
  train,
  onClose,
}: TrainPanelProps) {
  const statusLabel =
    train.status === "DELAYED"
      ? `+${train.delay} min`
      : train.status;

  return (
    <aside className="pointer-events-auto fixed right-5 top-[58%] z-[150] w-[300px] -translate-y-1/2">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#080d12]/92 shadow-2xl backdrop-blur-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 px-5 py-4">
          <div className="min-w-0 pr-3">
            <p className="text-[9px] tracking-[0.25em] text-white/40">
              TRAIN
            </p>

            <h2 className="mt-1.5 text-lg font-semibold text-white">
              {train.number}
            </h2>

            <p className="mt-1 truncate text-xs text-white/55">
              {train.name}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close train panel"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 text-base text-white/45 transition hover:bg-white/10 hover:text-white"
          >
            ×
          </button>
        </div>

        {/* Route */}
        <div className="px-5 py-4">
          <p className="text-[8px] tracking-[0.2em] text-white/30">
            ROUTE
          </p>

          <p className="mt-1 text-xs text-white/80">
            {train.origin}
          </p>

          <div className="my-2 flex items-center gap-2">
            <span className="h-px flex-1 bg-white/10" />

            <span className="text-[10px] text-cyan-300/70">
              →
            </span>

            <span className="h-px flex-1 bg-white/10" />
          </div>

          <p className="text-xs text-white/80">
            {train.destination}
          </p>

          {/* Live data */}
          <div className="mt-5 border-t border-white/10 pt-4">
            <p className="text-[9px] tracking-[0.25em] text-white/40">
              LIVE INFORMATION
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <DataCard
                label="SPEED"
                value={`${train.speed} km/h`}
              />

              <DataCard
                label="DELAY"
                value={
                  train.delay > 0
                    ? `+${train.delay} min`
                    : "ON TIME"
                }
              />

              <DataCard
                label="STATUS"
                value={statusLabel}
              />

              <DataCard
                label="DIRECTION"
                value={
                  train.direction ===
                  "NORTHBOUND"
                    ? "NORTH"
                    : "SOUTH"
                }
              />
            </div>
          </div>

          {/* Next station */}
          <div className="mt-4 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3">
            <p className="text-[8px] tracking-[0.18em] text-white/30">
              NEXT STATION
            </p>

            <p className="mt-1 truncate text-xs text-white/80">
              {train.nextStation ??
                "Unavailable"}
            </p>
          </div>

          {/* Data source */}
          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
            <p className="text-[8px] tracking-[0.18em] text-white/30">
              DATA
            </p>

            <span className="rounded-full border border-amber-300/20 bg-amber-300/5 px-2 py-1 text-[8px] tracking-[0.12em] text-amber-300/70">
              {train.dataStatus}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function DataCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2.5">
      <p className="text-[8px] tracking-[0.15em] text-white/30">
        {label}
      </p>

      <p className="mt-0.5 truncate text-xs text-white/75">
        {value}
      </p>
    </div>
  );
}