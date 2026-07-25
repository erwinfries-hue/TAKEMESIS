import "server-only";
import { serverEnvSchema } from "./schema";

const parsed = serverEnvSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(
    `Invalid server environment variables:\n${parsed.error.issues
      .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
      .join("\n")}`,
  );
}

export const serverEnv = parsed.data;
