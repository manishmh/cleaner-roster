PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_staff` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`phone` text,
	`role` text DEFAULT 'cleaner' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_staff`("id", "name", "email", "phone", "role", "is_active", "created_at", "updated_at") SELECT "id", "name", "email", "phone", "role", "is_active", "created_at", "updated_at" FROM `staff`;--> statement-breakpoint
DROP TABLE `staff`;--> statement-breakpoint
ALTER TABLE `__new_staff` RENAME TO `staff`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `role`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `location`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `status`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `access`;