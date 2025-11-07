CREATE TABLE `images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`originalUrl` text NOT NULL,
	`pixelatedUrl` text,
	`pixelSize` int NOT NULL DEFAULT 10,
	`width` int,
	`height` int,
	`fileName` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `images_id` PRIMARY KEY(`id`)
);
