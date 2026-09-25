"use client";

import type { Train } from "./trainData";

type TrainMarkerProps = {
  train: Train;
  selected?: boolean;
  onClick: (train: Train) => void;
};

export default function TrainMarker({
  train,
  selected = false,
  onClick,
}: TrainMarkerProps) {
  const isDelayed = train.delay > 0;

  return (
    <button
      type="button"
      onClick={() => onClick(train)}
      aria-label={`${train.number} ${train.name}`}
      className={`group relative flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-200 ${
        selected
          ? "scale-125 border-cyan-300 bg-cyan-300/20 shadow-[0_0_25px_rgba(34,211,238,0.8)]"
          : "border-cyan-300/60 bg-[#071218]/90 shadow-[0_0_14px_rgba(34,211,238,0.45)] hover:scale-110 hover:border-cyan-200"
      }`}
    >
      {/* Train direction indicator */}
      <span
        className={`absolute h-2.5 w-2.5 rotate-45 border-r border-t ${
          isDelayed
            ? "border-amber-300 bg-amber-300"
            : "border-cyan-300 bg-cyan-300"
        }`}
      />

      {/* Train core */}
      <span
        className={`h-2.5 w-2.5 rounded-full ${
          isDelayed
            ? "bg-amber-300 shadow-[0_0_10px_rgba(252,211,77,0.9)]"
            : "bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.9)]"
        }`}
      />

      {/* Hover label */}
      <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-[#080d12]/95 px-3 py-2 text-left shadow-xl backdrop-blur-xl group-hover:block">
        <span className="block text-[10px] tracking-[0.15em] text-white/40">
          TRAIN
        </span>

        <span className="block text-xs font-semibold text-white">
          {train.number}
        </span>

        <span className="block text-[10px] text-white/50">
          {train.name}
        </span>
      </span>
    </button>
  );
}