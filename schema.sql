-- Smart Car Park Telemetry Database Schema
-- Database: smartpark

CREATE DATABASE IF NOT EXISTS smartpark
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE smartpark;

-- 1. Bays Table
-- Tracks current occupancy and timestamp of last change for the 3 bays
CREATE TABLE IF NOT EXISTS bays (
  id INT PRIMARY KEY,
  occupied BOOLEAN NOT NULL DEFAULT FALSE,
  changed_at DATETIME(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed initial bays 1, 2, 3
INSERT IGNORE INTO bays (id, occupied, changed_at) VALUES
  (1, FALSE, NOW(3)),
  (2, FALSE, NOW(3)),
  (3, FALSE, NOW(3));

-- 2. Device Table
-- Tracks heartbeat and online status of the ESP32 hardware
CREATE TABLE IF NOT EXISTS device (
  id VARCHAR(32) PRIMARY KEY,
  last_seen DATETIME(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed initial device state
INSERT IGNORE INTO device (id, last_seen) VALUES
  ('esp32', NOW(3));

-- 3. Events Table
-- Real-time audit log of hardware events (ENTRY, EXIT, BAY, FULL, SYSTEM_START)
CREATE TABLE IF NOT EXISTS events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  created_at DATETIME(3) NOT NULL,
  event VARCHAR(32) NOT NULL,
  bay INT NULL,
  state BOOLEAN NULL,
  INDEX idx_created_at (created_at),
  INDEX idx_event_created_at (event, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
