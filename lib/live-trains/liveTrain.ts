export type Coordinate = [number, number];

export type LiveTrainProvider =
  | "RAILRADAR"
  | "NTES";

export type PositionQuality =
  | "ACTUAL"
  | "CALCULATED"
  | "UNKNOWN";

export type LiveTrainRoutePoint = {
  sequence: number;
  stationCode: string;
  stationName: string;

  scheduledArrival: string | null;
  scheduledDeparture: string | null;

  actualArrival: string | null;
  actualDeparture: string | null;

  delayArrival: number | null;
  delayDeparture: number | null;

  platform: string | null;

  /*
   * RailRadar route points may not always
   * contain a distance value.
   */
  distance?: number | null;

  /*
   * Provider-specific provenance information.
   */
  provenance: string | null;
};

export type DelayAnalysis = {
  currentDelayMinutes: number | null;

  delayTrend:
    | "IMPROVING"
    | "WORSENING"
    | "STABLE"
    | "UNKNOWN";

  recoveryOutlook:
    | "HIGH"
    | "MEDIUM"
    | "LOW"
    | "UNKNOWN";

  recoveredMinutes: number | null;

  /*
   * Change in delay compared with the
   * previous relevant observation.
   */
  delayChangeMinutes: number | null;

  /*
   * Delay associated with the next station.
   */
  nextStationDelayMinutes: number | null;

  reason: string | null;
};

export type LiveTrain = {
  number: string;

  name: string | null;

  category: string | null;

  origin: {
    code: string | null;
    name: string | null;
  } | null;

  destination: {
    code: string | null;
    name: string | null;
  } | null;

  status: string | null;

  delayMinutes: number | null;

  currentLocation: {
    stationCode: string | null;
    stationName: string | null;
    sequence: number | null;
  } | null;

  nextHalt: {
    stationCode: string | null;
    stationName: string | null;
    sequence: number | null;
  } | null;

  position: Coordinate | null;

  positionQuality: PositionQuality;

  trackingMode: string | null;

  lastUpdatedAt: string | null;

  route: LiveTrainRoutePoint[];

  delayAnalysis: DelayAnalysis | null;

  provider: LiveTrainProvider;
};

export type LiveTrainApiResponse = {
  success: boolean;

  train?: LiveTrain;

  error?: string;

  meta?: {
    fetchedAt?: string;
    cached?: boolean;
  };
};