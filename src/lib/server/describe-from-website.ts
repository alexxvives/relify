import { htmlToText, isBlockedAddress, parsePublicSiteUrl, tidyDescription } from "@/lib/site-url";
import { takeThrottle } from "@/lib/server/email-throttle";
import { prisma } from "@/lib/db";

/**
 * S33 (Alex): "Rellenar con tu web". Reads the seller's public website and asks Cloudflare Workers AI (binding `AI`) for
 * a neutral Spanish draft of the company description. The result only fills the textarea; nothing is saved here.
 *
 * SSRF guard: http(s) only, ports 80/443, no credentials or IP literals, every hostname resolved over DNS-over-HTTPS and
 * refused when any A/AAAA record is private, loopback, link-local, CGNAT or metadata; redirects followed by hand
 * (max 3), each hop checked again. 8 s timeout per request and 512 KB cap on the body; HTML or plain text only.
 */

/** Small instruct models, tried in order (plain `@cf/meta/llama-3.1-8b-instruct` is deprecated on Workers AI). */
export const describeModels = ["@cf/meta/llama-3.1-8b-instruct-fast", "@cf/zai-org/glm-4.7-flash"] as const;
const fetchTimeoutMs = 8000;
const maxBytes = 512 * 1024;
const maxRedirects = 3;

export type DescribeResult = { ok: true; description: string } | { ok: false; message: string };

const messages = {
  invalid: "Escribe la dirección de tu web, por ejemplo miempresa.es.",
  blocked: "Esa dirección no es una web pública.",
  unreachable: "No hemos podido abrir tu web. Revisa la dirección o escribe la descripción a mano.",
  empty: "Tu web no tiene texto suficiente para redactar una descripción.",
  throttled: "Has usado esta opción varias veces seguidas. Prueba de nuevo dentro de una hora.",
  unavailable: "La redacción automática no está disponible ahora. Escribe la descripción a mano.",
  failed: "No hemos podido redactar la descripción. Prueba de nuevo o escríbela a mano.",
} as const;

type AiBinding = { run: (model: string, input: unknown) => Promise<unknown> };

async function aiBinding(): Promise<AiBinding | null> {
  try {
    const workers = await import("cloudflare:workers");
    const binding = (workers.env as Record<string, unknown>).AI as AiBinding | undefined;
    return binding && typeof binding.run === "function" ? binding : null;
  } catch {
    return null;
  }
}

