/*
  Warnings:

  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `encryptedPassword` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `nickname` on the `User` table. All the data in the column will be lost.
  - The `id` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `userId` on the `Comment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `B` on the `_ProductToUser` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_userId_fkey";

-- DropForeignKey
ALTER TABLE "_ProductToUser" DROP CONSTRAINT "_ProductToUser_B_fkey";

-- AlterTable
ALTER TABLE "Comment" DROP COLUMN "userId",
ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "encryptedPassword",
DROP COLUMN "image",
DROP COLUMN "nickname",
ADD COLUMN     "name" TEXT,
ADD COLUMN     "password" TEXT,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "_ProductToUser" DROP COLUMN "B",
ADD COLUMN     "B" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "_ProductToUser_AB_unique" ON "_ProductToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_ProductToUser_B_index" ON "_ProductToUser"("B");

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductToUser" ADD CONSTRAINT "_ProductToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
