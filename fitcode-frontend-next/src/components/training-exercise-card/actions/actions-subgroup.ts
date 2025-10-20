import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/core/training/const/warmup-cooldown.const';
import { DEFAULT_SUBGROUP_ID } from '@/components/trainer-group-day-view/constant/subgroups.constant';
import { app } from '@/core/app.service';
import { MainSet } from '@/core/training/enum/main-set.enum';
import type { Subgroup } from '@/core/training/type/subgroup.type';
import type { TrainingComponent } from '@/core/training/type/training-component.type';
import type { TrainerDayViewCtxExtended } from '@/store/trainer-day-view.provider';

export function getOrCreateVirtualSubgroup(
  context: TrainerDayViewCtxExtended
): Subgroup | null {
  const {
    selectedAthlete,
    selectedSubgroup,
    component,
    setSelectedSubgroup,
    setComponent,
    setTraining,
  } = context;

  if (!selectedAthlete) return null;

  const found = component.subgroups.find(
    (s) => s.parentId && s.membersIds.includes(selectedAthlete.uid)
  );

  if (found) return found;

  const parentId =
    selectedSubgroup && !selectedSubgroup.parentId
      ? selectedSubgroup.id
      : DEFAULT_SUBGROUP_ID;

  const supersets = selectedSubgroup?.supersets || component.supersets || [];
  const virtualSubgroup = app.training.subgroup.stub({
    name: `${selectedAthlete.displayName} Custom Subgroup`,
    parentId,
    mainSet: (selectedSubgroup || component).mainSet || MainSet.BLOCK,
    membersIds: [selectedAthlete.uid],
    members: [selectedAthlete],
    supersets: supersets.map((s) => ({
      ...s,
      exercises: [...s.exercises].map((e) => ({
        ...e,
        sets: e.sets.map((set) => ({ ...set })),
      })),
    })),
  });

  const updatedComponent: TrainingComponent = {
    ...component,
    subgroups: [...component.subgroups, virtualSubgroup],
  };

  setSelectedSubgroup(virtualSubgroup);
  setComponent(updatedComponent);
  setTraining((prev) => {
    if (!prev) return prev;

    if (updatedComponent.id === WARMUP_ID)
      return { ...prev, warmup: updatedComponent };

    if (updatedComponent.id === COOLDOWN_ID)
      return { ...prev, cooldown: updatedComponent };

    return {
      ...prev,
      components: prev.components.map((c) =>
        c.id === updatedComponent.id ? updatedComponent : c
      ),
    };
  });

  return virtualSubgroup;
}
