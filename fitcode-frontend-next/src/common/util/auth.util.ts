import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { FIREBASE_AUTH_ID_TOKEN } from '../config/firebase.config';
import { LINK_SIGN_IN } from '../constant/navigation.constant';

export async function getAuthIdTokenFromCookies(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const payload = cookieStore.get(FIREBASE_AUTH_ID_TOKEN)?.value;

  if (!payload) return undefined;

  let value = '';
  let expiresAt = 0;

  try {
    const parsed = JSON.parse(payload);
    value = parsed.value;
    expiresAt = parsed.expiresAt;
  } catch (error) {
    console.error('Error parsing auth token from cookies:', error);
    return undefined;
  }

  if (Date.now() > expiresAt) {
    console.warn('Auth token has expired');
    return redirect(LINK_SIGN_IN.href);
  }

  return value;
}
