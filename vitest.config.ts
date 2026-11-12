import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      {
        find: "@/generated/prisma/client",
        replacement: path.join(root, "src/generated/prisma-worker/client.ts"),
      },
      {
        find: "@better-auth/utils/password",
        replacement: path.join(root, "node_modules/@better-auth/utils/dist/password.mjs"),
      },
      { find: /^@\//, replacement: `${path.join(root, "src")}/` },
    ],
  },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    exclude: ["tests/e2e/**", "node_modules/**"],
  },
});
