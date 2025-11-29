import { createContext, useContext, useState } from 'react';

import type { Institution } from '@/core/institution/type/institution.type';
import type { Training } from '@/core/training/type/training.type';
import type { SetState } from '@/lib/common/type/state.type';

export type TrainingIdPageProps = {
  training: Training;
  institution: Institution;
};

interface ICoachTrainingContext extends TrainingIdPageProps {
  setTraining: SetState<Training>;
  setInstitution: SetState<Institution>;
}

const CoachTrainingContext = createContext<ICoachTrainingContext | undefined>(
  undefined
);

export const CoachTrainingProvider = (
  props: TrainingIdPageProps & React.PropsWithChildren
) => {
  const { training: propsTraining, institution: propsInstitution } = props;

  const [training, setTraining] = useState<Training>(propsTraining);
  const [institution, setInstitution] = useState<Institution>(propsInstitution);

  return (
    <CoachTrainingContext.Provider
      value={{ training, setTraining, institution, setInstitution }}
    >
      {props.children}
    </CoachTrainingContext.Provider>
  );
};

export const useCoachTraining = () => useContext(CoachTrainingContext)!;
