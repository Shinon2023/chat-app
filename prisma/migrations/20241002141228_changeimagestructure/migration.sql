/*
  Warnings:

  - You are about to drop the column `nationalIdImgPath` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `imgPath` on the `Stock` table. All the data in the column will be lost.
  - The `profilePicture` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "nationalIdImgPath",
ADD COLUMN     "nationalIdImgUrl" BYTEA;

-- AlterTable
ALTER TABLE "Stock" DROP COLUMN "imgPath",
ADD COLUMN     "img" BYTEA;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "profilePicture",
ADD COLUMN     "profilePicture" BYTEA;
