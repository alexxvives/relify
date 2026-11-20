-- S33: optional company website captured in seller onboarding (prefills "Rellenar con tu web").
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "company_website" TEXT;
