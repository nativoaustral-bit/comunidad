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

    // 1. Catálogo común siempre disponible (Herramientas, Descuentos y Planes)
    $stmtTools = $pdo->query('SELECT * FROM tools ORDER BY sort_order ASC');
    $rawTools = $stmtTools->fetchAll();
    $tools = [];
    foreach ($rawTools as $t) {
        $tools[] = [
            'id' => $t['id'],
            'name' => $t['name'],
            'category' => $t['category'] ?? 'Gestión Comercial',
            'description' => $t['description'] ?? '',
            'status' => $t['status'] ?? 'disponible',
            'url' => $t['url'] ?? '',
            'icon' => $t['icon'] ?? '🚀',
            'sortOrder' => (int)($t['sort_order'] ?? 1),
            'order' => (int)($t['sort_order'] ?? 1),
            'isVisible' => (bool)($t['is_visible'] ?? 1),
            'isIncluded' => (bool)($t['is_included'] ?? 1),
            'createdAt' => $t['created_at'] ?? null
        ];
    }
    $data['tools'] = $tools;

    // 2. Alianzas y Descuentos
    $stmtDiscounts = $pdo->query('SELECT * FROM company_discounts ORDER BY is_featured DESC, created_at DESC');
    $rawDiscounts = $stmtDiscounts->fetchAll();
    $discounts = [];
    foreach ($rawDiscounts as $d) {
        $discounts[] = [
            'id' => $d['id'],
            'companyName' => $d['company_name'] ?? 'Empresa Aliada',
            'logo' => $d['logo'] ?? '🎁',
            'discountTitle' => $d['discount_title'] ?? 'Beneficio Exclusivo Humm',
            'category' => $d['category'] ?? 'Servicios Generales',
            'description' => $d['description'] ?? '',
            'code' => $d['code'] ?? '',
            'url' => $d['url'] ?? '',
            'expiresAt' => $d['expires_at'] ?? null,
            'isFeatured' => (bool)($d['is_featured'] ?? 0),
            'featured' => (bool)($d['is_featured'] ?? 0),
            'status' => $d['status'] ?? 'active',
            'createdAt' => $d['created_at'] ?? null
        ];
    }
    $data['company_discounts'] = $discounts;

    // 3. Planes de Suscripción
    $stmtPlans = $pdo->query('SELECT * FROM subscription_plans ORDER BY sort_order ASC');
    $plans = $stmtPlans->fetchAll();
    foreach ($plans as &$p) {
        $p['features'] = !empty($p['features']) ? json_decode($p['features'], true) : [];
        $p['trialDays'] = (int)($p['trial_days'] ?? 0);
        $p['sortOrder'] = (int)($p['sort_order'] ?? 1);
        $p['order'] = (int)($p['sort_order'] ?? 1);
    }
    $data['subscription_plans'] = $plans;

    // 3.1 Difusión y Comunicados
    $stmtBc = $pdo->query('SELECT * FROM broadcasts ORDER BY created_at DESC');
    $rawBc = $stmtBc->fetchAll();
    $broadcasts = [];
    foreach ($rawBc as $bc) {
        $broadcasts[] = [
            'id' => $bc['id'],
            'title' => $bc['title'],
            'category' => $bc['category'] ?? 'Noticia de la Comunidad',
            'targetAudience' => $bc['target_audience'] ?? 'Todos los Emprendedores',
            'content' => $bc['content'] ?? '',
            'authorName' => $bc['author_name'] ?? 'Administración Humm',
            'channels' => !empty($bc['channels']) ? json_decode($bc['channels'], true) : [],
            'reachCount' => (int)($bc['reach_count'] ?? 0),
            'createdAt' => $bc['created_at'] ?? null
        ];
    }
    $data['broadcasts'] = $broadcasts;

    // 4. Gestión Global para Administradores
    if ($role === 'admin') {
        $stmtUsers = $pdo->query('SELECT id, workspace_id, name, email, phone, role, specialty, avatar, theme, is_active, assigned_tool_ids, advisor_name, advisor_email, last_access, must_change_password, created_at FROM users ORDER BY name ASC');
        $rawUsers = $stmtUsers->fetchAll();
        $users = [];
        foreach ($rawUsers as $u) {
            $users[] = [
                'id' => $u['id'],
                'workspaceId' => $u['workspace_id'] ?? null,
                'name' => $u['name'],
                'email' => $u['email'],
                'phone' => $u['phone'] ?? '',
                'role' => $u['role'] ?? 'entrepreneur',
                'specialty' => $u['specialty'] ?? '',
                'avatar' => $u['avatar'] ?? 'U',
                'theme' => $u['theme'] ?? 'light',
                'isActive' => (bool)$u['is_active'],
                'assignedToolIds' => !empty($u['assigned_tool_ids']) ? json_decode($u['assigned_tool_ids'], true) : [],
                'advisorName' => $u['advisor_name'] ?? null,
                'advisorEmail' => $u['advisor_email'] ?? null,
                'lastAccess' => $u['last_access'] ?? null,
                'mustChangePassword' => (int)($u['must_change_password'] ?? 0),
                'createdAt' => $u['created_at'] ?? null
            ];
        }
        $data['users'] = $users;

        $stmtWorkspaces = $pdo->query('SELECT * FROM workspaces ORDER BY name ASC');
        $rawWorkspaces = $stmtWorkspaces->fetchAll();
        $workspaces = [];
        foreach ($rawWorkspaces as $w) {
            $workspaces[] = [
                'id' => $w['id'],
                'name' => $w['name'],
                'ownerName' => $w['owner_name'] ?? '',
                'ownerFirstName' => $w['owner_first_name'] ?? ($w['owner_name'] ?? ''),
                'ownerLastName' => $w['owner_last_name'] ?? '',
                'email' => $w['email'] ?? '',
                'phone' => $w['phone'] ?? '',
                'city' => $w['city'] ?? '',
                'comuna' => $w['city'] ?? '',
                'region' => $w['region'] ?? '',
                'industry' => $w['industry'] ?? '',
                'description' => $w['description'] ?? '',
                'membershipStatus' => $w['membership_status'] ?? 'active',
                'membershipType' => $w['membership_type'] ?? 'Membresía Humm Co-Creation',
                'advisorName' => $w['advisor_name'] ?? null,
                'advisorEmail' => $w['advisor_email'] ?? null,
                'assignedTools' => [],
                'createdAt' => $w['created_at'] ?? null
            ];
        }
        $data['workspaces'] = $workspaces;

        $stmtSubs = $pdo->query('SELECT * FROM subscriptions ORDER BY created_at DESC');
        $rawSubs = $stmtSubs->fetchAll();
        $subs = [];
        foreach ($rawSubs as $s) {
            $subs[] = [
                'id' => $s['id'],
                'userId' => $s['user_id'] ?? null,
                'workspaceId' => $s['workspace_id'] ?? null,
                'clientName' => $s['client_name'] ?? 'Emprendedor Humm',
                'clientEmail' => $s['client_email'] ?? '',
                'clientPhone' => $s['client_phone'] ?? '',
                'businessName' => $s['business_name'] ?? 'Emprendimiento',
                'planId' => $s['plan_id'] ?? 'plan-base',
                'planName' => $s['plan_name'] ?? 'Plan Base',
                'monthlyPrice' => (int)($s['monthly_price'] ?? 0),
                'status' => $s['status'] ?? 'trial',
                'trialDaysTotal' => (int)($s['trial_days_total'] ?? 14),
                'trialDaysLeft' => (int)($s['trial_days_left'] ?? 14),
                'isTrial' => (bool)($s['is_trial'] ?? 0),
                'paymentStatus' => $s['payment_status'] ?? 'pending',
                'joinedDate' => $s['joined_date'] ?? null,
                'lastPaymentDate' => $s['last_payment_date'] ?? null,
                'nextBillingDate' => $s['next_billing_date'] ?? null,
                'paymentMethod' => $s['payment_method'] ?? 'Webpay',
                'paymentLink' => $s['payment_link'] ?? '',
                'createdAt' => $s['created_at'] ?? null
            ];
        }
        $data['subscriptions'] = $subs;

        $stmtRequests = $pdo->query('SELECT * FROM support_requests ORDER BY created_at DESC');
        $rawRequests = $stmtRequests->fetchAll();
        $requests = [];
        foreach ($rawRequests as $r) {
            $requests[] = [
                'id' => $r['id'],
                'workspaceId' => $r['workspace_id'] ?? null,
                'userId' => $r['user_id'] ?? null,
                'workspaceName' => $r['workspace_name'] ?? '',
                'userName' => $r['user_name'] ?? '',
                'userEmail' => $r['user_email'] ?? '',
                'requestType' => $r['request_type'] ?? 'Consulta general',
                'subject' => $r['subject'] ?? '',
                'description' => $r['description'] ?? '',
                'contactPreference' => $r['contact_preference'] ?? '',
                'advisorName' => $r['advisor_name'] ?? null,
                'advisorEmail' => $r['advisor_email'] ?? null,
                'status' => $r['status'] ?? 'pendiente',
                'createdAt' => $r['created_at'] ?? null
            ];
        }
        $data['support_requests'] = $requests;
    } elseif (!empty($workspaceId)) {
        // Si no es admin pero tiene workspace asignado
        $stmtWs = $pdo->prepare('SELECT * FROM workspaces WHERE id = :ws LIMIT 1');
        $stmtWs->execute([':ws' => $workspaceId]);
        $w = $stmtWs->fetch();
        if ($w) {
            $data['workspaces'] = [[
                'id' => $w['id'],
                'name' => $w['name'],
                'ownerName' => $w['owner_name'] ?? '',
                'ownerFirstName' => $w['owner_first_name'] ?? ($w['owner_name'] ?? ''),
                'ownerLastName' => $w['owner_last_name'] ?? '',
                'email' => $w['email'] ?? '',
                'phone' => $w['phone'] ?? '',
                'city' => $w['city'] ?? '',
                'comuna' => $w['city'] ?? '',
                'region' => $w['region'] ?? '',
                'industry' => $w['industry'] ?? '',
                'description' => $w['description'] ?? '',
                'membershipStatus' => $w['membership_status'] ?? 'active',
                'membershipType' => $w['membership_type'] ?? 'Membresía Humm Co-Creation',
                'advisorName' => $w['advisor_name'] ?? null,
                'advisorEmail' => $w['advisor_email'] ?? null,
                'assignedTools' => [],
                'createdAt' => $w['created_at'] ?? null
            ]];
        }
    }

    // 5. Si hay Workspace activo: cargar datos específicos del negocio
    if (!empty($workspaceId)) {
        $stmtCustomers = $pdo->prepare('SELECT * FROM customers WHERE workspace_id = :ws ORDER BY name ASC');
        $stmtCustomers->execute([':ws' => $workspaceId]);
        $rawCust = $stmtCustomers->fetchAll();
        $customers = [];
        foreach ($rawCust as $c) {
            $firstName = $c['name'];
            $lastName = $c['last_name'] ?? '';
            if (empty($lastName) && strpos($c['name'], ' ') !== false) {
                $parts = explode(' ', $c['name'], 2);
                $firstName = $parts[0];
                $lastName = $parts[1] ?? '';
            }
            $customers[] = [
                'id' => $c['id'],
                'workspaceId' => $c['workspace_id'],
                'name' => $c['name'],
                'firstName' => $firstName,
                'lastName' => $lastName,
                'company' => $c['company'] ?? '',
                'rut' => $c['rut'] ?? '',
                'email' => $c['email'] ?? '',
                'phone' => $c['phone'] ?? '',
                'region' => $c['region'] ?? '',
                'comuna' => $c['comuna'] ?? '',
                'city' => $c['city'] ?? '',
                'address' => $c['address'] ?? '',
                'sourceChannel' => $c['source_channel'] ?? 'Recomendación',
                'status' => $c['status'] ?? 'active',
                'totalPurchases' => (float)($c['total_purchases'] ?? 0),
                'lastPurchaseDate' => $c['last_purchase_date'] ?? null,
                'notes' => $c['notes'] ?? '',
                'createdAt' => $c['created_at'] ?? null
            ];
        }
        $data['customers'] = $customers;

        $stmtSales = $pdo->prepare('SELECT * FROM sales WHERE workspace_id = :ws ORDER BY sale_date DESC, created_at DESC');
        $stmtSales->execute([':ws' => $workspaceId]);
        $rawSales = $stmtSales->fetchAll();
        $sales = [];
        foreach ($rawSales as $s) {
            $sales[] = [
                'id' => $s['id'],
                'workspaceId' => $s['workspace_id'],
                'customerId' => $s['customer_id'] ?? null,
                'customerName' => $s['customer_name'] ?? '',
                'amount' => (float)($s['amount'] ?? 0),
                'saleDate' => $s['sale_date'] ?? null,
                'date' => $s['sale_date'] ?? null,
                'paymentMethod' => $s['payment_method'] ?? 'Transferencia',
                'status' => $s['status'] ?? 'completed',
                'description' => $s['description'] ?? '',
                'createdAt' => $s['created_at'] ?? null
            ];
        }
        $data['sales'] = $sales;

        $stmtTasks = $pdo->prepare('SELECT * FROM tasks WHERE workspace_id = :ws ORDER BY due_date ASC, created_at DESC');
        $stmtTasks->execute([':ws' => $workspaceId]);
        $rawTasks = $stmtTasks->fetchAll();
        $tasks = [];
        foreach ($rawTasks as $t) {
            $rawStatus = $t['status'] ?? 'todo';
            if ($rawStatus === '' || $rawStatus === 'pendiente') $rawStatus = 'todo';
            elseif ($rawStatus === 'en_proceso' || $rawStatus === 'en_progreso') $rawStatus = 'in_progress';
            elseif ($rawStatus === 'completada') $rawStatus = 'done';

            $tasks[] = [
                'id' => $t['id'],
                'workspaceId' => $t['workspace_id'],
                'title' => $t['title'],
                'description' => $t['description'] ?? '',
                'startDate' => $t['start_date'] ?? null,
                'dueDate' => $t['due_date'] ?? null,
                'priority' => $t['priority'] ?? 'media',
                'status' => $rawStatus,
                'tag' => $t['tag'] ?? '',
                'customerId' => $t['customer_id'] ?? null,
                'opportunityId' => $t['opportunity_id'] ?? null,
                'completedAt' => $t['completed_at'] ?? null,
                'createdAt' => $t['created_at'] ?? null
            ];
        }
        $data['tasks'] = $tasks;

        $stmtEvents = $pdo->prepare('SELECT * FROM calendar_events WHERE workspace_id = :ws ORDER BY event_date ASC, event_time ASC');
        $stmtEvents->execute([':ws' => $workspaceId]);
        $rawEvents = $stmtEvents->fetchAll();
        $events = [];
        foreach ($rawEvents as $ev) {
            $events[] = [
                'id' => $ev['id'],
                'workspaceId' => $ev['workspace_id'],
                'title' => $ev['title'],
                'eventDate' => $ev['event_date'],
                'eventTime' => $ev['event_time'] ?? '',
                'type' => $ev['type'] ?? 'reunion',
                'description' => $ev['description'] ?? '',
                'createdAt' => $ev['created_at'] ?? null
            ];
        }
        $data['calendar_events'] = $events;

        $stmtNotes = $pdo->prepare('SELECT * FROM quick_notes WHERE workspace_id = :ws ORDER BY is_pinned DESC, updated_at DESC');
        $stmtNotes->execute([':ws' => $workspaceId]);
        $rawNotes = $stmtNotes->fetchAll();
        $notes = [];
        foreach ($rawNotes as $n) {
            $notes[] = [
                'id' => $n['id'],
                'workspaceId' => $n['workspace_id'],
                'title' => $n['title'] ?? '',
                'content' => $n['content'] ?? '',
                'color' => $n['color'] ?? 'yellow',
                'isPinned' => (bool)($n['is_pinned'] ?? 0),
                'updatedAt' => $n['updated_at'] ?? null,
                'createdAt' => $n['created_at'] ?? null
            ];
        }
        $data['quick_notes'] = $notes;

        $stmtOpps = $pdo->prepare('SELECT * FROM opportunities WHERE workspace_id = :ws ORDER BY expected_close_date ASC');
        $stmtOpps->execute([':ws' => $workspaceId]);
        $rawOpps = $stmtOpps->fetchAll();
        $opps = [];
        foreach ($rawOpps as $o) {
            $opps[] = [
                'id' => $o['id'],
                'workspaceId' => $o['workspace_id'],
                'title' => $o['title'],
                'customerName' => $o['customer_name'] ?? '',
                'value' => (float)($o['value'] ?? 0),
                'stage' => $o['stage'] ?? 'prospeccion',
                'expectedCloseDate' => $o['expected_close_date'] ?? null,
                'createdAt' => $o['created_at'] ?? null
            ];
        }
        $data['opportunities'] = $opps;
    }

    DB::jsonResponse(true, $data);
} catch (Exception $e) {
    DB::jsonResponse(false, null, 'Error al consultar datos: ' . $e->getMessage(), 500);
}
