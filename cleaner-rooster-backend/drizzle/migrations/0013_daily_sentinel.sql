PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_shift_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`shift_id` integer NOT NULL,
	`message_text` text NOT NULL,
	`created_by` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`shift_id`) REFERENCES `shifts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_shift_messages`("id", "shift_id", "message_text", "created_by", "created_at") SELECT "id", "shift_id", "message_text", "created_by", "created_at" FROM `shift_messages`;--> statement-breakpoint
DROP TABLE `shift_messages`;--> statement-breakpoint
ALTER TABLE `__new_shift_messages` RENAME TO `shift_messages`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `locations` ADD `latitude` real;--> statement-breakpoint
ALTER TABLE `locations` ADD `longitude` real;--> statement-breakpoint
ALTER TABLE `locations` ADD `place_id` text;--> statement-breakpoint
ALTER TABLE `locations` ADD `formatted_address` text;--> statement-breakpoint
ALTER TABLE `locations` ADD `last_used_at` integer;