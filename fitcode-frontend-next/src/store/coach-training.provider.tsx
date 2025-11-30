import { createContext, useContext, useState } from 'react';

import type { Institution } from '@/core/institution/type/institution.type';
import type { Training } from '@/core/training/type/training.type';
import type { SetState } from '@/lib/common/type/state.type';
import { Group } from '@/core/institution/type/group.type';

export type TrainingIdPageProps = {
  training: Training;
  institution: Institution;
  group: Group;
};

interface ICoachTrainingContext extends TrainingIdPageProps {
  setTraining: SetState<Training>;
  setInstitution: SetState<Institution>;
  setGroup: SetState<Group>;
}

const CoachTrainingContext = createContext<ICoachTrainingContext | undefined>(
  undefined
);

export const CoachTrainingProvider = (
  props: TrainingIdPageProps & React.PropsWithChildren
) => {
  const {
    training: propsTraining,
    institution: propsInstitution,
    group: propsGroup,
  } = props;

  const [training, setTraining] = useState<Training>(propsTraining);
  const [group, setGroup] = useState<Group>(propsGroup);
  const [institution, setInstitution] = useState<Institution>(propsInstitution);

  return (
    <CoachTrainingContext.Provider
      value={{
        training,
        setTraining,
        institution,
        setInstitution,
        group,
        setGroup,
      }}
    >
      {props.children}
    </CoachTrainingContext.Provider>
  );
};

export const useCoachTraining = () => useContext(CoachTrainingContext)!;
