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
  `advisor_name` VARCHAR(120) DEFAULT 'Valentina Castro',
  `advisor_email` VARCHAR(150) DEFAULT 'valentina@humm.cl',
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
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('entrepreneur', 'advisor', 'admin') DEFAULT 'entrepreneur',
  `avatar` VARCHAR(10) DEFAULT 'U',
  `theme` ENUM('light', 'dark') DEFAULT 'light',
  `is_active` TINYINT(1) DEFAULT 1,
  `assigned_tool_ids` TEXT DEFAULT NULL,
  `advisor_name` VARCHAR(120) DEFAULT NULL,
  `advisor_email` VARCHAR(150) DEFAULT NULL,
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
  `email` VARCHAR(150) DEFAULT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `company` VARCHAR(150) DEFAULT NULL,
  `status` ENUM('activo', 'inactivo', 'prospecto') DEFAULT 'activo',
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
  `payment_status` ENUM('pagado', 'pendiente', 'anulado') DEFAULT 'pagado',
  `payment_method` VARCHAR(50) DEFAULT 'Transferencia',
  `sale_date` DATE NOT NULL,
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
-- 7. TABLA: tasks (Gestor de Tareas y Compromisos)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tasks` (
  `id` VARCHAR(40) NOT NULL,
  `workspace_id` VARCHAR(40) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `priority` ENUM('alta', 'media', 'baja') DEFAULT 'media',
  `status` ENUM('pendiente', 'en_proceso', 'completada') DEFAULT 'pendiente',
  `due_date` DATE DEFAULT NULL,
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
  `event_type` ENUM('reunion', 'visita', 'mentoria', 'entrega', 'comercial', 'otro') DEFAULT 'reunion',
  `customer_id` VARCHAR(40) DEFAULT NULL,
  `event_date` DATE NOT NULL,
  `event_time` TIME DEFAULT NULL,
  `location` VARCHAR(255) DEFAULT NULL,
  `meeting_link` VARCHAR(255) DEFAULT NULL,
  `status` ENUM('programado', 'completado', 'cancelado') DEFAULT 'programado',
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
  `category` ENUM('general', 'ideas', 'tareas', 'clientes', 'finanzas') DEFAULT 'general',
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
  `customer_name` VARCHAR(120) NOT NULL,
  `estimated_value` INT UNSIGNED NOT NULL DEFAULT 0,
  `stage` ENUM('prospecto', 'contacto', 'propuesta', 'negociacion', 'ganada', 'perdida') DEFAULT 'prospecto',
  `expected_close_date` DATE DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_opp_workspace` (`workspace_id`),
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
  `advisor_name` VARCHAR(120) DEFAULT 'Valentina Castro',
  `advisor_email` VARCHAR(150) DEFAULT 'valentina@humm.cl',
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
  `logo` VARCHAR(10) DEFAULT '🎁',
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
  `icon` VARCHAR(50) DEFAULT 'tool',
  `sort_order` INT NOT NULL DEFAULT 1,
  `is_visible` TINYINT(1) DEFAULT 1,
  `is_included` TINYINT(1) DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================================
-- DATOS SEMILLA INICIALES (SEED DATA)
-- =========================================================================

