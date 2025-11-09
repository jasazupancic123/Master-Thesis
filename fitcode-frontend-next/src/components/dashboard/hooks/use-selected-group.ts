import { Group } from '@/core/group/type/group.type';
import { useMain } from '@/store/main.provider';
import { useEffect, useState } from 'react';

export default function useDashboardSelectedGroup() {
  const { groups } = useMain();

  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

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
  };
}
