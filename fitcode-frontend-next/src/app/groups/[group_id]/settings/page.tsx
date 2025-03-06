import { FIREBASE_COOKIE_NAME } from '@/common/constant/browser.constant';
import { GroupProvider } from '@/context/group-provider';
import { GroupController } from '@/controller/group/group.controller';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import { UserController } from '@/controller/user/user.controller';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { GroupIdPageParams, GroupIdPageProps } from '../props';
import GroupSettingsPage from './group-settings-page';
import { useState } from 'react';

export default async function Page(props: GroupIdPageParams) {
  // fetch data
  const cookieStore = await cookies();
  const token = cookieStore.get(FIREBASE_COOKIE_NAME)?.value;
  if (!token) return <div>Unauthorized</div>;

  const profile = await UserController.findMe(token);
  if (!profile) return <div>Unauthorized</div>;

  const role = profile.customClaims.role[0];
  if (![UserRole.TRAINER, UserRole.MANAGER].includes(role))
    return <div>Unauthorized</div>;

  // @ts-ignore
  const groupId = (await props.params).group_id; // https://nextjs.org/docs/messages/sync-dynamic-apis
  const group = await GroupController.findById(token, groupId);
  if (!group) return notFound();

  if ([UserRole.ATHLETE, UserRole.ADMIN].includes(role)) return notFound();

  const users = await UserController.findAll(token);
  const groups = await GroupController.findAll(token);

  const pageProps: GroupIdPageProps = {
    token,
    userId: profile.uid,
    group,
    users,
    groups,
    components: [],
    attributes: [],
    exercises: [],
    trainings: [],
  };

  return (
    <GroupProvider {...pageProps}>
      <GroupSettingsPage />
    </GroupProvider>
  );
}
