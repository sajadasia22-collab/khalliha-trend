export const IRAQ_PHONE_REGEX = /^(\+?964|0)?7[0-9]{9}$/;

export function normalizeIraqiPhone(input: string): string | null {
  const trimmed = input.trim();
  if (!IRAQ_PHONE_REGEX.test(trimmed)) {
    return null;
  }

  const digits = trimmed.replace(/^\+/, "");
  const localDigits = digits.startsWith("964")
    ? digits.slice(3)
    : digits.startsWith("0")
      ? digits.slice(1)
      : digits;

  return `+964${localDigits}`;
}
