CREATE DATABASE IF NOT EXISTS pos_rental;
USE pos_rental;

-- --------------------------------------------------------
-- Tabel `users` (Manajemen Akun & Kasir)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `transactions`;
DROP TABLE IF EXISTS `vehicles`;
DROP TABLE IF EXISTS `customers`;
DROP TABLE IF EXISTS `users`;

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('owner', 'cashier') NOT NULL,
  `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data Dummy User
INSERT INTO `users` (`username`, `password_hash`, `role`, `status`) VALUES
('admin', '$2b$12$BQOiztkManO9J2c0yZ0QCe7efB2MUUqMmTi8VjRFJWioJoHDhxUaW', 'owner', 'approved'),
('kasir', '$2b$12$T80VEu46T/gWwrYe5Ls34OSDMYcJd2Hzn5K.K.EXe.FwSZNRI/vD6', 'cashier', 'approved');


-- --------------------------------------------------------
-- Tabel `customers` (Data Pelanggan)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `customers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `full_name` VARCHAR(100) NOT NULL,
  `phone_number` VARCHAR(20) NOT NULL,
  `ktp_encrypted` TEXT NOT NULL COMMENT 'AES-256 Encrypted KTP Data',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- --------------------------------------------------------
-- Tabel `vehicles` (Master Data Kendaraan)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `vehicles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `plate_number` VARCHAR(20) NOT NULL UNIQUE,
  `brand_model` VARCHAR(100) NOT NULL,
  `vehicle_type` ENUM('car', 'motorcycle') NOT NULL,
  `status` ENUM('available', 'rented', 'maintenance') DEFAULT 'available',
  `daily_rate` DECIMAL(10,2) NOT NULL,
  `image_url` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data Dummy Kendaraan
INSERT INTO `vehicles` (`plate_number`, `brand_model`, `vehicle_type`, `status`, `daily_rate`, `image_url`) VALUES
('D 1234 ABC', 'Toyota Avanza 2023', 'car', 'available', 350000.00, 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=500&q=80'),
('D 5678 DEF', 'Honda Vario 160', 'motorcycle', 'available', 100000.00, 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fd?w=500&q=80'),
('B 9999 XYZ', 'Honda Brio Satya', 'car', 'available', 300000.00, 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=500&q=80');


-- --------------------------------------------------------
-- Tabel `transactions` (Penyewaan & Pembayaran)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `transactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Digunakan untuk ID di Midtrans',
  `cashier_id` INT NULL,
  `customer_id` INT NULL,
  `vehicle_id` INT NULL,
  
  `customer_name` VARCHAR(100) NOT NULL,
  `customer_phone` VARCHAR(20) NOT NULL,
  `vehicle_name` VARCHAR(100) NOT NULL,
  
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `total_days` INT NOT NULL,
  `total_amount` DECIMAL(12,2) NOT NULL,
  
  `actual_return_date` DATE NULL,
  `penalty_amount` DECIMAL(12,2) DEFAULT 0,
  `trx_status` ENUM('active', 'completed') DEFAULT 'active',
  
  `payment_type` VARCHAR(50) NOT NULL COMMENT 'midtrans, cash, debit',
  `payment_status` ENUM('pending', 'success', 'failed', 'expired', 'challenge') DEFAULT 'pending',
  `snap_token` VARCHAR(255) NULL COMMENT 'Token Snap dari Midtrans',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`cashier_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
