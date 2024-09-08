import { Dayjs } from 'dayjs';
import { Component } from '@/component/type/component.type';
import { Exercise } from '@/exercise/type/exercise.type';

export interface Training {
  id: string;
  cycleId: string;
  componentIds: string[];
  startTime: Dayjs;
  endTime: Dayjs;

  // relations
  setGroups: SetGroup[];
}

interface CreateTraining {
  startTime: Dayjs;
  endTime: Dayjs;
  date: Dayjs;
}

export interface AddSetGroup {
  trainingId: string;
  componentIds: string[];
}

export interface CreateSet {
  trainingId: string;
  color?: string;
  order?: number;
  exercises: {
    exerciseId: string;
    order: number;
    sets: number;
    reps: number;
    kg: number;
    intensity: number;
    tempo: number;
    rec: number;
    work: number;
  }[];
}

export interface SetGroup {
  id: string;
  trainingId: string;
  componentId: string;
  color: string;
  order: string;

  // relations
  setSubgroups: SetSubgroup[];
  component: Component;
}

export interface SetSubgroup {
  id: string;
  setGroupId: string;
  order: number;

  // relations
  setExercises: SetExercise[];
}

export interface SetExercise {
  id: string;
  setSubgroupId: string;
  exerciseId: string;
  order: number;

  exercise?: Exercise;
  exerciseInfo?: ExerciseInfo[];
  superExerciseInfo?: SuperExerciseInfo;
}

export interface SuperExerciseInfo {
  id: string;
  setExerciseId: string;
  sets: number;
  setType: 'reps' | 'distance' | 'time' | 'vo2';
  setTypeValue: number;
  workloadType: 'rm' | 'bw' | 'kg' | 'int';
  workloadValue: number;
  rec: number;
  tempo?: string;
  effort?: 'easy' | 'moderate' | 'hard' | 'max';
}

export interface ExerciseInfo {
  id: string;
  userId: string;
  superExerciseInfoId: string;
  value: number;
}