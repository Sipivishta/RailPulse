import type {
  DelayAnalysis,
  LiveTrainRoutePoint,
} from "./liveTrain";

function getDelay(point: LiveTrainRoutePoint) {
  const departure =
    point.delayDeparture;

  const arrival =
    point.delayArrival;

  if (
    typeof departure === "number"
  ) {
    return departure;
  }

  if (
    typeof arrival === "number"
  ) {
    return arrival;
  }

  return null;
}

export function calculateDelayAnalysis(
  route: LiveTrainRoutePoint[],
  currentSequence: number | null,
  currentDelayMinutes: number | null
): DelayAnalysis {
  if (
    route.length === 0 ||
    currentSequence === null
  ) {
    return {
      currentDelayMinutes,
      delayTrend: "UNKNOWN",
      delayChangeMinutes: null,
      nextStationDelayMinutes: null,
      destinationDelayMinutes: null,
      recoveredMinutes: null,
      recoveryOutlook: "UNKNOWN",
      recoveryConfidence: "LOW",
      reason: null,
      reasonSource: "UNKNOWN",
    };
  }

  const currentIndex =
    route.findIndex(
      (point) =>
        point.sequence === currentSequence
    );

  if (currentIndex === -1) {
    return {
      currentDelayMinutes,
      delayTrend: "UNKNOWN",
      delayChangeMinutes: null,
      nextStationDelayMinutes: null,
      destinationDelayMinutes: null,
      recoveredMinutes: null,
      recoveryOutlook: "UNKNOWN",
      recoveryConfidence: "LOW",
      reason: null,
      reasonSource: "UNKNOWN",
    };
  }

  /*
   * Find the most recent observed delays.
   */
  const previousObserved: number[] = [];

  for (
    let i = 0;
    i < currentIndex;
    i++
  ) {
    const delay = getDelay(route[i]);

    if (typeof delay === "number") {
      previousObserved.push(delay);
    }
  }

  const recent =
    previousObserved.slice(-3);

  let delayTrend:
    | "IMPROVING"
    | "WORSENING"
    | "STABLE"
    | "UNKNOWN" = "UNKNOWN";

  let delayChangeMinutes:
    | number
    | null = null;

  if (
    recent.length >= 2
  ) {
    const first =
      recent[0];

    const last =
      recent[recent.length - 1];

    delayChangeMinutes =
      last - first;

    if (
      delayChangeMinutes <= -3
    ) {
      delayTrend = "IMPROVING";
    } else if (
      delayChangeMinutes >= 3
    ) {
      delayTrend = "WORSENING";
    } else {
      delayTrend = "STABLE";
    }
  }

  /*
   * Next station.
   */
  const nextPoint =
    route.find(
      (point) =>
        point.sequence >
        currentSequence
    );

  const nextStationDelayMinutes =
    nextPoint
      ? getDelay(nextPoint)
      : null;

  /*
   * Destination.
   */
  const destination =
    route[route.length - 1];

  const destinationDelayMinutes =
    getDelay(destination);

  /*
   * Recovery.
   *
   * We only claim recovery when the
   * observed delay actually decreased.
   */
  let recoveredMinutes:
    | number
    | null = null;

  if (
    currentDelayMinutes !== null &&
    destinationDelayMinutes !== null
  ) {
    const recovery =
      currentDelayMinutes -
      destinationDelayMinutes;

    if (recovery > 0) {
      recoveredMinutes =
        Math.round(recovery);
    }
  }

  /*
   * Recovery outlook.
   *
   * This is a RailPulse estimate,
   * not an official railway prediction.
   */
  let recoveryOutlook:
    | "HIGH"
    | "MEDIUM"
    | "LOW"
    | "UNKNOWN" = "UNKNOWN";

  let recoveryConfidence:
    | "LOW"
    | "MEDIUM"
    | "HIGH" = "LOW";

  if (
    delayTrend === "IMPROVING"
  ) {
    recoveryOutlook = "HIGH";
    recoveryConfidence = "MEDIUM";
  } else if (
    delayTrend === "STABLE"
  ) {
    recoveryOutlook = "MEDIUM";
    recoveryConfidence = "LOW";
  } else if (
    delayTrend === "WORSENING"
  ) {
    recoveryOutlook = "LOW";
    recoveryConfidence = "MEDIUM";
  }

  return {
    currentDelayMinutes,

    delayTrend,

    delayChangeMinutes,

    nextStationDelayMinutes,

    destinationDelayMinutes,

    recoveredMinutes,

    recoveryOutlook,

    recoveryConfidence,

    /*
     * We do not invent a reason.
     * A future provider exception field can
     * populate this.
     */
    reason: null,

    reasonSource: "UNKNOWN",
  };
}