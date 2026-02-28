ALTER TABLE `contacts` ADD `sector` varchar(500);--> statement-breakpoint
ALTER TABLE `contacts` ADD `confidence` enum('high','medium','low');--> statement-breakpoint
ALTER TABLE `contacts` ADD `companyDomain` varchar(255);--> statement-breakpoint
ALTER TABLE `contacts` ADD `companyDescription` text;