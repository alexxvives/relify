"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/server/get-current-user";
import { reviewSaleContract, signSaleContract, uploadSaleContract } from "@/lib/server/sale-contract";

export type ContractActionState = { ok: boolean; message: string } | null;

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

/** "1.250.000", "1250000 €" or "1.250.000,50" -> cents; NaN-safe. */
function priceInputCents(value: string): number {
  const clean = value.replace(/[\s€]/g, "").replace(/\./g, "");
  const [whole = "", fraction = ""] = clean.split(",");
  if (!/^\d+$/.test(whole) || !/^\d{0,2}$/.test(fraction)) return 0;
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

function refresh(): void {
  revalidatePath("/procesos");
  revalidatePath("/mi-empresa/procesos");
  revalidatePath("/mandatos/encargos", "layout");
}

export async function uploadContractAction(_state: ContractActionState, formData: FormData): Promise<ContractActionState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Vuelve a iniciar sesión." };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Elige el PDF del contrato." };
  const priceCents = priceInputCents(text(formData, "price"));
  const result = await uploadSaleContract(
    user,
    { accessId: text(formData, "accessId"), priceCents, fileName: file.name },
    new Uint8Array(await file.arrayBuffer()),
  );
  if (result.ok) refresh();
  return result;
}

export async function reviewContractAction(_state: ContractActionState, formData: FormData): Promise<ContractActionState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Vuelve a iniciar sesión." };
  const decision = text(formData, "decision") === "changes" ? "changes" : "accept";
  const result = await reviewSaleContract(user, { contractId: text(formData, "contractId"), decision, comment: text(formData, "comment") });
  if (result.ok) refresh();
  return result;
}

export async function signContractAction(_state: ContractActionState, formData: FormData): Promise<ContractActionState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Vuelve a iniciar sesión." };
  const result = await signSaleContract(user, text(formData, "contractId"), formData.get("signature"));
  if (result.ok) refresh();
  return result;
}
