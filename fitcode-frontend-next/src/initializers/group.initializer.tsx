'use client';

import { notFound, usePathname } from 'next/navigation';

import type { GroupIdPageProps } from '@/app/(trainer)/groups/[group_id]/props';
import { GroupProvider } from '@/store/group.provider';
import { useMain } from '@/store/main.provider';

export default function GroupInitializer({
  children,
}: React.PropsWithChildren) {
  const { groups, institution, trainings } = useMain();
  const pathname = usePathname();

  const institutionId = institution.id;
  const groupId = pathname.split('/')[2];
  const group = groups.find((g) => g.id === groupId);

  if (!institutionId || !group || group.institutionId !== institution.id)
    return notFound();

  const state: GroupIdPageProps = {
    group,
    institution,
    trainings: trainings.data.filter((t) => t.groupId === group.id),
  };

  return <GroupProvider {...state}>{children}</GroupProvider>;
}
