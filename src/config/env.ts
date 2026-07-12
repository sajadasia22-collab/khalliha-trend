import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .url()
  .optional()
  .or(z.literal("").transform(() => undefined));

export const serverEnvSchema = z.object({
  DATABASE_URL: optionalUrl,
  DIRECT_URL: optionalUrl,
  NEXT_PUBLIC_APP_URL: optionalUrl.default("http://localhost:3000"),
  AUTH_SECRET: z
    .string()
    .min(24)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  SUPABASE_URL: optionalUrl,
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SENTRY_DSN: optionalUrl,
  PLATFORM_COMMISSION_BPS: z.string().regex(/^\d+$/).optional().default("0"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function getEnvValidation() {
  const parsed = serverEnvSchema.safeParse(process.env);

  if (parsed.success) {
    return {
      ok: true,
      env: parsed.data,
      issues: [],
    } as const;
  }

  return {
    ok: false,
    env: null,
    issues: parsed.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  } as const;
}

export function getRuntimeReadiness() {
  const validation = getEnvValidation();
  const env = validation.env;

  return {
    ok: validation.ok,
    checks: {
      env: validation.ok,
      databaseConfigured: Boolean(env?.DATABASE_URL),
      authSecretConfigured: Boolean(env?.AUTH_SECRET),
      supabaseConfigured: Boolean(env?.SUPABASE_URL && env.SUPABASE_ANON_KEY),
      sentryConfigured: Boolean(env?.SENTRY_DSN),
    },
    issues: validation.issues,
  };
}
