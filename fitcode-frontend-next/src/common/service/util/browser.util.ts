export class BrowserUtil {
  setClientCookie(key: string, value: string, expirationDays: number): void {
    const expirationDate = new Date(
      new Date().setDate(new Date().getDate() + expirationDays)
    );

    document.cookie = `${key}=${value}; expires=${expirationDate.toUTCString()}; path=/`;
  }

  removeClientCookie(key: string): void {
    document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
  }
}
