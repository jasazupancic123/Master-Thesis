export class BrowserUtil {
  getClientCookie(key: string): string | null {
    const name = key + '=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');

    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1);
      if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
    }

    return null;
  }

  setClientCookie(key: string, value: string, expirationDays = 1): void {
    const expirationDate = new Date(
      new Date().setDate(new Date().getDate() + expirationDays)
    );

    document.cookie = `${key}=${value}; expires=${expirationDate.toUTCString()}; path=/`;
  }

  removeClientCookie(key: string): void {
    document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
  }
}
