import { TrainingComponent } from '@/core/training/type/training-component.type';
import { Workload } from '@/core/training/type/workload.type';
import { SetState } from '@/lib/common/type/state.type';
import { createContext, useContext, useState } from 'react';

export type TrainingRecapProps = {
  workloads: Workload[];
  component: TrainingComponent;
};

interface ITrainingRecapProvider extends TrainingRecapProps {
  setWorkloads: SetState<Workload[]>;
}

const TrainingRecapContext = createContext<ITrainingRecapProvider | undefined>(
  undefined
);

export const TrainingRecapProvider = (
  props: React.PropsWithChildren & TrainingRecapProps
) => {
  const { workloads: propsWorkloads, component } = props;

  const [workloads, setWorkloads] = useState<Workload[]>(propsWorkloads);

  return (
    <TrainingRecapContext.Provider
      value={{ workloads, setWorkloads, component }}
    >
      {props.children}
    </TrainingRecapContext.Provider>
  );
};

export const useTrainingRecap = () => useContext(TrainingRecapContext)!;
