-- AlterTable
ALTER TABLE `Question` MODIFY `phase` ENUM('micro', 'quiz', 'boss', 'sample') NOT NULL DEFAULT 'quiz';
