/** CR/LF in a subject or address is header injection. One line, max 255. */
export function sanitizeMailHeader(value: string): string {
  return value.replace(/[\r\n\u0000]/g, " ").replace(/\s+/g, " ").trim().slice(0, 255);
}
