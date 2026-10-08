ALTER TABLE "investor_profile" ADD COLUMN "stake" TEXT NOT NULL DEFAULT '';

CREATE TYPE "engagement_author" AS ENUM ('client', 'advisor');

CREATE TABLE "engagement_message" (
    "id" TEXT NOT NULL,
    "engagement_id" TEXT NOT NULL,
    "author" "engagement_author" NOT NULL,
    "kind" "message_kind" NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "engagement_message_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "engagement_message_engagement_id_created_at_idx" ON "engagement_message"("engagement_id", "created_at");

ALTER TABLE "engagement_message" ADD CONSTRAINT "engagement_message_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "advisory_engagement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
