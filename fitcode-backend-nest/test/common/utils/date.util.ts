import { setHours, setMinutes } from 'date-fns';

export function getTime(date: Date, hours: number, minutes = 0) {
  return setMinutes(setHours(date, hours), minutes);
}
