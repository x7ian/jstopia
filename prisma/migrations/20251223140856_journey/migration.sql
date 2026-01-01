-- CreateTable
CREATE TABLE `Book` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `storyIntro` TEXT NULL,
    `themeJson` JSON NULL,
    `lockedByDefault` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `Book_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Chapter` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bookId` INTEGER NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `storyIntro` TEXT NULL,
    `themeOverrideJson` JSON NULL,
    `heroImage` VARCHAR(512) NULL,
    `lockedByDefault` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `Chapter_bookId_slug_key`(`bookId`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Topic` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `chapterId` INTEGER NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `storyIntro` TEXT NULL,
    `docPageId` INTEGER NULL,
    `lockedByDefault` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `Topic_slug_key`(`slug`),
    UNIQUE INDEX `Topic_docPageId_key`(`docPageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DocPage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `mdxPath` VARCHAR(512) NOT NULL,
    `chapterId` INTEGER NULL,
    `topicId` INTEGER NULL,
    `objectives` JSON NULL,
    `estimatedMinutes` INTEGER NULL,

    UNIQUE INDEX `DocPage_slug_key`(`slug`),
    INDEX `DocPage_chapterId_idx`(`chapterId`),
    INDEX `DocPage_topicId_idx`(`topicId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DocBlock` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `docPageId` INTEGER NOT NULL,
    `anchor` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NULL,
    `kind` VARCHAR(32) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `excerpt` TEXT NULL,
    `contentMd` LONGTEXT NULL,

    UNIQUE INDEX `DocBlock_docPageId_anchor_key`(`docPageId`, `anchor`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Question` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `topicId` INTEGER NOT NULL,
    `difficulty` ENUM('basic', 'medium', 'advanced') NOT NULL,
    `type` ENUM('mcq', 'code_output', 'code_complete') NOT NULL,
    `prompt` LONGTEXT NOT NULL,
    `code` LONGTEXT NULL,
    `choicesJson` JSON NULL,
    `answer` TEXT NOT NULL,
    `tip1` TEXT NOT NULL,
    `tip2` TEXT NULL,
    `explanationShort` LONGTEXT NOT NULL,
    `docPageId` INTEGER NULL,
    `answerDocBlockId` INTEGER NULL,
    `referencesJson` JSON NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Session` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sessionToken` VARCHAR(191) NOT NULL,
    `totalScore` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Session_sessionToken_key`(`sessionToken`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TopicProgress` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sessionToken` VARCHAR(191) NOT NULL,
    `topicId` INTEGER NOT NULL,
    `status` ENUM('locked', 'unlocked', 'completed') NOT NULL DEFAULT 'locked',
    `score` INTEGER NOT NULL DEFAULT 0,
    `completedAt` DATETIME(3) NULL,

    UNIQUE INDEX `TopicProgress_sessionToken_topicId_key`(`sessionToken`, `topicId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Attempt` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sessionToken` VARCHAR(191) NOT NULL,
    `questionId` INTEGER NOT NULL,
    `correct` BOOLEAN NOT NULL,
    `selected` TEXT NULL,
    `elapsedMs` INTEGER NOT NULL DEFAULT 0,
    `helpUsed` ENUM('none', 'tip', 'doc') NOT NULL DEFAULT 'none',
    `tipCount` INTEGER NOT NULL DEFAULT 0,
    `scoreAwarded` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Attempt_questionId_idx`(`questionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Chapter` ADD CONSTRAINT `Chapter_bookId_fkey` FOREIGN KEY (`bookId`) REFERENCES `Book`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Topic` ADD CONSTRAINT `Topic_chapterId_fkey` FOREIGN KEY (`chapterId`) REFERENCES `Chapter`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Topic` ADD CONSTRAINT `Topic_docPageId_fkey` FOREIGN KEY (`docPageId`) REFERENCES `DocPage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocPage` ADD CONSTRAINT `DocPage_chapterId_fkey` FOREIGN KEY (`chapterId`) REFERENCES `Chapter`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocPage` ADD CONSTRAINT `DocPage_topicId_fkey` FOREIGN KEY (`topicId`) REFERENCES `Topic`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocBlock` ADD CONSTRAINT `DocBlock_docPageId_fkey` FOREIGN KEY (`docPageId`) REFERENCES `DocPage`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Question` ADD CONSTRAINT `Question_topicId_fkey` FOREIGN KEY (`topicId`) REFERENCES `Topic`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Question` ADD CONSTRAINT `Question_docPageId_fkey` FOREIGN KEY (`docPageId`) REFERENCES `DocPage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Question` ADD CONSTRAINT `Question_answerDocBlockId_fkey` FOREIGN KEY (`answerDocBlockId`) REFERENCES `DocBlock`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TopicProgress` ADD CONSTRAINT `TopicProgress_sessionToken_fkey` FOREIGN KEY (`sessionToken`) REFERENCES `Session`(`sessionToken`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TopicProgress` ADD CONSTRAINT `TopicProgress_topicId_fkey` FOREIGN KEY (`topicId`) REFERENCES `Topic`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attempt` ADD CONSTRAINT `Attempt_sessionToken_fkey` FOREIGN KEY (`sessionToken`) REFERENCES `Session`(`sessionToken`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attempt` ADD CONSTRAINT `Attempt_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
