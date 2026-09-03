<?php
/**
 * MI HUMM - SERVICIO DE ENVÍO DE CORREOS ELECTRÓNICOS
 * Plantillas HTML profesionales para Bienvenida, Credenciales y Cambio de Contraseña
 */

declare(strict_types=1);

require_once __DIR__ . '/db.php';

setApiHeaders();
$input = DB::getJsonInput();

$action = $_GET['action'] ?? $input['action'] ?? 'welcome';
$email = trim($input['email'] ?? $_POST['email'] ?? '');
$name = trim($input['name'] ?? $_POST['name'] ?? 'Emprendedor/a');
$password = trim($input['password'] ?? $_POST['password'] ?? 'humm2026');
$resetUrl = trim($input['resetUrl'] ?? $_POST['resetUrl'] ?? 'https://comunidad.humm.cl');

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    DB::jsonResponse(false, null, 'Correo electrónico no válido o ausente.', 400);
}

// Configuración de remitente
$fromEmail = 'contacto@humm.cl';
$fromName = 'Comunidad Humm Co-Creation';
$headers = [
    'MIME-Version: 1.0',
    'Content-type: text/html; charset=UTF-8',
    "From: {$fromName} <{$fromEmail}>",
    "Reply-To: {$fromEmail}",
    'X-Mailer: PHP/' . phpversion()
];

