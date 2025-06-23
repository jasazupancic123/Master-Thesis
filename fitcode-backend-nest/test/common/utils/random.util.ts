export function generateRandomEmail(): string {
  return `${Math.random().toString(36).substring(2, 10)}@mail.com`;
}

export function generateRandomString(length = 10): string {
  const characters = 'abcdefghijklmnopqrstuvwxyz';

  let result = '';
  for (let i = 0; i < length; i++)
    result += characters.charAt(Math.floor(Math.random() * characters.length));

  // capitalize first letter
  return result.charAt(0).toUpperCase() + result.slice(1);
}

export function generateRandomName(): string {
  return `${generateRandomString(8)} ${generateRandomString(8)}`;
}

export function generateRandomColor(): string {
  const letters = '0123456789ABCDEF';

  let color = '#';
  for (let i = 0; i < 6; i++) color += letters[Math.floor(Math.random() * 16)];

  return color;
}
