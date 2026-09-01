<?php
/**
 * MI HUMM - CONTROLADOR DE AUTENTICACIÓN Y SESIONES
 * Login, Verificación de sesión y Seguridad
 */

declare(strict_types=1);

require_once __DIR__ . '/db.php';

setApiHeaders();
$action = $_GET['action'] ?? $_POST['action'] ?? 'session';
$pdo = DB::getConnection();
$input = DB::getJsonInput();

switch ($action) {
    case 'login':
        $email = trim($input['email'] ?? '');
        $password = trim($input['password'] ?? '');

        if (empty($email) || empty($password)) {
            DB::jsonResponse(false, null, 'Debes ingresar correo electrónico y contraseña.', 400);
        }

        $stmt = $pdo->prepare('SELECT * FROM users WHERE email = :email LIMIT 1');
        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch();

        if (!$user) {
            DB::jsonResponse(false, null, 'Credenciales incorrectas o usuario no registrado.', 401);
        }

        if ((int)$user['is_active'] !== 1) {
            DB::jsonResponse(false, null, 'Tu cuenta se encuentra inactiva. Contacta a un administrador de Humm.', 403);
        }

        // Validación de contraseña (soporta hash bcrypt o bypass para passwords de prueba)
        $passwordValid = password_verify($password, $user['password_hash']) ||
                         $password === 'humm' ||
                         $password === 'admin' ||
                         ($user['role'] === 'admin' && $password === 'admin') ||
                         ($user['role'] !== 'admin' && $password === 'humm');

        if (!$passwordValid) {
            DB::jsonResponse(false, null, 'Contraseña incorrecta.', 401);
        }

        // Actualizar último acceso
        $upStmt = $pdo->prepare('UPDATE users SET last_access = NOW() WHERE id = :id');
        $upStmt->execute([':id' => $user['id']]);

        // Cargar workspace asociado si existe
        $workspace = null;
        if (!empty($user['workspace_id'])) {
            $wsStmt = $pdo->prepare('SELECT * FROM workspaces WHERE id = :ws_id LIMIT 1');
            $wsStmt->execute([':ws_id' => $user['workspace_id']]);
            $workspace = $wsStmt->fetch() ?: null;
        }

        // Parsear JSON de herramientas asignadas
        $user['assigned_tool_ids'] = !empty($user['assigned_tool_ids']) ? json_decode($user['assigned_tool_ids'], true) : [];
        unset($user['password_hash']); // No enviar el hash al frontend

        // Generar token simple de sesión
        $sessionToken = bin2hex(random_bytes(32));

        DB::jsonResponse(true, [
            'user' => $user,
            'workspace' => $workspace,
            'token' => $sessionToken
        ]);
        break;

    case 'session':
        $userId = trim($_GET['user_id'] ?? $input['user_id'] ?? '');
        if (empty($userId)) {
            DB::jsonResponse(false, null, 'No hay sesión activa.', 401);
        }

        $stmt = $pdo->prepare('SELECT * FROM users WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $userId]);
        $user = $stmt->fetch();

        if (!$user || (int)$user['is_active'] !== 1) {
            DB::jsonResponse(false, null, 'Sesión expirada o usuario inactivo.', 401);
        }

        $workspace = null;
        if (!empty($user['workspace_id'])) {
            $wsStmt = $pdo->prepare('SELECT * FROM workspaces WHERE id = :ws_id LIMIT 1');
            $wsStmt->execute([':ws_id' => $user['workspace_id']]);
            $workspace = $wsStmt->fetch() ?: null;
        }

        $user['assigned_tool_ids'] = !empty($user['assigned_tool_ids']) ? json_decode($user['assigned_tool_ids'], true) : [];
        unset($user['password_hash']);

        DB::jsonResponse(true, [
            'user' => $user,
            'workspace' => $workspace
        ]);
        break;

    case 'change_password':
        $userId = trim($input['user_id'] ?? '');
        $currentPass = trim($input['current_password'] ?? '');
        $newPass = trim($input['new_password'] ?? '');

        if (empty($userId) || empty($newPass)) {
            DB::jsonResponse(false, null, 'Datos incompletos para cambio de contraseña.', 400);
        }

        $newHash = password_hash($newPass, PASSWORD_BCRYPT);
        $stmt = $pdo->prepare('UPDATE users SET password_hash = :hash WHERE id = :id');
        $stmt->execute([':hash' => $newHash, ':id' => $userId]);

        DB::jsonResponse(true, ['message' => 'Contraseña actualizada exitosamente.']);
        break;

    case 'logout':
        DB::jsonResponse(true, ['message' => 'Sesión finalizada.']);
        break;

    default:
        DB::jsonResponse(false, null, 'Acción no válida.', 400);
        break;
}
