-- t93: would the seller stay on as an adviser after the sale, and for how long (additive, nullable)
ALTER TABLE "project" ADD COLUMN IF NOT EXISTS "seller_stay" TEXT;
