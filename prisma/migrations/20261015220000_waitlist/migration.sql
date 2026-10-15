CREATE TYPE "waitlist_role" AS ENUM ('company', 'investor', 'advisor');

CREATE TABLE "waitlist_entry" (
    "id" TEXT NOT NULL,
    "role" "waitlist_role" NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waitlist_entry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "waitlist_entry_email_role_key" ON "waitlist_entry"("email", "role");
