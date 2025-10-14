import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import type { UseInstitutionRegisterMemberFormReturnType } from './use-form';
import { handleApiRequest } from '@/common/type/state.type';
import type { AuthUser } from '@/controller/auth/type/user.type';
import { InstitutionController } from '@/controller/institution/institution.controller';
import { UserRole } from '@/controller/profile/enum/user-role.enum';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';

export type UseInstitutionMembersReturnType = ReturnType<
  typeof useInstitutionMembers
>;

export default function useInstitutionMembers(
  registerRole: UserRole,
  useInstitutionRegisterMemberForm: UseInstitutionRegisterMemberFormReturnType
) {
  const router = useRouter();

  const { users } = useMain();

  const { selectedInstitution, setSelectedInstitution } = useDashboard();

  const { formData, setFormData } = useInstitutionRegisterMemberForm;

  const [existingUser, setExistingUser] = useState<AuthUser | null>(null);
  const [isUploadingMembers, setIsUploadingMembers] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  const controller = InstitutionController.getInstance();

  // refetch users and update institution's athletes or trainers
  useEffect(() => {
    if (
      !formData.displayName ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setIsUploadingMembers(false);
      return;
    }

    const user = users?.find((user) => user.email === formData.email);

    setFormData({
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
    });

    if (!user || !selectedInstitution) {
      setIsUploadingMembers(false);
      return;
    }

    if (registerRole === UserRole.TRAINER) {
      handleApiRequest(
        router,
        () =>
          controller.addTrainer(selectedInstitution.id, {
            userId: user.uid,
          }),
        () => {
          setSelectedInstitution((prev) => {
            if (!prev) return prev;

            const updatedTrainerIds = prev.trainerIds
              ? [...prev.trainerIds, user.uid]
              : [user.uid];

            const updatedTrainers = prev.trainers
              ? [...prev.trainers, user]
              : [user];

            return {
              ...prev,
              trainers: updatedTrainers,
              trainerIds: updatedTrainerIds,
            };
          });

          toast.success('Successfully added trainer');
        },
        undefined,
        'Failed to register trainer'
      );
    } else if (registerRole === UserRole.ATHLETE) {
      handleApiRequest(
        router,
        () =>
          controller.addAthlete(selectedInstitution.id, {
            userId: user.uid,
          }),
        () => {
          setSelectedInstitution((prev) => {
            if (!prev) return prev;

            const updatedAthleteIds = prev.athleteIds
              ? [...prev.athleteIds, user.uid]
              : [user.uid];

            const updatedAthletes = prev.athletes
              ? [...prev.athletes, user]
              : [user];

            return {
              ...prev,
              athletes: updatedAthletes,
              athleteIds: updatedAthleteIds,
            };
          });

          toast.success('Successfully added athlete');
        },
        undefined,
        'Failed to register athlete'
      );
    }

    setIsUploadingMembers(false);
  }, [users]);

  return {
    existingUser,
    setExistingUser,
    isUploadingMembers,
    setIsUploadingMembers,
    openModal,
    setOpenModal,
  };
}
