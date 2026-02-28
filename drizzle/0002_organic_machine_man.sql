CREATE TABLE `access_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(255),
	`reason` text,
	`status` enum('pending','approved','denied') NOT NULL DEFAULT 'pending',
	`reviewedBy` varchar(320),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `access_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`action` enum('profile_view','note_added','note_deleted','access_approved','access_denied','whitelist_added','whitelist_removed') NOT NULL,
	`actorEmail` varchar(320) NOT NULL,
	`actorName` varchar(255),
	`targetType` varchar(50),
	`targetId` int,
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_whitelist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`addedBy` varchar(320),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_whitelist_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_whitelist_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `meeting_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contactId` int NOT NULL,
	`authorEmail` varchar(320) NOT NULL,
	`authorName` varchar(255),
	`noteType` enum('meeting','call','email','follow_up','general') NOT NULL DEFAULT 'general',
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `meeting_notes_id` PRIMARY KEY(`id`)
);
