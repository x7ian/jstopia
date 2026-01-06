/*
  Warnings:

  - A unique constraint covering the columns `[taskQuestionId]` on the table `DocBlock` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `DocBlock` ADD COLUMN `taskQuestionId` INTEGER NULL;

-- CreateIndex
CREATE UNIQUE INDEX `DocBlock_taskQuestionId_key` ON `DocBlock`(`taskQuestionId`);

-- AddForeignKey
ALTER TABLE `DocBlock` ADD CONSTRAINT `DocBlock_taskQuestionId_fkey` FOREIGN KEY (`taskQuestionId`) REFERENCES `Question`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
