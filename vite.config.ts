import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";
import { imagesOptimizer } from "@vinext/cloudflare/images/images-optimizer";

const require = createRequire(import.meta.url);
const root = path.dirname(fileURLToPath(import.meta.url));

if (process.argv.includes("build")) {
  execFileSync(
    process.execPath,
    [require.resolve("prisma/build/index.js"), "generate"],
    { stdio: "inherit" },
  );
}

export default defineConfig({
  resolve: {
    alias: {
      "@/generated/prisma/client": path.join(
        root,
        "src/generated/prisma-worker/client.ts",
      ),
      "@better-auth/utils/password": path.join(
        root,
        "node_modules/@better-auth/utils/dist/password.mjs",
      ),
    },
  },
  plugins: [
    vinext({
      images: { optimizer: imagesOptimizer() },
    }),
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
});
