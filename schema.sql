-- =========================================================================
-- MI HUMM - BASE DE DATOS RELACIONAL (MYSQL / MARIADB PARA HOSTGATOR CPANEL)
-- Comunidad Humm Co-Creation & Plataforma de Gestión Comercial
-- Charset: utf8mb4 / Collation: utf8mb4_unicode_ci
-- =========================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "-03:00";

-- -------------------------------------------------------------------------
-- 1. TABLA: workspaces (Emprendimientos / Negocios)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `workspaces` (
  `id` VARCHAR(40) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `owner_name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `city` VARCHAR(100) DEFAULT NULL,
  `region` VARCHAR(100) DEFAULT NULL,
  `industry` VARCHAR(120) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `membership_status` ENUM('active', 'trial', 'suspended') DEFAULT 'active',
  `membership_type` VARCHAR(100) DEFAULT 'Membresía Humm Co-Creation',
  `advisor_name` VARCHAR(120) DEFAULT NULL,
  `advisor_email` VARCHAR(150) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_ws_email` (`email`),
  INDEX `idx_ws_status` (`membership_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 2. TABLA: users (Usuarios de la Comunidad y Administradores)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(40) NOT NULL,
  `workspace_id` VARCHAR(40) DEFAULT NULL,
  `name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('entrepreneur', 'advisor', 'admin') DEFAULT 'entrepreneur',
  `specialty` VARCHAR(150) DEFAULT NULL,
  `avatar` VARCHAR(10) DEFAULT 'U',
  `theme` ENUM('light', 'dark') DEFAULT 'light',
  `is_active` TINYINT(1) DEFAULT 1,
  `assigned_tool_ids` TEXT DEFAULT NULL,
  `advisor_name` VARCHAR(120) DEFAULT NULL,
  `advisor_email` VARCHAR(150) DEFAULT NULL,
  `must_change_password` TINYINT(1) DEFAULT 0,
  `reset_token` VARCHAR(100) DEFAULT NULL,
  `last_access` DATETIME DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_email` (`email`),
  INDEX `idx_user_role` (`role`),
  INDEX `idx_user_workspace` (`workspace_id`),
  INDEX `idx_user_active` (`is_active`),
  CONSTRAINT `fk_user_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 3. TABLA: subscription_plans (Planes de Venta Mensual Humm)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `subscription_plans` (
  `id` VARCHAR(40) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `price` INT UNSIGNED NOT NULL DEFAULT 0,
  `trial_days` INT UNSIGNED NOT NULL DEFAULT 14,
  `description` TEXT DEFAULT NULL,
  `features` TEXT DEFAULT NULL,
  `status` ENUM('active', 'paused') DEFAULT 'active',
  `sort_order` INT NOT NULL DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_plan_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 4. TABLA: subscriptions (Suscripciones, Cobros y Períodos de Prueba)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `subscriptions` (
  `id` VARCHAR(40) NOT NULL,
  `user_id` VARCHAR(40) NOT NULL,
  `workspace_id` VARCHAR(40) DEFAULT NULL,
  `client_name` VARCHAR(120) NOT NULL,
  `client_email` VARCHAR(150) NOT NULL,
  `client_phone` VARCHAR(50) DEFAULT NULL,
  `business_name` VARCHAR(150) DEFAULT NULL,
  `plan_id` VARCHAR(40) NOT NULL,
  `plan_name` VARCHAR(120) NOT NULL,
  `monthly_price` INT UNSIGNED NOT NULL DEFAULT 0,
  `status` ENUM('trial', 'active', 'overdue', 'cancelled') DEFAULT 'trial',
  `trial_days_total` INT UNSIGNED DEFAULT 14,
  `trial_days_left` INT UNSIGNED DEFAULT 14,
  `is_trial` TINYINT(1) DEFAULT 1,
  `payment_status` ENUM('paid', 'pending', 'overdue') DEFAULT 'pending',
  `joined_date` DATE DEFAULT NULL,
  `last_payment_date` DATE DEFAULT NULL,
  `next_billing_date` DATE DEFAULT NULL,
  `payment_method` VARCHAR(100) DEFAULT 'Webpay Débito/Crédito',
  `payment_link` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_sub_user` (`user_id`),
  INDEX `idx_sub_plan` (`plan_id`),
  INDEX `idx_sub_status` (`status`),
  INDEX `idx_sub_payment` (`payment_status`),
  CONSTRAINT `fk_sub_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_sub_plan` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 5. TABLA: customers (Clientes de cada Emprendedor)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `customers` (
  `id` VARCHAR(40) NOT NULL,
  `workspace_id` VARCHAR(40) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `last_name` VARCHAR(100) DEFAULT NULL,
  `rut` VARCHAR(20) DEFAULT NULL,
  `email` VARCHAR(150) DEFAULT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `company` VARCHAR(150) DEFAULT NULL,
  `region` VARCHAR(100) DEFAULT NULL,
  `comuna` VARCHAR(100) DEFAULT NULL,
  `city` VARCHAR(100) DEFAULT NULL,
  `address` VARCHAR(200) DEFAULT NULL,
  `source_channel` VARCHAR(100) DEFAULT 'Recomendación',
  `status` VARCHAR(50) DEFAULT 'active',
  `total_purchases` INT UNSIGNED DEFAULT 0,
  `last_purchase_date` DATE DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_cust_workspace` (`workspace_id`),
  INDEX `idx_cust_email` (`email`),
  CONSTRAINT `fk_cust_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 6. TABLA: sales (Registro de Ventas y Cobros de Emprendedores)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sales` (
  `id` VARCHAR(40) NOT NULL,
  `workspace_id` VARCHAR(40) NOT NULL,
  `customer_id` VARCHAR(40) DEFAULT NULL,
  `customer_name` VARCHAR(120) NOT NULL,
  `total_amount` INT UNSIGNED NOT NULL DEFAULT 0,
  `payment_status` VARCHAR(50) DEFAULT 'pagado',
  `payment_method` VARCHAR(50) DEFAULT 'Transferencia',
  `sale_date` DATE NOT NULL,
  `due_date` DATE DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_sales_workspace` (`workspace_id`),
  INDEX `idx_sales_customer` (`customer_id`),
  INDEX `idx_sales_date` (`sale_date`),
  INDEX `idx_sales_status` (`payment_status`),
  CONSTRAINT `fk_sales_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_sales_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 7. TABLA: tasks (Gestor de Tareas y Tablero Kanban)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tasks` (
  `id` VARCHAR(40) NOT NULL,
  `workspace_id` VARCHAR(40) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `priority` VARCHAR(50) DEFAULT 'media',
  `start_date` DATE DEFAULT NULL,
  `status` VARCHAR(50) DEFAULT 'todo',
  `due_date` DATE DEFAULT NULL,
  `tag` VARCHAR(100) DEFAULT NULL,
  `customer_id` VARCHAR(40) DEFAULT NULL,
  `opportunity_id` VARCHAR(40) DEFAULT NULL,
  `completed_at` DATETIME DEFAULT NULL,
  `assigned_to` VARCHAR(120) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_task_workspace` (`workspace_id`),
  INDEX `idx_task_status` (`status`),
  INDEX `idx_task_due` (`due_date`),
  CONSTRAINT `fk_task_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 8. TABLA: calendar_events (Calendario de Reuniones y Visitas)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `calendar_events` (
  `id` VARCHAR(40) NOT NULL,
  `workspace_id` VARCHAR(40) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `event_type` VARCHAR(50) DEFAULT 'reunion',
  `customer_id` VARCHAR(40) DEFAULT NULL,
  `event_date` DATE NOT NULL,
  `event_time` TIME DEFAULT NULL,
  `end_time` TIME DEFAULT NULL,
  `location` VARCHAR(255) DEFAULT NULL,
  `meeting_link` VARCHAR(255) DEFAULT NULL,
  `status` VARCHAR(50) DEFAULT 'programado',
  `notes` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_cal_workspace` (`workspace_id`),
  INDEX `idx_cal_date` (`event_date`),
  CONSTRAINT `fk_cal_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 9. TABLA: quick_notes (Bloc de Notas Rápidas)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `quick_notes` (
  `id` VARCHAR(40) NOT NULL,
  `workspace_id` VARCHAR(40) NOT NULL,
  `title` VARCHAR(200) NOT NULL DEFAULT 'Sin título',
  `content` TEXT DEFAULT NULL,
  `category` VARCHAR(50) DEFAULT 'general',
  `color` VARCHAR(20) DEFAULT 'yellow',
  `is_pinned` TINYINT(1) DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_notes_workspace` (`workspace_id`),
  INDEX `idx_notes_pinned` (`is_pinned`),
  CONSTRAINT `fk_notes_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 10. TABLA: opportunities (Embudo de Oportunidades y Negociaciones)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `opportunities` (
  `id` VARCHAR(40) NOT NULL,
  `workspace_id` VARCHAR(40) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `contact_name` VARCHAR(120) DEFAULT NULL,
  `customer_name` VARCHAR(120) NOT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `email` VARCHAR(150) DEFAULT NULL,
  `product_interest` VARCHAR(200) DEFAULT NULL,
  `estimated_amount` INT UNSIGNED NOT NULL DEFAULT 0,
  `estimated_value` INT UNSIGNED NOT NULL DEFAULT 0,
  `status` VARCHAR(50) DEFAULT 'nuevo',
  `stage` VARCHAR(50) DEFAULT 'prospecto',
  `next_action` VARCHAR(200) DEFAULT NULL,
  `follow_up_date` DATE DEFAULT NULL,
  `expected_close_date` DATE DEFAULT NULL,
  `source_channel` VARCHAR(100) DEFAULT 'Otro',
  `notes` TEXT DEFAULT NULL,
  `customer_id` VARCHAR(40) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_opp_workspace` (`workspace_id`),
  INDEX `idx_opp_customer` (`customer_id`),
  INDEX `idx_opp_stage` (`stage`),
  CONSTRAINT `fk_opp_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 11. TABLA: support_requests (Solicitudes de Apoyo y Mentoría Humm)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `support_requests` (
  `id` VARCHAR(40) NOT NULL,
  `workspace_id` VARCHAR(40) NOT NULL,
  `user_id` VARCHAR(40) DEFAULT NULL,
  `workspace_name` VARCHAR(150) NOT NULL,
  `user_name` VARCHAR(120) NOT NULL,
  `user_email` VARCHAR(150) NOT NULL,
  `request_type` VARCHAR(100) NOT NULL,
  `subject` VARCHAR(200) NOT NULL,
  `description` TEXT NOT NULL,
  `contact_preference` VARCHAR(100) DEFAULT 'Coordinar reunión virtual',
  `advisor_name` VARCHAR(120) DEFAULT NULL,
  `advisor_email` VARCHAR(150) DEFAULT NULL,
  `status` ENUM('pendiente', 'en_proceso', 'respondido') DEFAULT 'pendiente',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_req_workspace` (`workspace_id`),
  INDEX `idx_req_status` (`status`),
  CONSTRAINT `fk_req_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 12. TABLA: company_discounts (Beneficios y Convenios Comerciales)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `company_discounts` (
  `id` VARCHAR(40) NOT NULL,
  `company_name` VARCHAR(150) NOT NULL,
  `logo` MEDIUMTEXT DEFAULT NULL,
  `discount_title` VARCHAR(200) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `description` TEXT NOT NULL,
  `code` VARCHAR(50) DEFAULT NULL,
  `url` VARCHAR(255) DEFAULT NULL,
  `expires_at` DATE DEFAULT NULL,
  `is_featured` TINYINT(1) DEFAULT 0,
  `status` ENUM('active', 'inactive') DEFAULT 'active',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_disc_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 13. TABLA: tools (Catálogo de Soluciones Humm)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tools` (
  `id` VARCHAR(40) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NOT NULL,
  `category` VARCHAR(50) NOT NULL,
  `status` ENUM('disponible', 'proximamente', 'mantenimiento') DEFAULT 'disponible',
  `url` VARCHAR(255) NOT NULL,
  `icon` MEDIUMTEXT DEFAULT NULL,
  `sort_order` INT NOT NULL DEFAULT 1,
  `is_visible` TINYINT(1) DEFAULT 1,
  `is_included` TINYINT(1) DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 14. TABLA: broadcasts (Difusión y Comunicados Masivos)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `broadcasts` (
  `id` VARCHAR(40) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `category` VARCHAR(100) DEFAULT 'Noticia de la Comunidad',
  `target_audience` VARCHAR(100) DEFAULT 'Todos los Emprendedores',
  `content` TEXT DEFAULT NULL,
  `author_name` VARCHAR(120) DEFAULT 'Administración Humm',
  `channels` TEXT DEFAULT NULL,
  `reach_count` INT DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================================
-- DATOS SEMILLA INICIALES (PRODUCCIÓN - PARTIDA DE CERO)
-- =========================================================================

-- Usuario Administrador Central Inicial (contacto@humm.cl / humm2026)
INSERT INTO `users` (`id`, `workspace_id`, `name`, `email`, `password_hash`, `role`, `avatar`, `is_active`, `assigned_tool_ids`, `advisor_name`, `advisor_email`, `created_at`) VALUES
('usr-admin', NULL, 'Administrador Humm', 'contacto@humm.cl', '$2y$10$tZ2E7f2i7rY7r0qXgR6E6e.rR8i.XjP8LqjP2n8nE.1N2k3l4m5O6', 'admin', 'AH', 1, '[]', NULL, NULL, '2026-01-01 08:00:00')
ON DUPLICATE KEY UPDATE role = 'admin', is_active = 1;

-- Subscription Plans
INSERT INTO `subscription_plans` (`id`, `name`, `price`, `trial_days`, `description`, `features`, `status`, `sort_order`) VALUES
('plan-base', 'Plan Emprendedor Base', 19990, 14, 'Acceso a herramientas esenciales de gestión comercial y red de apoyo.', '["2 Herramientas Humm a elección", "14 días de prueba gratuita", "Soporte y comunidad", "Acceso a red de convenios"]', 'active', 1),
('plan-crecimiento', 'Plan Crecimiento Humm', 34990, 30, 'El plan más popular para negocios en expansión. Acceso a todas las herramientas y tutoría.', '["Todas las herramientas Humm habilitadas", "30 días de prueba gratuita", "Tutor y ejecutivo exclusivo", "Descuentos de empresas colaboradoras"]', 'active', 2),
('plan-pro', 'Plan Pro Co-Creation', 59990, 0, 'Máximo nivel de acompañamiento con consultoría 1 a 1 y vitrina comercial destacada.', '["Suite completa de soluciones Humm", "Mentorías personalizadas mensuales", "Vitrina y difusión destacada", "Sin periodo de prueba (Pago directo)"]', 'active', 3)
ON DUPLICATE KEY UPDATE price = VALUES(price), trial_days = VALUES(trial_days), description = VALUES(description), features = VALUES(features), status = VALUES(status), sort_order = VALUES(sort_order);

-- Tools (Catálogo de Soluciones Humm)
INSERT INTO `tools` (`id`, `name`, `description`, `category`, `status`, `url`, `icon`, `sort_order`, `is_visible`, `is_included`) VALUES
('tool-reloop', 'ReLoop', 'Optimiza tus procesos comerciales, recompra y fidelización de clientes.', 'Ventas', 'disponible', 'https://reloop.humm.cl', 'reloop', 1, 1, 1),
('tool-hummailing', 'Hummailing', 'Envía comunicaciones y campañas efectivas y personalizadas a tu lista de clientes.', 'Comunicación', 'disponible', 'https://mailing.humm.cl', 'mail', 2, 1, 1),
('tool-kinetic', 'Kinetic Control', 'Supervisa y organiza las operaciones diarias y tiempos de tu negocio.', 'Gestión', 'disponible', 'https://kinetic.humm.cl', 'activity', 3, 1, 1),
('tool-humm-radar', 'Humm Radar', 'Diagnostica la salud de tu emprendimiento y descubre oportunidades de mejora.', 'Diagnóstico', 'disponible', 'https://radar.humm.cl', 'radar', 4, 1, 1),
('tool-humm-link', 'Humm Link', 'Tu vitrina digital y enlace directo con botones de compra para bio y redes.', 'Comunicación', 'disponible', 'https://link.humm.cl', 'link', 5, 1, 1),
('tool-orientador', 'Orientador de Financiamiento', 'Descubre fondos concursables, subsidios y opciones de financiamiento para tu etapa.', 'Financiamiento', 'proximamente', 'https://fondos.humm.cl', 'dollar-sign', 6, 1, 0)
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), category = VALUES(category), status = VALUES(status), url = VALUES(url), icon = VALUES(icon), sort_order = VALUES(sort_order), is_visible = VALUES(is_visible), is_included = VALUES(is_included);

SET FOREIGN_KEY_CHECKS = 1;
