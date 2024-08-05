'use client'

import { Props } from '@/type/props.type';
import { useRouter } from 'next/navigation';

export default function Page({ params }: Props) {
  const router = useRouter()
  router.push(`/cycles/${params.id}/day`)
}