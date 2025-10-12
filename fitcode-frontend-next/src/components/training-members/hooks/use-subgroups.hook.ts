import {
  DEFAULT_SUBGROUP,
  DEFAULT_SUBGROUP_ID,
} from '@/components/trainer-day-view/constant';
import { Subgroup } from '@/controller/training/type/subgroup.type';
import { useTrainerDayViewContext } from '@/store/trainer-day-view.provider';
import { useEffect, useState } from 'react';
import { UseTrainingMembersReturnType } from './use-members.hook';
import { SetState } from '@/common/type/state.type';

export type UseTrainingMembersSubgroupsReturnType = {
  subgroups: Subgroup[];
  setSubgroups: SetState<Subgroup[]>;
  changedSubgroupIds: string[];
  setChangedSubgroupIds: SetState<string[]>;
};

export default function useTrainingMembersSubgroups(
  trainingMembersContext: UseTrainingMembersReturnType
) {
  const [subgroups, setSubgroups] = useState<Subgroup[]>([]);
  const [changedSubgroupIds, setChangedSubgroupIds] = useState<string[]>([]);

  const { training, component, selectedSubgroup } = useTrainerDayViewContext();

  const { members, item } = trainingMembersContext;

  /* Inits subgroups */
  useEffect(() => {
    if (!training) return;

    if (!component) {
      setSubgroups([]);
      return;
    }

    let subgroups = component.subgroups || [];
    const availableMembers = members.filter(
      (member) =>
        !subgroups.some(
          (subgroup: Subgroup) =>
            subgroup.membersIds.includes(member.uid) && !subgroup.parentId
        )
    );

    const defaultSubgroup = subgroups.find(
      (sg) => sg.id === DEFAULT_SUBGROUP_ID
    );

    if (defaultSubgroup) {
      const defaultSubgroupMembers = members.filter((member) =>
        defaultSubgroup.membersIds.includes(member.uid)
      );
      availableMembers.push(...defaultSubgroupMembers);
    }

    // sort available members by group.membersIds
    availableMembers.sort((a, b) => {
      const indexA = item.membersIds.indexOf(a.uid);
      const indexB = item.membersIds.indexOf(b.uid);
      return indexA - indexB;
    });

    subgroups = subgroups.map((sg) => {
      const leafSubgroup = component.subgroups.find(
        (s) => s.parentId === sg.id
      );
      if (leafSubgroup) {
        const mergedMembers = [
          ...(sg.members || []),
          ...(leafSubgroup.members || []),
        ];
        const uniqueMembers = mergedMembers.filter(
          (m, index, self) => index === self.findIndex((t) => t.uid === m.uid)
        );

        return {
          ...sg,
          membersIds: [...sg.membersIds, ...leafSubgroup.membersIds].filter(
            (id, index, self) => self.indexOf(id) === index
          ),
          members: uniqueMembers,
        } as Subgroup;
      }

      if (sg.parentId === DEFAULT_SUBGROUP_ID) {
        const newMembers = (sg.members || []).filter(
          (m) =>
            !subgroups.some(
              (s) => s.id !== sg.id && s.membersIds.includes(m.uid)
            ) && !availableMembers.some((am) => am.uid === m.uid)
        );
        availableMembers.push(...newMembers);
      }

      return sg;
    });

    const newSubgroups = !subgroups.some((sg) => sg.id === DEFAULT_SUBGROUP_ID)
      ? [DEFAULT_SUBGROUP(availableMembers), ...subgroups]
      : subgroups.map((sg) => {
          if (sg.id === DEFAULT_SUBGROUP_ID) {
            return {
              ...sg,
              membersIds: availableMembers.map((m) => m.uid),
              members: availableMembers,
            };
          }
          return sg;
        });

    setSubgroups(newSubgroups);
  }, [training, component, selectedSubgroup]);

  return {
    subgroups,
    setSubgroups,
    changedSubgroupIds,
    setChangedSubgroupIds,
  };
}