-- Workspaces
INSERT INTO `workspaces` (`id`, `name`, `owner_name`, `email`, `phone`, `city`, `region`, `industry`, `description`, `membership_status`, `membership_type`, `advisor_name`, `advisor_email`, `created_at`) VALUES
('ws-taller-austral', 'Taller Austral', 'Carolina Valenzuela', 'carolina@talleraustral.cl', '+56987654321', 'Puerto Varas', 'Los Lagos', 'Diseño y Decoración', 'Diseño y producción artesanal sustentable con maderas nativas y lana ovina.', 'active', 'Membresía Humm Pro', 'Valentina Castro', 'valentina@humm.cl', '2026-01-10 10:00:00'),
('ws-cafe-valle', 'Café del Valle', 'Juan Pérez', 'juan@cafedelvalle.cl', '+56912345678', 'La Serena', 'Coquimbo', 'Gastronomía y Café', 'Cafetería de especialidad y tostaduría artesanal.', 'active', 'Membresía Humm Base', 'Rodrigo Merino', 'rodrigo@humm.cl', '2026-02-01 14:00:00'),
('ws-patagonia-botanica', 'Patagonia Botánica', 'Ignacia Silva', 'ignacia@patagoniabotanica.cl', '+56998761234', 'Punta Arenas', 'Magallanes', 'Cosmética Natural', 'Cosmética botánica formulada con flora endémica de la Patagonia chilena.', 'active', 'Membresía Humm Pro', 'Valentina Castro', 'valentina@humm.cl', '2026-02-15 09:30:00'),
('ws-conservas-ranco', 'Conservas del Ranco', 'Diego Morales', 'diego@conservasranco.cl', '+56955512345', 'Futrono', 'Los Ríos', 'Alimentos Gourmet', 'Conservas gourmet, mermeladas y mieles de bosque nativo.', 'active', 'Membresía Humm Base', 'Rodrigo Merino', 'rodrigo@humm.cl', '2026-03-01 16:20:00');

-- Subscription Plans
INSERT INTO `subscription_plans` (`id`, `name`, `price`, `trial_days`, `description`, `features`, `status`, `sort_order`) VALUES
('plan-base', 'Plan Emprendedor Base', 19990, 14, 'Acceso a herramientas esenciales de gestión comercial y red de apoyo.', '["2 Herramientas Humm a elección", "14 días de prueba gratuita", "Soporte y comunidad", "Acceso a red de convenios"]', 'active', 1),
('plan-crecimiento', 'Plan Crecimiento Humm', 34990, 30, 'El plan más popular para negocios en expansión. Acceso a todas las herramientas y tutoría.', '["Todas las herramientas Humm habilitadas", "30 días de prueba gratuita", "Tutor y ejecutivo exclusivo", "Descuentos de empresas colaboradoras"]', 'active', 2),
('plan-pro', 'Plan Pro Co-Creation', 59990, 0, 'Máximo nivel de acompañamiento con consultoría 1 a 1 y vitrina comercial destacada.', '["Suite completa de soluciones Humm", "Mentorías personalizadas mensuales", "Vitrina y difusión destacada", "Sin periodo de prueba (Pago directo)"]', 'active', 3);

-- Users (Contraseña inicial: 'admin' para admin, 'humm' para emprendedores)
INSERT INTO `users` (`id`, `workspace_id`, `name`, `email`, `password_hash`, `role`, `avatar`, `is_active`, `assigned_tool_ids`, `advisor_name`, `advisor_email`, `created_at`) VALUES
('usr-admin', NULL, 'Administrador Humm', 'admin@humm.cl', '$2y$10$wK1F5N8qXN8jLwH6fO6aheJ3bK3Z1xT5jU9vP0mO2sT4qR8wN2h6W', 'admin', 'AH', 1, '[]', NULL, NULL, '2025-12-01 08:00:00'),
('usr-valentina', NULL, 'Valentina Castro', 'valentina@humm.cl', '$2y$10$7rXmFhLgN5PjTwH9kQ3beeU2vK4yN1oM7sT3qP8wO0sT4qR8wN2h6', 'advisor', 'VC', 1, '[]', NULL, NULL, '2026-01-05 09:00:00'),
('usr-carolina', 'ws-taller-austral', 'Carolina Valenzuela', 'carolina@humm.cl', '$2y$10$7rXmFhLgN5PjTwH9kQ3beeU2vK4yN1oM7sT3qP8wO0sT4qR8wN2h6', 'entrepreneur', 'CV', 1, '["tool-reloop", "tool-hummailing", "tool-kinetic", "tool-humm-radar", "tool-humm-link"]', 'Valentina Castro', 'valentina@humm.cl', '2026-01-10 10:00:00'),
('usr-juan', 'ws-cafe-valle', 'Juan Pérez', 'juan@humm.cl', '$2y$10$7rXmFhLgN5PjTwH9kQ3beeU2vK4yN1oM7sT3qP8wO0sT4qR8wN2h6', 'entrepreneur', 'JP', 1, '["tool-reloop", "tool-humm-radar", "tool-humm-link"]', 'Rodrigo Merino', 'rodrigo@humm.cl', '2026-02-01 14:00:00'),
('usr-ignacia', 'ws-patagonia-botanica', 'Ignacia Silva', 'ignacia@humm.cl', '$2y$10$7rXmFhLgN5PjTwH9kQ3beeU2vK4yN1oM7sT3qP8wO0sT4qR8wN2h6', 'entrepreneur', 'IS', 1, '["tool-reloop", "tool-hummailing", "tool-kinetic"]', 'Valentina Castro', 'valentina@humm.cl', '2026-02-15 09:30:00'),
('usr-diego', 'ws-conservas-ranco', 'Diego Morales', 'diego@humm.cl', '$2y$10$7rXmFhLgN5PjTwH9kQ3beeU2vK4yN1oM7sT3qP8wO0sT4qR8wN2h6', 'entrepreneur', 'DM', 1, '["tool-reloop", "tool-humm-radar"]', 'Rodrigo Merino', 'rodrigo@humm.cl', '2026-03-01 16:20:00'),
('usr-patricia', 'ws-taller-austral', 'Patricia Lagos', 'patricia@humm.cl', '$2y$10$7rXmFhLgN5PjTwH9kQ3beeU2vK4yN1oM7sT3qP8wO0sT4qR8wN2h6', 'entrepreneur', 'PL', 0, '["tool-reloop"]', 'Valentina Castro', 'valentina@humm.cl', '2026-05-02 11:00:00');

