-- AlterTable
ALTER TABLE `Question` ADD COLUMN `rankSlug` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Session` ADD COLUMN `currentBookSlug` VARCHAR(191) NULL,
    ADD COLUMN `rank` VARCHAR(191) NOT NULL DEFAULT 'initiate',
    ADD COLUMN `rankUpdatedAt` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `BossExamAttempt` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sessionToken` VARCHAR(191) NOT NULL,
    `bookSlug` VARCHAR(191) NOT NULL,
    `rankSlug` VARCHAR(191) NOT NULL,
    `passed` BOOLEAN NOT NULL DEFAULT false,
    `score` INTEGER NOT NULL DEFAULT 0,
    `mastery` INTEGER NOT NULL DEFAULT 0,
    `helpUsedJson` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `BossExamAttempt_sessionToken_bookSlug_rankSlug_idx`(`sessionToken`, `bookSlug`, `rankSlug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
