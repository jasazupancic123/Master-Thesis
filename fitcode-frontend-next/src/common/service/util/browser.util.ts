export class BrowserUtil {
  setClientCookie(key: string, value: string, expirationDays: number): void {
    const expirationDate = new Date(
      new Date().setDate(new Date().getDate() + expirationDays)
    );

    document.cookie = `${key}=${value}; expires=${expirationDate.toUTCString()}; path=/`;
  }
}
