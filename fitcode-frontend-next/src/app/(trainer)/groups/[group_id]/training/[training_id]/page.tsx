'use server';

import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ group_id: string; training_id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { group_id } = await params;
  return redirect(`/groups/${group_id}`);
}
