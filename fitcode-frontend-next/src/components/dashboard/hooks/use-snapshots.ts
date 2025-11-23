'use client';

import { collection, onSnapshot, query, where } from '@firebase/firestore';
import { endOfDay, startOfDay } from 'date-fns';
import { useEffect } from 'react';

import type { Institution } from '@/core/institution/type/institution.type';
import { UserRole } from '@/core/profile/enum/user-role.enum';
import type { Training } from '@/core/training/type/training.type';
import { lib } from '@/lib';
import type { FirestoreEntity } from '@/lib/firebase/type/firestore.type';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useDashboard } from '@/store/dashboard.provider';

export default function useDashboardScheduleSnapshots() {
  const { role } = useAuthenticatedAuth();
  const { selectedInstitution } = useDashboard();

  useEffect(() => {
    if (!selectedInstitution || role !== UserRole.MANAGER) return;
    const institutionId = selectedInstitution.id;

    const unsub = onSnapshot(
      query(
        collection(
          lib.firebase.firestore.db,
          `institutions/${institutionId}/institution-members`
        )
      ),
      (snapshot) => {
        const data = snapshot.docs.map((doc) =>
          lib.firebase.firestore.serialize(
            doc.data() as FirestoreEntity<Institution>
          )
        );
      },
      (error) => {
        console.error(
          'Error occured while listening to institution members changes:',
          error
        );
      }
    );

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!selectedInstitution || role !== UserRole.MANAGER) return;
    const institutionId = selectedInstitution.id;

    const unsub = onSnapshot(
      query(
        collection(lib.firebase.firestore.db, 'trainings'),
        where('institutionId', '==', institutionId),
        where('from', '>=', startOfDay(new Date())), // 00:00 today
        where('from', '<', endOfDay(new Date())) // 23:59 today
      ),
      (snapshot) => {
        const data: Training[] = snapshot.docs.map((doc) =>
          lib.firebase.firestore.serialize(
            doc.data() as FirestoreEntity<Training>
          )
        );
      },
      (error) => {
        console.error(
          'Error occured while listening to institution trainings changes:',
          error
        );
      }
    );

    return () => unsub();
  }, []);
}
