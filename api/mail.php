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

require_once __DIR__ . '/mailer.php';

/**
 * Despachador maestro: Delega a HummMailer (SMTP autenticado con fallback a mail)
 */
function dispatchHummMail(string $to, string $subject, string $htmlBody, string $fromEmail, string $fromName): array {
    return HummMailer::send($to, $subject, $htmlBody, $fromEmail, $fromName);
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
