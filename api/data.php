<?php
/**
 * MI HUMM - CONTROLADOR DE LECTURA DE DATOS (DATA PROVIDER)
 * Retorna el estado sincronizado de la plataforma según el rol y workspace del usuario
 */

declare(strict_types=1);

require_once __DIR__ . '/db.php';

setApiHeaders();
$pdo = DB::getConnection();

$userId = $_GET['user_id'] ?? '';
$workspaceId = $_GET['workspace_id'] ?? '';
$role = $_GET['role'] ?? 'entrepreneur';

try {
    $data = [];

    // 1. Catálogo común siempre disponible
    $stmtTools = $pdo->query('SELECT * FROM tools ORDER BY sort_order ASC');
    $data['tools'] = $stmtTools->fetchAll();

    $stmtDiscounts = $pdo->query('SELECT * FROM company_discounts WHERE status = "active" ORDER BY is_featured DESC, created_at DESC');
    $data['company_discounts'] = $stmtDiscounts->fetchAll();

    $stmtPlans = $pdo->query('SELECT * FROM subscription_plans ORDER BY sort_order ASC');
    $plans = $stmtPlans->fetchAll();
    foreach ($plans as &$p) {
        $p['features'] = !empty($p['features']) ? json_decode($p['features'], true) : [];
    }
    $data['subscription_plans'] = $plans;

    // 2. Si es Administrador: cargar datos de gestión global
    if ($role === 'admin') {
        $stmtUsers = $pdo->query('SELECT id, workspace_id, name, email, role, avatar, theme, is_active, assigned_tool_ids, advisor_name, advisor_email, last_access, created_at FROM users ORDER BY name ASC');
        $users = $stmtUsers->fetchAll();
        foreach ($users as &$u) {
            $u['assigned_tool_ids'] = !empty($u['assigned_tool_ids']) ? json_decode($u['assigned_tool_ids'], true) : [];
            $u['is_active'] = (bool)$u['is_active'];
        }
        $data['users'] = $users;

        $stmtWorkspaces = $pdo->query('SELECT * FROM workspaces ORDER BY name ASC');
        $data['workspaces'] = $stmtWorkspaces->fetchAll();

        $stmtSubs = $pdo->query('SELECT * FROM subscriptions ORDER BY created_at DESC');
        $data['subscriptions'] = $stmtSubs->fetchAll();

        $stmtRequests = $pdo->query('SELECT * FROM support_requests ORDER BY created_at DESC');
        $data['support_requests'] = $stmtRequests->fetchAll();
    }

    // 3. Si hay Workspace activo (Emprendedor o Admin suplantando): cargar datos específicos del negocio
    if (!empty($workspaceId)) {
        $stmtCustomers = $pdo->prepare('SELECT * FROM customers WHERE workspace_id = :ws ORDER BY name ASC');
        $stmtCustomers->execute([':ws' => $workspaceId]);
        $data['customers'] = $stmtCustomers->fetchAll();

        $stmtSales = $pdo->prepare('SELECT * FROM sales WHERE workspace_id = :ws ORDER BY sale_date DESC, created_at DESC');
        $stmtSales->execute([':ws' => $workspaceId]);
        $data['sales'] = $stmtSales->fetchAll();

        $stmtTasks = $pdo->prepare('SELECT * FROM tasks WHERE workspace_id = :ws ORDER BY due_date ASC, created_at DESC');
        $stmtTasks->execute([':ws' => $workspaceId]);
        $data['tasks'] = $stmtTasks->fetchAll();

        $stmtEvents = $pdo->prepare('SELECT * FROM calendar_events WHERE workspace_id = :ws ORDER BY event_date ASC, event_time ASC');
        $stmtEvents->execute([':ws' => $workspaceId]);
        $data['calendar_events'] = $stmtEvents->fetchAll();

        $stmtNotes = $pdo->prepare('SELECT * FROM quick_notes WHERE workspace_id = :ws ORDER BY is_pinned DESC, updated_at DESC');
        $stmtNotes->execute([':ws' => $workspaceId]);
        $data['quick_notes'] = $stmtNotes->fetchAll();

        $stmtOpps = $pdo->prepare('SELECT * FROM opportunities WHERE workspace_id = :ws ORDER BY expected_close_date ASC');
        $stmtOpps->execute([':ws' => $workspaceId]);
        $data['opportunities'] = $stmtOpps->fetchAll();

        $stmtWsRequests = $pdo->prepare('SELECT * FROM support_requests WHERE workspace_id = :ws ORDER BY created_at DESC');
        $stmtWsRequests->execute([':ws' => $workspaceId]);
        $data['workspace_support_requests'] = $stmtWsRequests->fetchAll();
    }

    DB::jsonResponse(true, $data);
} catch (Exception $e) {
    DB::jsonResponse(false, null, 'Error al consultar datos: ' . $e->getMessage(), 500);
}
