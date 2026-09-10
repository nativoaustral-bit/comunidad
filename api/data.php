<?php
/**
 * MI HUMM - CONTROLADOR DE LECTURA DE DATOS (DATA PROVIDER SEGURO)
 * Aislamiento multitenant estricto basado en sesión server-side.
 * Cero accesos cruzados entre empresas o roles.
 */

declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/security.php';

Security::setSecurityHeaders();
Security::initSession();

// Exigir autenticación obligatoria: sin sesión server-side -> HTTP 401
$authUser = Security::requireAuth();
$role = $authUser['role'];
$userEmail = $authUser['email'];
$pdo = DB::getConnection();

try {
    $data = [];

    // -------------------------------------------------------------------------
    // 1. CATÁLOGO COMÚN PÚBLICO DE LA PLATAFORMA (Herramientas, Convenios, Planes)
    // -------------------------------------------------------------------------
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
            'contactPerson' => $d['contact_person'] ?? '',
            'contactRole' => $d['contact_role'] ?? '',
            'phone' => $d['phone'] ?? '',
            'whatsapp' => $d['whatsapp'] ?? '',
            'instagram' => $d['instagram'] ?? '',
            'email' => $d['email'] ?? '',
            'preferredChannel' => $d['preferred_channel'] ?? 'whatsapp',
            'code' => $d['code'] ?? '',
            'url' => $d['url'] ?? '',
            'startsAt' => $d['starts_at'] ?? null,
            'expiresAt' => $d['expires_at'] ?? null,
            'minPurchase' => (int)($d['min_purchase'] ?? 0),
            'maxDiscount' => (int)($d['max_discount'] ?? 0),
            'whatsappTemplate' => $d['whatsapp_template'] ?? null,
            'instagramTemplate' => $d['instagram_template'] ?? null,
            'emailTemplate' => $d['email_template'] ?? null,
            'hummResponsible' => $d['humm_responsible'] ?? 'Equipo Humm',
            'isFeatured' => (bool)($d['is_featured'] ?? 0),
            'featured' => (bool)($d['is_featured'] ?? 0),
            'status' => $d['status'] ?? 'active',
            'createdAt' => $d['created_at'] ?? null
        ];
    }
    $data['company_discounts'] = $discounts;

    $stmtPlans = $pdo->query('SELECT * FROM subscription_plans ORDER BY sort_order ASC');
    $plans = $stmtPlans->fetchAll();
    foreach ($plans as &$p) {
        $p['features'] = !empty($p['features']) ? json_decode($p['features'], true) : [];
        $p['trialDays'] = (int)($p['trial_days'] ?? 0);
        $p['sortOrder'] = (int)($p['sort_order'] ?? 1);
        $p['order'] = (int)($p['sort_order'] ?? 1);
    }
    $data['subscription_plans'] = $plans;

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

    // -------------------------------------------------------------------------
    // 2. SEGMENTACIÓN POR ROL Y AISLAMIENTO MULTITENANT
    // -------------------------------------------------------------------------

    // CASO A: ADMINISTRADOR GENERAL DE HUMM
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
                'kanbanColumns' => !empty($w['kanban_columns']) ? json_decode($w['kanban_columns'], true) : null,
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

        $stmtReqs = $pdo->query('SELECT * FROM benefit_requests ORDER BY requested_at DESC');
        $rawReqs = $stmtReqs->fetchAll();
        $benefitRequests = [];
        foreach ($rawReqs as $br) {
            $benefitRequests[] = [
                'id' => $br['id'],
                'discountId' => $br['discount_id'],
                'userId' => $br['user_id'],
                'workspaceId' => $br['workspace_id'],
                'personalCode' => $br['personal_code'],
                'channel' => $br['channel'] ?? 'whatsapp',
                'status' => $br['status'] ?? 'contact_started',
                'requestedAt' => $br['requested_at'] ?? null,
                'lastContactAt' => $br['last_contact_at'] ?? null,
                'usedAt' => $br['used_at'] ?? null,
                'purchaseAmount' => $br['purchase_amount'] !== null ? (int)$br['purchase_amount'] : null,
                'discountAmount' => $br['discount_amount'] !== null ? (int)$br['discount_amount'] : null,
                'memberComment' => $br['member_comment'] ?? '',
                'memberRating' => $br['member_rating'] !== null ? (int)$br['member_rating'] : null,
                'notCompletedReason' => $br['not_completed_reason'] ?? '',
                'adminNotes' => $br['admin_notes'] ?? '',
                'createdAt' => $br['created_at'] ?? null
            ];
        }
        $data['benefit_requests'] = $benefitRequests;

        // Si el admin está auditando un workspace en particular, filtrar datos privados
        $filterWs = trim((string)($_GET['workspace_id'] ?? ''));
        $wsCondition = !empty($filterWs) ? 'WHERE workspace_id = :ws' : '';
        $wsParams = !empty($filterWs) ? [':ws' => $filterWs] : [];

        $stmtSalesAll = $pdo->prepare("SELECT * FROM sales {$wsCondition} ORDER BY sale_date DESC, created_at DESC");
        $stmtSalesAll->execute($wsParams);
        $salesAll = [];
        foreach ($stmtSalesAll->fetchAll() as $s) {
            $salesAmount = (float)($s['total_amount'] ?? ($s['amount'] ?? 0));
            $salesAll[] = [
                'id' => $s['id'],
                'workspaceId' => $s['workspace_id'],
                'customerId' => $s['customer_id'] ?? null,
                'customerName' => $s['customer_name'] ?? '',
                'amount' => $salesAmount,
                'totalAmount' => $salesAmount,
                'saleDate' => $s['sale_date'],
                'date' => $s['sale_date'],
                'paymentMethod' => $s['payment_method'] ?? 'Transferencia',
                'paymentStatus' => $s['payment_status'] ?? 'pagado',
                'notes' => $s['notes'] ?? '',
                'createdAt' => $s['created_at'] ?? null
            ];
        }
        $data['sales'] = $salesAll;

        $stmtTasksAll = $pdo->prepare("SELECT * FROM tasks {$wsCondition} ORDER BY due_date ASC, created_at DESC");
        $stmtTasksAll->execute($wsParams);
        $tasksAll = [];
        foreach ($stmtTasksAll->fetchAll() as $t) {
            $tasksAll[] = [
                'id' => $t['id'],
                'workspaceId' => $t['workspace_id'],
                'title' => $t['title'],
                'description' => $t['description'] ?? '',
                'priority' => $t['priority'] ?? 'media',
                'status' => $t['status'] ?? 'todo',
                'dueDate' => $t['due_date'] ?? null,
                'createdAt' => $t['created_at'] ?? null
            ];
        }
        $data['tasks'] = $tasksAll;

    // CASO B: ASESOR ASIGNADO (advisor)
    } elseif ($role === 'advisor') {
        // Un asesor solo puede ver los workspaces que tiene asignados explícitamente por su email
        $stmtWs = $pdo->prepare('SELECT * FROM workspaces WHERE LOWER(TRIM(advisor_email)) = LOWER(TRIM(:email)) ORDER BY name ASC');
        $stmtWs->execute([':email' => $userEmail]);
        $rawWorkspaces = $stmtWs->fetchAll();
        $assignedWsIds = array_column($rawWorkspaces, 'id');

        $workspaces = [];
        foreach ($rawWorkspaces as $w) {
            $workspaces[] = [
                'id' => $w['id'],
                'name' => $w['name'],
                'ownerName' => $w['owner_name'] ?? '',
                'email' => $w['email'] ?? '',
                'phone' => $w['phone'] ?? '',
                'city' => $w['city'] ?? '',
                'region' => $w['region'] ?? '',
                'membershipStatus' => $w['membership_status'] ?? 'active',
                'advisorEmail' => $w['advisor_email'] ?? null
            ];
        }
        $data['workspaces'] = $workspaces;

        // Determinar workspace activo del asesor
        $activeWs = trim((string)($_GET['workspace_id'] ?? ''));
        if (empty($activeWs) || !in_array($activeWs, $assignedWsIds, true)) {
            $activeWs = $assignedWsIds[0] ?? null;
        }

        if (!empty($activeWs)) {
            // Cargar datos del workspace asignado
            $stmtCust = $pdo->prepare('SELECT * FROM customers WHERE workspace_id = :ws ORDER BY name ASC');
            $stmtCust->execute([':ws' => $activeWs]);
            $data['customers'] = $stmtCust->fetchAll();

            $stmtSales = $pdo->prepare('SELECT * FROM sales WHERE workspace_id = :ws ORDER BY sale_date DESC');
            $stmtSales->execute([':ws' => $activeWs]);
            $data['sales'] = $stmtSales->fetchAll();

            $stmtTasks = $pdo->prepare('SELECT * FROM tasks WHERE workspace_id = :ws ORDER BY due_date ASC');
            $stmtTasks->execute([':ws' => $activeWs]);
            $data['tasks'] = $stmtTasks->fetchAll();

            $stmtNotes = $pdo->prepare('SELECT * FROM quick_notes WHERE workspace_id = :ws ORDER BY is_pinned DESC, updated_at DESC');
            $stmtNotes->execute([':ws' => $activeWs]);
            $data['notes'] = $stmtNotes->fetchAll();
            $data['quick_notes'] = $data['notes'];
        } else {
            $data['customers'] = [];
            $data['sales'] = [];
            $data['tasks'] = [];
            $data['notes'] = [];
        }

    // CASO C: EMPRENDEDOR (entrepreneur) — AISLAMIENTO TOTAL AL WORKSPACE DE LA SESIÓN
    } else {
        // El workspace ID se extrae EXCLUSIVAMENTE de la sesión autenticada en el servidor.
        // Cualquier workspace_id enviado en la URL por el cliente es completamente ignorado.
        $workspaceId = $authUser['workspace_id'];

        if (!empty($workspaceId)) {
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
                    'kanbanColumns' => !empty($w['kanban_columns']) ? json_decode($w['kanban_columns'], true) : null,
                    'membershipStatus' => $w['membership_status'] ?? 'active',
                    'membershipType' => $w['membership_type'] ?? 'Membresía Humm Co-Creation',
                    'advisorName' => $w['advisor_name'] ?? null,
                    'advisorEmail' => $w['advisor_email'] ?? null,
                    'assignedTools' => [],
                    'createdAt' => $w['created_at'] ?? null
                ]];
            } else {
                $data['workspaces'] = [];
            }

            // Clientes (CRM) del emprendimiento
            $stmtCust = $pdo->prepare('SELECT * FROM customers WHERE workspace_id = :ws ORDER BY name ASC');
            $stmtCust->execute([':ws' => $workspaceId]);
            $rawCust = $stmtCust->fetchAll();
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

            // Ventas
            $stmtSales = $pdo->prepare('SELECT * FROM sales WHERE workspace_id = :ws ORDER BY sale_date DESC, created_at DESC');
            $stmtSales->execute([':ws' => $workspaceId]);
            $sales = [];
            foreach ($stmtSales->fetchAll() as $s) {
                $salesAmount = (float)($s['total_amount'] ?? ($s['amount'] ?? 0));
                $sales[] = [
                    'id' => $s['id'],
                    'workspaceId' => $s['workspace_id'],
                    'customerId' => $s['customer_id'] ?? null,
                    'customerName' => $s['customer_name'] ?? '',
                    'amount' => $salesAmount,
                    'totalAmount' => $salesAmount,
                    'saleDate' => $s['sale_date'],
                    'date' => $s['sale_date'],
                    'dueDate' => $s['due_date'] ?? null,
                    'paymentMethod' => $s['payment_method'] ?? 'Transferencia',
                    'paymentStatus' => $s['payment_status'] ?? 'pagado',
                    'status' => $s['payment_status'] ?? 'pagado',
                    'notes' => $s['notes'] ?? '',
                    'createdAt' => $s['created_at'] ?? null
                ];
            }
            $data['sales'] = $sales;

            // Tareas
            $stmtTasks = $pdo->prepare('SELECT * FROM tasks WHERE workspace_id = :ws ORDER BY due_date ASC, created_at DESC');
            $stmtTasks->execute([':ws' => $workspaceId]);
            $tasks = [];
            foreach ($stmtTasks->fetchAll() as $t) {
                $tasks[] = [
                    'id' => $t['id'],
                    'workspaceId' => $t['workspace_id'],
                    'title' => $t['title'],
                    'description' => $t['description'] ?? '',
                    'startDate' => $t['start_date'] ?? null,
                    'dueDate' => $t['due_date'] ?? null,
                    'priority' => $t['priority'] ?? 'media',
                    'status' => $t['status'] ?? 'todo',
                    'tag' => $t['tag'] ?? '',
                    'customerId' => $t['customer_id'] ?? null,
                    'opportunityId' => $t['opportunity_id'] ?? null,
                    'completedAt' => $t['completed_at'] ?? null,
                    'createdAt' => $t['created_at'] ?? null
                ];
            }
            $data['tasks'] = $tasks;

            // Calendario
            $stmtEvents = $pdo->prepare('SELECT * FROM calendar_events WHERE workspace_id = :ws ORDER BY event_date ASC, event_time ASC');
            $stmtEvents->execute([':ws' => $workspaceId]);
            $events = [];
            foreach ($stmtEvents->fetchAll() as $ev) {
                $events[] = [
                    'id' => $ev['id'],
                    'workspaceId' => $ev['workspace_id'],
                    'title' => $ev['title'],
                    'date' => $ev['event_date'],
                    'eventDate' => $ev['event_date'],
                    'startTime' => !empty($ev['event_time']) ? substr($ev['event_time'], 0, 5) : '09:00',
                    'endTime' => !empty($ev['end_time']) ? substr($ev['end_time'], 0, 5) : '10:00',
                    'type' => $ev['event_type'] ?? 'reunion',
                    'eventType' => $ev['event_type'] ?? 'reunion',
                    'customerId' => $ev['customer_id'] ?? null,
                    'location' => $ev['location'] ?? '',
                    'meetUrl' => $ev['meeting_link'] ?? '',
                    'notes' => $ev['notes'] ?? '',
                    'status' => $ev['status'] ?? 'programado',
                    'createdAt' => $ev['created_at'] ?? null
                ];
            }
            $data['calendar_events'] = $events;
            $data['events'] = $events;

            // Bloc de notas
            $stmtNotes = $pdo->prepare('SELECT * FROM quick_notes WHERE workspace_id = :ws ORDER BY is_pinned DESC, updated_at DESC');
            $stmtNotes->execute([':ws' => $workspaceId]);
            $notes = [];
            foreach ($stmtNotes->fetchAll() as $n) {
                $notes[] = [
                    'id' => $n['id'],
                    'workspaceId' => $n['workspace_id'],
                    'title' => $n['title'] ?? '',
                    'content' => $n['content'] ?? '',
                    'category' => $n['category'] ?? 'general',
                    'color' => $n['color'] ?? 'yellow',
                    'isPinned' => (bool)($n['is_pinned'] ?? 0),
                    'pinned' => (bool)($n['is_pinned'] ?? 0),
                    'createdAt' => $n['created_at'] ?? null,
                    'updatedAt' => $n['updated_at'] ?? null
                ];
            }
            $data['quick_notes'] = $notes;
            $data['notes'] = $notes;

            // Oportunidades
            $stmtOpp = $pdo->prepare('SELECT * FROM opportunities WHERE workspace_id = :ws ORDER BY created_at DESC');
            $stmtOpp->execute([':ws' => $workspaceId]);
            $opps = [];
            foreach ($stmtOpp->fetchAll() as $o) {
                $opps[] = [
                    'id' => $o['id'],
                    'workspaceId' => $o['workspace_id'],
                    'title' => $o['title'],
                    'contactName' => $o['contact_name'] ?? '',
                    'customerName' => $o['customer_name'] ?? '',
                    'phone' => $o['phone'] ?? '',
                    'email' => $o['email'] ?? '',
                    'productInterest' => $o['product_interest'] ?? '',
                    'estimatedAmount' => (int)($o['estimated_amount'] ?? 0),
                    'estimatedValue' => (int)($o['estimated_amount'] ?? 0),
                    'status' => $o['status'] ?? 'nuevo',
                    'stage' => $o['stage'] ?? 'prospecto',
                    'nextAction' => $o['next_action'] ?? '',
                    'followUpDate' => $o['follow_up_date'] ?? null,
                    'expectedCloseDate' => $o['expected_close_date'] ?? null,
                    'sourceChannel' => $o['source_channel'] ?? 'Otro',
                    'notes' => $o['notes'] ?? '',
                    'customerId' => $o['customer_id'] ?? null,
                    'createdAt' => $o['created_at'] ?? null
                ];
            }
            $data['opportunities'] = $opps;

            // Solicitudes de soporte propias
            $stmtSupp = $pdo->prepare('SELECT * FROM support_requests WHERE workspace_id = :ws ORDER BY created_at DESC');
            $stmtSupp->execute([':ws' => $workspaceId]);
            $data['support_requests'] = $stmtSupp->fetchAll();

            // Solicitudes de beneficios propias
            $stmtBReq = $pdo->prepare('SELECT * FROM benefit_requests WHERE workspace_id = :ws ORDER BY requested_at DESC');
            $stmtBReq->execute([':ws' => $workspaceId]);
            $data['benefit_requests'] = $stmtBReq->fetchAll();

            // Suscripción propia
            $stmtSub = $pdo->prepare('SELECT * FROM subscriptions WHERE workspace_id = :ws LIMIT 1');
            $stmtSub->execute([':ws' => $workspaceId]);
            $sub = $stmtSub->fetch();
            $data['subscriptions'] = $sub ? [$sub] : [];

        } else {
            // Usuario sin workspace asignado
            $data['workspaces'] = [];
            $data['customers'] = [];
            $data['sales'] = [];
            $data['tasks'] = [];
            $data['events'] = [];
            $data['calendar_events'] = [];
            $data['notes'] = [];
            $data['quick_notes'] = [];
            $data['opportunities'] = [];
            $data['support_requests'] = [];
            $data['benefit_requests'] = [];
            $data['subscriptions'] = [];
        }

        // Datos del usuario propio autenticado
        $stmtMe = $pdo->prepare('SELECT id, workspace_id, name, email, phone, role, specialty, avatar, theme, is_active, assigned_tool_ids, advisor_name, advisor_email FROM users WHERE id = :id LIMIT 1');
        $stmtMe->execute([':id' => $authUser['id']]);
        $me = $stmtMe->fetch();
        if ($me) {
            $me['assignedToolIds'] = !empty($me['assigned_tool_ids']) ? json_decode($me['assigned_tool_ids'], true) : [];
            $data['users'] = [$me];
        } else {
            $data['users'] = [];
        }
    }

    Security::jsonResponse(true, $data);

} catch (Throwable $e) {
    error_log("Error en data.php: " . $e->getMessage());
    Security::jsonResponse(false, null, 'Error al recuperar los datos del sistema.', 500);
}
