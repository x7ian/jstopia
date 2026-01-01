-- AlterTable
ALTER TABLE `Question` ADD COLUMN `phase` ENUM('micro', 'quiz', 'boss') NOT NULL DEFAULT 'quiz';
