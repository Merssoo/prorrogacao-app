export function maskDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  let day = digits.slice(0, 2);
  let month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  if (day.length === 2) {
    day = String(Math.min(31, Math.max(1, Number(day)))).padStart(2, '0');
  }
  if (month.length === 2) {
    month = String(Math.min(12, Math.max(1, Number(month)))).padStart(2, '0');
  }

  let formatted = day;
  if (digits.length > 2) formatted += '/' + month;
  if (digits.length > 4) formatted += '/' + year;
  return formatted;
}

export function ddMMyyyyToIso(value: string): string | undefined {
  const [day, month, year] = value.split('/');
  if (!day || !month || year?.length !== 4) return undefined;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

export function isoToDdMMyyyy(iso: string): string {
  const [year, month, day] = iso.substring(0, 10).split('-');
  return `${day}/${month}/${year}`;
}
