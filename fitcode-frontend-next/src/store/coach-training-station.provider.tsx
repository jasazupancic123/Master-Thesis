'use client';

import { TrainingComponent } from '@/core/training/type/training-component.type';
import { TrainingStation } from '@/core/training/type/training-station.type';
import { Training } from '@/core/training/type/training.type';
import { handleApiRequest, SetState } from '@/lib/common/type/state.type';
import { createContext, useContext, useEffect, useState } from 'react';
import { useCoachTraining } from './coach-training.provider';
import { usePathname } from 'next/navigation';
import { TrainingExercise } from '@/core/training/type/training-exercise.type';
import { AuthUser } from '@/core/auth/type/user.type';
import { PartialWorkload, Workload } from '@/core/training/type/workload.type';
import { lib } from '@/lib';
import { core } from '@/core/core.service';
import dayjs from 'dayjs';
import { TrainingController } from '@/core/training/training.controller';
import toast from 'react-hot-toast';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export type CoachTrainingSessionProps = {
  individualTrainings: (Training & { userId: string })[];
};

interface ICoachTrainingStationProvider extends CoachTrainingSessionProps {
  setIndividualTrainings: SetState<(Training & { userId: string })[]>;
  station: TrainingStation | null;
  setStation: SetState<TrainingStation | null>;
  component: TrainingComponent | null;
  setComponent: SetState<TrainingComponent | null>;
  selectedExercise: TrainingExercise | null;
  setSelectedExercise: SetState<TrainingExercise | null>;
  selectedUser: AuthUser | null;
  setSelectedUser: SetState<AuthUser | null>;
  selectedSetIndex: number | undefined;
  setSelectedSetIndex: SetState<number | undefined>;
  workloads: Workload[];
  setWorkloads: SetState<Workload[]>;
  updateStationsWorkloadValue: (
    id: {
      trainingId: string;
      componentId: string;
      exerciseId: string;
      supersetIndex: number;
      setNumber: number;
      userId: string;
    },
    field: keyof Workload,
    value: Workload[keyof Workload]
  ) => void;
  handleUpsertSet: (
    body: PartialWorkload,
    state: {
      exerciseId: string;
      supersetIndex: number;
      setIndex: number;
      isAiRecorded?: boolean;
    },
    router: AppRouterInstance
  ) => Promise<void>;
}

const CoachTrainingStationContext = createContext<
  ICoachTrainingStationProvider | undefined
>(undefined);

