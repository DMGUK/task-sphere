/*
  Warnings:

  - You are about to alter the column `status` on the `Task` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(1))`.

*/
-- AlterTable
ALTER TABLE `Task` ADD COLUMN `originalStatus` ENUM('todo', 'in_progress', 'done') NOT NULL DEFAULT 'todo',
    MODIFY `status` ENUM('todo', 'in_progress', 'done') NOT NULL DEFAULT 'todo';
