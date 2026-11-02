ALTER TABLE "Property" ADD COLUMN "publication" TEXT NOT NULL DEFAULT 'published';
ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'client', ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active', ADD COLUMN "company" TEXT NOT NULL DEFAULT '';
CREATE TABLE "Invitation" ("id" UUID PRIMARY KEY, "tokenHash" TEXT NOT NULL UNIQUE, "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE, "expiresAt" TIMESTAMP(3) NOT NULL);
CREATE TABLE "Material" ("id" UUID PRIMARY KEY, "propertyId" TEXT NOT NULL REFERENCES "Property"("id") ON DELETE CASCADE, "kind" TEXT NOT NULL, "name" TEXT NOT NULL, "mime" TEXT NOT NULL, "bytes" BYTEA NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX "Material_propertyId_kind_idx" ON "Material"("propertyId", "kind");
ALTER TYPE "RequestStatus" ADD VALUE 'approved';
ALTER TYPE "RequestStatus" ADD VALUE 'declined';
