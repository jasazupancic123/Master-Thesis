export class BrowserUtil {
  setClientCookie(key: string, value: string, maxAgeSeconds = 3600): void {
    const expiresAt = Date.now() + maxAgeSeconds * 1000;
    const cookieValue = encodeURIComponent(
      JSON.stringify({ value, expiresAt })
    );

    document.cookie = `${key}=${cookieValue}; path=/; SameSite=Lax`;
  }

  removeClientCookie(key: string): void {
    document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
  }

  getClientCookie(key: string): { value: string; expiresAt: number } | null {
    const cookies = document.cookie ? document.cookie.split('; ') : [];
    for (let i = 0; i < cookies.length; i++) {
      const parts = cookies[i].split('=');
      const cookieName = parts.shift();
      const cookieValue = parts.join('=');

      if (cookieName === key)
        try {
          const parsed = JSON.parse(decodeURIComponent(cookieValue));
          return parsed;
        } catch (_) {
          return null;
        }
    }

    return null;
  }
}
