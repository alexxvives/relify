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
