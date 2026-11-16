import { billingCopy } from "@/lib/billing-copy";
import type { CurrentUser } from "@/lib/server/get-current-user";

export type PublishClientResult = { ok: false; message: string };

export async function publishClientCompany(
  user: CurrentUser,
  slug: string,
): Promise<PublishClientResult> {
  void user;
  void slug;

  return { ok: false, message: billingCopy.advisorDoesNotPublish };
}
