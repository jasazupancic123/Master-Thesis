import { useEffect, useState } from 'react';

import type { AuthUser } from '@/core/auth/type/user.type';
import { useDashboard } from '@/store/dashboard.provider';

export type UseDashboardGroupsMembersUsersReturnType = ReturnType<
  typeof useDashboardGroupsMembersUsers
>;

export default function useDashboardGroupsMembersUsers() {
  const { selectedGroup } = useDashboard();

  const [filteredUsers, setFilteredUsers] = useState<AuthUser[]>([]);
  const [hoveredUser, setHoveredUser] = useState<AuthUser | null>(null);
  const [editUser, setEditUser] = useState<AuthUser | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!selectedGroup) {
      setFilteredUsers([]);
      setSearch('');
      return;
    }

    setFilteredUsers(selectedGroup.members || []);
    setSearch('');
  }, [selectedGroup]);

  return {
    filteredUsers,
    setFilteredUsers,
    hoveredUser,
    setHoveredUser,
    editUser,
    setEditUser,
    search,
    setSearch,
  };
}
