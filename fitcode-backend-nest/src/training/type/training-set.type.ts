export interface TrainingSet {
  repsL: number;
  repsR: number;
  loadL: number;
  loadR: number;
  recTime: number;
  tempoL: number;
  tempoR: number;
  timeL: number;
  timeR: number;
  distL: number;
  distR: number;
  recDist: number;
}

export interface SetReport {
  reps: number;
  load: number;
  recTime: number;
  time: number;
  dist: number;
  recDist: number;
  activeTime: number;
  tonnage: number;
  timeWork: number;
  distWork: number;
  power: number;
}
