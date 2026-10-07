import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { defineConfig } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";
import { imagesOptimizer } from "@vinext/cloudflare/images/images-optimizer";

const require = createRequire(import.meta.url);

if (process.argv.includes("build")) {
  execFileSync(
    process.execPath,
    [require.resolve("prisma/build/index.js"), "generate"],
    { stdio: "inherit" },
  );
}

export default defineConfig({
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