async function withTimeout<T>(run: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), fetchTimeoutMs);
  try {
    return await run(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

/** Resolves A and AAAA over Cloudflare DNS-over-HTTPS; null when the name does not resolve. */
async function resolveHost(host: string): Promise<string[] | null> {
  const answers: string[] = [];
  for (const type of ["A", "AAAA"]) {
    const response = await withTimeout((signal) =>
      fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=${type}`, {
        headers: { accept: "application/dns-json" },
        signal,
      }),
    );
    if (!response.ok) return null;
    const body = (await response.json()) as { Answer?: { type: number; data: string }[] };
    for (const answer of body.Answer ?? []) {
      if (answer.type === 1 || answer.type === 28) answers.push(answer.data);
    }
  }
  return answers.length > 0 ? answers : null;
}

async function readCapped(response: Response): Promise<string | null> {
  const declared = Number(response.headers.get("content-length") ?? "0");
  if (declared > maxBytes) return null;
  const reader = response.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      break;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0));
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

/** Fetches a public page as text, or returns the user-facing reason it could not. */
export async function fetchPublicSiteText(raw: string): Promise<{ ok: true; text: string } | { ok: false; message: string }> {
  let url = parsePublicSiteUrl(raw);
  if (!url) return { ok: false, message: messages.invalid };

  try {
    for (let hop = 0; hop <= maxRedirects; hop += 1) {
      const addresses = await resolveHost(url.hostname);
      if (!addresses) return { ok: false, message: messages.unreachable };
      if (addresses.some(isBlockedAddress)) return { ok: false, message: messages.blocked };

      const current: URL = url;
      const response = await withTimeout((signal) =>
        fetch(current.toString(), {
          redirect: "manual",
          signal,
          headers: { accept: "text/html,text/plain;q=0.9", "user-agent": "RelifyBot/1.0 (+https://itsrelify.com)" },
        }),
      );

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        await response.body?.cancel();
        const next = location ? parsePublicSiteUrl(new URL(location, current).toString()) : null;
        if (!next) return { ok: false, message: messages.blocked };
        url = next;
        continue;
      }
      if (!response.ok) {
        await response.body?.cancel();
        return { ok: false, message: messages.unreachable };
      }
      const type = response.headers.get("content-type") ?? "";
      if (!/text\/html|text\/plain|application\/xhtml/i.test(type)) {
        await response.body?.cancel();
        return { ok: false, message: messages.unreachable };
      }
      const html = await readCapped(response);
      if (html === null) return { ok: false, message: messages.unreachable };
      const text = htmlToText(html);
      return text.length < 120 ? { ok: false, message: messages.empty } : { ok: true, text };
    }
    return { ok: false, message: messages.unreachable };
  } catch {
    return { ok: false, message: messages.unreachable };
  }
}

export const describePrompt = [
  "Eres un redactor de Relify, un marketplace español de compraventa de pymes.",
  "Con el texto de la web de una empresa, escribe en español neutro una descripción de la empresa de entre 500 y 1000 caracteres, en uno o dos párrafos y en tercera persona.",
  "Explica a qué se dedica, qué ofrece, a qué clientes sirve y qué la diferencia, solo con lo que diga el texto.",
  "No inventes cifras, años, premios, clientes ni datos que no aparezcan en el texto. No copies teléfonos, correos, direcciones ni nombres de personas.",
  "No uses tono publicitario, superlativos, emojis, listas ni títulos. Devuelve solo la descripción.",
].join(" ");

/** Rate-limited per user: 5 drafts per hour. */
export async function describeFromWebsite(userId: string, rawUrl: string): Promise<DescribeResult> {
  if (!parsePublicSiteUrl(rawUrl)) return { ok: false, message: messages.invalid };
  const ai = await aiBinding();
  if (!ai) return { ok: false, message: messages.unavailable };
  if (!(await takeThrottle(`site-describe:${userId}`, 5, 3600))) return { ok: false, message: messages.throttled };

  const site = await fetchPublicSiteText(rawUrl);
  if (!site.ok) return site;

  for (const model of describeModels) {
    try {
      const output = await ai.run(model, {
        messages: [
          { role: "system", content: describePrompt },
          { role: "user", content: `Texto de la web:\n"""\n${site.text}\n"""` },
        ],
        max_tokens: 600,
        temperature: 0.3,
      });
      const description = tidyDescription(modelText(output));
      if (description.length >= 200) return { ok: true, description };
      console.warn(`[describe-from-website] ${model}: short output (${description.length} chars)`);
    } catch (error) {
      console.warn(`[describe-from-website] ${model}: ${error instanceof Error ? error.message.slice(0, 200) : "error"}`);
    }
  }
  return { ok: false, message: messages.failed };
}

/** Workers AI text: `{ response }` (Llama) or OpenAI-style `{ choices: [{ message: { content } }] }`. */
export function modelText(output: unknown): string {
  if (!output || typeof output !== "object") return "";
  const value = output as { response?: unknown; choices?: { message?: { content?: unknown } }[] };
  if (typeof value.response === "string") return value.response;
  const content = value.choices?.[0]?.message?.content;
  return typeof content === "string" ? content : "";
}

/** Prefill for the website field: the project's website (SABI import) or the one given at onboarding. */
export async function sellerWebsiteHint(userId: string, projectId: string | null): Promise<string> {
  const [project, user] = await Promise.all([
    projectId ? prisma.project.findUnique({ where: { id: projectId }, select: { website: true } }) : null,
    prisma.user.findUnique({ where: { id: userId }, select: { companyWebsite: true } }),
  ]);
  return project?.website?.trim() || user?.companyWebsite?.trim() || "";
}
