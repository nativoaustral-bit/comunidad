<?php
/**
 * MI HUMM - MOTOR CENTRALIZADO DE CORREO ELECTRÓNICO
 * Despacho con autenticación SSL/TLS directa a Titan Email (smtp.titan.email:465)
 * y respaldo transparente con envelope sender PHP mail().
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';

class HummMailer {
    /**
     * Envío directo a través de sockets SMTP con autenticación SSL/TLS (Titan Email / cPanel / HostGator)
     */
    public static function sendSmtp(string $to, string $subject, string $htmlBody, string $fromEmail, string $fromName): array {
        $host = defined('MAIL_SMTP_HOST') ? MAIL_SMTP_HOST : 'smtp.titan.email';
        $port = defined('MAIL_SMTP_PORT') ? (int)MAIL_SMTP_PORT : 465;
        $user = defined('MAIL_SMTP_USER') ? MAIL_SMTP_USER : $fromEmail;
        $pass = defined('MAIL_SMTP_PASS') ? MAIL_SMTP_PASS : '';
        $secure = defined('MAIL_SMTP_SECURE') ? strtolower(MAIL_SMTP_SECURE) : 'ssl';

        $protocol = ($secure === 'ssl') ? 'ssl://' : '';
        $context = stream_context_create([
            'ssl' => [
                'verify_peer' => true,
                'verify_peer_name' => true,
                'allow_self_signed' => false
            ]
        ]);

        $socket = @stream_socket_client("{$protocol}{$host}:{$port}", $errno, $errstr, 10, STREAM_CLIENT_CONNECT, $context);
        if (!$socket) {
            return ['success' => false, 'error' => "No se pudo conectar al servidor SMTP {$host}:{$port} ({$errstr})"];
        }

        stream_set_timeout($socket, 10);

        $read = function() use ($socket) {
            $response = '';
            while ($line = fgets($socket, 515)) {
                $response .= $line;
                if (substr($line, 3, 1) === ' ') break;
            }
            return $response;
        };

        $sendCmd = function(string $cmd, array $expectedCodes) use ($socket, $read) {
            fputs($socket, $cmd . "\r\n");
            $response = $read();
            $code = (int)substr($response, 0, 3);
            if (!in_array($code, $expectedCodes, true)) {
                throw new Exception("Comando SMTP [{$cmd}] falló: {$response}");
            }
            return $response;
        };

        try {
            $read();

            $clientHost = $_SERVER['SERVER_NAME'] ?? 'comunidad.humm.cl';
            $sendCmd("EHLO {$clientHost}", [250]);

            if ($secure === 'tls') {
                $sendCmd("STARTTLS", [220]);
                stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
                $sendCmd("EHLO {$clientHost}", [250]);
            }

            if (!empty($user) && !empty($pass)) {
                $sendCmd("AUTH LOGIN", [334]);
                $sendCmd(base64_encode($user), [334]);
                $sendCmd(base64_encode($pass), [235]);
            }

            $sendCmd("MAIL FROM: <{$fromEmail}>", [250]);
            $sendCmd("RCPT TO: <{$to}>", [250, 251]);
            $sendCmd("DATA", [354]);

            $headers = [
                "MIME-Version: 1.0",
                "Content-Type: text/html; charset=UTF-8",
                "From: =?UTF-8?B?" . base64_encode($fromName) . "?= <{$fromEmail}>",
                "To: <{$to}>",
                "Reply-To: <{$fromEmail}>",
                "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=",
                "Date: " . date('r'),
                "X-Mailer: MiHumm SMTP Service"
            ];

            $payload = implode("\r\n", $headers) . "\r\n\r\n" . $htmlBody . "\r\n.";
            $sendCmd($payload, [250]);
            $sendCmd("QUIT", [221]);
            fclose($socket);

            return ['success' => true];
        } catch (Throwable $e) {
            if (is_resource($socket)) {
                @fputs($socket, "QUIT\r\n");
                @fclose($socket);
            }
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Despacho maestro con fallback automático a mail() nativo
     */
    public static function send(string $to, string $subject, string $htmlBody, ?string $fromEmail = null, ?string $fromName = null): array {
        $fromEmail = $fromEmail ?: (defined('MAIL_FROM_EMAIL') ? MAIL_FROM_EMAIL : 'contacto@humm.cl');
        $fromName = $fromName ?: (defined('MAIL_FROM_NAME') ? MAIL_FROM_NAME : 'Comunidad Humm Co-Creation');

        if (defined('MAIL_USE_SMTP') && MAIL_USE_SMTP && defined('MAIL_SMTP_PASS') && MAIL_SMTP_PASS !== '') {
            $smtpResult = self::sendSmtp($to, $subject, $htmlBody, $fromEmail, $fromName);
            if ($smtpResult['success']) {
                return [
                    'sent' => true,
                    'method' => 'smtp',
                    'message' => 'Correo entregado exitosamente vía SMTP autenticado.'
                ];
            }
            error_log("MiHumm SMTP falló para {$to}: " . ($smtpResult['error'] ?? 'desconocido') . ". Intentando respaldo vía mail()...");
        }

        $headers = [
            'MIME-Version: 1.0',
            'Content-type: text/html; charset=UTF-8',
            "From: =?UTF-8?B?" . base64_encode($fromName) . "?= <{$fromEmail}>",
            "Reply-To: {$fromEmail}",
            "Return-Path: <{$fromEmail}>",
            'X-Mailer: PHP/' . phpversion(),
            'X-Priority: 3'
        ];

        $sent = @mail($to, "=?UTF-8?B?" . base64_encode($subject) . "?=", $htmlBody, implode("\r\n", $headers), "-f{$fromEmail}");

        if ($sent) {
            return [
                'sent' => true,
                'method' => 'php_mail',
                'message' => "Correo despachado por el servidor a {$to}."
            ];
        }

        $lastErr = error_get_last();
        $errDetail = $lastErr ? $lastErr['message'] : 'Función mail() retornó false.';
        error_log("MiHumm mail() falló al enviar a {$to}: {$errDetail}");
        return [
            'sent' => false,
            'method' => 'php_mail',
            'error' => $errDetail,
            'message' => "El servidor no pudo despachar el correo a {$to}."
        ];
    }
}
