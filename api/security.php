<?php
/**
 * MI HUMM - CAPA CENTRALIZADA DE SEGURIDAD, SESIONES NATIVAS Y CONTROL DE ACCESO
 * Comunidad Humm Co-Creation
 *
 * Implementa:
 * 1. Sesiones nativas PHP seguras con cookies HttpOnly, Secure, SameSite=Lax y strict mode.
 * 2. Protección CSRF obligatoria para peticiones mutantes (POST/PUT/DELETE).
 * 3. Matriz formal de roles (admin × advisor × entrepreneur).
 * 4. Aislamiento multitenant estricto (cero accesos cruzados).
 * 5. Cabeceras HTTP de seguridad (CSP, HSTS, X-Frame-Options, X-Content-Type-Options).
 * 6. Política CORS estricta (sin comodín '*').
 */

declare(strict_types=1);

if (!defined('MI_HUMM_APP')) {
    define('MI_HUMM_APP', true);
}

class Security {
    private const SESSION_NAME = 'HUMM_SESSID';
    private const ADMIN_INACTIVITY_LIMIT = 3600;      // 60 minutos
    private const USER_INACTIVITY_LIMIT = 7200;       // 2 horas

    /**
     * Configura y arranca la sesión nativa de PHP de forma segura
     */
    public static function initSession(): void {
        if (session_status() === PHP_SESSION_ACTIVE) {
            self::checkInactivity();
            return;
        }

        $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https')
            || (isset($_SERVER['SERVER_PORT']) && (int)$_SERVER['SERVER_PORT'] === 443);

        ini_set('session.use_strict_mode', '1');
        ini_set('session.use_only_cookies', '1');
        ini_set('session.cookie_httponly', '1');

        session_name(self::SESSION_NAME);

        session_set_cookie_params([
            'lifetime' => 86400 * 7,
            'path' => '/',
            'domain' => '',
            'secure' => $isHttps,
            'httponly' => true,
            'samesite' => 'Lax'
        ]);

        session_start();

        // Inicializar token CSRF si no existe
        if (empty($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }

        self::checkInactivity();
    }

    /**
     * Valida expiración por inactividad del lado del servidor
     */
    private static function checkInactivity(): void {
        if (!isset($_SESSION['user_id'])) {
            return;
        }

        $now = time();
        $role = $_SESSION['role'] ?? 'entrepreneur';
        $limit = ($role === 'admin') ? self::ADMIN_INACTIVITY_LIMIT : self::USER_INACTIVITY_LIMIT;

        if (isset($_SESSION['last_activity']) && ($now - (int)$_SESSION['last_activity'] > $limit)) {
            self::destroySession();
            self::jsonResponse(false, null, 'Sesión expirada por inactividad. Inicia sesión nuevamente.', 401);
        }

        $_SESSION['last_activity'] = $now;
    }

    /**
     * Destruye la sesión de forma limpia en servidor y expira cookie
     */
    public static function destroySession(): void {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(),
                '',
                time() - 42000,
                $params['path'],
                $params['domain'],
                $params['secure'],
                $params['httponly']
            );
        }
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_destroy();
        }
    }

    /**
     * Establece cabeceras HTTP de seguridad y CORS restringido
     */
    public static function setSecurityHeaders(): void {
        if (headers_sent()) {
            return;
        }

        $httpOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $allowedOrigins = [
            'https://comunidad.humm.cl',
            'http://localhost',
            'http://localhost:8080',
            'http://localhost:3000',
            'http://127.0.0.1',
            'http://127.0.0.1:8080',
            'http://127.0.0.1:3000'
        ];

        if (in_array($httpOrigin, $allowedOrigins, true)) {
            header("Access-Control-Allow-Origin: {$httpOrigin}");
            header('Access-Control-Allow-Credentials: true');
        } else {
            // Producción por defecto
            header('Access-Control-Allow-Origin: https://comunidad.humm.cl');
            header('Access-Control-Allow-Credentials: true');
        }

        header('Content-Type: application/json; charset=utf-8');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token, X-Requested-With');
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        header('Pragma: no-cache');
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: SAMEORIGIN');
        header('Referrer-Policy: strict-origin-when-cross-origin');
        header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://comunidad.humm.cl; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';");

        $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');
        if ($isHttps) {
            header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
        }

        if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
            http_response_code(200);
            exit;
        }
    }

    /**
     * Retorna el token CSRF activo de la sesión
     */
    public static function getCsrfToken(): string {
        return $_SESSION['csrf_token'] ?? '';
    }

    /**
     * Valida el token CSRF para operaciones mutantes (POST, PUT, DELETE)
     */
    public static function validateCsrfToken(): void {
        $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        if (in_array($method, ['GET', 'HEAD', 'OPTIONS'], true)) {
            return;
        }

        $tokenHeader = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
        $input = json_decode(file_get_contents('php://input'), true);
        $tokenBody = is_array($input) ? ($input['csrf_token'] ?? '') : ($_POST['csrf_token'] ?? '');
        $token = !empty($tokenHeader) ? $tokenHeader : $tokenBody;

        $sessionToken = $_SESSION['csrf_token'] ?? '';

        if (empty($token) || empty($sessionToken) || !hash_equals($sessionToken, (string)$token)) {
            self::jsonResponse(false, null, 'Error de seguridad CSRF: token ausente o inválido.', 403);
        }
    }

    /**
     * Exige que exista una sesión autenticada en el servidor (401 si no existe)
     */
    public static function requireAuth(): array {
        self::initSession();

        if (empty($_SESSION['user_id'])) {
            self::jsonResponse(false, null, 'Acceso no autorizado. Sesión no activa.', 401);
        }

        return [
            'id' => $_SESSION['user_id'],
            'role' => $_SESSION['role'] ?? 'entrepreneur',
            'workspace_id' => $_SESSION['workspace_id'] ?? null,
            'email' => $_SESSION['email'] ?? '',
            'name' => $_SESSION['name'] ?? ''
        ];
    }

    /**
     * Exige un rol específico (403 si no coincide)
     */
    public static function requireRole(array|string $allowedRoles): array {
        $user = self::requireAuth();
        $roles = is_array($allowedRoles) ? $allowedRoles : [$allowedRoles];

        if (!in_array($user['role'], $roles, true)) {
            self::jsonResponse(false, null, 'Acceso denegado: permisos insuficientes para esta operación.', 403);
        }

        return $user;
    }

    /**
     * Valida server-side si el usuario autenticado tiene acceso al workspace solicitado
     */
    public static function requireWorkspaceAccess(PDO $pdo, ?string $targetWorkspaceId): bool {
        $user = self::requireAuth();

        if (empty($targetWorkspaceId)) {
            return false;
        }

        // 1. Administrador Humm: acceso a cualquier workspace
        if ($user['role'] === 'admin') {
            return true;
        }

        // 2. Emprendedor: solo su propio workspace
        if ($user['role'] === 'entrepreneur') {
            if (!empty($user['workspace_id']) && $user['workspace_id'] === $targetWorkspaceId) {
                return true;
            }
            self::jsonResponse(false, null, 'Acceso denegado: no tienes autorización para acceder a este emprendimiento.', 403);
        }

        // 3. Asesor (advisor): solo workspaces explícitamente asignados en BD
        if ($user['role'] === 'advisor') {
            $stmt = $pdo->prepare('SELECT id FROM workspaces WHERE id = :ws_id AND LOWER(TRIM(advisor_email)) = LOWER(TRIM(:email)) LIMIT 1');
            $stmt->execute([':ws_id' => $targetWorkspaceId, ':email' => $user['email']]);
            $isAssigned = (bool)$stmt->fetch();

            if ($isAssigned) {
                return true;
            }
            self::jsonResponse(false, null, 'Acceso denegado: no estás asignado como asesor de este emprendimiento.', 403);
        }

        self::jsonResponse(false, null, 'Acceso denegado: rol sin permisos de espacio.', 403);
        return false;
    }

    /**
     * Sanitiza cadenas de texto para mitigar inyecciones XSS contextuales
     */
    public static function sanitizeText(?string $str): string {
        if ($str === null) return '';
        return htmlspecialchars($str, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }

    /**
     * Helper de respuesta JSON estandarizada
     */
    public static function jsonResponse(bool $success, mixed $data = null, ?string $error = null, int $statusCode = 200): void {
        self::setSecurityHeaders();
        http_response_code($statusCode);
        $payload = ['success' => $success];
        if ($data !== null) $payload['data'] = $data;
        if ($error !== null) $payload['error'] = $error;
        echo json_encode($payload, JSON_UNESCAPED_UNICODE);
        exit;
    }
}
