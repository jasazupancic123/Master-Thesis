'use client';

import { TrainingController } from '@/core/training/training.controller';
import { TrainingComponent } from '@/core/training/type/training-component.type';
import { Workload } from '@/core/training/type/workload.type';
import { handleApiRequest, SetState } from '@/lib/common/type/state.type';
import { createContext, useContext, useState } from 'react';
import { useCoachTraining } from './coach-training.provider';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export type TrainingRecapProps = {
  workloads: Workload[];
  component: TrainingComponent;
};

interface ITrainingRecapProvider extends TrainingRecapProps {
  setWorkloads: SetState<Workload[]>;
  submitWorkloads: (
    deletedWorkloads: Workload[],
    updatedWorkloads: Workload[]
  ) => Promise<void>;
}

const TrainingRecapContext = createContext<ITrainingRecapProvider | undefined>(
  undefined
);

export const TrainingRecapProvider = (
  props: React.PropsWithChildren & TrainingRecapProps
) => {
  const router = useRouter();

  const { training } = useCoachTraining();

  const { workloads: propsWorkloads, component } = props;

  const [workloads, setWorkloads] = useState<Workload[]>(propsWorkloads);

  const submitWorkloads = async (
    deletedWorkloads: Workload[],
    updatedWorkloads: Workload[]
  ) => {
    handleApiRequest(
      router,
      () =>
        TrainingController.getInstance().updateManyWorkloads(training.id, {
          updates: updatedWorkloads.map((w) => ({
            ref: w,
            data: w,
          })),
          deletes: deletedWorkloads,
        }),
      () => {
        toast.success('Workloads updated successfully.');
      },
      undefined,
      'Failed to update workloads.'
    );
  };

  return (
    <TrainingRecapContext.Provider
      value={{ workloads, setWorkloads, component, submitWorkloads }}
    >
      {props.children}
    </TrainingRecapContext.Provider>
  );
};

export const useTrainingRecap = () => useContext(TrainingRecapContext)!;
