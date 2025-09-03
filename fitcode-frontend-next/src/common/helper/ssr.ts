import type { Auth, User } from '@firebase/auth';
import { cookies } from 'next/headers';
import { redirect, RedirectType } from 'next/navigation';

import { getFirebaseAuth } from '../config/firebase.config';
import { FIREBASE_AUTH_ID_TOKEN } from '../constant/browser.constant';
import { LINK_SIGN_IN } from '../constant/navigation.constant';
import type { UserRole } from '@/controller/user/enum/user-role.enum';
import type { CustomClaims } from '@/controller/user/type/custom-claims.type';

export async function getTokenAndCheckUserAccess(
  allowedRoles?: UserRole[]
): Promise<string> {
  const auth = await getFirebaseServerAuth();
  if (!auth?.currentUser)
    return redirect(LINK_SIGN_IN.href, RedirectType.replace);

  const { token, claims } = await getIdTokenResult(auth.currentUser);
  if (!allowedRoles || !allowedRoles.length) return token;

  const role = claims.role?.[0];
  if (!role) return redirect(LINK_SIGN_IN.href, RedirectType.replace);
  if (!allowedRoles.includes(role))
    return redirect(LINK_SIGN_IN.href, RedirectType.replace);

  return token;
}

export async function getFirebaseServerAuth(): Promise<Auth | undefined> {
  const cookieStore = await cookies();
  const token = cookieStore.get(FIREBASE_AUTH_ID_TOKEN)?.value;
  if (!token) return undefined;

  let auth: Auth;
  try {
    auth = getFirebaseAuth({ authIdToken: token, server: true });
  } catch (_) {
    return undefined;
  }

  await auth.authStateReady();
  return auth;
}

export async function getIdTokenResult(
  user: User
): Promise<{ token: string; claims: CustomClaims }> {
  const { token, claims } = await user.getIdTokenResult();
  return { token, claims: claims as unknown as CustomClaims };
}
