'use client';

import { notFound, usePathname } from 'next/navigation';

import type { GroupIdPageProps } from '@/app/(trainer)/groups/[group_id]/props';
import { GroupProvider } from '@/store/group.provider';
import { useMain } from '@/store/main.provider';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Training } from '@/core/training/type/training.type';
import { TrainingController } from '@/core/training/training.controller';

export default function GroupInitializer({
  children,
}: React.PropsWithChildren) {
  const { institution, trainings, setTrainings } = useMain();
  const pathname = usePathname();
  const groups = institution.groups || [];

  const institutionId = institution.id;
  const groupId = pathname.split('/')[2];
  const group = groups.find((g) => g.id === groupId);

  // Refetch group trainings
  useEffect(() => {
    async function fetchTrainings() {
      if (!institutionId || !group || group.institutionId !== institution.id)
        return;

      try {
        const fetchedTrainings = await TrainingController.getInstance().findAll(
          { institutionId, groupId }
        );

        // replace trainings that match same ID in main trainings
        setTrainings((prevTrainings) => {
          const updatedTrainings = prevTrainings.data.map((training) => {
            const updatedTraining = fetchedTrainings.find(
              (ft) => ft.id === training.id
            );

            return updatedTraining ? updatedTraining : training;
          });

          // add new trainings that were not in previous state
          fetchedTrainings.forEach((ft) => {
            if (!prevTrainings.data.find((t) => t.id === ft.id))
              updatedTrainings.push(ft);
          });

          return { ...prevTrainings, data: updatedTrainings };
        });
      } catch (e) {
        console.error('Error fetching group trainings:', e);
        toast.error((e as Error).message || 'Failed to load group trainings.');
      }
    }

    fetchTrainings().then();
  }, []);

  if (!institutionId || !group || group.institutionId !== institution.id)
    return notFound();

  return (
    <GroupProvider
      group={group}
      trainings={trainings.data.filter((t) => t.groupId === group.id)}
    >
      {children}
    </GroupProvider>
  );
}
