import toast from 'react-hot-toast';

import { COLOR } from '@/common/constant/color.constant';
import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/common/constant/warmup-cooldown-ids-constants';
import type { Pagination } from '@/common/type/paginate.type';
import type { SetState, SetStateNullable } from '@/common/type/state.type';
import type { AttributeValue } from '@/controller/attribute/type/attribute-value.type';
import { ParamType } from '@/controller/component/enum/param.enum';
import type { Exercise } from '@/controller/exercise/type/exercise.type';
import type { Method } from '@/controller/method/type/method.type';
import { CustomWorkloadsSubgroupsService } from '@/controller/training/custom-workloads-subgroups.service';
import { MainSet } from '@/controller/training/enum/main-set.enum';
import type { Subgroup } from '@/controller/training/type/subgroup.type';
import type { Superset } from '@/controller/training/type/superset.type';
import type { Training } from '@/controller/training/type/training.type';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import {
  NUM_MAX_EXERCISES_PER_SUPERSET,
  NUM_MAX_SUPERSETS,
} from '@/components/trainer-group-day-view/constant/supersets.constant';

export const updateSupersets = (
  supersets: Superset[],
  exercisesToAdd: TrainingExercise[],
  mainSet: MainSet
): Superset[] | null => {
  if (!Array.isArray(supersets)) supersets = [];
  if (supersets.length === 0)
    supersets.push({ exercises: [], color: COLOR[supersets.length] });

  const maxExercisesPerSuperset =
    mainSet === MainSet.CIRCUIT ? 32 : NUM_MAX_EXERCISES_PER_SUPERSET;
  const maxSupersets = mainSet === MainSet.CIRCUIT ? 1 : NUM_MAX_SUPERSETS;

  let i = 0;
  for (const superset of supersets) {
    while (
      superset.exercises.length < maxExercisesPerSuperset &&
      i < exercisesToAdd.length
    ) {
      const exerciseToAdd = exercisesToAdd[i]; // get the current exercise
      if (exerciseToAdd) superset.exercises.push({ ...exerciseToAdd });

      i++;
    }

    if (i === exercisesToAdd.length)
      break; // stop if no exercises left
    else if (supersets.indexOf(superset) === supersets.length - 1) {
      // if this is the last superset, add a new one if there are still exercises to add
      if (supersets.length === maxSupersets) {
        toast.error(
          'Added exercises exceed the maximum number of exercises allowed'
        );
        return null;
      }

      if (mainSet === MainSet.BLOCK) {
        supersets.push({
          exercises: [],
          color: COLOR[supersets.length],
        });
      }
    }
  }

  return supersets;
};
