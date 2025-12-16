'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { useAuthenticatedAuth } from './auth.provider';
import { useMain } from './main.provider';
import { DASHBOARD_ALL_GROUPS_SELECTED_ID } from '@/components/dashboard/constant/dashboard.const';
import { INDEX_DB_LAST_SELECTED_DASHBOARD_GROUP_ID } from '@/components/report-athlete-exercise/const/index-db-id.const';
import { core } from '@/core/core.service';
import { InstitutionController } from '@/core/institution/institution.controller';
import type { Group, UpdateGroup } from '@/core/institution/type/group.type';
import type {
  InitInstitution,
  UpdateInstitution,
} from '@/core/institution/type/institution.type';
import type { User } from '@/core/user/type/user.type';
import { lib } from '@/lib';
import { DASHBOARD_VIEWS } from '@/lib/common/const/nav.const';
import type { ILink } from '@/lib/common/type/link.type';
import type { SetState } from '@/lib/common/type/state.type';

export interface IDashboardContext {
  filter: ILink;
  setFilter: SetState<ILink>;
  selectedGroups: Group[];
  setSelectedGroups: SetState<Group[]>;
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
  openEditGroupModal: boolean;
  setOpenEditGroupModal: SetState<boolean>;
}

const DashboardContext = createContext<IDashboardContext | null>(null);

export const useDashboard = () => useContext(DashboardContext)!;

export function DashboardProvider(props: React.PropsWithChildren) {
  const { children } = props;
  const { role } = useAuthenticatedAuth();
  const { users, institution, setInstitution } = useMain();

  const groups = institution.groups || [];
  const [filter, setFilter] = useState<ILink>(DASHBOARD_VIEWS(role)[0]);
  const [detectedChanges, setDetectedChanges] = useState(false);
  const [openEditGroupModal, setOpenEditGroupModal] = useState(false);

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

  const [selectedGroups, setSelectedGroups] = useState<Group[]>(
    (institution?.groups || []).filter((g) =>
      groups.some((sg) => sg.id === g.id)
    ) || []
  );

  useEffect(() => {
    if (!institution) return;

    const setupSelectedGroup = async () => {
      const lastSelectedGroupId = await lib.common.indexedDb.items.get(
        INDEX_DB_LAST_SELECTED_DASHBOARD_GROUP_ID
      );

      if (lastSelectedGroupId?.payload) {
        const groupId = lastSelectedGroupId.payload as string;

        if (groupId === DASHBOARD_ALL_GROUPS_SELECTED_ID) return;

        const group = institution.groups?.find((g) => g.id === groupId);

        if (group) {
          setSelectedGroups([group]);
          return;
        }
      }

      // Fallback to first group
      const group = institution.groups?.find((g) =>
        groups.some((sg) => sg.id === g.id)
      );

      setSelectedGroups(group ? [group] : []);
    };

    setupSelectedGroup();
  }, []);

  const value: IDashboardContext = {
    filter,
    setFilter,
    selectedGroups,
    setSelectedGroups,
    detectedChanges,
    setDetectedChanges,
    openEditGroupModal,
    setOpenEditGroupModal,
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
        setSelectedGroups((prev) => prev.map(mapper));
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
        selectedGroups: structuredClone(selectedGroups),
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

        setSelectedGroups((prev) =>
          prev.map((g) => (g.id === newGroup.id ? newGroup : g))
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
        selectedGroups: structuredClone(selectedGroups),
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

        setSelectedGroups((prev) =>
          prev.map((g) => (g.id === newGroup.id ? newGroup : g))
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
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}
