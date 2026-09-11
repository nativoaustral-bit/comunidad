<?php
/**
 * MI HUMM - CONTROLADOR DE AUTENTICACIÓN Y SESIONES SERVER-SIDE
 * Autenticación estricta con Bcrypt, sesiones nativas con cookies HttpOnly,
 * protección CSRF y recuperación criptográfica de contraseñas.
 */

declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/security.php';

Security::setSecurityHeaders();
Security::initSession();

$input = DB::getJsonInput();
$action = $_GET['action'] ?? $_POST['action'] ?? ($input['action'] ?? 'session');
$pdo = DB::getConnection();

switch ($action) {
    case 'login':
        $email = trim((string)($input['email'] ?? ''));
        $password = trim((string)($input['password'] ?? ''));

        if (empty($email) || empty($password)) {
            Security::jsonResponse(false, null, 'Debes ingresar correo electrónico y contraseña.', 400);
        }

        $emailClean = strtolower($email);
        $stmt = $pdo->prepare('SELECT * FROM users WHERE LOWER(email) = :email LIMIT 1');
        $stmt->execute([':email' => $emailClean]);
        $user = $stmt->fetch();

        // Si no se encuentra con el email exacto, buscar por prefijo si es necesario
        if (!$user) {
            $stmt = $pdo->prepare('SELECT * FROM users WHERE LOWER(email) LIKE :email_prefix LIMIT 1');
            $stmt->execute([':email_prefix' => $emailClean . '@%']);
            $user = $stmt->fetch();
        }

        if (!$user) {
            Security::jsonResponse(false, null, 'Credenciales incorrectas. Verifica tus datos.', 401);
        }

        if ((int)$user['is_active'] !== 1) {
            Security::jsonResponse(false, null, 'Tu cuenta se encuentra inactiva. Contacta a un administrador de Humm.', 403);
        }

        // Validación estricta y única de contraseña (sin backdoors ni contraseñas maestras)
        $passwordValid = password_verify($password, (string)$user['password_hash']);

        if (!$passwordValid) {
            Security::jsonResponse(false, null, 'Credenciales incorrectas. Verifica tus datos.', 401);
        }

        // Regenerar ID de sesión al autenticar para mitigar Session Fixation
        session_regenerate_id(true);

        // Actualizar último acceso
        $upStmt = $pdo->prepare('UPDATE users SET last_access = NOW() WHERE id = :id');
        $upStmt->execute([':id' => $user['id']]);

        // Cargar o auto-vincular workspace
        $workspace = null;
        if (!empty($user['workspace_id'])) {
            $wsStmt = $pdo->prepare('SELECT * FROM workspaces WHERE id = :ws_id LIMIT 1');
            $wsStmt->execute([':ws_id' => $user['workspace_id']]);
            $workspace = $wsStmt->fetch() ?: null;
        }

        if (!$workspace && !empty($user['email']) && $user['role'] === 'entrepreneur') {
            $wsStmt = $pdo->prepare('SELECT * FROM workspaces WHERE LOWER(TRIM(email)) = LOWER(TRIM(:email)) LIMIT 1');
            $wsStmt->execute([':email' => $user['email']]);
            $workspace = $wsStmt->fetch() ?: null;
            if ($workspace) {
                $user['workspace_id'] = $workspace['id'];
                $upLink = $pdo->prepare('UPDATE users SET workspace_id = :ws_id WHERE id = :user_id');
                $upLink->execute([':ws_id' => $workspace['id'], ':user_id' => $user['id']]);
            }
        }

        // Establecer variables de sesión seguras en el servidor
        $_SESSION['user_id'] = (string)$user['id'];
        $_SESSION['role'] = (string)$user['role'];
        $_SESSION['workspace_id'] = !empty($user['workspace_id']) ? (string)$user['workspace_id'] : null;
        $_SESSION['email'] = (string)$user['email'];
        $_SESSION['name'] = (string)$user['name'];
        $_SESSION['last_activity'] = time();
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));

        // Parsear herramientas y remover hash de la respuesta
        $user['assigned_tool_ids'] = !empty($user['assigned_tool_ids']) ? json_decode($user['assigned_tool_ids'], true) : [];
        unset($user['password_hash'], $user['reset_token']);

        Security::jsonResponse(true, [
            'user' => $user,
            'workspace' => $workspace,
            'csrf_token' => Security::getCsrfToken()
        ]);
        break;

    case 'session':
        // Determinar identidad exclusivamente desde la sesión server-side
        $authUser = Security::requireAuth();

        $stmt = $pdo->prepare('SELECT * FROM users WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $authUser['id']]);
        $user = $stmt->fetch();

        if (!$user || (int)$user['is_active'] !== 1) {
            Security::destroySession();
            Security::jsonResponse(false, null, 'Sesión expirada o cuenta inactiva.', 401);
        }

        // Cargar workspace
        $workspace = null;
        $wsId = $user['workspace_id'] ?? $authUser['workspace_id'];
        if (!empty($wsId)) {
            $wsStmt = $pdo->prepare('SELECT * FROM workspaces WHERE id = :ws_id LIMIT 1');
            $wsStmt->execute([':ws_id' => $wsId]);
            $workspace = $wsStmt->fetch() ?: null;
        }

        if (!$workspace && !empty($user['email']) && $user['role'] === 'entrepreneur') {
            $wsStmt = $pdo->prepare('SELECT * FROM workspaces WHERE LOWER(TRIM(email)) = LOWER(TRIM(:email)) LIMIT 1');
            $wsStmt->execute([':email' => $user['email']]);
            $workspace = $wsStmt->fetch() ?: null;
            if ($workspace) {
                $user['workspace_id'] = $workspace['id'];
                $_SESSION['workspace_id'] = $workspace['id'];
                $upLink = $pdo->prepare('UPDATE users SET workspace_id = :ws_id WHERE id = :user_id');
                $upLink->execute([':ws_id' => $workspace['id'], ':user_id' => $user['id']]);
            }
        }

        $user['assigned_tool_ids'] = !empty($user['assigned_tool_ids']) ? json_decode($user['assigned_tool_ids'], true) : [];
        unset($user['password_hash'], $user['reset_token']);

        Security::jsonResponse(true, [
            'user' => $user,
            'workspace' => $workspace,
            'csrf_token' => Security::getCsrfToken()
        ]);
        break;

    case 'change_password':
        $authUser = Security::requireAuth();
        Security::validateCsrfToken();

        $currentPass = trim((string)($input['current_password'] ?? ''));
        $newPass = trim((string)($input['new_password'] ?? ''));

        if (empty($currentPass) || empty($newPass)) {
            Security::jsonResponse(false, null, 'Debes ingresar tu contraseña actual y la nueva contraseña.', 400);
        }

        if (strlen($newPass) < 8) {
            Security::jsonResponse(false, null, 'La nueva contraseña debe tener al menos 8 caracteres.', 400);
        }

        $stmt = $pdo->prepare('SELECT id, password_hash FROM users WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $authUser['id']]);
        $u = $stmt->fetch();
        if (!$u) {
            Security::jsonResponse(false, null, 'Usuario no encontrado.', 404);
        }

        // Verificación estricta de la contraseña actual
        if (!password_verify($currentPass, (string)$u['password_hash'])) {
            Security::jsonResponse(false, null, 'La contraseña actual ingresada es incorrecta.', 401);
        }

        $newHash = password_hash($newPass, PASSWORD_BCRYPT);
        $upStmt = $pdo->prepare('UPDATE users SET password_hash = :hash, must_change_password = 0 WHERE id = :id');
        $upStmt->execute([':hash' => $newHash, ':id' => $authUser['id']]);

        // Regenerar sesión
        session_regenerate_id(true);

        Security::jsonResponse(true, ['message' => 'Contraseña actualizada exitosamente.']);
        break;

    case 'request_reset':
        $email = trim((string)($input['email'] ?? $_POST['email'] ?? ''));
        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Security::jsonResponse(false, null, 'Ingresa un correo electrónico válido.', 400);
        }

        $stmt = $pdo->prepare('SELECT id, name, email FROM users WHERE LOWER(email) = LOWER(:email) LIMIT 1');
        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch();

        // Respuesta genérica para mitigar enumeración de usuarios
        $genericMsg = 'Si el correo está registrado, recibirás un enlace de recuperación seguro.';

        if (!$user) {
            Security::jsonResponse(true, ['message' => $genericMsg]);
        }

        // Generar token criptográfico seguro de un solo uso con expiración a 1 hora
        $rawToken = bin2hex(random_bytes(32));
        $tokenHash = hash('sha256', $rawToken);
        $expiresAt = time() + 3600; // 1 hora
        $tokenRecord = $tokenHash . ':' . $expiresAt;

        $upToken = $pdo->prepare('UPDATE users SET reset_token = :token_rec WHERE id = :id');
        $upToken->execute([':token_rec' => $tokenRecord, ':id' => $user['id']]);

        // Enviar correo con el token firmado en la URL
        require_once __DIR__ . '/mailer.php';

        $resetUrl = "https://comunidad.humm.cl/#cambiar-clave?token=" . urlencode($rawToken);
        $subject = "Restablece tu Contraseña - Mi Humm";
        $userName = htmlspecialchars((string)$user['name']);
        $html = "<!DOCTYPE html><html lang='es'><head><meta charset='UTF-8'><title>Restablecer Contraseña</title><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;padding:20px;color:#1e293b;}.card{max-width:520px;margin:0 auto;background:#fff;padding:28px;border-radius:10px;border:1px solid #e2e8f0;}.btn{display:inline-block;background:#e5383b;color:#fff!important;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:700;margin:20px 0;}</style></head><body><div class='card'><h2 style='color:#0f172a;margin-top:0;'>Restablece tu Contraseña</h2><p>Hola, <strong>{$userName}</strong>:</p><p>Hemos recibido una solicitud para cambiar tu contraseña en <strong>Mi Humm</strong>. Este enlace es válido por 60 minutos:</p><div style='text-align:center;'><a href='{$resetUrl}' class='btn'>🔐 Restablecer mi Contraseña</a></div><p style='font-size:12px;color:#64748b;'>Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p></div></body></html>";
        
        $dispatch = HummMailer::send($user['email'], $subject, $html);
        if (!$dispatch['sent']) {
            error_log("Error enviando correo de recuperación a {$user['email']}: " . ($dispatch['error'] ?? 'desconocido'));
        }

        Security::jsonResponse(true, ['message' => $genericMsg]);
        break;

    case 'verify_reset_token':
        $token = trim((string)($input['token'] ?? $_GET['token'] ?? ''));
        if (empty($token)) {
            Security::jsonResponse(false, null, 'Token de restablecimiento no proporcionado.', 400);
        }

        $tokenHash = hash('sha256', $token);
        $stmt = $pdo->prepare('SELECT id, email, name, reset_token FROM users WHERE reset_token LIKE :token_prefix LIMIT 1');
        $stmt->execute([':token_prefix' => $tokenHash . ':%']);
        $user = $stmt->fetch();

        if (!$user) {
            Security::jsonResponse(false, null, 'El enlace de recuperación es inválido o ya ha sido utilizado.', 400);
        }

        $parts = explode(':', (string)$user['reset_token'], 2);
        $expTime = (int)($parts[1] ?? 0);
        if ($expTime < time()) {
            // Expirado: revocar
            $revStmt = $pdo->prepare('UPDATE users SET reset_token = NULL WHERE id = :id');
            $revStmt->execute([':id' => $user['id']]);
            Security::jsonResponse(false, null, 'El enlace de recuperación ha expirado. Solicita uno nuevo.', 400);
        }

        Security::jsonResponse(true, [
            'valid' => true,
            'email' => $user['email'],
            'name' => $user['name']
        ]);
        break;

    case 'apply_reset_password':
        $token = trim((string)($input['token'] ?? ''));
        $newPass = trim((string)($input['new_password'] ?? ''));

        if (empty($token) || empty($newPass)) {
            Security::jsonResponse(false, null, 'Token y nueva contraseña son obligatorios.', 400);
        }

        if (strlen($newPass) < 8) {
            Security::jsonResponse(false, null, 'La nueva contraseña debe tener al menos 8 caracteres.', 400);
        }

        $tokenHash = hash('sha256', $token);
        $stmt = $pdo->prepare('SELECT id, reset_token FROM users WHERE reset_token LIKE :token_prefix LIMIT 1');
        $stmt->execute([':token_prefix' => $tokenHash . ':%']);
        $user = $stmt->fetch();

        if (!$user) {
            Security::jsonResponse(false, null, 'El token es inválido o ya ha sido utilizado.', 400);
        }

        $parts = explode(':', (string)$user['reset_token'], 2);
        $expTime = (int)($parts[1] ?? 0);
        if ($expTime < time()) {
            $revStmt = $pdo->prepare('UPDATE users SET reset_token = NULL WHERE id = :id');
            $revStmt->execute([':id' => $user['id']]);
            Security::jsonResponse(false, null, 'El enlace ha expirado. Solicita uno nuevo.', 400);
        }

        $newHash = password_hash($newPass, PASSWORD_BCRYPT);
        $upStmt = $pdo->prepare('UPDATE users SET password_hash = :hash, reset_token = NULL, must_change_password = 0 WHERE id = :id');
        $upStmt->execute([':hash' => $newHash, ':id' => $user['id']]);

        Security::jsonResponse(true, ['message' => 'Contraseña actualizada con éxito. Ya puedes iniciar sesión con tu nueva clave.']);
        break;

    case 'logout':
        Security::destroySession();
        Security::jsonResponse(true, ['message' => 'Sesión finalizada exitosamente.']);
        break;

    default:
        Security::jsonResponse(false, null, 'Acción no válida o no permitida.', 400);
        break;
}
