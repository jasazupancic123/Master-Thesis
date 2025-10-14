import { DEFAULT_SUBGROUP_ID } from '@/components/trainer-group-day-view/constant/subgroups.constant';
import type { TrainerDayViewProviderReturnType } from '@/store/trainer-day-view.provider';

export const deselectAthlete = (context: {
  useTrainerDayViewContext: TrainerDayViewProviderReturnType;
}) => {
  const {
    component,
    selectedSubgroup,
    setSelectedSubgroup,
    setSelectedAthlete,
  } = context.useTrainerDayViewContext;

  setSelectedAthlete(undefined);

  if (selectedSubgroup && selectedSubgroup.parentId && component) {
    const parentSubgroup = component.subgroups.find(
      (sg) => sg.id === selectedSubgroup.parentId
    );
    if (parentSubgroup && parentSubgroup.id !== DEFAULT_SUBGROUP_ID)
      setSelectedSubgroup(parentSubgroup);
    else setSelectedSubgroup(null);
  }
};
