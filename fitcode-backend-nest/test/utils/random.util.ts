export function generateRandomEmail(): string {
  return `${Math.random().toString(36).substring(2, 10)}@mail.com`;
}

export function generateRandomString(minLength = 0, maxLength = 10): string {
  const characters = 'abcdefghijklmnopqrstuvwxyz';
  const length =
    Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;

  let result = '';
  for (let i = 0; i < length; i++)
    result += characters.charAt(Math.floor(Math.random() * characters.length));

  // capitalize first letter
  return result.charAt(0).toUpperCase() + result.slice(1);
}

export function generateRandomName(): string {
  return `${generateRandomString(5, 8)} ${generateRandomString(5, 8)}`;
}

export function getComponents() {
  // returns components strength, speed and endurance
  return [
    global.components.find((c) => c.id === 'strength')!,
    global.components.find((c) => c.id === 'speed')!,
    global.components.find((c) => c.id === 'endurance')!,
  ];
}
