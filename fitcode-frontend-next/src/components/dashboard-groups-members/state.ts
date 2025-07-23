import { BACKEND_API_BASE_URL } from '@/common/constant/api.constant';
import { handleApiRequest, SetState } from '@/common/type/state.type';
import { Institution } from '@/controller/institution/type/institution.type';
import { User, UserEntity } from '@/controller/user/type/user.type';
import { UserController } from '@/controller/user/user.controller';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import toast from 'react-hot-toast';

export const updateUserProfile = async (input: {
  editUser: User | null;
  router: AppRouterInstance;
  selectedInstitution: Institution | null;
  profile: UserEntity | undefined;
  setModal: SetState<{
    add_member: boolean;
    add_trainer: boolean;
    add_group: boolean;
    edit_athlete: boolean;
  }>;
  setEditedProfile: SetState<boolean>;
  setEditUser: SetState<User | null>;
  refetchMembers: (url?: string) => void;
}) => {
  const {
    editUser,
    router,
    selectedInstitution,
    profile,
    setModal,
    setEditedProfile,
    setEditUser,
    refetchMembers,
  } = input;

  if (!editUser || !profile) return;
  handleApiRequest(
    router,
    () =>
      UserController.updateProfile({
        ...profile,
        userId: editUser.uid,
      }),
    () => {
      refetchMembers(
        selectedInstitution
          ? `${BACKEND_API_BASE_URL}/institution/${selectedInstitution.id}/find/all`
          : undefined
      );

      setModal((prev) => ({ ...prev, edit_athlete: false }));
      setEditedProfile(false);
      setEditUser(null);

      toast.success('Successfully updated user profile');
    },
    undefined,
    'Failed to update user profile'
  );
};
