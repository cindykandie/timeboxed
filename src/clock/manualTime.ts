export type ManualDateTime = { year: number; month: number; day: number; hour: number; minute: number };

export function manualDateTime(timestamp: number): ManualDateTime {
  const date = new Date(timestamp);
  return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate(),
    hour: date.getHours(), minute: date.getMinutes() };
}

export function manualTimestamp(fields: ManualDateTime) {
  const values = Object.values(fields);
  if (!values.every(Number.isInteger) || fields.year < 1970 || fields.year > 9999 || fields.month < 1
    || fields.month > 12 || fields.day < 1 || fields.day > 31 || fields.hour < 0 || fields.hour > 23
    || fields.minute < 0 || fields.minute > 59) throw new Error('Enter a valid date and time.');
  const timestamp = new Date(fields.year, fields.month - 1, fields.day, fields.hour, fields.minute, 0, 0).getTime();
  const actual = manualDateTime(timestamp);
  if (Object.keys(fields).some((key) => fields[key as keyof ManualDateTime] !== actual[key as keyof ManualDateTime])) {
    throw new Error('This date or local time does not exist.');
  }
  return timestamp;
}
