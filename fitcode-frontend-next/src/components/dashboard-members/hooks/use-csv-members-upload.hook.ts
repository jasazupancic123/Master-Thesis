import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import useInstitutionMembers from '../../dashboard/hooks/use-institution-members.hook';
import { UserRole } from '@/core/user/enum/user-role.enum';
import type { User } from '@/core/user/type/user.type';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';

export default function useCsvMembersUpload() {
  const { users } = useMain();
  const { selectedInstitution } = useDashboard();

  const { setIsUploadingMembers } = useInstitutionMembers();

  const [csvUserEmails, setCsvUserEmails] = useState<string[]>([]);

  useEffect(() => {
    if (!selectedInstitution || !csvUserEmails.length) return;

    const newUsers = [] as User[];
    for (const email of csvUserEmails) {
      if (!email) continue;

      const user = users.data.find(
        (user) => user.email === email.toLowerCase()
      );

      if (!user) continue;
      newUsers.push(user);
    }

    const athletes = newUsers
      .filter((user) => user.role.includes(UserRole.ATHLETE))
      .filter(
        (user) =>
          !selectedInstitution?.members
            .filter((m) => m.role === UserRole.ATHLETE)
            .map((m) => m.id)
            .includes(user.uid)
      );

    const trainers = newUsers
      .filter((user) => user.role.includes(UserRole.TRAINER))
      .filter(
        (user) =>
          !selectedInstitution?.members
            .filter((m) => m.role === UserRole.TRAINER)
            .map((m) => m.id)
            .includes(user.uid)
      );

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