-- Subscriptions
INSERT INTO `subscriptions` (`id`, `user_id`, `workspace_id`, `client_name`, `client_email`, `client_phone`, `business_name`, `plan_id`, `plan_name`, `monthly_price`, `status`, `trial_days_total`, `trial_days_left`, `is_trial`, `payment_status`, `joined_date`, `last_payment_date`, `next_billing_date`, `payment_method`, `payment_link`) VALUES
('sub-carolina', 'usr-carolina', 'ws-taller-austral', 'Carolina Valenzuela', 'carolina@talleraustral.cl', '+56987654321', 'Taller Austral', 'plan-crecimiento', 'Plan Crecimiento Humm', 34990, 'active', 30, 0, 0, 'paid', '2026-01-10', '2026-08-28', '2026-09-28', 'Webpay Débito/Crédito', 'https://pagos.humm.cl/checkout?sub=sub-carolina&monto=34990'),
('sub-juan', 'usr-juan', 'ws-cafe-valle', 'Juan Pérez', 'juan@cafedelvalle.cl', '+56912345678', 'Café del Valle', 'plan-base', 'Plan Emprendedor Base', 19990, 'trial', 14, 6, 1, 'pending', '2026-08-20', NULL, '2026-09-07', 'Por definir (En prueba)', 'https://pagos.humm.cl/checkout?sub=sub-juan&monto=19990'),
('sub-ignacia', 'usr-ignacia', 'ws-patagonia-botanica', 'Ignacia Silva', 'ignacia@patagoniabotanica.cl', '+56998761234', 'Patagonia Botánica', 'plan-crecimiento', 'Plan Crecimiento Humm', 34990, 'active', 30, 0, 0, 'paid', '2026-02-15', '2026-08-15', '2026-09-15', 'Transferencia Bancaria', 'https://pagos.humm.cl/checkout?sub=sub-ignacia&monto=34990'),
('sub-diego', 'usr-diego', 'ws-conservas-ranco', 'Diego Morales', 'diego@conservasranco.cl', '+56955512345', 'Conservas del Ranco', 'plan-base', 'Plan Emprendedor Base', 19990, 'overdue', 14, 0, 0, 'overdue', '2026-03-01', '2026-07-28', '2026-08-28', 'Pendiente de Pago', 'https://pagos.humm.cl/checkout?sub=sub-diego&monto=19990'),
('sub-patricia', 'usr-patricia', 'ws-taller-austral', 'Patricia Lagos', 'patricia@talleraustral.cl', '+56977788990', 'Taller Austral', 'plan-base', 'Plan Emprendedor Base', 19990, 'trial', 14, 11, 1, 'pending', '2026-08-28', NULL, '2026-09-11', 'Por definir (En prueba)', 'https://pagos.humm.cl/checkout?sub=sub-patricia&monto=19990');

