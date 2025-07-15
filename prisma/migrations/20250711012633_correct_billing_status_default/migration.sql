/*
  Warnings:

  - The `billingStatus` column on the `tenants` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "tenants" DROP COLUMN "billingStatus",
ADD COLUMN     "billingStatus" "BillingStatus" NOT NULL DEFAULT 'ACTIVE';
