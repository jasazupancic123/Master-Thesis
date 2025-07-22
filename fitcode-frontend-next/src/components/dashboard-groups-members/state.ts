import { BACKEND_API_BASE_URL } from '@/common/constant/api.constant';
import { handleApiRequest, SetState } from '@/common/type/state.type';
import { Institution } from '@/controller/institution/type/institution.type';
import { User } from '@/controller/user/type/user.type';
import { UserController } from '@/controller/user/user.controller';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import toast from 'react-hot-toast';

export const updateUserProfile = async (input: {
  editUser: User | null;
  editUserImageUrl: string | null;
  router: AppRouterInstance;
  selectedInstitution: Institution | null;
  setModal: SetState<{
    add_member: boolean;
    add_trainer: boolean;
    add_group: boolean;
    edit_athlete: boolean;
  }>;
  setEditUserImageUrl: (url: string | null) => void;
  setEditUser: (user: User | null) => void;
  refetchMembers: (url?: string) => void;
}) => {
  const {
    editUser,
    editUserImageUrl,
    router,
    selectedInstitution,
    setModal,
    setEditUserImageUrl,
    setEditUser,
    refetchMembers,
  } = input;

  if (!editUser || !editUserImageUrl) return;
  handleApiRequest(
    router,
    () =>
      UserController.updateProfile({
        profileImageUrl: editUserImageUrl,
        userId: editUser.uid,
      }),
    () => {
      refetchMembers(
        selectedInstitution
          ? `${BACKEND_API_BASE_URL}/institution/${selectedInstitution.id}/find/all`
          : undefined
      );

      setModal((prev) => ({ ...prev, edit_athlete: false }));
      setEditUserImageUrl(null);
      setEditUser(null);

      toast.success('Successfully updated user profile');
    },
    undefined,
    'Failed to update user profile'
  );
};
