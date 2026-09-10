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
                error_log("Error de conexión MySQL en HostGator: " . $e->getMessage());
                $isProd = (isset($_SERVER['HTTP_HOST']) && !in_array($_SERVER['HTTP_HOST'], ['localhost', '127.0.0.1', 'localhost:8080', 'localhost:3000'], true));
                Security::jsonResponse(
                    false,
                    null,
                    'Error al conectar con la base de datos MySQL en HostGator.',
                    500
                );
            }
        }

        return self::$instance;
    }

    /**
     * Helper para enviar respuestas JSON estándar delegando a la capa de seguridad
     */
    public static function jsonResponse(bool $success, mixed $data = null, ?string $error = null, int $statusCode = 200): void {
        Security::jsonResponse($success, $data, $error, $statusCode);
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
