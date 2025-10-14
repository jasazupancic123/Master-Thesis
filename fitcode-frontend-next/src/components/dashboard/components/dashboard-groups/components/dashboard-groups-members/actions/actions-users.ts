import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import toast from 'react-hot-toast';

import type { UseDashboardGroupsMembersUsersReturnType } from '../hooks/use-users';
import { BACKEND_API_BASE_URL } from '@/common/constant/api.constant';
import type { SetState } from '@/common/type/state.type';
import { handleApiRequest } from '@/common/type/state.type';
import { AuthController } from '@/controller/auth/auth.controller';
import type { AuthUser } from '@/controller/auth/type/user.type';
import type { GroupController } from '@/controller/group/group.controller';
import { ProfileController } from '@/controller/profile/profile.controller';
import type { Profile } from '@/controller/profile/type/user.type';
import type { UseDashboardReturnType } from '@/store/dashboard.provider';

export const handleRemoveAthleteFromGroup = async (
  input: {
    userId: string;
    router: AppRouterInstance;
    controller: GroupController;
  },
  context: {
    useDashboard: UseDashboardReturnType;
    useDashboardGroupsMembersUsers: UseDashboardGroupsMembersUsersReturnType;
  }
) => {
  const { userId, router, controller } = input;

  const { useDashboard, useDashboardGroupsMembersUsers } = context;

  const { selectedGroup, setSelectedInstitution, setDetectedChanges } =
    useDashboard;

  const { setFilteredUsers } = useDashboardGroupsMembersUsers;

  if (!selectedGroup) return;

  await handleApiRequest(
    router,
    () =>
      controller.removeMember(selectedGroup!.id, {
        userId: userId,
      }),
    () => {
      toast.success('Member removed successfully');
    },
    (e) => {
      toast.error((e as Error).message);
    }
  );

  setFilteredUsers((prev) => prev.filter((m) => m.uid !== userId));
  setSelectedInstitution((prev) => {
    if (!prev) return null;
    const updatedGroups = prev.groups.map((g) => {
      if (g.id === selectedGroup?.id) {
        return {
          ...g,
          members: g.members?.filter((m) => m.uid !== userId),
          membersIds: g.membersIds.filter((uid) => uid !== userId),
        };
      }
      return g;
    });
    return {
      ...prev,
      groups: updatedGroups,
    };
  });
  setDetectedChanges(true);
};

export const updateUserProfile = async (
  input: {
    router: AppRouterInstance;
    userToEdit: AuthUser | null;
    isEditedUser?: boolean;
    isEditedProfile?: boolean;
    profileToEdit: Profile | undefined;
    setIsEditedProfile: SetState<boolean>;
    setUserToEdit: SetState<AuthUser | null>;
    setOpenModal: SetState<boolean>;
  },
  context: {
    useDashboard: UseDashboardReturnType;
  }
) => {
  const { useDashboard } = context;

  const {
    userToEdit,
    router,
    profileToEdit,
    isEditedUser,
    setIsEditedProfile,
    setUserToEdit,
    setOpenModal,
  } = input;

  const { selectedInstitution, refetchMembers, refetchUsers } = useDashboard;

  const authController = AuthController.getInstance();
  const profileController = ProfileController.getInstance();

  handleApiRequest(
    router,
    async () => {
      if (profileToEdit)
        await profileController.update({
          level: profileToEdit.level,
          sport: profileToEdit.sport,
          birthDate: profileToEdit.birthDate,
          gender: profileToEdit.gender,
          userId: profileToEdit.uid,
        });

      if (userToEdit && isEditedUser)
        await authController.updateUser(userToEdit.uid, {
          displayName: userToEdit.displayName,
          photoURL: userToEdit.photoURL,
        });

      refetchUsers();
      refetchMembers(
        selectedInstitution
          ? `${BACKEND_API_BASE_URL}/institution/${selectedInstitution.id}/find/all`
          : undefined
      );
    },
    () => {
      setOpenModal(false);
      setIsEditedProfile(false);
      setUserToEdit(null);
      toast.success('Successfully updated user profile');
    },
    undefined,
    'Failed to update user profile'
  );
};
