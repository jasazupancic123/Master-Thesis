'use client';

import { useFetch } from '@/hook/use-fetch';
import { Group } from '@/type/group.type';
import { AuthContextType, useAuth } from '@/context/auth-provider';
import { UserRole } from '@/enum/user-role.enum';
import TrainerPage from '@/app/groups/[id]/trainer.page';
import { Props } from '@/type/props.type';

export default function Page({ params }: Props) {
  const {role} = useAuth() as AuthContextType
  const [group, loading, error] = useFetch<Group>(`/group/${params.id}`)

  if (loading)
    return <div>Loading ...</div>

  if (error)
    return <div>Error</div>

  if (role.includes(UserRole.ATHLETE))
    return <h1>Athlete Group View</h1>

  if (role.includes(UserRole.TRAINER))
    return <TrainerPage group={group} />
}