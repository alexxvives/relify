-- Round N: seller financing no longer has Negociable. Map leftover rows to Sí.
-- The column is a string (not a Postgres enum). Prisma writes only "yes" | "no" after this.
-- Apply on INT. Production may keep "negotiable" until Alex runs this; storedSellerFinancing maps it to yes.
UPDATE "project" SET "seller_financing" = 'yes' WHERE "seller_financing" = 'negotiable';
