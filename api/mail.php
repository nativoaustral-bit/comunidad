<?php
/**
 * MI HUMM - SERVICIO DE ENVÍO DE CORREOS ELECTRÓNICOS PROTEGIDO
 * Soporte dual: SMTP Autenticado (HostGator cPanel / SSL / TLS) + Fallback PHP mail() con Envelope Sender.
 * Acceso protegido por autenticación, roles y validación CSRF.
 */

declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/security.php';

Security::setSecurityHeaders();
Security::initSession();

// Exigir autenticación y validación CSRF obligatoria
$authUser = Security::requireAuth();
Security::validateCsrfToken();

$input = DB::getJsonInput();
$action = strtolower(trim((string)($_GET['action'] ?? $input['action'] ?? 'welcome')));
$fromEmail = defined('MAIL_FROM_EMAIL') ? MAIL_FROM_EMAIL : 'contacto@humm.cl';
$fromName = defined('MAIL_FROM_NAME') ? MAIL_FROM_NAME : 'Comunidad Humm Co-Creation';
$pdo = DB::getConnection();

/**
 * Envío directo a través de sockets SMTP con autenticación SSL/TLS (cPanel / HostGator / Externo)
 */
function sendSmtpMail(string $to, string $subject, string $htmlBody, string $fromEmail, string $fromName): array {
    $host = defined('MAIL_SMTP_HOST') ? MAIL_SMTP_HOST : 'localhost';
    $port = defined('MAIL_SMTP_PORT') ? MAIL_SMTP_PORT : 465;
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

    $socket = @stream_socket_client("{$protocol}{$host}:{$port}", $errno, $errstr, 8, STREAM_CLIENT_CONNECT, $context);
    if (!$socket) {
        return ['success' => false, 'error' => "No se pudo conectar al servidor SMTP {$host}:{$port} ({$errstr})"];
    }

    stream_set_timeout($socket, 8);

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

        $clientHost = $_SERVER['SERVER_NAME'] ?? 'localhost';
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
 * Despachador maestro: Intenta SMTP autenticado y respaldo mediante mail() con envelope sender -f
 */
function dispatchHummMail(string $to, string $subject, string $htmlBody, string $fromEmail, string $fromName): array {
    if (defined('MAIL_USE_SMTP') && MAIL_USE_SMTP && defined('MAIL_SMTP_PASS') && MAIL_SMTP_PASS !== '') {
        $smtpResult = sendSmtpMail($to, $subject, $htmlBody, $fromEmail, $fromName);
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
        "From: {$fromName} <{$fromEmail}>",
        "Reply-To: {$fromEmail}",
        "Return-Path: <{$fromEmail}>",
        'X-Mailer: PHP/' . phpversion(),
        'X-Priority: 3'
    ];

    $sent = @mail($to, $subject, $htmlBody, implode("\r\n", $headers), "-f{$fromEmail}");

    if ($sent) {
        return [
            'sent' => true,
            'method' => 'php_mail',
            'message' => "Correo despachado por el servidor a {$to}."
        ];
    }

    $lastErr = error_get_last();
    $errDetail = $lastErr ? $lastErr['message'] : 'La función mail() de PHP retornó false o el servidor no tiene servicio de correo configurado.';
    error_log("MiHumm mail() falló al enviar a {$to}: {$errDetail}");
    return [
        'sent' => false,
        'method' => 'php_mail',
        'error' => $errDetail,
        'message' => "El servidor no pudo despachar el correo a {$to}."
    ];
}

// -----------------------------------------------------------------------------
// ENRUTADOR DE ACCIONES
// -----------------------------------------------------------------------------

if ($action === 'welcome' || $action === 'welcome_user') {
    // Exclusivo rol admin
    Security::requireRole('admin');

    $email = trim((string)($input['email'] ?? $input['to'] ?? $_POST['email'] ?? ''));
    $name = trim((string)($input['name'] ?? $_POST['name'] ?? 'Emprendedor/a'));
    $password = trim((string)($input['password'] ?? $input['tempPassword'] ?? $_POST['password'] ?? ''));
    $loginUrl = 'https://comunidad.humm.cl';

    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        Security::jsonResponse(false, null, 'Correo electrónico no válido o ausente.', 400);
    }

    // Mitigación Open Relay: Verificar obligatoriamente que el usuario existe en BD
    $stmtCheck = $pdo->prepare('SELECT id, name FROM users WHERE LOWER(email) = LOWER(:email) LIMIT 1');
    $stmtCheck->execute([':email' => $email]);
    $existingUser = $stmtCheck->fetch();
    if (!$existingUser) {
        Security::jsonResponse(false, null, 'Solo se pueden enviar credenciales a usuarios registrados.', 400);
    }

    $subject = "¡Bienvenido/a a la Comunidad Humm! Tus credenciales de acceso";
    $safeName = htmlspecialchars($name);
    $safeEmail = htmlspecialchars($email);
    $safePass = htmlspecialchars($password);

    $htmlBody = <<<HTML
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Bienvenido a Mi Humm</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f5f7; margin: 0; padding: 20px; color: #1e293b; }
    .email-container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: #0f172a; padding: 32px 24px; text-align: center; }
    .badge { display: inline-block; background: #e5383b; color: #ffffff; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; margin-bottom: 10px; }
    .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; }
    .content { padding: 32px 28px; line-height: 1.6; }
    .greeting { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
    .creds-box { background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 8px; padding: 18px 20px; margin: 24px 0; }
    .cred-item { margin-bottom: 8px; font-size: 14px; }
    .cred-label { font-weight: 600; color: #64748b; font-size: 12px; text-transform: uppercase; }
    .cred-value { font-weight: 700; color: #0f172a; font-family: monospace; font-size: 15px; }
    .actions { text-align: center; margin: 28px 0 20px; }
    .btn-primary { display: inline-block; background: #e5383b; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 700; font-size: 14px; }
    .footer { background: #f8fafc; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="badge">Comunidad Humm Co-Creation</div>
      <h1>¡Te damos la bienvenida a Mi Humm!</h1>
    </div>
    <div class="content">
      <div class="greeting">Hola, {$safeName} 👋</div>
      <p>Tu cuenta en la plataforma de gestión y ecosistema de <strong>Comunidad Humm</strong> ha sido activada. Desde ahora puedes acceder a tus herramientas, gestionar tus clientes y ventas, y aprovechar los beneficios y alianzas exclusivas.</p>
      <div class="creds-box">
        <div class="cred-item">
          <div class="cred-label">Plataforma Web:</div>
          <div class="cred-value"><a href="{$loginUrl}" style="color: #e5383b;">{$loginUrl}</a></div>
        </div>
        <div class="cred-item" style="margin-top: 10px;">
          <div class="cred-label">Usuario / Correo:</div>
          <div class="cred-value">{$safeEmail}</div>
        </div>
        <div class="cred-item" style="margin-top: 10px;">
          <div class="cred-label">Contraseña Temporal:</div>
          <div class="cred-value" style="background: #ffffff; padding: 3px 8px; border-radius: 4px; display: inline-block; border: 1px solid #e2e8f0;">{$safePass}</div>
        </div>
      </div>
      <div class="actions">
        <a href="{$loginUrl}" class="btn-primary">🚀 Ingresar a Mi Humm</a>
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px;">Este es un mensaje automático de <strong>Comunidad Humm Co-Creation</strong>.</p>
      <p style="margin: 0;">Soporte: <a href="mailto:soporte@humm.cl" style="color: #e5383b;">soporte@humm.cl</a></p>
    </div>
  </div>
</body>
</html>
HTML;

    $dispatch = dispatchHummMail($email, $subject, $htmlBody, $fromEmail, $fromName);
    Security::jsonResponse(true, [
        'sent' => $dispatch['sent'],
        'method' => $dispatch['method'] ?? 'unknown',
        'email' => $email,
        'message' => $dispatch['message']
    ]);

} elseif ($action === 'benefit_request_notification') {
    $toEmail = $fromEmail;
    $subject = "Nueva Solicitud de Beneficio en Comunidad Humm: " . htmlspecialchars((string)($input['benefitTitle'] ?? 'Convenio'));
    $userName = htmlspecialchars((string)($input['userName'] ?? $authUser['name']));
    $workspaceName = htmlspecialchars((string)($input['workspaceName'] ?? 'Emprendimiento'));
    $benefitTitle = htmlspecialchars((string)($input['benefitTitle'] ?? 'Beneficio'));
    $companyName = htmlspecialchars((string)($input['companyName'] ?? 'Empresa Aliada'));
    $channel = strtoupper(htmlspecialchars((string)($input['channel'] ?? 'WhatsApp')));
    $personalCode = htmlspecialchars((string)($input['personalCode'] ?? 'HUMM-CODE'));
    $reqDate = date('d/m/Y H:i');

    $htmlBody = <<<HTML
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Nueva Solicitud de Beneficio</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f5f7; margin: 0; padding: 20px; color: #1e293b; }
    .email-container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: #0f172a; padding: 24px; text-align: center; color: white; }
    .badge { display: inline-block; background: #e5383b; color: #ffffff; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; margin-bottom: 8px; }
    .content { padding: 28px; line-height: 1.6; }
    .info-grid { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #e2e8f0; font-size: 13px; }
    .info-row:last-child { border-bottom: none; }
    .label { color: #64748b; font-weight: 600; }
    .val { color: #0f172a; font-weight: 700; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="badge">Contacto Comercial Generado</div>
      <h2 style="margin:0; font-size: 20px;">Nueva Solicitud de Beneficio</h2>
    </div>
    <div class="content">
      <p>Un miembro de la Comunidad Humm ha iniciado contacto para solicitar un beneficio de la red:</p>
      <div class="info-grid">
        <div class="info-row"><span class="label">Emprendedor:</span><span class="val">{$userName}</span></div>
        <div class="info-row"><span class="label">Emprendimiento:</span><span class="val">{$workspaceName}</span></div>
        <div class="info-row"><span class="label">Convenio:</span><span class="val">{$benefitTitle} ({$companyName})</span></div>
        <div class="info-row"><span class="label">Canal:</span><span class="val">{$channel}</span></div>
        <div class="info-row"><span class="label">Código Asignado:</span><span class="val">{$personalCode}</span></div>
        <div class="info-row"><span class="label">Fecha y Hora:</span><span class="val">{$reqDate}</span></div>
      </div>
    </div>
  </div>
</body>
</html>
HTML;

    $dispatch = dispatchHummMail($toEmail, $subject, $htmlBody, $fromEmail, $fromName);
    Security::jsonResponse(true, [
        'sent' => $dispatch['sent'],
        'message' => $dispatch['message']
    ]);

} else {
    Security::jsonResponse(false, null, 'Acción no permitida.', 400);
}
