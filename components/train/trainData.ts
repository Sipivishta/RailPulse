export type TrainStatus =
  | "RUNNING"
  | "STOPPED"
  | "DELAYED"
  | "UNKNOWN";

export type TrainDataStatus =
  | "SIMULATED"
  | "LIVE"
  | "CALCULATED"
  | "INFERRED"
  | "UNKNOWN";

export type Train = {
  id: string;

  number: string;
  name: string;

  origin: string;
  destination: string;

  currentPosition: [number, number];

  speed: number;

  delay: number;

  status: TrainStatus;

  direction: "NORTHBOUND" | "SOUTHBOUND";

  nextStation?: string;

  dataStatus: TrainDataStatus;
};

export const trains: Train[] = [
  {
    id: "train-12627",

    number: "12627",
    name: "Karnataka Express",

    origin: "KSR Bengaluru",
    destination: "New Delhi",

    currentPosition: [77.5800, 13.0200],

    speed: 84,

    delay: 12,

    status: "RUNNING",

    direction: "NORTHBOUND",

    nextStation: "Yelahanka Junction",

    dataStatus: "SIMULATED",
  },

  {
    id: "train-12628",

    number: "12628",
    name: "Karnataka Express",

    origin: "New Delhi",
    destination: "KSR Bengaluru",

    currentPosition: [77.5400, 13.0500],

    speed: 72,

    delay: 4,

    status: "RUNNING",

    direction: "SOUTHBOUND",

    nextStation: "KSR Bengaluru",

    dataStatus: "SIMULATED",
  },

  {
    id: "train-16526",

    number: "16526",
    name: "Kanyakumari Express",

    origin: "KSR Bengaluru",
    destination: "Kanyakumari",

    currentPosition: [77.6000, 12.9500],

    speed: 68,

    delay: 0,

    status: "RUNNING",

    direction: "SOUTHBOUND",

    nextStation: "Kengeri",

    dataStatus: "SIMULATED",
  },

  {
    id: "train-16507",

    number: "16507",
    name: "Jodhpur Express",

    origin: "KSR Bengaluru",
    destination: "Jodhpur",

    currentPosition: [77.6200, 13.0200],

    speed: 91,

    delay: 18,

    status: "DELAYED",

    direction: "NORTHBOUND",

    nextStation: "Yelahanka Junction",

    dataStatus: "SIMULATED",
  },

  {
    id: "train-22691",

    number: "22691",
    name: "Rajdhani Express",

    origin: "KSR Bengaluru",
    destination: "Hazrat Nizamuddin",

    currentPosition: [77.5700, 12.9900],

    speed: 96,

    delay: 7,

    status: "RUNNING",

    direction: "NORTHBOUND",

    nextStation: "Yeshwanthpur Junction",

    dataStatus: "SIMULATED",
  },
];