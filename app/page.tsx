"use client";

import { useRef } from "react";
import RailMap, {
  RailMapHandle,
} from "@/components/map/RailMap";
import StationSearch from "@/components/search/StationSearch";

export default function Home() {
  const mapRef = useRef<RailMapHandle>(null);

  return (
    <main className="relative h-screen overflow-hidden bg-[#070b0f] text-white">
      {/* Full-screen map */}
      <div className="absolute inset-0 z-0">
        <RailMap ref={mapRef} />
      </div>

      {/* Top atmospheric gradient */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-10 h-48 bg-gradient-to-b from-black/85 via-black/40 to-transparent" />

      {/* Bottom atmospheric gradient */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-10 h-52 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      {/* Header */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex h-24 items-center px-8">
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

      {/* Search */}
      <div className="pointer-events-none fixed inset-x-0 top-28 z-[100] flex justify-center px-6">
        <div className="pointer-events-auto w-full max-w-3xl">
          <StationSearch
            onSelect={(station) => {
              mapRef.current?.flyToStation(
                station.coordinates
              );
            }}
          />
        </div>
      </div>

      {/* Bottom statistics */}
      <div className="pointer-events-none fixed bottom-7 left-7 z-[100]">
        <div className="flex items-end gap-2">
          <Stat label="TRAINS" value="0" />
          <Stat label="ON TIME" value="0" />
          <Stat label="DELAYED" value="0" />
          <Stat label="NETWORK" value="ONLINE" />
        </div>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/35 px-5 py-3 shadow-lg backdrop-blur-md">
      <p className="text-[9px] tracking-[0.18em] text-white/40">
        {label}
      </p>

      <p className="mt-0.5 text-base font-medium text-white/90">
        {value}
      </p>
    </div>
  );
}