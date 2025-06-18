ALTER TABLE `shifts` ADD `job_ended_at` integer;--> statement-breakpoint
ALTER TABLE `shifts` ADD `scheduled_in_time` integer;--> statement-breakpoint
ALTER TABLE `shifts` ADD `scheduled_out_time` integer;--> statement-breakpoint
ALTER TABLE `shifts` ADD `logged_in_time` integer;--> statement-breakpoint
ALTER TABLE `shifts` ADD `logged_out_time` integer;--> statement-breakpoint
ALTER TABLE `shifts` ADD `pause_log` text;