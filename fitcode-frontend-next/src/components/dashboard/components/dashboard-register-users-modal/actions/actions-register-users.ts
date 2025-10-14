import { UserRole } from '@/controller/profile/enum/user-role.enum';
import { UseInstitutionMembersReturnType } from '../hooks/use-institution-members';
import { UseDashboardReturnType } from '@/store/dashboard.provider';
import { handleApiRequest } from '@/common/type/state.type';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { InstitutionController } from '@/controller/institution/institution.controller';
import toast from 'react-hot-toast';
import { UseInstitutionRegisterMemberFormReturnType } from '../hooks/use-form';

export const handleAddExistingUser = (
  input: {
    registerRole: UserRole;
    router: AppRouterInstance;
    controller: InstitutionController;
  },
  context: {
    useDashboard: UseDashboardReturnType;
    useInstitutionMembers: UseInstitutionMembersReturnType;
    useInstitutionRegisterMemberForm: UseInstitutionRegisterMemberFormReturnType;
  }
) => {
  const { registerRole, router, controller } = input;

  const {
    useDashboard,
    useInstitutionMembers,
    useInstitutionRegisterMemberForm,
  } = context;

  const { existingUser, setExistingUser, setOpenModal } = useInstitutionMembers;

  const { selectedInstitution, setSelectedInstitution } = useDashboard;

  const { setFormData } = useInstitutionRegisterMemberForm;

  if (!existingUser || !selectedInstitution) return;

  if (registerRole === UserRole.TRAINER) {
    handleApiRequest(
      router,
      () =>
        controller.addTrainer(selectedInstitution.id, {
          userId: existingUser.uid,
        }),
      () => {
        setSelectedInstitution((prev) => {
          if (!prev) return prev;

          const updatedTrainerIds = prev.trainerIds
            ? [...prev.trainerIds, existingUser.uid]
            : [existingUser.uid];

          const updatedTrainers = prev.trainers
            ? [...prev.trainers, existingUser]
            : [existingUser];

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
          userId: existingUser.uid,
        }),
      () => {
        setSelectedInstitution((prev) => {
          if (!prev) return prev;

          const updatedAthleteIds = prev.athleteIds
            ? [...prev.athleteIds, existingUser.uid]
            : [existingUser.uid];

          const updatedAthletes = prev.athletes
            ? [...prev.athletes, existingUser]
            : [existingUser];

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

  setOpenModal(false);
  setExistingUser(null);
  setFormData({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
};
