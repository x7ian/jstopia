-- AlterTable
ALTER TABLE `Question` ADD COLUMN `expectedJson` JSON NULL,
    ADD COLUMN `filesJson` JSON NULL,
    MODIFY `type` ENUM('mcq', 'code_output', 'code_complete', 'code') NOT NULL;
