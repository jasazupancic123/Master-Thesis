'use client';

import { notFound, usePathname } from 'next/navigation';

import type { GroupIdPageProps } from '@/app/(trainer)/groups/[group_id]/props';
import { TrainingService } from '@/core/training/training.service';
import { GroupProvider } from '@/store/group.provider';
import { useMain } from '@/store/main.provider';

export default function GroupInitializer({
  children,
}: React.PropsWithChildren) {
  const pathname = usePathname();
  const { exercises, groups, institution, trainings } = useMain();

  const groupId = pathname.split('/')[2];
  const group = groups.find((g) => g.id === groupId);
  if (!group || group.institutionId !== institution.id) return notFound();

  const filteredTrainings = trainings.data
    .filter((t) => t.groupId === group.id)
    .map((t) => TrainingService.mapData(t, { exercises }));

  const state: GroupIdPageProps = {
    group,
    institution,
    trainings: filteredTrainings,
  };

  return <GroupProvider {...state}>{children}</GroupProvider>;
}
