<?php
/**
 * MI HUMM - CONFIGURACIÓN DE BASE DE DATOS Y ENTORNO
 * HostGator cPanel PHP 8 / MySQL
 */

declare(strict_types=1);

// Evitar acceso directo no deseado si se incluye mal
if (!defined('MI_HUMM_APP')) {
    define('MI_HUMM_APP', true);
}

// -------------------------------------------------------------------------
// CREDENCIALES DE BASE DE DATOS CPANEL / HOSTGATOR
// (En HostGator, el nombre de base de datos y usuario suele ser: cpaneluser_db)
// -------------------------------------------------------------------------
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_PORT', (int)(getenv('DB_PORT') ?: 3306));
define('DB_NAME', getenv('DB_NAME') ?: 'paulocis_humm_comunidad');
define('DB_USER', getenv('DB_USER') ?: 'paulocis_humm');
define('DB_PASS', getenv('DB_PASS') ?: 'HummComunidad2026!Db');
define('DB_CHARSET', 'utf8mb4');

// -------------------------------------------------------------------------
// CONFIGURACIÓN DE SESIÓN Y SEGURIDAD
// -------------------------------------------------------------------------
define('SESSION_LIFETIME', 86400 * 7); // 7 días de sesión activa
define('APP_SECRET', 'humm_co_creation_secret_key_2026_secure_jwt');

// -------------------------------------------------------------------------
// CONFIGURACIÓN DE CORREO SALIENTE (CPANEL HOSTGATOR / SMTP)
// -------------------------------------------------------------------------
define('MAIL_FROM_EMAIL', getenv('MAIL_FROM_EMAIL') ?: 'comunidad@humm.cl');
define('MAIL_FROM_NAME', getenv('MAIL_FROM_NAME') ?: 'Comunidad Humm Co-Creation');

// Envío SMTP autenticado exclusivo para comunidad@humm.cl
define('MAIL_USE_SMTP', filter_var(getenv('MAIL_USE_SMTP') ?: 'true', FILTER_VALIDATE_BOOLEAN));
define('MAIL_SMTP_HOST', getenv('MAIL_SMTP_HOST') ?: 'localhost'); // 'localhost' en servidor cPanel o 'mail.humm.cl'
define('MAIL_SMTP_PORT', (int)(getenv('MAIL_SMTP_PORT') ?: 465));      // 465 (SSL) o 587 (TLS)
define('MAIL_SMTP_USER', getenv('MAIL_SMTP_USER') ?: 'comunidad@humm.cl');
define('MAIL_SMTP_PASS', getenv('MAIL_SMTP_PASS') ?: 'Cocreation5181$$');
define('MAIL_SMTP_SECURE', getenv('MAIL_SMTP_SECURE') ?: 'ssl');       // 'ssl' o 'tls'


// Configuración de reporte de errores (desactivar visualización en producción)
$isProduction = (isset($_SERVER['HTTP_HOST']) && !in_array($_SERVER['HTTP_HOST'], ['localhost', '127.0.0.1', 'localhost:8080', 'localhost:3000']));
if ($isProduction) {
    error_reporting(0);
    ini_set('display_errors', '0');
} else {
    error_reporting(E_ALL);
    ini_set('display_errors', '1');
}

// Cabeceras HTTP estándar para API JSON y CORS
function setApiHeaders(): void {
    if (!headers_sent()) {
        header('Content-Type: application/json; charset=utf-8');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        header('Pragma: no-cache');
    }

    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}
