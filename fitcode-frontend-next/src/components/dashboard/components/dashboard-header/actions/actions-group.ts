import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import toast from 'react-hot-toast';

import { handleApiRequest } from '@/lib/common/type/state.type';
import type { GroupController } from '@/core/group/group.controller';
import type { UseDashboardReturnType } from '@/store/dashboard.provider';

export const handleRemoveSelectedGroup = (
  input: {
    router: AppRouterInstance;
    controller: GroupController;
  },
  context: {
    useDashboard: UseDashboardReturnType;
  }
) => {
  const { router, controller } = input;

  const { useDashboard } = context;

  const { selectedGroup, setSelectedGroup, setSelectedInstitution } =
    useDashboard;

  if (!selectedGroup) return;

  handleApiRequest(
    router,
    () => controller.delete(selectedGroup.id),
    () => {
      setSelectedGroup(null);
      setSelectedInstitution((prev) => {
        if (!prev) return null;
        const updatedGroups = prev.groups.filter(
          (g) => g.id !== selectedGroup.id
        );
        return { ...prev, groups: updatedGroups };
      });
      toast.success('Successfully deleted group');
    },
    undefined,
    'Failed to delete group'
  );
};
