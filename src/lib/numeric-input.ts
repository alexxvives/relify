export function keepDigits(value: string, maxLength: number): string {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

export function keepYear(value: string): string {
  return keepDigits(value, 4);
}

export function keepUnsignedEuro(value: string): string {
  const cleaned = value.replace(/\./g, "").replace(/[^\d,]/g, "");
  const commaAt = cleaned.indexOf(",");
  const wholeSource = commaAt === -1 ? cleaned : cleaned.slice(0, commaAt);
  const whole = wholeSource.replace(/^0+(?=\d)/, "").slice(0, 12);

  if (commaAt === -1) {
    return whole;
  }

  const fraction = cleaned.slice(commaAt + 1).replace(/\D/g, "").slice(0, 2);
  return `${whole.length === 0 ? "0" : whole},${fraction}`;
}

export function keepSignedEuro(value: string): string {
  const negative = value.trimStart().startsWith("-");
  const body = keepUnsignedEuro(value.replace(/-/g, ""));

  if (!negative) {
    return body;
  }

  return body.length === 0 ? "-" : `-${body}`;
}

export function keepPercent(value: string): string {
  const cleaned = value.replace(/\./g, ",").replace(/[^\d,]/g, "");
  const commaAt = cleaned.indexOf(",");
  const wholeSource = (commaAt === -1 ? cleaned : cleaned.slice(0, commaAt)).replace(/^0+(?=\d)/, "").slice(0, 3);
  const wholeNumber = Number(wholeSource === "" ? "0" : wholeSource);

  if (wholeNumber >= 100) {
    return "100";
  }

  if (commaAt === -1) {
    return wholeSource;
  }

  const fraction = cleaned.slice(commaAt + 1).replace(/\D/g, "").slice(0, 2);
  return `${wholeSource.length === 0 ? "0" : wholeSource},${fraction}`;
}
