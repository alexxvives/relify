-- t73b: rate limits for email-sending actions (additive)
CREATE TABLE IF NOT EXISTS "email_throttle" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "window_start" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "email_throttle_pkey" PRIMARY KEY ("key")
);
