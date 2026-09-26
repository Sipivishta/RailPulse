import type { Coordinate } from "./position";

export type LiveTrainRoutePoint = {
  sequence: number;
  stationCode: string;
  stationName: string;

  lat?: number;
  lng?: number;

  status?: string | null;
  distance?: number | null;

  scheduledArrival?: string | null;
  scheduledDeparture?: string | null;

  actualArrival?: string | null;
  actualDeparture?: string | null;

  delayArrival?: number | null;
  delayDeparture?: number | null;

  platform?: string | null;

  provenance?: string | null;
};

export type DelayAnalysis = {
  currentDelayMinutes: number | null;

  delayTrend:
    | "IMPROVING"
    | "WORSENING"
    | "STABLE"
    | "UNKNOWN";

  delayChangeMinutes: number | null;

  nextStationDelayMinutes: number | null;

  destinationDelayMinutes: number | null;

  recoveredMinutes: number | null;

  recoveryOutlook:
    | "HIGH"
    | "MEDIUM"
    | "LOW"
    | "UNKNOWN";

  recoveryConfidence:
    | "LOW"
    | "MEDIUM"
    | "HIGH";

  reason:
    | string
    | null;

  reasonSource:
    | "PROVIDER"
    | "INFERRED"
    | "UNKNOWN";
};

export type LiveTrain = {
  number: string;

  name: string | null;

  type?: string | null;

  category?: string | null;

  origin?: {
    code: string | null;
    name: string | null;
  };

  destination?: {
    code: string | null;
    name: string | null;
  };

  status: string | null;

  delayMinutes?: number | null;

  isLive: boolean;

  trackingMode: string | null;

  currentLocation: {
    stationCode: string | null;
    stationName: string | null;
    sequence: number | null;

    status: string | null;

    segmentProgress: number | null;

    speedKmh: number | null;

    bearingDegrees: number | null;

    isActualPosition: boolean | null;
  } | null;

  previousHalt: {
    stationCode: string | null;
    stationName: string | null;
    sequence: number | null;
  } | null;

  nextHalt: {
    stationCode: string | null;
    stationName: string | null;
    sequence: number | null;
  } | null;

  route: LiveTrainRoutePoint[];

  geometry: {
    type: "LineString";
    coordinates: Coordinate[];
  } | null;

  position: Coordinate | null;

  lastUpdatedAt: string | null;

  positionQuality:
    | "ACTUAL"
    | "CALCULATED"
    | "UNKNOWN";

  provider: "RAILRADAR";

  delayAnalysis: DelayAnalysis;
};

export type LiveTrainApiResponse = {
  success: boolean;

  train?: LiveTrain;

  error?: string;

  meta?: {
    source:
      | "RAILRADAR"
      | "CACHE";

    fetchedAt: number;

    expiresAt?: number;
  };
};