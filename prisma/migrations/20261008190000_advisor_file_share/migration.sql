CREATE TABLE "advisor_file_share" (
    "id" TEXT NOT NULL,
    "engagement_id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "advisor_file_share_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "advisor_file_share_engagement_id_file_id_key" ON "advisor_file_share"("engagement_id", "file_id");

CREATE INDEX "advisor_file_share_engagement_id_idx" ON "advisor_file_share"("engagement_id");

CREATE INDEX "advisor_file_share_file_id_idx" ON "advisor_file_share"("file_id");

ALTER TABLE "advisor_file_share" ADD CONSTRAINT "advisor_file_share_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "advisory_engagement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "advisor_file_share" ADD CONSTRAINT "advisor_file_share_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "data_room_file"("id") ON DELETE CASCADE ON UPDATE CASCADE;