if ($action === 'welcome') {
    $subject = "¡Bienvenido/a a la Comunidad Humm! Tus credenciales de acceso";
    $loginUrl = 'https://comunidad.humm.cl';
    $changePassUrl = "https://comunidad.humm.cl/#cambiar-clave?email=" . urlencode($email);

    $htmlBody = <<<HTML
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenido a Mi Humm</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f5f7; margin: 0; padding: 20px; color: #1e293b; }
    .email-container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .header { background: #0f172a; padding: 32px 24px; text-align: center; }
    .badge { display: inline-block; background: #e5383b; color: #ffffff; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px; }
    .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; }
    .content { padding: 32px 28px; line-height: 1.6; }
    .greeting { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
    .creds-box { background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 8px; padding: 18px 20px; margin: 24px 0; }
    .cred-item { margin-bottom: 8px; font-size: 14px; }
    .cred-item:last-child { margin-bottom: 0; }
    .cred-label { font-weight: 600; color: #64748b; font-size: 12px; text-transform: uppercase; }
    .cred-value { font-weight: 700; color: #0f172a; font-family: monospace; font-size: 15px; }
    .actions { text-align: center; margin: 28px 0 20px; }
    .btn-primary { display: inline-block; background: #e5383b; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 700; font-size: 14px; margin: 6px; }
    .btn-secondary { display: inline-block; background: #e2e8f0; color: #0f172a !important; text-decoration: none; padding: 12px 22px; border-radius: 6px; font-weight: 600; font-size: 14px; margin: 6px; }
    .info-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 4px; font-size: 13px; color: #1e40af; margin-top: 20px; }
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
      <div class="greeting">Hola, {$name} 👋</div>
      <p>Tu cuenta en la plataforma de gestión y ecosistema de <strong>Comunidad Humm</strong> ha sido creada exitosamente. Desde ahora puedes acceder a tus herramientas, gestionar tus ventas y aprovechar todos los convenios y beneficios exclusivos.</p>
      
      <div class="creds-box">
        <div class="cred-item">
          <div class="cred-label">Plataforma Web:</div>
          <div class="cred-value"><a href="{$loginUrl}" style="color: #e5383b; text-decoration: none;">{$loginUrl}</a></div>
        </div>
        <div class="cred-item" style="margin-top: 10px;">
          <div class="cred-label">Usuario / Correo de Acceso:</div>
          <div class="cred-value">{$email}</div>
        </div>
        <div class="cred-item" style="margin-top: 10px;">
          <div class="cred-label">Contraseña Inicial Asignada:</div>
          <div class="cred-value" style="background: #ffffff; padding: 3px 8px; border-radius: 4px; display: inline-block; border: 1px solid #e2e8f0;">{$password}</div>
        </div>
      </div>

      <div class="actions">
        <a href="{$loginUrl}" class="btn-primary">🚀 Ingresar a Mi Humm</a>
        <a href="{$changePassUrl}" class="btn-secondary">🔐 Cambiar mi Contraseña</a>
      </div>

      <div class="info-box">
        💡 <strong>Recomendación de seguridad:</strong> Te sugerimos ingresar a la plataforma y cambiar tu contraseña inicial por una de tu preferencia desde el menú <em>"Mi Cuenta"</em> o haciendo clic en el botón <em>"Cambiar mi Contraseña"</em>.
      </div>
    </div>

    <div class="footer">
      <p style="margin: 0 0 6px;">Este es un mensaje automático enviado por <strong>Comunidad Humm Co-Creation</strong>.</p>
      <p style="margin: 0;">¿Necesitas ayuda? Escríbenos a <a href="mailto:soporte@humm.cl" style="color: #e5383b;">soporte@humm.cl</a> o a través de tu tutor asignado.</p>
    </div>
  </div>
</body>
</html>
HTML;

} elseif ($action === 'reset_password') {
    $subject = "Restablecimiento de Contraseña - Mi Humm";
    $changePassUrl = "https://comunidad.humm.cl/#cambiar-clave?email=" . urlencode($email);

    $htmlBody = <<<HTML
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Restablecer Contraseña</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f5f7; margin: 0; padding: 20px; color: #1e293b; }
    .email-container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: #0f172a; padding: 24px; text-align: center; color: white; }
    .content { padding: 28px; line-height: 1.6; }
    .btn-primary { display: inline-block; background: #e5383b; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 700; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h2 style="margin:0;">Restablece tu Contraseña</h2>
    </div>
    <div class="content">
      <p>Hola, {$name}:</p>
      <p>Hemos recibido una solicitud para cambiar tu contraseña en <strong>Mi Humm</strong>. Haz clic en el siguiente enlace para ingresar tu nueva clave:</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="{$changePassUrl}" class="btn-primary">🔐 Cambiar mi Contraseña</a>
      </div>
      <p style="font-size: 12px; color: #64748b;">Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
    </div>
  </div>
</body>
</html>
HTML;
} elseif ($action === 'benefit_request_notification') {
    $subject = "Nueva Solicitud de Beneficio en Comunidad Humm: " . ($input['benefitTitle'] ?? 'Convenio');
    $userName = htmlspecialchars($input['userName'] ?? 'Miembro Humm');
    $workspaceName = htmlspecialchars($input['workspaceName'] ?? 'Emprendimiento');
    $benefitTitle = htmlspecialchars($input['benefitTitle'] ?? 'Beneficio');
    $companyName = htmlspecialchars($input['companyName'] ?? 'Empresa Aliada');
    $channel = strtoupper(htmlspecialchars($input['channel'] ?? 'WhatsApp'));
    $personalCode = htmlspecialchars($input['personalCode'] ?? 'HUMM-CODE');
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
    .code-badge { background: #fee2e2; color: #991b1b; padding: 3px 8px; border-radius: 4px; font-family: monospace; font-weight: 700; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="badge">Contacto Comercial Generado</div>
      <h2 style="margin:0; font-size: 20px;">Nueva Solicitud de Beneficio</h2>
    </div>
    <div class="content">
      <p>Un miembro de la Comunidad Humm ha iniciado contacto comercial para solicitar un beneficio de la red de alianzas:</p>
      
      <div class="info-grid">
        <div class="info-row">
          <span class="label">Emprendedor/a:</span>
          <span class="val">{$userName}</span>
        </div>
        <div class="info-row">
          <span class="label">Emprendimiento / Workspace:</span>
          <span class="val">{$workspaceName}</span>
        </div>
        <div class="info-row">
          <span class="label">Empresa Aliada:</span>
          <span class="val">{$companyName}</span>
        </div>
        <div class="info-row">
          <span class="label">Beneficio / Descuento:</span>
          <span class="val">{$benefitTitle}</span>
        </div>
        <div class="info-row">
          <span class="label">Canal de Contacto:</span>
          <span class="val">{$channel}</span>
        </div>
        <div class="info-row">
          <span class="label">Código Personal Humm:</span>
          <span class="val"><span class="code-badge">{$personalCode}</span></span>
        </div>
        <div class="info-row">
          <span class="label">Fecha y Hora:</span>
          <span class="val">{$reqDate}</span>
        </div>
      </div>

      <p style="font-size: 13px; color: #64748b;">
        Puedes gestionar y dar seguimiento a este contacto desde el panel de administración en la sección <strong>"Contactos generados por beneficios"</strong>.
      </p>
    </div>
  </div>
</body>
</html>
HTML;
} elseif ($action === 'auth_help_alert') {
    $clientEmail = htmlspecialchars($input['email'] ?? $email);
    $clientName = htmlspecialchars($input['name'] ?? $name);
    $clientMsg = htmlspecialchars($input['message'] ?? 'Solicitud de asistencia para inicio de sesión en plataforma');
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'Desconocida';
    $now = date('d/m/Y H:i:s');

    $subject = "🚨 Alerta de Acceso: {$clientName} ({$clientEmail}) solicita ayuda para ingresar a Mi Humm";
    $toEmail = 'contacto@humm.cl';

    $htmlBody = <<<HTML
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Alerta de Acceso a Plataforma</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; padding: 20px; color: #1e293b; }
    .card { max-width: 540px; margin: 0 auto; background: #fff; border-radius: 10px; border: 1px solid #e2e8f0; overflow: hidden; }
    .header { background: #e5383b; color: #fff; padding: 20px; text-align: center; }
    .body { padding: 24px; line-height: 1.6; }
    .item { margin-bottom: 12px; }
    .label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; }
    .val { font-size: 14px; font-weight: 600; color: #0f172a; margin-top: 2px; }
    .msg-box { background: #fff1f2; border: 1px solid #fecdd3; padding: 12px; border-radius: 6px; margin-top: 14px; font-size: 13px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h2 style="margin:0; font-size: 18px;">🚨 Solicitud de Ayuda de Acceso</h2>
      <p style="margin:4px 0 0; font-size: 12px; opacity: 0.9;">Plataforma Comunidad Humm Co-Creation</p>
    </div>
    <div class="body">
      <p>Un usuario ha indicado que tiene problemas para ingresar a la plataforma y solicita asistencia:</p>
      <div class="item">
        <div class="label">Nombre / Emprendedor:</div>
        <div class="val">{$clientName}</div>
      </div>
      <div class="item">
        <div class="label">Correo Electrónico:</div>
        <div class="val"><a href="mailto:{$clientEmail}">{$clientEmail}</a></div>
      </div>
      <div class="item">
        <div class="label">Fecha y Hora:</div>
        <div class="val">{$now}</div>
      </div>
      <div class="item">
        <div class="label">Dirección IP:</div>
        <div class="val">{$ip}</div>
      </div>
      <div class="msg-box">
        <div class="label" style="color: #991b1b;">Mensaje / Observaciones:</div>
        <div style="margin-top: 4px; color: #1e293b;">{$clientMsg}</div>
      </div>
    </div>
  </div>
</body>
</html>
HTML;

    $sent = @mail($toEmail, $subject, $htmlBody, implode("\r\n", $headers));
    DB::jsonResponse(true, ['sent' => !!$sent, 'message' => 'Alerta enviada al equipo de administración Humm.']);
    exit;
} else {
    DB::jsonResponse(false, null, 'Acción de correo no reconocida.', 400);
}

// Envío a través de la función mail() de PHP en el servidor
$sent = @mail($email, $subject, $htmlBody, implode("\r\n", $headers));

if ($sent) {
    DB::jsonResponse(true, [
        'sent' => true,
        'email' => $email,
        'subject' => $subject,
        'message' => "Correo de bienvenida enviado exitosamente a {$email}"
    ]);
} else {
    DB::jsonResponse(true, [
        'sent' => false,
        'email' => $email,
        'subject' => $subject,
        'message' => "Datos de bienvenida preparados para {$email}"
    ]);
}