-- Tools
INSERT INTO `tools` (`id`, `name`, `description`, `category`, `status`, `url`, `icon`, `sort_order`, `is_visible`, `is_included`) VALUES
('tool-reloop', 'ReLoop', 'Optimiza tus procesos comerciales, recompra y fidelización de clientes.', 'Ventas', 'disponible', 'https://reloop.humm.cl', 'reloop', 1, 1, 1),
('tool-hummailing', 'Hummailing', 'Envía comunicaciones y campañas efectivas y personalizadas a tu lista de clientes.', 'Comunicación', 'disponible', 'https://mailing.humm.cl', 'mail', 2, 1, 1),
('tool-kinetic', 'Kinetic Control', 'Supervisa y organiza las operaciones diarias y tiempos de tu negocio.', 'Gestión', 'disponible', 'https://kinetic.humm.cl', 'activity', 3, 1, 1),
('tool-humm-radar', 'Humm Radar', 'Diagnostica la salud de tu emprendimiento y descubre oportunidades de mejora.', 'Diagnóstico', 'disponible', 'https://radar.humm.cl', 'radar', 4, 1, 1),
('tool-humm-link', 'Humm Link', 'Tu vitrina digital y enlace directo con botones de compra para bio y redes.', 'Comunicación', 'disponible', 'https://link.humm.cl', 'link', 5, 1, 1),
('tool-orientador', 'Orientador de Financiamiento', 'Descubre fondos concursables, subsidios y opciones de financiamiento para tu etapa.', 'Financiamiento', 'proximamente', 'https://fondos.humm.cl', 'dollar-sign', 6, 1, 0);

-- Company Discounts
INSERT INTO `company_discounts` (`id`, `company_name`, `logo`, `discount_title`, `category`, `description`, `code`, `url`, `expires_at`, `is_featured`, `status`) VALUES
('disc-1', 'Starken Envíos', '🚚', '25% de Descuento en Envíos Nacionales', 'Logística y Envíos', 'Tarifa preferencial para emprendimientos en todos tus envíos estándar y express en sucursales Starken.', 'HUMM-STARKEN25', 'https://www.starken.cl', '2026-12-31', 1, 'active'),
('disc-2', 'Transbank Webpay', '💳', 'Comisión 1.1% en Ventas Débito y Crédito', 'Medios de Pago', 'Tasa preferencial para miembros de Humm sin costo de mantención durante los primeros 6 meses.', 'TBK-HUMM2026', 'https://www.transbank.cl', '2026-11-30', 1, 'active'),
('disc-3', 'Canva Pro', '🎨', '3 Meses Gratis de Canva Pro para Equipos', 'Marketing y Diseño', 'Diseña publicaciones, catálogos digitales y papelería corporativa con plantillas premium.', 'CANVA-HUMM-PRO', 'https://www.canva.com', '2026-12-31', 0, 'active'),
('disc-4', 'Notaría Digital Chile', '✍️', '30% OFF en Firma Electrónica Avanzada', 'Legal y Contable', 'Firma contratos con clientes, poderes y declaraciones juradas 100% online con validez legal.', 'NOTARIA-HUMM30', 'https://www.notariadigital.cl', '2027-01-31', 0, 'active'),
('disc-5', 'BancoEstado Microempresas', '🏦', 'Cuenta Emprendedor sin Comisión', 'Banca y Financiamiento', 'Apertura preferente de cuenta corriente para persona natural con giro o SpA.', 'BANCO-HUMM-PYME', 'https://www.bancoestado.cl', '2026-12-31', 1, 'active');

SET FOREIGN_KEY_CHECKS = 1;
