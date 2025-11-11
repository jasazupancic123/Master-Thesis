import { useEffect, useState } from 'react';

import type { Group } from '@/core/group/type/group.type';
import { useMain } from '@/store/main.provider';

export default function useDashboardGroupView() {
  const { groups } = useMain();

  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [openAddGroupModal, setOpenAddGroupModal] = useState(false);

  useEffect(() => {
    if (!selectedGroup && groups.length > 0) {
      setSelectedGroup(groups[0]);
      return;
    }

    setSelectedGroup(
      groups.find((group) => group.id === selectedGroup?.id) || null
    );
  }, [groups, selectedGroup]);

  return {
    selectedGroup,
    setSelectedGroup,
    openAddGroupModal,
    setOpenAddGroupModal,
  };
}
