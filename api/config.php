<?php
/**
 * MI HUMM - CONFIGURACIÓN DE BASE DE DATOS Y ENTORNO
 * HostGator cPanel PHP 8 / MySQL
 *
 * Carga credenciales desde una ruta privada fuera del DocumentRoot
 * o desde api/config.local.php (ignorado en Git).
 */

declare(strict_types=1);

if (!defined('MI_HUMM_APP')) {
    define('MI_HUMM_APP', true);
}

// -------------------------------------------------------------------------
// 1. CARGA DE SECRETOS FUERA DEL DOCUMENTROOT
// -------------------------------------------------------------------------
$secretsLoaded = false;
$candidateSecretPaths = [
    // Producción HostGator cPanel (fuera de public_html)
    '/home1/paulocis/private/comunidad_secrets.php',
    dirname(__DIR__, 2) . '/private/comunidad_secrets.php',
    dirname(__DIR__, 3) . '/private/comunidad_secrets.php',
    // Archivo local para desarrollo (ignorado por Git)
    __DIR__ . '/config.local.php',
];

foreach ($candidateSecretPaths as $secretFile) {
    if (file_exists($secretFile)) {
        require_once $secretFile;
        $secretsLoaded = true;
        break;
    }
}

// -------------------------------------------------------------------------
// 2. VALORES POR DEFECTO O VARIABLES DE ENTORNO (SI NO FUERON DEFINIDAS)
// -------------------------------------------------------------------------
if (!defined('DB_HOST')) define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
if (!defined('DB_PORT')) define('DB_PORT', (int)(getenv('DB_PORT') ?: 3306));
if (!defined('DB_NAME')) define('DB_NAME', getenv('DB_NAME') ?: 'paulocis_humm_comunidad');
if (!defined('DB_USER')) define('DB_USER', getenv('DB_USER') ?: 'paulocis_humm');
if (!defined('DB_PASS')) define('DB_PASS', getenv('DB_PASS') ?: '');
if (!defined('DB_CHARSET')) define('DB_CHARSET', 'utf8mb4');

if (!defined('SESSION_LIFETIME')) define('SESSION_LIFETIME', 86400 * 7);
if (!defined('APP_SECRET')) define('APP_SECRET', getenv('APP_SECRET') ?: '');

if (!defined('MAIL_FROM_EMAIL')) define('MAIL_FROM_EMAIL', getenv('MAIL_FROM_EMAIL') ?: 'contacto@humm.cl');
if (!defined('MAIL_FROM_NAME')) define('MAIL_FROM_NAME', getenv('MAIL_FROM_NAME') ?: 'Comunidad Humm Co-Creation');
if (!defined('MAIL_USE_SMTP')) define('MAIL_USE_SMTP', filter_var(getenv('MAIL_USE_SMTP') ?: 'true', FILTER_VALIDATE_BOOLEAN));
if (!defined('MAIL_SMTP_HOST')) define('MAIL_SMTP_HOST', getenv('MAIL_SMTP_HOST') ?: 'localhost');
if (!defined('MAIL_SMTP_PORT')) define('MAIL_SMTP_PORT', (int)(getenv('MAIL_SMTP_PORT') ?: 465));
if (!defined('MAIL_SMTP_USER')) define('MAIL_SMTP_USER', getenv('MAIL_SMTP_USER') ?: 'comunidad@humm.cl');
if (!defined('MAIL_SMTP_PASS')) define('MAIL_SMTP_PASS', getenv('MAIL_SMTP_PASS') ?: '');
if (!defined('MAIL_SMTP_SECURE')) define('MAIL_SMTP_SECURE', getenv('MAIL_SMTP_SECURE') ?: 'ssl');

// -------------------------------------------------------------------------
// 3. CAPA DE SEGURIDAD Y CONTROL DE ERRORES
// -------------------------------------------------------------------------
require_once __DIR__ . '/security.php';

$isProduction = (isset($_SERVER['HTTP_HOST']) && !in_array($_SERVER['HTTP_HOST'], ['localhost', '127.0.0.1', 'localhost:8080', 'localhost:3000'], true));
if ($isProduction) {
    error_reporting(0);
    ini_set('display_errors', '0');
} else {
    error_reporting(E_ALL);
    ini_set('display_errors', '1');
}

/**
 * Función heredada normalizada: redirige a la capa de seguridad
 */
function setApiHeaders(): void {
    Security::setSecurityHeaders();
}
