CREATE TABLE `extended_network` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contactId` int NOT NULL,
	`associateName` varchar(255) NOT NULL,
	`associateRole` varchar(255),
	`associateOrg` varchar(255),
	`connectionReason` text,
	`connectionType` varchar(100),
	`linkedinUrl` varchar(500),
	`confidence` enum('high','medium','low') DEFAULT 'medium',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `extended_network_id` PRIMARY KEY(`id`)
);
