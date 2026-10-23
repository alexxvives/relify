import * as z from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.url(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function readServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
  });

  if (!parsed.success) {
    throw new Error("Invalid server environment");
  }

  return parsed.data;
}

const siteUrlSchema = z.object({
  BETTER_AUTH_URL: z.url(),
});

export function readSiteUrl(): URL {
  const parsed = siteUrlSchema.safeParse({
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
  });

  if (parsed.success) {
    return new URL(parsed.data.BETTER_AUTH_URL);
  }

  return new URL("https://Relify.alexxvives.workers.dev");
}
