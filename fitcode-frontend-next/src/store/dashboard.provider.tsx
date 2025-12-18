'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { useAuthenticatedAuth } from './auth.provider';
import { useMain } from './main.provider';
import {
  DASHBOARD_ALL_GROUPS_SELECTED_ID,
  DASHBOARD_MY_GROUPS_SELECTED_ID,
} from '@/components/dashboard/constant/dashboard.const';
import { core } from '@/core/core.service';
import { InstitutionController } from '@/core/institution/institution.controller';
import type { Group, UpdateGroup } from '@/core/institution/type/group.type';
import type {
  InitInstitution,
  UpdateInstitution,
} from '@/core/institution/type/institution.type';
import type { User } from '@/core/user/type/user.type';
import { lib } from '@/lib';
import { LINK_DASHBOARD_HOME } from '@/lib/common/const/nav.const';
import type { ILink } from '@/lib/common/type/link.type';
import type { SetState } from '@/lib/common/type/state.type';

export interface IDashboardContext {
  filter: ILink;
  setFilter: SetState<ILink>;
  filteredGroups: Group[];
  setFilteredGroups: SetState<Group[]>;
  filterGroups: { id: string; label: string };
  setFilterGroups: SetState<{ id: string; label: string }>;
  groupFilterItems: { id: string; label: string }[];
  detectedChanges: boolean;
  setDetectedChanges: SetState<boolean>;
  updateInstitution: (
    institutionId: string,
    input: UpdateInstitution
  ) => Promise<void>;
  updateGroup: (groupId: string, input: UpdateGroup) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  addGroup: (data: Group) => Promise<Group | undefined>;
  addGroupMember: (user: User, groupId: string) => Promise<void>;
  removeGroupMember: (userId: string, groupId: string) => Promise<void>;
  addGroupTrainer: (user: User, groupId: string) => Promise<void>;
  removeGroupTrainer: (userId: string, groupId: string) => Promise<void>;
}

const DashboardContext = createContext<IDashboardContext | null>(null);

export const useDashboard = () => useContext(DashboardContext)!;

