export function accountEmailConfigured(): boolean {
  const hook = process.env.ACCOUNT_EMAIL_WEBHOOK;
  return typeof hook === "string" && hook.startsWith("https://");
}

export async function sendAccountEmail(input: { to: string; url: string }): Promise<void> {
  const hook = process.env.ACCOUNT_EMAIL_WEBHOOK;

  if (typeof hook !== "string" || !hook.startsWith("https://")) {
    throw new Error("account_email_unconfigured");
  }

  const response = await fetch(hook, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ to: input.to, url: input.url }),
  });

  if (!response.ok) {
    throw new Error("account_email_failed");
  }
}
