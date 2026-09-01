<?php
/**
 * MI HUMM - CONECTOR PDO MYSQL / MARIADB
 * Singleton Seguro con Prepared Statements para HostGator
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';

class DB {
    private static ?PDO $instance = null;

    public static function getConnection(): PDO {
        if (self::$instance === null) {
            $dsn = sprintf(
                'mysql:host=%s;port=%d;dbname=%s;charset=%s',
                DB_HOST,
                DB_PORT,
                DB_NAME,
                DB_CHARSET
            );

            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
            ];

            try {
                self::$instance = new PDO($dsn, DB_USER, DB_PASS, $options);
            } catch (PDOException $e) {
                // Si la conexión falla, responder JSON claro sin filtrar contraseñas
                setApiHeaders();
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'error' => 'Error al conectar con la base de datos MySQL en HostGator.',
                    'details' => $e->getMessage()
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }
        }

        return self::$instance;
    }

    /**
     * Helper para enviar respuestas JSON estándar
     */
    public static function jsonResponse(bool $success, mixed $data = null, ?string $error = null, int $statusCode = 200): void {
        setApiHeaders();
        http_response_code($statusCode);
        $payload = ['success' => $success];
        if ($data !== null) $payload['data'] = $data;
        if ($error !== null) $payload['error'] = $error;
        echo json_encode($payload, JSON_UNESCAPED_UNICODE);
        exit;
    }

    /**
     * Obtener el cuerpo de la petición JSON
     */
    public static function getJsonInput(): array {
        $raw = file_get_contents('php://input');
        if (empty($raw)) return $_POST;
        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }
}
