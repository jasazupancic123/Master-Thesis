import { handleApiRequest } from '@/common/type/state.type';
import { GroupController } from '@/controller/group/group.controller';
import { UseDashboardReturnType } from '@/store/dashboard.provider';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import toast from 'react-hot-toast';

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

  const {
    selectedGroup,
    setSelectedGroup,
    selectedInstitution,
    setSelectedInstitution,
  } = useDashboard;

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
