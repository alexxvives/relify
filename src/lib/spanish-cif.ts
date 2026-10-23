const cifPattern = /^[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J]$/;
const digitOnly = "ABEH";
const letterOnly = "KPQS";
const controlLetters = "JABCDEFGHI";

export function normalizeCif(value: string): string {
  return value.trim().toUpperCase().replace(/[\s-]/g, "");
}

export function isValidSpanishCif(value: string): boolean {
  const cif = normalizeCif(value);

  if (!cifPattern.test(cif)) {
    return false;
  }

  const digits = cif.slice(1, 8);
  let sum = 0;

  for (let index = 0; index < digits.length; index += 1) {
    const digit = Number(digits[index]);

    if (index % 2 === 0) {
      const doubled = digit * 2;
      sum += Math.floor(doubled / 10) + (doubled % 10);
    } else {
      sum += digit;
    }
  }

  const control = (10 - (sum % 10)) % 10;
  const expected = cif[8] ?? "";
  const first = cif[0] ?? "";
  const letter = controlLetters[control] ?? "";

  if (digitOnly.includes(first)) {
    return expected === String(control);
  }

  if (letterOnly.includes(first)) {
    return expected === letter;
  }

  return expected === String(control) || expected === letter;
}

const dniLetters = "TRWAGMYFPDXBNJZSQVHLCKE";

function dniLetter(number: number): string {
  return dniLetters[number % 23] ?? "";
}

export function isValidSpanishDni(value: string): boolean {
  const id = normalizeCif(value);
  const match = /^(\d{8})([A-Z])$/.exec(id);

  if (!match?.[1] || !match[2]) {
    return false;
  }

  return dniLetter(Number(match[1])) === match[2];
}

export function isValidSpanishNie(value: string): boolean {
  const id = normalizeCif(value);
  const match = /^([XYZ])(\d{7})([A-Z])$/.exec(id);

  if (!match?.[1] || !match[2] || !match[3]) {
    return false;
  }

  const prefixes: Record<string, string> = { X: "0", Y: "1", Z: "2" };
  const prefix = prefixes[match[1]] ?? "";
  return dniLetter(Number(`${prefix}${match[2]}`)) === match[3];
}

export function isValidSpanishPersonId(value: string): boolean {
  return isValidSpanishDni(value) || isValidSpanishNie(value);
}

export function isValidSpanishTaxId(value: string): boolean {
  return isValidSpanishPersonId(value) || isValidSpanishCif(value);
}
