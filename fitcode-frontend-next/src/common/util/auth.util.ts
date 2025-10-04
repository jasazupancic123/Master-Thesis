import { cookies } from 'next/headers';

import { AuthController } from '@/controller/auth/auth.controller';

export async function getAuthIdTokenFromCookies(): Promise<string | undefined> {
  const controller = AuthController.getInstance('');

  const cookieStore = await cookies();
  const idToken = cookieStore.get('idToken')?.value;
  const refreshToken = cookieStore.get('refreshToken')?.value;

  try {
    const response = await controller.login(idToken!, refreshToken!);
    return response.idToken;
  } catch (e) {
    console.error('Error refreshing token:', e);
    await controller.logout();
    return undefined;
  }
}
