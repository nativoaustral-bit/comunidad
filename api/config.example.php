<?php
/**
 * MI HUMM - CONFIGURACIÓN DE BASE DE DATOS Y ENTORNO (PLANTILLA DE EJEMPLO)
 * Copiar a api/config.local.php o a /home1/<usuario>/private/comunidad_secrets.php en producción
 */

declare(strict_types=1);

if (!defined('MI_HUMM_APP')) {
    define('MI_HUMM_APP', true);
}

// -------------------------------------------------------------------------
// CREDENCIALES DE BASE DE DATOS
// -------------------------------------------------------------------------
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_PORT', (int)(getenv('DB_PORT') ?: 3306));
define('DB_NAME', getenv('DB_NAME') ?: 'nombre_base_datos');
define('DB_USER', getenv('DB_USER') ?: 'usuario_base_datos');
define('DB_PASS', getenv('DB_PASS') ?: 'ContraseñaSegura_Cambiar!');
define('DB_CHARSET', 'utf8mb4');

// -------------------------------------------------------------------------
// CONFIGURACIÓN DE SESIÓN Y SEGURIDAD
// -------------------------------------------------------------------------
define('SESSION_LIFETIME', 86400 * 7); // 7 días
define('APP_SECRET', getenv('APP_SECRET') ?: 'generar_secreto_criptografico_aleatorio_64_bytes');

// -------------------------------------------------------------------------
// CONFIGURACIÓN DE CORREO SALIENTE (SMTP)
// -------------------------------------------------------------------------
define('MAIL_FROM_EMAIL', getenv('MAIL_FROM_EMAIL') ?: 'comunidad@humm.cl');
define('MAIL_FROM_NAME', getenv('MAIL_FROM_NAME') ?: 'Comunidad Humm Co-Creation');
define('MAIL_USE_SMTP', filter_var(getenv('MAIL_USE_SMTP') ?: 'true', FILTER_VALIDATE_BOOLEAN));
define('MAIL_SMTP_HOST', getenv('MAIL_SMTP_HOST') ?: 'localhost');
define('MAIL_SMTP_PORT', (int)(getenv('MAIL_SMTP_PORT') ?: 465));
define('MAIL_SMTP_USER', getenv('MAIL_SMTP_USER') ?: 'comunidad@humm.cl');
define('MAIL_SMTP_PASS', getenv('MAIL_SMTP_PASS') ?: 'PasswordSmtp_Cambiar!');
define('MAIL_SMTP_SECURE', getenv('MAIL_SMTP_SECURE') ?: 'ssl');
