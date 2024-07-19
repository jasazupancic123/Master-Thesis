'use client'

import { Props } from '@/type/props.type';
import { AuthContextType, useAuth } from '@/context/auth-provider';
import { useFetch } from '@/hook/use-fetch';
import { UserRole } from '@/enum/user-role.enum';
import { Cycle } from '@/type/cycle.type';
import { Firestore } from '@/util/firebase';
import TrainerPage from '@/app/cycles/[id]/trainer.page';

export default function Page({ params }: Props) {
  const {role} = useAuth() as AuthContextType
  const [cycle, loading, error] = useFetch<Cycle>(`/cycle/id/${params.id}`, {
    populate: (data) => Firestore.populate(data),
  })

  if (loading)
    return <div>Loading ...</div>

  if (error)
    return <div>Error</div>

  if (role.includes(UserRole.ATHLETE))
    return <h1>Athlete Group View</h1>

  if (role.includes(UserRole.TRAINER))
    return <TrainerPage cycle={cycle} />
}