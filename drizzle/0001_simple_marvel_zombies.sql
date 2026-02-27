CREATE TABLE `access_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(320) NOT NULL,
	`email` varchar(320) NOT NULL,
	`reason` text,
	`status` enum('pending','approved','denied') NOT NULL DEFAULT 'pending',
	`reviewedBy` varchar(320),
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `access_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whitelist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` text,
	`approvedBy` varchar(320),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `whitelist_id` PRIMARY KEY(`id`),
	CONSTRAINT `whitelist_email_unique` UNIQUE(`email`)
);
