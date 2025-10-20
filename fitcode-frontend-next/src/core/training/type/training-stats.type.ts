import type { Component } from '@/core/component/type/component.type';

export type TrainingComponentStats = {
  componentId: string;
  totalSets: number; // for calculating status
};

export type TrainingStats = {
  plannedComponents: TrainingComponentStats[];
  mappedPlannedComponents?: Component[];
  totalDuration: number; // in minutes
  totalComponents: number;
  totalSupersets: number;
  totalExercises: number; // unique
  totalSets: number;
  totalReps: number;
  totalRecTime: number; // total recovery time (for all sets, in seconds)
  totalTit: number; // time when executing the training (in seconds) - sets * reps/dist/time * tempo (sum), for example 3 * 12 * 1:0:1 tempo (2s) = 72s
  totalTonnage: number; // total weight lifted prescribed (in kg: sets * reps * weight)
  totalTimeVol?: number; // total time prescribed (in seconds)
  totalDistVol?: number; // total distance prescribed (in meters)
  totalRecDist?: number; // total recovery distance prescribed (in meters)
};
