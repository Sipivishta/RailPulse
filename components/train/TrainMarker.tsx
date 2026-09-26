"use client";

import type { LiveTrain } from "@/lib/live-trains/liveTrain";

type Props = {
  train: LiveTrain;
  selected?: boolean;
};

export default function TrainMarker({
  train,
  selected = false,
}: Props) {
  const delay =
    train.delayMinutes ?? 0;

  const delayClass =
    delay > 10
      ? "bg-red-400"
      : delay > 0
        ? "bg-amber-300"
        : "bg-emerald-300";

  return (
    <div
      className={`
        relative
        flex
        h-8
        w-8
        items-center
        justify-center
        rounded-full
        border
        ${
          selected
            ? "border-white bg-cyan-300"
            : "border-cyan-200/70 bg-[#071017]"
        }
        shadow-[0_0_18px_rgba(34,211,238,0.55)]
      `}
    >
      <div
        className={`
          h-2
          w-2
          rounded-full
          ${delayClass}
        `}
      />

      <div
        className="
          absolute
          -bottom-4
          whitespace-nowrap
          rounded
          bg-[#05090d]/90
          px-1.5
          py-0.5
          font-mono
          text-[8px]
          text-white/70
        "
      >
        {train.number}
      </div>
    </div>
  );
}