export function DashboardProvider(props: React.PropsWithChildren) {
  const { user } = useAuthenticatedAuth();
  const { users, institution, setInstitution } = useMain();

  const { children } = props;

  const groups = institution.groups || [];
  const [filter, setFilter] = useState<ILink>(LINK_DASHBOARD_HOME);
  const [detectedChanges, setDetectedChanges] = useState(false);

  const [filteredGroups, setFilteredGroups] = useState<Group[]>(groups);

  const [filterGroups, setFilterGroups] = useState<{
    id: string;
    label: string;
  }>({ id: DASHBOARD_ALL_GROUPS_SELECTED_ID, label: 'All Groups' });

  const groupFilterItems: { id: string; label: string }[] = [
    {
      id: DASHBOARD_ALL_GROUPS_SELECTED_ID,
      label: 'All Groups',
    },
    {
      id: DASHBOARD_MY_GROUPS_SELECTED_ID,
      label: 'My Groups',
    },

    institution.groups.map((g: Group) => ({
      id: g.id,
      label: g.name,
    })),
  ].flat();

  useEffect(() => {
    if (filterGroups.id === DASHBOARD_ALL_GROUPS_SELECTED_ID) {
      setFilteredGroups(institution.groups);
      return;
    }

    if (filterGroups.id === DASHBOARD_MY_GROUPS_SELECTED_ID) {
      const myGroups = institution.groups.filter((group) =>
        group.trainerIds.some((id) => id === user.uid)
      );
      setFilteredGroups(myGroups);
      return;
    }

    const specificGroup = institution.groups.filter(
      (group) => group.id === filterGroups.id
    );
    if (specificGroup) setFilteredGroups(specificGroup);
  }, [filterGroups, institution.groups]);

  useEffect(() => {
    if (!users.data.length) return;

    // map groups and instituton
    setInstitution((prev) => {
      if (!prev) return prev;
      const institution = core.institution.mapUsers([prev], users.data)[0];
      for (const group of groups) core.group.mapMembers(group, users.data);
      return institution;
    });
  }, [users]);

  const value: IDashboardContext = {
    filter,
    setFilter,
    filteredGroups,
    setFilteredGroups,
    filterGroups,
    setFilterGroups,
    groupFilterItems,
    detectedChanges,
    setDetectedChanges,
    updateInstitution: async (institutionId, input) => {
      const prevState = {
        institution: structuredClone(institution),
      };

      function mapper(inst: InitInstitution): InitInstitution {
        if (inst.id !== institutionId) return inst;
        return {
          ...inst,
          name: input.name ?? inst.name,
          imageUrl: input.imageUrl ?? inst.imageUrl,
        };
      }

      await lib.common.generic.optimisticUpdate(
        () => {
          if (institutionId === institution?.id)
            setInstitution((prev) => (prev ? mapper(prev) : prev));
        },
        (snapshot) => {
          setInstitution(snapshot.institution);
          toast.error('Failed to update institution name');
        },
        () => InstitutionController.getInstance().update(institutionId, input),
        prevState
      );
    },
    updateGroup: async (groupId: string, input: UpdateGroup) => {
      if (!institution) return;

      const prevState = {
        institution: structuredClone(institution),
      };

      function mapper(group: Group): Group {
        if (group.id !== groupId) return group;

        let newGroup: Group = {
          ...group,
          name: input.name ?? group.name,
          shortName: input.shortName ?? group.shortName,
          trainerIds: input.trainerIds ?? group.trainerIds,
        };

        newGroup = core.group.mapMembers(newGroup, users.data || []);
        return newGroup;
      }

      const apply = () => {
        // apply optimistic update
        setInstitution((prev) =>
          prev ? { ...prev, groups: (prev.groups || []).map(mapper) } : prev
        );
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rollback = (snapshot: any) => {
        setInstitution(snapshot.institution);
        toast.error('Failed to update group name');
      };

      const action = () =>
        InstitutionController.getInstance().updateGroup(
          institution.id,
          groupId,
          input
        );

      await lib.common.generic.optimisticUpdate(
        apply,
        rollback,
        action,
        prevState
      );
    },
    deleteGroup: async (groupId: string) => {
      if (!institution) return;

      const prevState = {
        institution: structuredClone(institution),
      };

      const apply = () => {
        setInstitution((prev) =>
          prev
            ? {
                ...prev,
                groups: (prev.groups || []).filter(
                  (group) => group.id !== groupId
                ),
              }
            : prev
        );
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rollback = (snapshot: any) => {
        setInstitution(snapshot.institution);
        toast.error('Failed to delete group');
      };

      const action = () =>
        InstitutionController.getInstance().deleteGroup(
          institution.id,
          groupId
        );

      await lib.common.generic.optimisticUpdate(
        apply,
        rollback,
        action,
        prevState
      );
    },
    addGroup: async (data: Group) => {
      if (!institution) return;

      const prevState = {
        institution: structuredClone(institution),
      };

      const apply = () => {
        setInstitution((prev) =>
          prev ? { ...prev, groups: [...(prev.groups || []), data] } : prev
        );
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rollback = (snapshot: any) => {
        setInstitution(snapshot.institution);
        toast.error('Failed to add group');
      };

      const action = () =>
        InstitutionController.getInstance().createGroup(data);

      return await lib.common.generic.optimisticUpdate(
        apply,
        rollback,
        action,
        prevState
      );
    },
    addGroupMember: async (user: User, groupId: string) => {
      if (!institution) return;

      const prevState = {
        institution: structuredClone(institution),
      };

      const selectedGroup = institution.groups.find((g) => g.id === groupId);

      if (!selectedGroup) return;

      const apply = () => {
        const newGroup: Group = {
          ...selectedGroup,
          members: selectedGroup.members
            ? [...selectedGroup.members, user]
            : [user],
          membersIds: selectedGroup.membersIds
            ? [...selectedGroup.membersIds, user.uid]
            : [user.uid],
        };

        setInstitution((prev) =>
          !prev
            ? prev
            : {
                ...prev,
                groups: (prev.groups || []).map((g) =>
                  g.id === newGroup.id ? newGroup : g
                ),
              }
        );
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rollback = (snapshot: any) => {
        setInstitution(snapshot.institution);
        toast.error('Failed to add member to group');
      };

      const action = () =>
        InstitutionController.getInstance().addGroupAthlete(
          selectedGroup.institutionId,
          selectedGroup.id,
          { userId: user.uid }
        );

      await lib.common.generic.optimisticUpdate(
        apply,
        rollback,
        action,
        prevState
      );
    },
    removeGroupMember: async (userId: string, groupId: string) => {
      if (!institution) return;

      const prevState = {
        institution: structuredClone(institution),
      };

      const selectedGroup = institution.groups.find((g) => g.id === groupId);

      if (!selectedGroup) return;

      const apply = () => {
        const newGroup: Group = {
          ...selectedGroup,
          members: selectedGroup.members?.filter((m) => m.uid !== userId),
          membersIds: selectedGroup.membersIds?.filter((id) => id !== userId),
        };

        setInstitution((prev) =>
          !prev
            ? prev
            : {
                ...prev,
                groups: (prev.groups || []).map((g) =>
                  g.id === newGroup.id ? newGroup : g
                ),
              }
        );
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rollback = (snapshot: any) => {
        setInstitution(snapshot.institution);
        toast.error('Failed to remove member from group');
      };

      const action = () =>
        InstitutionController.getInstance().removeGroupAthlete(
          selectedGroup.institutionId,
          selectedGroup.id,
          { userId }
        );

      await lib.common.generic.optimisticUpdate(
        apply,
        rollback,
        action,
        prevState
      );
    },
    addGroupTrainer: async (user: User, groupId: string) => {
      if (!institution) return;

      const prevState = {
        institution: structuredClone(institution),
      };

      const selectedGroup = institution.groups.find((g) => g.id === groupId);

      if (!selectedGroup) return;

      const apply = () => {
        const newGroup: Group = {
          ...selectedGroup,
          trainers: selectedGroup.trainers
            ? [...selectedGroup.trainers, user]
            : [user],
          trainerIds: selectedGroup.trainerIds
            ? [...selectedGroup.trainerIds, user.uid]
            : [user.uid],
        };

        setInstitution((prev) =>
          !prev
            ? prev
            : {
                ...prev,
                groups: (prev.groups || []).map((g) =>
                  g.id === newGroup.id ? newGroup : g
                ),
              }
        );
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rollback = (snapshot: any) => {
        setInstitution(snapshot.institution);
        toast.error('Failed to add trainer to group');
      };

      const action = () =>
        InstitutionController.getInstance().addGroupTrainer(
          selectedGroup.institutionId,
          selectedGroup.id,
          { userId: user.uid }
        );

      await lib.common.generic.optimisticUpdate(
        apply,
        rollback,
        action,
        prevState
      );
    },
    removeGroupTrainer: async (userId: string, groupId: string) => {
      if (!institution) return;

      const prevState = {
        institution: structuredClone(institution),
      };

      const selectedGroup = institution.groups.find((g) => g.id === groupId);

      if (!selectedGroup) return;

      const apply = () => {
        const newGroup: Group = {
          ...selectedGroup,
          trainers: selectedGroup.trainers?.filter((m) => m.uid !== userId),
          trainerIds: selectedGroup.trainerIds?.filter((id) => id !== userId),
        };

        setInstitution((prev) =>
          !prev
            ? prev
            : {
                ...prev,
                groups: (prev.groups || []).map((g) =>
                  g.id === newGroup.id ? newGroup : g
                ),
              }
        );
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rollback = (snapshot: any) => {
        setInstitution(snapshot.institution);
        toast.error('Failed to remove member from group');
      };

      const action = () =>
        InstitutionController.getInstance().removeGroupTrainer(
          selectedGroup.institutionId,
          selectedGroup.id,
          { userId }
        );

      await lib.common.generic.optimisticUpdate(
        apply,
        rollback,
        action,
        prevState
      );
    },
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}
