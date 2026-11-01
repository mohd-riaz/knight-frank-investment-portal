-- Preserve unavailable metrics as NULL instead of inventing zero values.
ALTER TABLE "Property"
  ALTER COLUMN "price" DROP NOT NULL,
  ALTER COLUMN "yield" DROP NOT NULL,
  ALTER COLUMN "area" DROP NOT NULL,
  ADD COLUMN "priceQualifier" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "annualIncome" DOUBLE PRECISION,
  ADD COLUMN "incomeType" TEXT NOT NULL DEFAULT 'Reported annual income';
