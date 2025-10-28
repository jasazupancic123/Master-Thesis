import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { useDashboardUserEdit } from '../context/user-edit.context';
import type { IFormData } from './use-register-member-form.hook';
import useRegisterMemberForm from './use-register-member-form.hook';
import { AuthController } from '@/core/auth/auth.controller';
import type { AuthUser } from '@/core/auth/type/user.type';
import { GroupController } from '@/core/group/group.controller';
import { InstitutionController } from '@/core/institution/institution.controller';
import { UserRole } from '@/core/profile/enum/user-role.enum';
import type { Profile } from '@/core/profile/type/user.type';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';

export type IInstitutionMembersHook = ReturnType<typeof useInstitutionMembers>;

export default function useInstitutionMembers() {
  const { isFormEmpty, setFormData, formData, resetForm } =
    useRegisterMemberForm();
  const { users } = useMain();
  const { setFilteredUsers } = useDashboardUserEdit();
  const {
    selectedGroup,
    selectedInstitution,
    setSelectedInstitution,
    setUsers,
    setMembers,
  } = useDashboard();

  const [existingUser, setExistingUser] = useState<AuthUser | null>(null);
  const [isUploadingMembers, setIsUploadingMembers] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  // refetch users and update institution's athletes or trainers
  useEffect(() => {
    if (isFormEmpty()) return setIsUploadingMembers(false);

    const user = users?.find((user) => user.email === formData.email);
    resetForm();

    if (!user || !selectedInstitution) return setIsUploadingMembers(false);
    addUser(user).then();
  }, [users]);

  async function addUser(user: AuthUser | null) {
    if (!user || !selectedInstitution) return;

    const controller = InstitutionController.getInstance();
    const institutionId = selectedInstitution!.id;
    const userId = user!.uid;

    const role = user.customClaims.role[0];
    try {
      if (role === UserRole.TRAINER) {
        await controller.addTrainer(institutionId, { userId });

        setSelectedInstitution((prev) => ({
          ...prev!,
          trainers: prev!.trainers ? [...prev!.trainers, user] : [user],
          trainerIds: prev!.trainerIds
            ? [...prev!.trainerIds, user.uid]
            : [user.uid],
        }));
      } else if (role === UserRole.ATHLETE) {
        await controller.addAthlete(institutionId, { userId });

        setSelectedInstitution((prev) => ({
          ...prev!,
          athletes: prev!.athletes ? [...prev!.athletes, user] : [user],
          athleteIds: prev!.athleteIds
            ? [...prev!.athleteIds, user.uid]
            : [user.uid],
        }));
      }

      toast.success('Successfully added user');
    } catch (e) {
      console.error(e);
      toast.error('An error occurred while adding the user');
    } finally {
      setIsUploadingMembers(false);
    }
  }

  async function registerUser(registerRole: UserRole, formData: IFormData) {
    if (!selectedInstitution) return;
    setFormData(formData);

    const { displayName, email, password, confirmPassword } = formData;

    if (password !== confirmPassword)
      return toast.error('Passwords do not match');

    const exists =
      registerRole === UserRole.ATHLETE
        ? selectedInstitution?.athletes?.some(
            (athlete) => athlete.email === email
          )
        : selectedInstitution?.trainers?.some(
            (trainer) => trainer.email === email
          );

    if (exists)
      return toast.error(
        `User with email ${email} is already registered as a ${registerRole}.`
      );

    const existingUser = users?.find((user) => user.email === email);
    if (existingUser) {
      setExistingUser(existingUser);
      setOpenModal(true);
      return;
    }

    setIsUploadingMembers(true);

    try {
      const user = await AuthController.getInstance().registerUser({
        displayName,
        email,
        password,
        role: registerRole,
      });

      const profile: Profile = {
        uid: user.uid,
        email: user.email!,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setUsers((prev) => [...prev, user]);
      setMembers((prev) => [...prev, profile]);
    } catch (e) {
      console.error(e);
      toast.error('An error occurred while registering the user');
    } finally {
      setIsUploadingMembers(false);
    }
  }

  async function removeAthleteFromGroup(userId: string) {
    if (!selectedGroup) return;
    const groupId = selectedGroup.id;

    try {
      await GroupController.getInstance().removeMember(groupId, { userId });
      toast.success('Member removed successfully');
    } catch (e) {
      console.error(e);
      toast.error('Failed to remove member from group');
    } finally {
      setFilteredUsers((prev) => prev.filter((m) => m.uid !== userId));
      setSelectedInstitution((prev) => {
        if (!prev) return null;
        const updatedGroups = prev.groups.map((g) =>
          g.id !== groupId
            ? g
            : {
                ...g,
                members: g.members?.filter((m) => m.uid !== userId),
                membersIds: g.membersIds.filter((uid) => uid !== userId),
              }
        );

        return { ...prev, groups: updatedGroups };
      });
    }
  }

  return {
    existingUser,
    setExistingUser,
    isUploadingMembers,
    setIsUploadingMembers,
    openModal,
    setOpenModal,
    registerUser,
    addUser,
    removeAthleteFromGroup,
  };
}
