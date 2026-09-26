"use client";

import {
  useEffect,
  useRef,
} from "react";

import {
  Marker,
  type Map as MapLibreMap,
} from "maplibre-gl";

import type { LiveTrain } from "@/lib/live-trains/liveTrain";

type TrainLayerProps = {
  map: MapLibreMap | null;
  trains: LiveTrain[];
  onTrainSelect?: (
    train: LiveTrain
  ) => void;
};

export default function TrainLayer({
  map,
  trains,
  onTrainSelect,
}: TrainLayerProps) {
  const markersRef =
    useRef<Map<string, Marker>>(
      new globalThis.Map<
        string,
        Marker
      >()
    );

  useEffect(() => {
    if (!map) {
      return;
    }

    /*
     * Keep track of the train numbers
     * currently being displayed.
     */
    const activeTrainNumbers =
      new Set(
        trains.map(
          (train) => train.number
        )
      );

    /*
     * Remove old markers.
     */
    markersRef.current.forEach(
      (
        marker: Marker,
        trainNumber: string
      ) => {
        if (
          !activeTrainNumbers.has(
            trainNumber
          )
        ) {
          marker.remove();

          markersRef.current.delete(
            trainNumber
          );
        }
      }
    );

    /*
     * Add/update real train markers.
     */
    for (const train of trains) {
      /*
       * position is already:
       *
       * [longitude, latitude]
       */
      const position =
        train.position;

      if (
        !Array.isArray(
          position
        ) ||
        position.length < 2
      ) {
        continue;
      }

      const lng =
        Number(position[0]);

      const lat =
        Number(position[1]);

      if (
        !Number.isFinite(
          lng
        ) ||
        !Number.isFinite(
          lat
        )
      ) {
        continue;
      }

      const existingMarker =
        markersRef.current.get(
          train.number
        );

      if (existingMarker) {
        existingMarker.setLngLat(
          [lng, lat]
        );

        continue;
      }

      /*
       * Train marker DOM.
       */
      const element =
        document.createElement(
          "button"
        );

      element.type = "button";

      element.className =
        "railpulse-train-marker";

      element.style.cursor =
        "pointer";

      element.style.width =
        "42px";

      element.style.height =
        "26px";

      element.style.padding =
        "0";

      element.style.border =
        "1px solid rgba(34,211,238,0.8)";

      element.style.borderRadius =
        "9999px";

      element.style.background =
        "rgba(8,13,18,0.94)";

      element.style.color =
        "#67e8f9";

      element.style.boxShadow =
        "0 0 16px rgba(34,211,238,0.65)";

      element.style.fontSize =
        "8px";

      element.style.fontWeight =
        "700";

      element.style.fontFamily =
        "ui-monospace, SFMono-Regular, Menlo, monospace";

      element.style.whiteSpace =
        "nowrap";

      element.textContent =
        train.number;

      element.title =
        `${train.number} ${
          train.name ?? ""
        }`.trim();

      element.addEventListener(
        "click",
        (event) => {
          event.stopPropagation();

          onTrainSelect?.(
            train
          );
        }
      );

      const marker =
        new Marker({
          element,
          anchor: "center",
        })
          .setLngLat([
            lng,
            lat,
          ])
          .addTo(map);

      markersRef.current.set(
        train.number,
        marker
      );
    }
  }, [
    map,
    trains,
    onTrainSelect,
  ]);

  /*
   * Cleanup.
   */
  useEffect(() => {
    return () => {
      markersRef.current.forEach(
        (
          marker: Marker
        ) => {
          marker.remove();
        }
      );

      markersRef.current.clear();
    };
  }, []);

  return null;
}