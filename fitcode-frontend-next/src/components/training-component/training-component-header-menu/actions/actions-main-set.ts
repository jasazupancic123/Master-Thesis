import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/common/constant/warmup-cooldown-ids-constants';
import { CustomWorkloadsSubgroupsService } from '@/controller/training/custom-workloads-subgroups.service';
import { MainSet } from '@/controller/training/enum/main-set.enum';
import { Subgroup } from '@/controller/training/type/subgroup.type';
import { Superset } from '@/controller/training/type/superset.type';
import { TrainingComponent } from '@/controller/training/type/training-component.type';
import { GroupProviderReturnType } from '@/store/group.provider';
import { TrainerDayViewProviderReturnTypeDefined } from '@/store/trainer-day-view.provider';

export function handleSetMainSet(
  input: { newMainSet: string | number },
  context: {
    useGroup: GroupProviderReturnType;
    useTrainerDayViewContext: TrainerDayViewProviderReturnTypeDefined;
  }
) {
  const { newMainSet } = input;

  const { useGroup, useTrainerDayViewContext } = context;

  const { setDetectedChanges } = useGroup;
  const {
    component,
    setComponent,
    setTraining,
    selectedSubgroup,
    setSelectedSubgroup,
  } = useTrainerDayViewContext;

  setDetectedChanges(true);
  const mainSet = Object.values(MainSet).find((g) => g === newMainSet);

  if (!mainSet) return;

  if (!selectedSubgroup && component.mainSet === mainSet) return;

  if (selectedSubgroup && selectedSubgroup.mainSet === mainSet) return;

  const updatedSupersets = onMainSetChange({
    mainSet,
    updatedComponent: component,
    updatedSubgroup: selectedSubgroup,
  });

  const updatedComponent = { ...component };

  if (selectedSubgroup) {
    const updatedSubgroup = {
      ...selectedSubgroup,
      supersets: updatedSupersets,
      mainSet,
    };

    setSelectedSubgroup(updatedSubgroup);

    updatedComponent.subgroups = component.subgroups.map((s) =>
      s.id === updatedSubgroup.id ? updatedSubgroup : s
    );

    updatedComponent.subgroups = CustomWorkloadsSubgroupsService.updateMainSet(
      {
        component: updatedComponent,
        selectedSubgroup: updatedSubgroup,
        mainSet,
      },
      context
    );
  } else {
    updatedComponent.supersets = updatedSupersets;
    updatedComponent.mainSet = mainSet;

    updatedComponent.subgroups = CustomWorkloadsSubgroupsService.updateMainSet(
      {
        component,
        selectedSubgroup: null,
        mainSet,
      },
      context
    );
  }

  setComponent(updatedComponent);

  setTraining((prev) => {
    if (!prev) return prev;

    if (updatedComponent.id === WARMUP_ID) {
      return {
        ...prev,
        warmup: updatedComponent,
      };
    } else if (updatedComponent.id === COOLDOWN_ID) {
      return {
        ...prev,
        cooldown: updatedComponent,
      };
    }

    return {
      ...prev,
      components: prev.components.map((c) =>
        c.id === updatedComponent.id ? updatedComponent : c
      ),
    };
  });
}

export const onMainSetChange = (input: {
  mainSet: MainSet;
  updatedComponent: TrainingComponent;
  updatedSubgroup: Subgroup | null;
}): Superset[] => {
  const { mainSet, updatedComponent, updatedSubgroup } = input;

  const updatedSupersets = [{ exercises: [] }] as Superset[];

  const exercises = (updatedSubgroup || updatedComponent).supersets.flatMap(
    (s) => s.exercises
  );

  if (mainSet === MainSet.BLOCK) {
    exercises.forEach((e, i) => {
      // limit to 32 exercises
      if (i > 31) return;

      if (updatedSupersets[updatedSupersets.length - 1].exercises.length === 4)
        updatedSupersets.push({
          exercises: [],
        });

      updatedSupersets[updatedSupersets.length - 1].exercises.push(e);
    });
  } else {
    // circuit
    exercises.forEach((e, i) => {
      // limit to 32 exercises
      if (i > 31) return;

      updatedSupersets[0].exercises.push(e);
    });
  }

  return updatedSupersets;
};
