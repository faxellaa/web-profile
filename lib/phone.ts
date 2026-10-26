export function isValidIndonesianMobileNumber(value: string): boolean {
  return /^628\d{9,10}$/.test(value);
}
