PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`phone` text,
	`bio` text,
	`avatar` text,
	`role` text DEFAULT 'Cleaner' NOT NULL,
	`location` text,
	`status` text DEFAULT 'Active' NOT NULL,
	`access` text DEFAULT '[]' NOT NULL,
	`country` text,
	`city` text,
	`postal_code` text,
	`tax_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "name", "email", "password", "phone", "bio", "avatar", "role", "location", "status", "access", "country", "city", "postal_code", "tax_id", "created_at", "updated_at") SELECT "id", "name", "email", "password", "phone", "bio", "avatar", "role", "location", "status", "access", "country", "city", "postal_code", "tax_id", "created_at", "updated_at" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);