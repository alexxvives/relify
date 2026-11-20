-- S34 INT only: the website autofill was removed, so the S33 column goes away. Apply after deploying S34 code.
ALTER TABLE "user" DROP COLUMN IF EXISTS company_website;
