export function expectDatesToMatchUpToMinute(date1: Date, date2: Date) {
  expect(date1.getFullYear()).toBe(date2.getFullYear());
  expect(date1.getMonth()).toBe(date2.getMonth());
  expect(date1.getDate()).toBe(date2.getDate());
  expect(date1.getHours()).toBe(date2.getHours());
  expect(date1.getMinutes()).toBe(date2.getMinutes());
}

export function getNextFriday(fromDate = new Date()) {
  const date = new Date(fromDate);
  const day = date.getDay();

  const diff = (5 - day + 7) % 7 || 7;
  date.setDate(date.getDate() + diff);

  return date;
}
