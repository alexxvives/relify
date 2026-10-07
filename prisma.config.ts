import "dotenv/config";
import { defineConfig } from "prisma/config";

const databaseUrl =
  process.env.DATABASE_URL ?? "postgresql://localhost:5432/releva";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "prisma db execute --file prisma/seed.sql",
  },
  datasource: {
    url: databaseUrl,
  },
});
