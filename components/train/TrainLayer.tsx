"use client";

import { useState } from "react";

import TrainMarker from "./TrainMarker";
import { trains, type Train } from "./trainData";

type TrainLayerProps = {
  onTrainSelect?: (train: Train) => void;
};

export default function TrainLayer({
  onTrainSelect,
}: TrainLayerProps) {
  const [selectedTrainId, setSelectedTrainId] =
    useState<string | null>(null);

  function handleTrainClick(train: Train) {
    setSelectedTrainId(train.id);
    onTrainSelect?.(train);
  }

  return (
    <>
      {trains.map((train) => (
        <div
          key={train.id}
          className="pointer-events-auto absolute"
          style={{
            left: `${50 + (train.currentPosition[0] - 77.58) * 20}%`,
            top: `${50 - (train.currentPosition[1] - 13.0) * 20}%`,
          }}
        >
          <TrainMarker
            train={train}
            selected={selectedTrainId === train.id}
            onClick={handleTrainClick}
          />
        </div>
      ))}
    </>
  );
}