-- Kapitbisig MySQL Schema
-- Based on ERD + DFD (Web-based Crowdfunding System)

-- Auto-create and select DB on import.
CREATE DATABASE IF NOT EXISTS kapitbisig_db
	CHARACTER SET utf8mb4
	COLLATE utf8mb4_unicode_ci;
USE kapitbisig_db;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS transparency_reports;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS donations;
DROP TABLE IF EXISTS campaigns;
DROP TABLE IF EXISTS ngos;
DROP TABLE IF EXISTS payment_providers;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- USER (ERD: USER)
CREATE TABLE users (
	user_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	first_name VARCHAR(150) NOT NULL,
	last_name VARCHAR(150) NOT NULL,
	email VARCHAR(190) NOT NULL,
	password_hash VARCHAR(255) NULL,
	role ENUM('donor', 'ngo_admin', 'admin', 'superadmin') NOT NULL DEFAULT 'donor',
	date_registered DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (user_id),
	UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- NGO (ERD: NGO)
CREATE TABLE ngos (
	ngo_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	ngo_name VARCHAR(180) NOT NULL,
	description TEXT NULL,
	contact_person VARCHAR(150) NULL,
	verification_status ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending',
	user_id BIGINT UNSIGNED NOT NULL,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (ngo_id),
	KEY idx_ngos_user_id (user_id),
	CONSTRAINT fk_ngos_user
		FOREIGN KEY (user_id) REFERENCES users(user_id)
		ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CAMPAIGN (ERD: CAMPAIGN)
CREATE TABLE campaigns (
	campaign_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	title VARCHAR(200) NOT NULL,
	description TEXT NULL,
	target_amount DECIMAL(14,2) NOT NULL,
	current_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
	start_date DATE NOT NULL,
	end_date DATE NOT NULL,
	status ENUM('draft', 'pending', 'active', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
	ngo_id BIGINT UNSIGNED NOT NULL,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (campaign_id),
	KEY idx_campaigns_ngo_id (ngo_id),
	KEY idx_campaigns_status (status),
	CONSTRAINT fk_campaigns_ngo
		FOREIGN KEY (ngo_id) REFERENCES ngos(ngo_id)
		ON UPDATE CASCADE ON DELETE RESTRICT,
	CONSTRAINT chk_campaign_amount CHECK (target_amount > 0),
	CONSTRAINT chk_campaign_dates CHECK (end_date >= start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DONATION (ERD: DONATION)
CREATE TABLE donations (
	donation_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	amount DECIMAL(14,2) NOT NULL,
	donation_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	user_id BIGINT UNSIGNED NOT NULL,
	campaign_id BIGINT UNSIGNED NOT NULL,
	message VARCHAR(255) NULL,
	PRIMARY KEY (donation_id),
	KEY idx_donations_user_id (user_id),
	KEY idx_donations_campaign_id (campaign_id),
	KEY idx_donations_date (donation_date),
	CONSTRAINT fk_donations_user
		FOREIGN KEY (user_id) REFERENCES users(user_id)
		ON UPDATE CASCADE ON DELETE RESTRICT,
	CONSTRAINT fk_donations_campaign
		FOREIGN KEY (campaign_id) REFERENCES campaigns(campaign_id)
		ON UPDATE CASCADE ON DELETE RESTRICT,
	CONSTRAINT chk_donation_amount CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- PAYMENT_PROVIDER (ERD: PAYMENT_PROVIDER)
CREATE TABLE payment_providers (
	provider_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	provider_name VARCHAR(120) NOT NULL,
	type ENUM('ewallet', 'bank', 'card', 'other') NOT NULL DEFAULT 'other',
	is_active TINYINT(1) NOT NULL DEFAULT 1,
	PRIMARY KEY (provider_id),
	UNIQUE KEY uq_payment_providers_name (provider_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TRANSACTION (ERD: TRANSACTION)
CREATE TABLE transactions (
	transaction_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	amount DECIMAL(14,2) NOT NULL,
	transaction_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	status ENUM('pending', 'success', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
	donation_id BIGINT UNSIGNED NOT NULL,
	provider_id BIGINT UNSIGNED NOT NULL,
	reference_no VARCHAR(120) NULL,
	gateway_response TEXT NULL,
	PRIMARY KEY (transaction_id),
	UNIQUE KEY uq_transactions_reference_no (reference_no),
	KEY idx_transactions_donation_id (donation_id),
	KEY idx_transactions_provider_id (provider_id),
	KEY idx_transactions_status (status),
	CONSTRAINT fk_transactions_donation
		FOREIGN KEY (donation_id) REFERENCES donations(donation_id)
		ON UPDATE CASCADE ON DELETE RESTRICT,
	CONSTRAINT fk_transactions_provider
		FOREIGN KEY (provider_id) REFERENCES payment_providers(provider_id)
		ON UPDATE CASCADE ON DELETE RESTRICT,
	CONSTRAINT chk_transaction_amount CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TRANSPARENCY_REPORT (ERD: TRANSPARENCY_REPORT)
-- Includes campaign_id to support DFD project update/report flow.
CREATE TABLE transparency_reports (
	report_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	date_generated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	details TEXT NOT NULL,
	transaction_id BIGINT UNSIGNED NULL,
	campaign_id BIGINT UNSIGNED NULL,
	generated_by BIGINT UNSIGNED NULL,
	PRIMARY KEY (report_id),
	KEY idx_transparency_reports_transaction_id (transaction_id),
	KEY idx_transparency_reports_campaign_id (campaign_id),
	KEY idx_transparency_reports_generated_by (generated_by),
	CONSTRAINT fk_transparency_reports_transaction
		FOREIGN KEY (transaction_id) REFERENCES transactions(transaction_id)
		ON UPDATE CASCADE ON DELETE SET NULL,
	CONSTRAINT fk_transparency_reports_campaign
		FOREIGN KEY (campaign_id) REFERENCES campaigns(campaign_id)
		ON UPDATE CASCADE ON DELETE SET NULL,
	CONSTRAINT fk_transparency_reports_generated_by
		FOREIGN KEY (generated_by) REFERENCES users(user_id)
		ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional starter payment providers
INSERT INTO payment_providers (provider_name, type) VALUES
('GCash', 'ewallet'),
('Maya', 'ewallet'),
('Bank Transfer', 'bank')
ON DUPLICATE KEY UPDATE provider_name = VALUES(provider_name);

