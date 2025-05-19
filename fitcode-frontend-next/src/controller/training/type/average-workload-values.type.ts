import { IntensityVolumeValues } from './intensity-volume-values.type';

export type AverageWorkloadValues = {
  exerciseId: string;
  rootComponentId: string; // strength, speed, ...
  numMembers: number;
  avgWorkloadValue: IntensityVolumeValues; // make sure to avg workload values based on setNumber
};
