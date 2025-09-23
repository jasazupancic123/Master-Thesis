import type { DateRange } from '@/common/type/date-range.type';
import type { Component } from '@/controller/component/type/component.type';
import type { ExerciseMuscleValue } from '@/controller/exercise/type/muscle-tip.type';
import type { Cycle } from '@/controller/group/type/cycle.type';
import type { Group } from '@/controller/group/type/group.type';
import type { Institution } from '@/controller/institution/type/institution.type';

export type TrainingReportComponentStatus = {
  componentId: string;
  status: 'not_started' | 'in_progress' | 'completed';
};

export type TrainingReport = TrainingStats &
  Required<DateRange> & {
    institutionId?: string;
    institution?: Institution;
    groupId?: string;
    group?: Group;
    cycleId?: string;
    cycle?: Cycle;

    componentStatuses: TrainingReportComponentStatus[]; // list of completed component ids, just for frontend display
    trainingId: string;
    userId: string;
    completed: boolean;
    duration: number; // in minutes
    components: number;
    exercises: number;
    sets: number;
    reps: number;
    recTime: number;

    // calculated fields
    activeTime: number; // total time under tension
    tonnage: number;
    timeWork: number;
    distWork: number;
    power: number;
    realizationScore: number;

    muscleValues: ExerciseMuscleValue[];
    photoURL?: string; // "best" photo of the training session
    timeVol?: number; // total time prescribed (in seconds)
    distVol?: number; // total distance prescribed (in meters)
    recDist?: number; // total recovery distance prescribed (in meters)
  };

export type TraininComponentStats = {
  componentId: string;
  totalSets: number; // for calculating status
};

export type TrainingStats = {
  plannedComponents: TraininComponentStats[];
  mappedPlannedComponents?: Component[];
  totalDuration: number; // in minutes
  totalComponents: number;
  totalSupersets: number;
  totalExercises: number; // unique
  totalSets: number;
  totalReps: number;
  totalRecTime: number; // total recovery time (for all sets, in seconds)
  totalActiveTime: number; // time when executing the training (in seconds) - sets * reps/dist/time * tempo (sum), for example 3 * 12 * 1:0:1 tempo (2s) = 72s
  totalTonnage: number; // total weight lifted prescribed (in kg: sets * reps * weight)
  totalTimeWork: number; // total time under load
  totalDistWork: number; // total distance under load
  totalPower: number; // total power output (in watts)
  totalRealizationScore: number; // tonnage and also time, distance, tempo prescribed - saved as a score of points
  totalTimeVol?: number; // total time prescribed (in seconds)
  totalDistVol?: number; // total distance prescribed (in meters)
  totalRecDist?: number; // total recovery distance prescribed (in meters)
};
