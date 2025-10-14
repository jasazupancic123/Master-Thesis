import { UseDashboardReturnType } from '@/store/dashboard.provider';
import { UseInstitutionRegisterMemberFormReturnType } from '../hooks/use-form';
import { UseInstitutionMembersReturnType } from '../hooks/use-institution-members';
import toast from 'react-hot-toast';
import { UserRole } from '@/controller/profile/enum/user-role.enum';
import { MainProviderReturnType } from '@/store/main.provider';
import { handleApiRequest } from '@/common/type/state.type';
import { BACKEND_API_BASE_URL } from '@/common/constant/api.constant';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { FirebaseFunctionsUtil } from '@/common/firebase/firebase-functions.util';

export const handleChange = (
  input: { e: React.ChangeEvent<HTMLInputElement> },
  context: {
    useInstitutionRegisterMemberForm: UseInstitutionRegisterMemberFormReturnType;
  }
) => {
  const { e } = input;

  const { useInstitutionRegisterMemberForm } = context;

  const { name, value } = e.target;

  const { setFormData } = useInstitutionRegisterMemberForm;

  setFormData((prev) => ({ ...prev, [name]: value }));
};

export const handleSubmit = (
  input: {
    e: React.FormEvent;
    registerRole: UserRole;
    router: AppRouterInstance;
    firebaseFunctions: FirebaseFunctionsUtil;
  },
  context: {
    useMain: MainProviderReturnType;
    useDashboard: UseDashboardReturnType;
    useInstitutionMembers: UseInstitutionMembersReturnType;
    useInstitutionRegisterMemberForm: UseInstitutionRegisterMemberFormReturnType;
  }
) => {
  const { e, registerRole, router, firebaseFunctions } = input;

  const {
    useMain,
    useDashboard,
    useInstitutionMembers,
    useInstitutionRegisterMemberForm,
  } = context;

  const { users } = useMain;

  const { selectedInstitution, refetchUsers, refetchMembers } = useDashboard;

  const { setExistingUser, setOpenModal, setIsUploadingMembers } =
    useInstitutionMembers;

  const { formData } = useInstitutionRegisterMemberForm;

  if (!selectedInstitution) return;

  e.preventDefault();

  if (formData.password !== formData.confirmPassword) {
    toast.error('Passwords do not match');
    return;
  }

  const formInput = {
    displayName: formData.displayName,
    email: formData.email,
    password: formData.password,
    role: registerRole,
  };

  const userAlreadyInInstitution =
    registerRole === UserRole.ATHLETE
      ? selectedInstitution?.athletes?.some(
          (athlete) => athlete.email === formInput.email
        )
      : selectedInstitution?.trainers?.some(
          (trainer) => trainer.email === formInput.email
        );

  if (userAlreadyInInstitution) {
    toast.error(
      `User with email ${formInput.email} is already registered as a ${registerRole}.`
    );
    return;
  }

  const existingUser = users?.find((user) => user.email === formInput.email);

  if (existingUser) {
    setExistingUser(existingUser);
    setOpenModal(true);
    return;
  }

  setIsUploadingMembers(true);

  handleApiRequest(
    router,
    () => firebaseFunctions.createUserWithRole(formInput),
    () => {
      refetchMembers(
        `${BACKEND_API_BASE_URL}/institution/${selectedInstitution.id}/find/all`
      );
      refetchUsers();
    },
    () => {
      setIsUploadingMembers(false);
    },
    'Failed to register user'
  );
};