export const CoachTrainingStationProvider = (
  props: CoachTrainingSessionProps & React.PropsWithChildren
) => {
  const pathname = usePathname();
  const { training } = useCoachTraining();

  const componentId = pathname.split('/')[4];

  const { individualTrainings: individualTrainingsProps } = props;

  const [individualTrainings, setIndividualTrainings] = useState<
    (Training & { userId: string })[]
  >(individualTrainingsProps);

  const [component, setComponent] = useState<TrainingComponent | null>(
    training.components.find((c) => c.id === componentId) || null
  );

  const [station, setStation] = useState<TrainingStation | null>(null);

  const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null);

  const [selectedExercise, setSelectedExercise] =
    useState<TrainingExercise | null>(null);

  const [selectedSetIndex, setSelectedSetIndex] = useState<number | undefined>(
    undefined
  );

  const [workloads, setWorkloads] = useState<Workload[]>([]);

  useEffect(() => {
    if (!training) return;

    const unsub = lib.firebase.firestore.listenCollection<Workload>(
      `trainings/${training.id}/training-workload`,
      (snapshot) => {
        const data: Workload[] = snapshot.docs.map((doc) =>
          lib.firebase.firestore.serialize(doc.data())
        );

        setWorkloads(data);
      },
      (error) => {
        console.error('Error loading workloads:', error);
      }
    );

    return () => unsub();
  }, [training]);

  const updateStationsWorkloadValue = <K extends keyof Workload>(
    id: {
      trainingId: string;
      componentId: string;
      exerciseId: string;
      supersetIndex: number;
      setNumber: number;
      userId: string;
    },
    field: K,
    value: Workload[K]
  ) => {
    let workload: Workload | undefined | null = workloads.find(
      (w) =>
        w.trainingId === id.trainingId &&
        w.componentId === id.componentId &&
        w.exerciseId === id.exerciseId &&
        w.supersetIndex === id.supersetIndex &&
        w.setNumber === id.setNumber &&
        w.userId === id.userId
    );

    if (!workload) {
      const newWorkload =
        core.training.workload.createEmptyWorkloadFromTraining(id, training);

      if (!newWorkload) return;

      newWorkload[field] = value;

      setWorkloads((prev) => [...prev, newWorkload]);
      return;
    }

    if (!(field in workload)) return;

    workload[field] = value;
    (workload as any).id = undefined; // force update - remove id to make it "un-posted"

    setWorkloads((prev) =>
      prev.map((wl) => (wl.id === workload.id ? workload : wl))
    );
  };

  async function handleUpsertSet(
    body: PartialWorkload,
    state: {
      exerciseId: string;
      supersetIndex: number;
      setIndex: number;
    },
    router: AppRouterInstance
  ) {
    const {
      exerciseId,
      supersetIndex: stateSupersetIndex,
      setIndex: stateSetIndex,
    } = state || {};

    if (!body.from) {
      const currentSetActiveTimeS =
        core.training.workload.getActiveWorkloadTimeS(body);

      body.from = dayjs().subtract(currentSetActiveTimeS, 'second').toDate();
    }

    if (workloads.length > 0 && stateSetIndex > 0) {
      // we have previous workloads and this is not the first set
      const prevWorkload = workloads.find(
        (w) =>
          w.trainingId === body.trainingId &&
          w.componentId === body.componentId &&
          w.exerciseId === exerciseId &&
          w.supersetIndex === stateSupersetIndex &&
          w.setNumber === stateSetIndex // previous set (setNumber is 1-based, setIndex is 0-based)
      );

      if (prevWorkload) {
        const recTime = Math.abs(
          dayjs(body.from).diff(
            dayjs(prevWorkload.to || prevWorkload.timestamp),
            'second'
          )
        );

        prevWorkload.recTime = recTime;
        if (prevWorkload.repsR) prevWorkload.recTimeR = recTime;

        // Update prev workload's recTime
        handleApiRequest(
          router,
          () =>
            TrainingController.getInstance().upsertSet(
              body.trainingId,
              body.componentId,
              exerciseId,
              stateSupersetIndex,
              stateSetIndex, // previous set (setNumber is 1-based, setIndex is 0-based)
              { ...prevWorkload, userId: body.userId }
            ),
          (fetchedPrevWorkload) => {
            // We have listeners, no need to update state
          }
        );
      }
    }

    handleApiRequest(
      router,
      () =>
        TrainingController.getInstance().upsertSet(
          body.trainingId,
          body.componentId,
          exerciseId,
          stateSupersetIndex,
          stateSetIndex + 1,
          { ...body, userId: body.userId }
        ),
      (workload) => {
        // We have listeners, no need to update state
        toast.success('Saved');
      }
    );
  }

  useEffect(() => {
    console.log('workloads updated:', workloads);
  }, [workloads]);

  return (
    <CoachTrainingStationContext.Provider
      value={{
        station,
        setStation,
        individualTrainings,
        setIndividualTrainings,
        component,
        setComponent,
        selectedExercise,
        setSelectedExercise,
        selectedUser,
        setSelectedUser,
        selectedSetIndex,
        setSelectedSetIndex,
        workloads,
        setWorkloads,
        updateStationsWorkloadValue,
        handleUpsertSet,
      }}
    >
      {props.children}
    </CoachTrainingStationContext.Provider>
  );
};

export const useCoachTrainingStation = () =>
  useContext(CoachTrainingStationContext)!;
