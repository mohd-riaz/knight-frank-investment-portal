ALTER TABLE "Property"
  ADD COLUMN "memorandumUrl" TEXT,
  ADD COLUMN "memorandumKey" TEXT,
  ADD COLUMN "memorandumSample" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "Material"
  ALTER COLUMN "bytes" DROP NOT NULL,
  ADD COLUMN "url" TEXT,
  ADD COLUMN "objectKey" TEXT;

ALTER TABLE "Material" ADD CONSTRAINT "Material_storage_reference_pair"
  CHECK (("url" IS NULL) = ("objectKey" IS NULL));
