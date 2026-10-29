import { revalidatePath } from "next/cache";
import { filingByteLimit } from "@/lib/financial-filing";
import { getCurrentUser } from "@/server/getCurrentUser";
import { uploadFiling } from "@/server/financialFilings";

const noStore = { "Cache-Control": "private, no-store" };

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");

  if (!origin) {
    return false;
  }

  try {
    return new URL(origin).host === new URL(request.url).host || new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

export async function POST(request: Request): Promise<Response> {
  if (!sameOrigin(request)) {
    return Response.json({ ok: false, code: "forbidden" }, { status: 403, headers: noStore });
  }

  const length = Number(request.headers.get("content-length") ?? "0");

  if (length > filingByteLimit + 64 * 1024) {
    return Response.json({ ok: false, code: "too-large" }, { status: 413, headers: noStore });
  }

  const user = await getCurrentUser();

  if (!user) {
    return Response.json({ ok: false, code: "forbidden" }, { status: 401, headers: noStore });
  }

  let form: FormData;

  try {
    form = await request.formData();
  } catch {
    return Response.json({ ok: false, code: "empty" }, { status: 400, headers: noStore });
  }

  const file = form.get("file");
  const year = Number(form.get("year"));

  if (!(file instanceof File)) {
    return Response.json({ ok: false, code: "empty" }, { status: 400, headers: noStore });
  }

  if (file.size > filingByteLimit) {
    return Response.json({ ok: false, code: "too-large" }, { status: 413, headers: noStore });
  }

  const result = await uploadFiling(user, year, new Uint8Array(await file.arrayBuffer()), file.name);

  if (result.ok) {
    revalidatePath("/mi-empresa/financieros");
  }

  return Response.json(result, { status: result.ok ? 200 : result.code === "forbidden" ? 403 : 400, headers: noStore });
}
