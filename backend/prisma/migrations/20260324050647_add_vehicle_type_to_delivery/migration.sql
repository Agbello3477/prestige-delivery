-- AlterTable
ALTER TABLE "Delivery" ADD COLUMN     "isSettled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vehicleType" TEXT DEFAULT 'BIKE';
