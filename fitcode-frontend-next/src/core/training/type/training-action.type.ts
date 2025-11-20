import type { ExerciseSet } from './exercise-set.type';

export enum TrainingAction {
  // TODO - not implemented yet
  /* // component
  ADD_COMPONENT = 'ADD_COMPONENT',
  UPDATE_COMPONENT = 'UPDATE_COMPONENT', // from, to, target
  REMOVE_COMPONENT = 'REMOVE_COMPONENT',

  // subgroup (payload must include componentId)
  ADD_SUBGROUP = 'ADD_SUBGROUP',
  UPDATE_SUBGROUP = 'UPDATE_SUBGROUP', // name, membersIds 
  REMOVE_SUBGROUP = 'REMOVE_SUBGROUP',
  // virtual subgroup (payload must include componentId and parentId)
  ADD_VIRTUAL_SUBGROUP = 'ADD_VIRTUAL_SUBGROUP',
  UPDATE_VIRTUAL_SUBGROUP = 'UPDATE_VIRTUAL_SUBGROUP',
  REMOVE_VIRTUAL_SUBGROUP = 'REMOVE_VIRTUAL_SUBGROUP',

  // superset (payload must include componentId and optionally subgroupId)
  ADD_SUPERSET = 'ADD_SUPERSET',
  UPDATE_SUPERSET = 'UPDATE_SUPERSET', // warmup, cooldown, main set
  REMOVE_SUPERSET = 'REMOVE_SUPERSET', */

  // exercise
  ADD_EXERCISE = 'ADD_EXERCISE',
  // UPDATE_EXERCISE = 'UPDATE_EXERCISE', // method
  REMOVE_EXERCISE = 'REMOVE_EXERCISE',

  // set (payload must include componentId, optionally subgroupId, and mandatory supersetIndex and exerciseId)
  ADD_SET = 'ADD_SET',
  UPDATE_SET = 'UPDATE_SET', // load, reps, ...
  REMOVE_SET = 'REMOVE_SET',
}

export interface TrainingActionRef {
  userId?: string; // if provided, move user to virtual subgroup
  componentId?: string;
  subgroupId?: string;
  parentId?: string;
  supersetIndex?: number;
  exerciseId?: string;
  setNumber?: number;
}

export interface TrainingActionPayload {
  set?: ExerciseSet;
}

export interface TrainingActionPayloadBody {
  action: TrainingAction;
  ref: TrainingActionRef;
  payload: TrainingActionPayload;
}
