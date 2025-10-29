import Papa from 'papaparse';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import type { IFormData } from './use-register-member-form.hook';
import useRegisterMemberForm from './use-register-member-form.hook';
import { AuthController } from '@/core/auth/auth.controller';
import type { AuthUser } from '@/core/auth/type/user.type';
import { core } from '@/core/core.service';
import { InstitutionController } from '@/core/institution/institution.controller';
import { Gender } from '@/core/profile/enum/gender.enum';
import { SportLevel } from '@/core/profile/enum/sport-level.enum';
import { UserRole } from '@/core/profile/enum/user-role.enum';
import { ProfileController } from '@/core/profile/profile.controller';
import type { ImportProfile } from '@/core/profile/type/user.type';
import { lib } from '@/lib';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';

export type IInstitutionMembersHook = ReturnType<typeof useInstitutionMembers>;

export default function useInstitutionMembers() {
  const { users, profiles, setProfiles } = useMain();
  const { isFormEmpty, setFormData, formData, resetForm } =
    useRegisterMemberForm();

  const {
    selectedInstitution,
    selectedGroup,
    setSelectedGroup,
    setSelectedInstitution,
    setUsers,
  } = useDashboard();

  const [existingUser, setExistingUser] = useState<AuthUser | null>(null);
  const [isUploadingMembers, setIsUploadingMembers] = useState(false);
  const [openModal, setOpenModal] = useState(false);

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

  async function removeUser(userId: string) {
    if (!selectedInstitution) return;

    const controller = InstitutionController.getInstance();
    const institutionId = selectedInstitution!.id;

    const user = users?.find((user) => user.uid === userId);
    if (!user) return;

    const role = user.customClaims.role[0];

    const prevState = {
      institution: structuredClone(selectedInstitution),
      group: selectedGroup ? structuredClone(selectedGroup) : null,
      users: structuredClone(users || []),
      profiles: structuredClone(profiles || []),
    };

    await lib.common.generic.optimisticUpdate(
      () => {
        const newGroups = selectedInstitution.groups?.map((group) => {
          if (!group.membersIds.includes(userId)) return group;
          return {
            ...group,
            membersIds: group.membersIds.filter((id) => id !== userId),
            members: (group.members || []).filter(
              (member) => member.uid !== userId
            ),
          };
        });

        if (role === UserRole.TRAINER)
          setSelectedInstitution((prev) => ({
            ...prev!,
            groups: newGroups,
            trainers: prev!.trainers?.filter(
              (trainer) => trainer.uid !== userId
            ),
            trainerIds: prev!.trainerIds?.filter((id) => id !== userId),
          }));
        else if (role === UserRole.ATHLETE)
          setSelectedInstitution((prev) => ({
            ...prev!,
            groups: newGroups,
            athletes: prev!.athletes?.filter(
              (athlete) => athlete.uid !== userId
            ),
            athleteIds: prev!.athleteIds?.filter((id) => id !== userId),
          }));

        setSelectedGroup((prev) =>
          !prev
            ? prev
            : {
                ...prev,
                membersIds: prev.membersIds.filter((id) => id !== userId),
                members: (prev.members || []).filter(
                  (member) => member.uid !== userId
                ),
              }
        );
      },
      (snapshot) => {
        setSelectedInstitution(snapshot.institution);
        setSelectedGroup(snapshot.group);
        setUsers(snapshot.users);
        setProfiles(snapshot.profiles);
      },
      async () => {
        if (role === UserRole.TRAINER)
          await controller.removeTrainer(institutionId, { userId });
        else if (role === UserRole.ATHLETE)
          await controller.removeAthlete(institutionId, { userId });
      },
      prevState
    );
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

      setUsers((prev) => [...prev, user]);
      setProfiles((prev) => [...prev, core.profile.userToProfile(user)]);
    } catch (e) {
      console.error(e);
      toast.error('An error occurred while registering the user');
    } finally {
      setIsUploadingMembers(false);
    }
  }

  async function uploadUsers(file: File) {
    setIsUploadingMembers(true);

    let result: AuthUser[] = [];

    Papa.parse<ImportProfile>(file, {
      header: true,
      skipEmptyLines: true,
      error: (e: Error) =>
        toast.error(`Failed to parse CSV file: ${e.message}`),
      transform: (value, column: keyof ImportProfile) => {
        switch (column) {
          case 'email':
            value = value.trim().toLowerCase();
            break;
          case 'password':
            value = value.trim();
            break;
          case 'displayName':
            value = value.trim();
            break;
          case 'photoURL':
            value = value.trim();
            break;
          case 'role':
            value = value.trim().toLowerCase();
            if (
              ![UserRole.ATHLETE, UserRole.TRAINER].includes(value as UserRole)
            )
              value = UserRole.ATHLETE;

            break;
          case 'level':
            value = value.trim().toLowerCase();
            if (
              ![
                SportLevel.BEGINNER,
                SportLevel.INTERMEDIATE,
                SportLevel.ADVANCED,
              ].includes(value as SportLevel)
            )
              value = SportLevel.BEGINNER;
            break;
          case 'gender':
            value = value.trim().toLowerCase();
            if (value && ![Gender.M, Gender.F].includes(value as Gender))
              value = Gender.M;
            break;
          case 'birthDate':
            value = value.trim();
            if (value && isNaN(new Date(value).getTime())) value = '';
            break;
        }

        return value;
      },
      complete: async (results) => {
        results.data.pop();

        // validate rows
        const errors: { row: number; message: string }[] = [];
        results.data.forEach((r) => {
          const row = results.data.indexOf(r) + 2;
          if (!r.email) errors.push({ row, message: 'Missing email' });
          if (!r.password) errors.push({ row, message: 'Missing password' });
          if (!r.displayName) errors.push({ row, message: 'Missing name' });
          if (!r.role) errors.push({ row, message: 'Missing role' });
        });

        if (errors.length) {
          toast.error(
            `Errors in CSV file:\n${errors
              .map((e) => `Row ${e.row}: ${e.message}`)
              .join('\n')}`
          );

          setIsUploadingMembers(false);
          return;
        }

        const data: ImportProfile[] = results.data.map((r) => ({
          email: r.email,
          password: r.password,
          displayName: r.displayName,
          photoURL: r.photoURL,
          role: r.role,
          sport: r.sport || undefined,
          level: r.level || undefined,
          gender: r.gender || undefined,
          birthDate: r.birthDate ? new Date(r.birthDate) : undefined,
        }));

        try {
          const response = await ProfileController.getInstance().importProfiles(
            { profiles: data }
          );

          result = response.successful || [];

          setUsers((prev) => [...prev, ...result]);
          setProfiles((prev) => [
            ...prev,
            ...(response.successful || []).map((u) =>
              core.profile.userToProfile(u)
            ),
          ]);

          const athletes = result.filter(
            (u) => u.customClaims.role[0] === UserRole.ATHLETE
          );

          const trainers = result.filter(
            (u) => u.customClaims.role[0] === UserRole.TRAINER
          );

          const athleteIds = athletes.map((u) => u.uid);
          const trainerIds = trainers.map((u) => u.uid);

          // update selected institution
          setSelectedInstitution((prev) =>
            !prev
              ? prev
              : {
                  ...prev,
                  athletes: [...(prev.athletes || []), ...athletes],
                  athleteIds: [...(prev.athleteIds || []), ...athleteIds],
                  trainers: [...(prev.trainers || []), ...trainers],
                  trainerIds: [...(prev.trainerIds || []), ...trainerIds],
                }
          );

          toast.success(`Sueccessfully registered ${result.length} users`);
          if (response.errors?.length) {
            console.error('Errors during bulk user import:', response.errors);
            toast.error(
              `Failed to register some users. See console for details.`
            );
          }
        } catch (e) {
          toast.error(`Failed to register users: ${(e as Error).message}`);
        } finally {
          setIsUploadingMembers(false);
        }
      },
    });

    return result;
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
    removeUser,
    uploadUsers,
  };
}
