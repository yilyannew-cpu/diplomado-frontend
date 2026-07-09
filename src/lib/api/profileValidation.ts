export const passwordRules = {
  minLength: 8,
  pattern: /^(?=.*[a-zA-Z])(?=.*\d).+$/,
  message: "Mín. 8 caracteres, al menos una letra y un número",
} as const;

export const phoneRules = {
  minLength: 10,
  pattern: /^\+?57|\d{10,}/,
  message: "Formato inválido. Use +57...",
} as const;

export function isValidPassword(value: string): boolean {
  return value.length >= passwordRules.minLength && passwordRules.pattern.test(value);
}

export function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= phoneRules.minLength && phoneRules.pattern.test(value);
}
