-- Run this first if your MySQL user can create databases.
CREATE DATABASE IF NOT EXISTS kapitbisig_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE kapitbisig_db;

SELECT DATABASE() AS active_database;
