"use client";

import type { Station } from "@/lib/stations";

type StationPanelProps = {
  station: Station;
  onClose: () => void;
};

export default function StationPanel({
  station,
  onClose,
}: StationPanelProps) {
  return (
    <aside className="pointer-events-auto fixed right-5 top-[58%] z-[150] w-[300px] -translate-y-1/2">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#080d12]/92 shadow-2xl backdrop-blur-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 px-5 py-4">
          <div className="min-w-0 pr-3">
            <p className="text-[9px] tracking-[0.25em] text-white/40">
              RAILWAY STATION
            </p>

            <h2 className="mt-1.5 truncate text-lg font-semibold text-white">
              {station.name}
            </h2>

            {station.code && (
              <p className="mt-1 text-xs font-medium tracking-[0.2em] text-cyan-300/80">
                {station.code}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close station panel"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 text-base text-white/45 transition hover:bg-white/10 hover:text-white"
          >
            ×
          </button>
        </div>

        {/* Station information */}
        <div className="px-5 py-4">
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <InfoRow
              label="STATION"
              value={station.name}
              fullWidth
            />

            <InfoRow
              label="CODE"
              value={station.code ?? "Unavailable"}
            />

            <InfoRow
              label="LONGITUDE"
              value={`${station.coordinates[0].toFixed(4)}°`}
            />

            <InfoRow
              label="LATITUDE"
              value={`${station.coordinates[1].toFixed(4)}°`}
            />
          </div>

          {/* Live information */}
          <div className="mt-5 border-t border-white/10 pt-4">
            <p className="text-[9px] tracking-[0.25em] text-white/40">
              LIVE INFORMATION
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <DataCard label="TRAINS" value="—" />
              <DataCard label="ARRIVALS" value="—" />
              <DataCard label="DEPARTURES" value="—" />
              <DataCard label="STATUS" value="—" />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function InfoRow({
  label,
  value,
  fullWidth = false,
}: {
  label: string;
  value: string;
  fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? "col-span-2" : ""}>
      <p className="text-[8px] tracking-[0.2em] text-white/30">
        {label}
      </p>

      <p className="mt-1 truncate text-xs text-white/75">
        {value}
      </p>
    </div>
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

      <p className="mt-0.5 text-sm text-white/70">
        {value}
      </p>
    </div>
  );
}