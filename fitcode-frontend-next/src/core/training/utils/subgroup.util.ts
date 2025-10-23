import { v4 } from 'uuid';

import { MainSet } from '../enum/main-set.enum';
import type { Subgroup } from '../type/subgroup.type';
import type { Superset } from '../type/superset.type';
import type { TrainingComponent } from '../type/training-component.type';
import { DEFAULT_SUBGROUP_ID } from '@/components/trainer-group-day-view/constant/subgroups.constant';
import type { AuthUser } from '@/core/auth/type/user.type';
import { core } from '@/core/core.service';

export class TrainingSubgroupUtil {
  stub(data?: Partial<Subgroup>): Subgroup {
    return {
      id: data?.id || v4(),
      name: data?.name || 'New Subgroup',
      parentId: data?.parentId,
      mainSet: data?.mainSet || MainSet.BLOCK,
      membersIds: data?.membersIds || [],
      members: data?.members || [],
      supersets: data?.supersets || [],
      periodizationType: data?.periodizationType,
      color: data?.color,
    };
  }

  getVirtual(athleteId: string, component: TrainingComponent): Subgroup | null {
    return (
      component.subgroups.find(
        (s) =>
          s.parentId &&
          s.membersIds.length === 1 &&
          s.membersIds.includes(athleteId)
      ) || null
    );
  }

  createVirtual(
    athlete: AuthUser,
    subgroup: Subgroup | null,
    component: TrainingComponent
  ): Subgroup {
    return this.stub({
      id: athlete.uid,
      name: `${athlete.displayName} Custom Subgroup`,
      parentId:
        subgroup && !subgroup.parentId ? subgroup.id : DEFAULT_SUBGROUP_ID,
      mainSet: (subgroup || component).mainSet || MainSet.BLOCK,
      membersIds: [athlete.uid],
      members: [athlete],
      supersets: structuredClone(
        subgroup?.supersets || component.supersets || []
      ),
    });
  }

  /**
   * Checks if subgroup prescription is equal to its parent prescription.
   * Subgroup can be either virtual or regular. The function finds its
   * parent item (component or root subgroup) and compares the supersets.
   *
   * @param subgroup - the subgroup to compare (virtual or regular)
   * @param component - the training component containing all subgroups
   */
  isEqual(subgroup: Subgroup, component: TrainingComponent): boolean {
    const supersets = this.getParentSupersets(subgroup, component);
    if (subgroup.supersets.length !== supersets.length) return false;

    for (let i = 0; i < subgroup.supersets.length; i++) {
      const supersetA = subgroup.supersets[i];
      const supersetB = supersets[i];
      if (!core.training.superset.isEqual(supersetA, supersetB)) return false;
    }

    return true;
  }

  getParent(subgroup: Subgroup, component: TrainingComponent): Subgroup | null {
    if (!subgroup.parentId || subgroup.parentId === DEFAULT_SUBGROUP_ID)
      return null;

    return component.subgroups.find((s) => s.id === subgroup.parentId) || null;
  }

  getChildren(
    item: Subgroup | TrainingComponent,
    component: TrainingComponent
  ): Subgroup[] {
    return !core.training.isTrainingComponent(item)
      ? component.subgroups.filter((s) => s.parentId === item.id) // item is subgroup, find its virtual children
      : component.subgroups.filter(
          (s) =>
            s.parentId &&
            s.parentId === DEFAULT_SUBGROUP_ID &&
            s.membersIds.length === 1
        ); // item is component, find virtual children subgroups
  }

  private getParentSupersets(
    subgroup: Subgroup,
    component: TrainingComponent
  ): Superset[] {
    return !subgroup.parentId || subgroup.parentId === DEFAULT_SUBGROUP_ID
      ? component.supersets
      : component.subgroups.find((s) => s.id === subgroup.parentId)
          ?.supersets || component.supersets;
  }
}
