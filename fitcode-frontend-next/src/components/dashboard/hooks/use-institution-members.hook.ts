import Papa from 'papaparse';
import { useState } from 'react';
import toast from 'react-hot-toast';

import type { IFormData } from './use-register-member-form.hook';
import useRegisterMemberForm from './use-register-member-form.hook';
import { InstitutionController } from '@/core/institution/institution.controller';
import { Gender } from '@/core/user/enum/gender.enum';
import { SportLevel } from '@/core/user/enum/sport-level.enum';
import { UserRole } from '@/core/user/enum/user-role.enum';
import type { ImportUser, User } from '@/core/user/type/user.type';
import { UserController } from '@/core/user/user.controller';
import { lib } from '@/lib';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';

export type IInstitutionMembersHook = ReturnType<typeof useInstitutionMembers>;

export default function useInstitutionMembers() {
  const { users, setUsers, institution, setInstitution } = useMain();
  const { setFormData } = useRegisterMemberForm();

  const [existingUser, setExistingUser] = useState<User | null>(null);
  const [isUploadingMembers, setIsUploadingMembers] = useState(false);
  const [openUserAlreadyExistsModal, setOpenUserAlreadyExistsModal] =
    useState(false);

  async function addUser(user: User | null) {
    if (!user) return;

    const controller = InstitutionController.getInstance();
    const institutionId = institution.id;
    const userId = user!.uid;

    const role = user.role;
    try {
      if (role === UserRole.TRAINER) {
        await controller.addTrainer(institutionId, { userId });

        setInstitution((prev) => ({
          ...prev!,
          trainers: prev!.trainers ? [...prev!.trainers, user] : [user],
          members: [...prev!.members, { id: user.uid, role: UserRole.TRAINER }],
        }));
      } else if (role === UserRole.ATHLETE) {
        await controller.addAthlete(institutionId, { userId });

        setInstitution((prev) => ({
          ...prev!,
          athletes: prev!.athletes ? [...prev!.athletes, user] : [user],
          members: [...prev!.members, { id: user.uid, role: UserRole.ATHLETE }],
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
    const controller = InstitutionController.getInstance();
    const institutionId = institution!.id;

    const user = users?.data?.find((user) => user.uid === userId);
    if (!user) return;

    const role = user.role;

    const prevState = {
      institution: structuredClone(institution),
      users: structuredClone(users || []),
    };

    await lib.common.generic.optimisticUpdate(
      () => {
        const newGroups = institution.groups?.map((group) => {
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
          setInstitution((prev) => ({
            ...prev!,
            groups: newGroups,
            trainers: prev!.trainers?.filter(
              (trainer) => trainer.uid !== userId
            ),
            members: prev!.members.filter((member) => member.id !== userId),
          }));
        else if (role === UserRole.ATHLETE)
          setInstitution((prev) => ({
            ...prev!,
            groups: newGroups,
            athletes: prev!.athletes?.filter(
              (athlete) => athlete.uid !== userId
            ),
            members: prev!.members.filter((member) => member.id !== userId),
          }));
      },
      (snapshot) => {
        setInstitution(snapshot.institution);
        setUsers(snapshot.users);
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

  async function registerUser(
    registerRole: UserRole,
    formData: IFormData,
    file?: File
  ): Promise<boolean> {
    setFormData(formData);

    const { displayName, email, password, confirmPassword } = formData;

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }

    const exists =
      registerRole === UserRole.ATHLETE
        ? institution?.athletes?.some((athlete) => athlete.email === email)
        : institution?.trainers?.some((trainer) => trainer.email === email);

    if (exists) {
      toast.error(
        `User with email ${email} is already registered as a ${registerRole}.`
      );
      return false;
    }

    const existingUser = users?.data?.find((user) => user.email === email);
    if (existingUser) {
      setExistingUser(existingUser);
      setIsUploadingMembers(true);
      return true;
    }

    setIsUploadingMembers(true);

    try {
      const uploadedUser = await UserController.getInstance().register({
        displayName,
        email,
        password,
        role: registerRole,
      });

      let photoUrl = uploadedUser.photoURL || null;
      let photoURLBase64 = uploadedUser.photoURLBase64 || undefined;

      if (file) {
        const path = `user/${uploadedUser.uid}/${file.name}`;
        const { url: uploadedUrl, base64: uploadedBase64 } =
          await lib.firebase.storage.uploadFileWithBase64(file, path, {
            maxDimensionCrop: 300,
          });

        await UserController.getInstance().update(uploadedUser.uid, {
          photoURL: uploadedUrl,
          photoURLBase64: uploadedBase64,
        });
        photoUrl = uploadedUrl;
        photoURLBase64 = uploadedBase64;
      }

      const newUser: User = {
        ...uploadedUser,
        photoURL: photoUrl,
        photoURLBase64: photoURLBase64,
      };

      if (registerRole === UserRole.ATHLETE) {
        setInstitution((prev) => ({
          ...prev!,
          athletes: prev!.athletes ? [...prev!.athletes, newUser] : [newUser],
          members: [
            ...prev!.members,
            { id: newUser.uid, role: UserRole.ATHLETE },
          ],
        }));
      } else if (registerRole === UserRole.TRAINER) {
        setInstitution((prev) => ({
          ...prev!,
          trainers: prev!.trainers ? [...prev!.trainers, newUser] : [newUser],
          members: [
            ...prev!.members,
            { id: newUser.uid, role: UserRole.TRAINER },
          ],
        }));
      }

      setUsers((prev) => ({ ...prev, data: [...prev.data, newUser] }));
      toast.success('Successfully registered user');
    } catch (e) {
      console.error(e);
      toast.error('An error occurred while registering the user');
    } finally {
      setIsUploadingMembers(false);
    }

    return true;
  }

  async function uploadUsers(file: File) {
    setIsUploadingMembers(true);

    let result: User[] = [];

    Papa.parse<ImportUser>(file, {
      header: true,
      skipEmptyLines: true,
      error: (e: Error) =>
        toast.error(`Failed to parse CSV file: ${e.message}`),
      transform: (value, column: keyof ImportUser) => {
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

        const data: ImportUser[] = results.data.map((r) => ({
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
          const response = await UserController.getInstance().import({
            users: data,
          });

          result = response.successful || [];
          setUsers((prev) => ({ ...prev, data: [...prev.data, ...result] }));

          const athletes = result.filter((u) => u.role === UserRole.ATHLETE);
          const trainers = result.filter((u) => u.role === UserRole.TRAINER);

          // update selected institution
          setInstitution((prev) =>
            !prev
              ? prev
              : {
                  ...prev,
                  athletes: [...(prev.athletes || []), ...athletes],
                  trainers: [...(prev.trainers || []), ...trainers],
                  members: [
                    ...(prev.members || []),
                    ...athletes.map((a) => ({
                      id: a.uid,
                      role: UserRole.ATHLETE,
                    })),
                    ...trainers.map((t) => ({
                      id: t.uid,
                      role: UserRole.TRAINER,
                    })),
                  ],
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
    openUserAlreadyExistsModal,
    setOpenUserAlreadyExistsModal,
    registerUser,
    addUser,
    removeUser,
    uploadUsers,
  };
}
