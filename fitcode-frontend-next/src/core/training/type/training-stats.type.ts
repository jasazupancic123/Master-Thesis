export type PrescribedTrainingComponentStats = {
  componentId: string;
  totalSets: number; // for calculating status
};

export type PrescribedTrainingStats = Omit<SetReport, 'load'> & {
  plannedComponents: PrescribedTrainingComponentStats[];
  duration: number; // in minutes
  components: number;
  supersets: number;
  exercises: number; // unique
  sets: number;
};

export type SetReport = {
  reps: number;
  load: number; // in kg
  tut: number; // time under tension in seconds
  tonnage: number; // in kg
  time: number; // in seconds
  dist: number; // in meters
  recTime: number; // in seconds
  recDist: number; // in meters
};
