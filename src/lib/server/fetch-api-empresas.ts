import {
  apiEmpresasDefaultBaseUrl,
  parseApiEmpresasPayload,
  registryCompanyFromApiEmpresas,
} from "../apiempresas";
import type { ApiEmpresasFetch } from "../registry-lookup";
import { normalizeCif } from "../spanish-cif";

function baseUrl(): string {
  const custom = process.env.APIEMPRESAS_BASE_URL?.trim() ?? "";

  return custom.length > 0
    ? custom.replace(/\/+$/, "")
    : apiEmpresasDefaultBaseUrl;
}

async function readBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function errorCode(body: unknown): string {
  if (
    body &&
    typeof body === "object" &&
    "code" in body &&
    typeof body.code === "string"
  ) {
    return body.code;
  }

  return "";
}

export async function fetchApiEmpresas(
  rawCif: string,
  apiKey: string,
): Promise<ApiEmpresasFetch> {
  const { shouldBlockExternalApi } = await import("./int-guards");
  if (shouldBlockExternalApi("APIEMPRESAS")) {
    return { ok: false, code: "unavailable" };
  }
  const cif = normalizeCif(rawCif);

  try {
    const response = await fetch(
      `${baseUrl()}/companies?cif=${encodeURIComponent(cif)}`,
      {
        headers: { Accept: "application/json", "X-API-KEY": apiKey },
        signal: AbortSignal.timeout(8_000),
        cache: "no-store",
      },
    );
    const body = await readBody(response);

    if (response.status === 401 || response.status === 403) {
      return { ok: false, code: "auth" };
    }

    if (response.status === 429) {
      return {
        ok: false,
        code: errorCode(body) === "QUOTA_EXCEEDED" ? "quota" : "rate",
      };
    }

    if (
      response.status === 404 ||
      response.status === 400 ||
      response.status === 422
    ) {
      return { ok: true, record: null };
    }

    if (!response.ok) {
      return { ok: false, code: "unavailable" };
    }

    const parsed = parseApiEmpresasPayload(body);

    if (parsed.kind === "not-found") {
      return { ok: true, record: null };
    }

    if (parsed.kind !== "company") {
      return { ok: false, code: "unavailable" };
    }

    const record = registryCompanyFromApiEmpresas(cif, parsed.company);

    return { ok: true, record };
  } catch {
    return { ok: false, code: "unavailable" };
  }
}
