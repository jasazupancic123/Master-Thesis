import { useEffect, useState } from 'react';
import useInstitutionMembers from '../../dashboard/hooks/use-institution-members.hook';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';
import { AuthUser } from '@/core/auth/type/user.type';
import { UserRole } from '@/core/profile/enum/user-role.enum';
import toast from 'react-hot-toast';

export default function useCsvMembersUpload() {
  const { users } = useMain();
  const { selectedInstitution } = useDashboard();

  const { setIsUploadingMembers } = useInstitutionMembers();

  const [csvUserEmails, setCsvUserEmails] = useState<string[]>([]);

  useEffect(() => {
    if (!selectedInstitution || !csvUserEmails.length) return;

    const newUsers = [] as AuthUser[];
    for (const email of csvUserEmails) {
      if (!email) continue;

      const user = users.find((user) => user.email === email.toLowerCase());
      if (!user) continue;
      newUsers.push(user);
    }

    const athletes = newUsers
      .filter((user) => user.customClaims.role.includes(UserRole.ATHLETE))
      .filter((user) => !selectedInstitution?.athleteIds?.includes(user.uid));

    const trainers = newUsers
      .filter((user) => user.customClaims.role.includes(UserRole.TRAINER))
      .filter((user) => !selectedInstitution?.trainerIds?.includes(user.uid));

    if (!trainers.length && !athletes.length) {
      toast.error('No new users to add');

      setCsvUserEmails([]);
      setIsUploadingMembers(false);
      return;
    }

    toast.success('Successfully added users');
    setCsvUserEmails([]);
    setIsUploadingMembers(false);
  }, [users]);

  return {
    setCsvUserEmails,
  };
}
