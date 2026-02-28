ALTER TABLE `audit_log` MODIFY COLUMN `action` enum('profile_view','note_added','note_deleted','access_approved','access_denied','whitelist_added','whitelist_removed','contact_updated','contact_researched','invite_sent') NOT NULL;--> statement-breakpoint
ALTER TABLE `meeting_notes` MODIFY COLUMN `noteType` enum('meeting','call','email','follow_up','general','research') NOT NULL DEFAULT 'general';--> statement-breakpoint
ALTER TABLE `contacts` ADD `linkedinUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `contacts` ADD `lastResearchedAt` timestamp;