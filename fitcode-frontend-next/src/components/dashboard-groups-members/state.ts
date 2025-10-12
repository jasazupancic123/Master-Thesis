import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import toast from 'react-hot-toast';

import { BACKEND_API_BASE_URL } from '@/common/constant/api.constant';
import type { SetState } from '@/common/type/state.type';
import { handleApiRequest } from '@/common/type/state.type';
import { AuthController } from '@/controller/auth/auth.controller';
import type { AuthUser } from '@/controller/auth/type/user.type';
import type { Institution } from '@/controller/institution/type/institution.type';
import { ProfileController } from '@/controller/profile/profile.controller';
import type { Profile } from '@/controller/profile/type/user.type';

export const updateUserProfile = async (input: {
  router: AppRouterInstance;
  userToEdit: AuthUser | null;
  isEditedUser?: boolean;
  isEditedProfile?: boolean;
  selectedInstitution: Institution | null;
  profileToEdit: Profile | undefined;
  setIsEditedProfile: SetState<boolean>;
  setUserToEdit: SetState<AuthUser | null>;
  setIsEditedUser: SetState<boolean>;
  refetchMembers: (url?: string) => void;
  refetchUsers: () => void;
  setModal: SetState<{
    add_member: boolean;
    add_trainer: boolean;
    add_group: boolean;
    add_member_via_csv: boolean;
    edit_athlete: boolean;
  }>;
}) => {
  const {
    userToEdit,
    router,
    selectedInstitution,
    profileToEdit,
    setModal,
    isEditedUser,
    setIsEditedProfile,
    setUserToEdit,
    refetchMembers,
    refetchUsers,
  } = input;

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
      setModal((prev) => ({ ...prev, edit_athlete: false }));
      setIsEditedProfile(false);
      setUserToEdit(null);
      toast.success('Successfully updated user profile');
    },
    undefined,
    'Failed to update user profile'
  );
};
