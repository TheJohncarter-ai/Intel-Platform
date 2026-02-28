CREATE TABLE `audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(320) NOT NULL,
	`userEmail` varchar(320) NOT NULL,
	`action` enum('profile_view','note_added','note_deleted') NOT NULL,
	`contactId` int NOT NULL,
	`contactName` varchar(320) NOT NULL,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contact_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contactId` int NOT NULL,
	`contactName` varchar(320) NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(320) NOT NULL,
	`userEmail` varchar(320) NOT NULL,
	`noteType` enum('meeting','interaction','follow_up','general') NOT NULL DEFAULT 'general',
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contact_notes_id` PRIMARY KEY(`id`)
);
