<?php
/**
 * MI HUMM - CONTROLADOR DE ESCRITURA Y MUTACIÓN DE DATOS (CREATE / UPDATE / DELETE)
 * Operaciones ACID seguras con Prepared Statements y Aislamiento Multitenant Estricto.
 */

declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/security.php';

Security::setSecurityHeaders();
Security::initSession();

// 1. Exigir autenticación activa (401 si no hay sesión)
$authUser = Security::requireAuth();

// 2. Exigir validación CSRF para todas las mutaciones (403 si falta o es inválido)
Security::validateCsrfToken();

$pdo = DB::getConnection();
$input = DB::getJsonInput();

$entity = trim((string)($_GET['entity'] ?? $input['entity'] ?? ''));
$action = trim((string)($_GET['action'] ?? $input['action'] ?? 'save')); // 'save', 'delete'

if (empty($entity)) {
    Security::jsonResponse(false, null, 'Entidad no especificada.', 400);
}

$item = $input['item'] ?? $input;
$targetId = $input['id'] ?? (is_array($item) ? ($item['id'] ?? '') : (string)$item);
$role = $authUser['role'];
$sessionWsId = $authUser['workspace_id'];

/**
 * Resuelve y valida el workspace autorizado para una entidad de negocio
 */
function resolveAuthorizedWorkspace(PDO $pdo, array $authUser, ?string $inputWsId): string {
    $role = $authUser['role'];
    if ($role === 'admin') {
        return !empty($inputWsId) ? $inputWsId : ($authUser['workspace_id'] ?? 'ws-admin');
    }

    if ($role === 'advisor') {
        if (empty($inputWsId) || !Security::requireWorkspaceAccess($pdo, $inputWsId)) {
            Security::jsonResponse(false, null, 'No tienes autorización para operar en este emprendimiento.', 403);
        }
        return $inputWsId;
    }

    // Emprendedor: SIEMPRE y ÚNICAMENTE el workspace de su sesión server-side
    if (empty($authUser['workspace_id'])) {
        Security::jsonResponse(false, null, 'Tu cuenta no tiene un espacio de emprendimiento asignado.', 403);
    }
    return $authUser['workspace_id'];
}

/**
 * Eliminación segura con control estricto de multitenancy
 */
function executeSafeDelete(PDO $pdo, string $table, string $id, array $authUser): void {
    if ($authUser['role'] === 'admin') {
        $stmt = $pdo->prepare("DELETE FROM {$table} WHERE id = :id");
        $stmt->execute([':id' => $id]);
    } elseif ($authUser['role'] === 'advisor') {
        // Verificar que el registro pertenezca a un workspace asignado al asesor
        $stmtCheck = $pdo->prepare("SELECT w.id FROM {$table} t JOIN workspaces w ON t.workspace_id = w.id WHERE t.id = :id AND LOWER(TRIM(w.advisor_email)) = LOWER(TRIM(:email)) LIMIT 1");
        $stmtCheck->execute([':id' => $id, ':email' => $authUser['email']]);
        if (!$stmtCheck->fetch()) {
            Security::jsonResponse(false, null, 'No tienes autorización para eliminar este registro.', 403);
        }
        $stmt = $pdo->prepare("DELETE FROM {$table} WHERE id = :id");
        $stmt->execute([':id' => $id]);
    } else {
        // Emprendedor: solo si coincide con su workspace_id de sesión
        $stmt = $pdo->prepare("DELETE FROM {$table} WHERE id = :id AND workspace_id = :ws_id");
        $stmt->execute([':id' => $id, ':ws_id' => $authUser['workspace_id']]);
    }
    Security::jsonResponse(true, ['id' => $id, 'deleted' => true]);
}

try {
    switch ($entity) {
        // -----------------------------------------------------------------
        // 1. VENTAS (sales)
        // -----------------------------------------------------------------
        case 'sales':
            if ($action === 'delete') {
                executeSafeDelete($pdo, 'sales', (string)$targetId, $authUser);
            } else {
                $targetWsId = resolveAuthorizedWorkspace($pdo, $authUser, $item['workspaceId'] ?? ($item['workspace_id'] ?? null));
                $customerId = $item['customerId'] ?? ($item['customer_id'] ?? null);
                if (empty($customerId) || $customerId === 'null') $customerId = null;

                $customerName = trim((string)($item['customerName'] ?? ($item['customer_name'] ?? '')));
                if (empty($customerName) && !empty($customerId)) {
                    $stmtC = $pdo->prepare('SELECT name, last_name FROM customers WHERE id = :cid AND workspace_id = :ws LIMIT 1');
                    $stmtC->execute([':cid' => $customerId, ':ws' => $targetWsId]);
                    $crow = $stmtC->fetch();
                    if ($crow) {
                        $customerName = trim(($crow['name'] ?? '') . ' ' . ($crow['last_name'] ?? ''));
                    }
                }
                if (empty($customerName)) {
                    $customerName = !empty($customerId) ? 'Cliente Asociado' : 'Venta General';
                }

                $totalAmount = max(0, (int)($item['amount'] ?? ($item['totalAmount'] ?? ($item['total_amount'] ?? 0))));
                $saleId = !empty($item['id']) ? (string)$item['id'] : ('sal-' . round(microtime(true) * 1000));

                $sql = 'INSERT INTO sales (id, workspace_id, customer_id, customer_name, total_amount, payment_status, payment_method, sale_date, due_date, notes)
                        VALUES (:id, :workspace_id, :customer_id, :customer_name, :total_amount, :payment_status, :payment_method, :sale_date, :due_date, :notes)
                        ON DUPLICATE KEY UPDATE
                        customer_id = VALUES(customer_id),
                        customer_name = VALUES(customer_name),
                        total_amount = VALUES(total_amount),
                        payment_status = VALUES(payment_status),
                        payment_method = VALUES(payment_method),
                        sale_date = VALUES(sale_date),
                        due_date = VALUES(due_date),
                        notes = VALUES(notes)';
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    ':id' => $saleId,
                    ':workspace_id' => $targetWsId,
                    ':customer_id' => $customerId,
                    ':customer_name' => $customerName,
                    ':total_amount' => $totalAmount,
                    ':payment_status' => $item['paymentStatus'] ?? ($item['payment_status'] ?? 'pagado'),
                    ':payment_method' => $item['paymentMethod'] ?? ($item['payment_method'] ?? 'Transferencia'),
                    ':sale_date' => $item['date'] ?? ($item['saleDate'] ?? ($item['sale_date'] ?? date('Y-m-d'))),
                    ':due_date' => $item['dueDate'] ?? ($item['due_date'] ?? null),
                    ':notes' => $item['notes'] ?? ''
                ]);
                $item['id'] = $saleId;
                $item['workspaceId'] = $targetWsId;
                Security::jsonResponse(true, ['item' => $item]);
            }
            break;

        // -----------------------------------------------------------------
        // 2. CLIENTES (customers)
        // -----------------------------------------------------------------
        case 'customers':
            if ($action === 'delete') {
                executeSafeDelete($pdo, 'customers', (string)$targetId, $authUser);
            } else {
                $targetWsId = resolveAuthorizedWorkspace($pdo, $authUser, $item['workspaceId'] ?? ($item['workspace_id'] ?? null));
                $name = trim((string)($item['name'] ?? trim(($item['firstName'] ?? '') . ' ' . ($item['lastName'] ?? ''))));
                if (empty($name)) $name = 'Cliente Sin Nombre';
                $custId = !empty($item['id']) ? (string)$item['id'] : ('cus-' . round(microtime(true) * 1000));

                $sql = 'INSERT INTO customers (id, workspace_id, name, last_name, rut, email, phone, company, region, comuna, city, address, source_channel, status, total_purchases, last_purchase_date, notes)
                        VALUES (:id, :workspace_id, :name, :last_name, :rut, :email, :phone, :company, :region, :comuna, :city, :address, :source_channel, :status, :total_purchases, :last_purchase_date, :notes)
                        ON DUPLICATE KEY UPDATE
                        name = VALUES(name),
                        last_name = VALUES(last_name),
                        rut = VALUES(rut),
                        email = VALUES(email),
                        phone = VALUES(phone),
                        company = VALUES(company),
                        region = VALUES(region),
                        comuna = VALUES(comuna),
                        city = VALUES(city),
                        address = VALUES(address),
                        source_channel = VALUES(source_channel),
                        status = VALUES(status),
                        total_purchases = VALUES(total_purchases),
                        last_purchase_date = VALUES(last_purchase_date),
                        notes = VALUES(notes)';
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    ':id' => $custId,
                    ':workspace_id' => $targetWsId,
                    ':name' => $name,
                    ':last_name' => $item['lastName'] ?? ($item['last_name'] ?? null),
                    ':rut' => $item['rut'] ?? null,
                    ':email' => $item['email'] ?? null,
                    ':phone' => $item['phone'] ?? null,
                    ':company' => $item['company'] ?? null,
                    ':region' => $item['region'] ?? null,
                    ':comuna' => $item['comuna'] ?? ($item['city'] ?? null),
                    ':city' => $item['city'] ?? ($item['comuna'] ?? null),
                    ':address' => $item['address'] ?? null,
                    ':source_channel' => $item['sourceChannel'] ?? ($item['source_channel'] ?? 'Recomendación'),
                    ':status' => $item['status'] ?? 'active',
                    ':total_purchases' => max(0, (int)($item['totalPurchases'] ?? ($item['total_purchases'] ?? 0))),
                    ':last_purchase_date' => $item['lastPurchaseDate'] ?? ($item['last_purchase_date'] ?? null),
                    ':notes' => $item['notes'] ?? null
                ]);
                $item['id'] = $custId;
                $item['workspaceId'] = $targetWsId;
                Security::jsonResponse(true, ['item' => $item]);
            }
            break;

        // -----------------------------------------------------------------
        // 3. TAREAS KANBAN (tasks)
        // -----------------------------------------------------------------
        case 'tasks':
            if ($action === 'delete') {
                executeSafeDelete($pdo, 'tasks', (string)$targetId, $authUser);
            } else {
                $targetWsId = resolveAuthorizedWorkspace($pdo, $authUser, $item['workspaceId'] ?? ($item['workspace_id'] ?? null));
                $taskId = !empty($item['id']) ? (string)$item['id'] : ('tsk-' . round(microtime(true) * 1000));

                $rawStatus = $item['status'] ?? 'todo';
                if ($rawStatus === 'in_progress' || $rawStatus === 'en_proceso') $rawStatus = 'en_proceso';
                elseif ($rawStatus === 'done' || $rawStatus === 'completada') $rawStatus = 'completada';
                else $rawStatus = 'todo';

                $sql = 'INSERT INTO tasks (id, workspace_id, title, description, priority, status, start_date, due_date, tag, customer_id, opportunity_id, completed_at, assigned_to)
                        VALUES (:id, :workspace_id, :title, :description, :priority, :status, :start_date, :due_date, :tag, :customer_id, :opportunity_id, :completed_at, :assigned_to)
                        ON DUPLICATE KEY UPDATE
                        title = VALUES(title),
                        description = VALUES(description),
                        priority = VALUES(priority),
                        status = VALUES(status),
                        start_date = VALUES(start_date),
                        due_date = VALUES(due_date),
                        tag = VALUES(tag),
                        customer_id = VALUES(customer_id),
                        opportunity_id = VALUES(opportunity_id),
                        completed_at = VALUES(completed_at),
                        assigned_to = VALUES(assigned_to)';
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    ':id' => $taskId,
                    ':workspace_id' => $targetWsId,
                    ':title' => $item['title'] ?? 'Nueva tarea',
                    ':description' => $item['description'] ?? '',
                    ':priority' => $item['priority'] ?? 'media',
                    ':status' => $rawStatus,
                    ':start_date' => $item['startDate'] ?? ($item['start_date'] ?? null),
                    ':due_date' => $item['dueDate'] ?? ($item['due_date'] ?? null),
                    ':tag' => $item['tag'] ?? '',
                    ':customer_id' => $item['customerId'] ?? ($item['customer_id'] ?? null),
                    ':opportunity_id' => $item['opportunityId'] ?? ($item['opportunity_id'] ?? null),
                    ':completed_at' => ($rawStatus === 'completada' || $rawStatus === 'done') ? ($item['completedAt'] ?? date('Y-m-d H:i:s')) : null,
                    ':assigned_to' => $item['assignedTo'] ?? ($item['assigned_to'] ?? null)
                ]);
                $item['id'] = $taskId;
                $item['workspaceId'] = $targetWsId;
                Security::jsonResponse(true, ['item' => $item]);
            }
            break;

        // -----------------------------------------------------------------
        // 4. EVENTOS CALENDARIO (calendar_events)
        // -----------------------------------------------------------------
        case 'calendar_events':
        case 'events':
            if ($action === 'delete') {
                executeSafeDelete($pdo, 'calendar_events', (string)$targetId, $authUser);
            } else {
                $targetWsId = resolveAuthorizedWorkspace($pdo, $authUser, $item['workspaceId'] ?? ($item['workspace_id'] ?? null));
                $evId = !empty($item['id']) ? (string)$item['id'] : ('evt-' . round(microtime(true) * 1000));

                $sql = 'INSERT INTO calendar_events (id, workspace_id, title, event_type, customer_id, event_date, event_time, end_time, location, meeting_link, status, notes)
                        VALUES (:id, :workspace_id, :title, :event_type, :customer_id, :event_date, :event_time, :end_time, :location, :meeting_link, :status, :notes)
                        ON DUPLICATE KEY UPDATE
                        title = VALUES(title),
                        event_type = VALUES(event_type),
                        customer_id = VALUES(customer_id),
                        event_date = VALUES(event_date),
                        event_time = VALUES(event_time),
                        end_time = VALUES(end_time),
                        location = VALUES(location),
                        meeting_link = VALUES(meeting_link),
                        status = VALUES(status),
                        notes = VALUES(notes)';
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    ':id' => $evId,
                    ':workspace_id' => $targetWsId,
                    ':title' => $item['title'] ?? 'Compromiso',
                    ':event_type' => $item['type'] ?? ($item['eventType'] ?? ($item['event_type'] ?? 'reunion')),
                    ':customer_id' => $item['customerId'] ?? ($item['customer_id'] ?? null),
                    ':event_date' => $item['date'] ?? ($item['eventDate'] ?? ($item['event_date'] ?? date('Y-m-d'))),
                    ':event_time' => $item['startTime'] ?? ($item['eventTime'] ?? ($item['event_time'] ?? null)),
                    ':end_time' => $item['endTime'] ?? ($item['end_time'] ?? null),
                    ':location' => $item['location'] ?? null,
                    ':meeting_link' => $item['meetUrl'] ?? ($item['meetingLink'] ?? ($item['meeting_link'] ?? null)),
                    ':status' => $item['status'] ?? 'programado',
                    ':notes' => $item['description'] ?? ($item['notes'] ?? null)
                ]);
                $item['id'] = $evId;
                $item['workspaceId'] = $targetWsId;
                Security::jsonResponse(true, ['item' => $item]);
            }
            break;

        // -----------------------------------------------------------------
        // 5. BLOC DE NOTAS (quick_notes)
        // -----------------------------------------------------------------
        case 'quick_notes':
        case 'notes':
            if ($action === 'delete') {
                executeSafeDelete($pdo, 'quick_notes', (string)$targetId, $authUser);
            } else {
                $targetWsId = resolveAuthorizedWorkspace($pdo, $authUser, $item['workspaceId'] ?? ($item['workspace_id'] ?? null));
                $noteId = !empty($item['id']) ? (string)$item['id'] : ('not-' . round(microtime(true) * 1000));

                $sql = 'INSERT INTO quick_notes (id, workspace_id, title, content, category, color, is_pinned)
                        VALUES (:id, :workspace_id, :title, :content, :category, :color, :is_pinned)
                        ON DUPLICATE KEY UPDATE
                        title = VALUES(title),
                        content = VALUES(content),
                        category = VALUES(category),
                        color = VALUES(color),
                        is_pinned = VALUES(is_pinned),
                        updated_at = NOW()';
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    ':id' => $noteId,
                    ':workspace_id' => $targetWsId,
                    ':title' => $item['title'] ?? 'Sin título',
                    ':content' => $item['content'] ?? '',
                    ':category' => $item['category'] ?? 'general',
                    ':color' => $item['color'] ?? 'yellow',
                    ':is_pinned' => !empty($item['pinned'] ?? $item['isPinned'] ?? $item['is_pinned']) ? 1 : 0
                ]);
                $item['id'] = $noteId;
                $item['workspaceId'] = $targetWsId;
                Security::jsonResponse(true, ['item' => $item]);
            }
            break;

        // -----------------------------------------------------------------
        // 6. OPORTUNIDADES COMERCIALES (opportunities)
        // -----------------------------------------------------------------
        case 'opportunities':
        case 'opportunity':
            if ($action === 'delete') {
                executeSafeDelete($pdo, 'opportunities', (string)$targetId, $authUser);
            } else {
                $targetWsId = resolveAuthorizedWorkspace($pdo, $authUser, $item['workspaceId'] ?? ($item['workspace_id'] ?? null));
                $oppId = !empty($item['id']) ? (string)$item['id'] : ('opp-' . round(microtime(true) * 1000));

                $sql = 'INSERT INTO opportunities (id, workspace_id, title, contact_name, customer_name, phone, email, product_interest, estimated_amount, estimated_value, status, stage, next_action, follow_up_date, expected_close_date, source_channel, notes, customer_id)
                        VALUES (:id, :workspace_id, :title, :contact_name, :customer_name, :phone, :email, :product_interest, :estimated_amount, :estimated_value, :status, :stage, :next_action, :follow_up_date, :expected_close_date, :source_channel, :notes, :customer_id)
                        ON DUPLICATE KEY UPDATE
                        title = VALUES(title),
                        contact_name = VALUES(contact_name),
                        customer_name = VALUES(customer_name),
                        phone = VALUES(phone),
                        email = VALUES(email),
                        product_interest = VALUES(product_interest),
                        estimated_amount = VALUES(estimated_amount),
                        estimated_value = VALUES(estimated_value),
                        status = VALUES(status),
                        stage = VALUES(stage),
                        next_action = VALUES(next_action),
                        follow_up_date = VALUES(follow_up_date),
                        expected_close_date = VALUES(expected_close_date),
                        source_channel = VALUES(source_channel),
                        notes = VALUES(notes),
                        customer_id = VALUES(customer_id)';
                $stmt = $pdo->prepare($sql);
                $estAmt = max(0, (int)($item['estimatedAmount'] ?? ($item['estimated_amount'] ?? ($item['estimatedValue'] ?? 0))));
                $stmt->execute([
                    ':id' => $oppId,
                    ':workspace_id' => $targetWsId,
                    ':title' => $item['title'] ?? 'Nueva oportunidad',
                    ':contact_name' => $item['contactName'] ?? ($item['contact_name'] ?? null),
                    ':customer_name' => $item['customerName'] ?? ($item['customer_name'] ?? ($item['title'] ?? 'Contacto')),
                    ':phone' => $item['phone'] ?? null,
                    ':email' => $item['email'] ?? null,
                    ':product_interest' => $item['productInterest'] ?? ($item['product_interest'] ?? null),
                    ':estimated_amount' => $estAmt,
                    ':estimated_value' => $estAmt,
                    ':status' => $item['status'] ?? 'nuevo',
                    ':stage' => $item['stage'] ?? 'prospecto',
                    ':next_action' => $item['nextAction'] ?? ($item['next_action'] ?? null),
                    ':follow_up_date' => $item['followUpDate'] ?? ($item['follow_up_date'] ?? null),
                    ':expected_close_date' => $item['expectedCloseDate'] ?? ($item['expected_close_date'] ?? null),
                    ':source_channel' => $item['sourceChannel'] ?? ($item['source_channel'] ?? 'Otro'),
                    ':notes' => $item['notes'] ?? null,
                    ':customer_id' => $item['customerId'] ?? ($item['customer_id'] ?? null)
                ]);
                $item['id'] = $oppId;
                $item['workspaceId'] = $targetWsId;
                Security::jsonResponse(true, ['item' => $item]);
            }
            break;

        // -----------------------------------------------------------------
        // 7. SOLICITUDES DE SOPORTE (support_requests)
        // -----------------------------------------------------------------
        case 'support_requests':
        case 'support_request':
            $targetWsId = resolveAuthorizedWorkspace($pdo, $authUser, $item['workspaceId'] ?? ($item['workspace_id'] ?? null));
            $reqId = !empty($item['id']) ? (string)$item['id'] : ('sr-' . round(microtime(true) * 1000));

            $sql = 'INSERT INTO support_requests (id, workspace_id, user_id, workspace_name, user_name, user_email, request_type, subject, description, contact_preference, advisor_name, advisor_email, status)
                    VALUES (:id, :workspace_id, :user_id, :workspace_name, :user_name, :user_email, :request_type, :subject, :description, :contact_preference, :advisor_name, :advisor_email, :status)
                    ON DUPLICATE KEY UPDATE
                    status = VALUES(status),
                    advisor_name = VALUES(advisor_name),
                    advisor_email = VALUES(advisor_email)';
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':id' => $reqId,
                ':workspace_id' => $targetWsId,
                ':user_id' => $authUser['id'],
                ':workspace_name' => $item['workspaceName'] ?? ($item['workspace_name'] ?? 'Emprendimiento'),
                ':user_name' => $authUser['name'],
                ':user_email' => $authUser['email'],
                ':request_type' => $item['requestType'] ?? ($item['request_type'] ?? 'Consulta general'),
                ':subject' => $item['subject'] ?? 'Solicitud de apoyo',
                ':description' => $item['description'] ?? '',
                ':contact_preference' => $item['contactPreference'] ?? ($item['contact_preference'] ?? 'WhatsApp'),
                ':advisor_name' => $item['advisorName'] ?? ($item['advisor_name'] ?? null),
                ':advisor_email' => $item['advisorEmail'] ?? ($item['advisor_email'] ?? null),
                ':status' => $item['status'] ?? 'pendiente'
            ]);
            $item['id'] = $reqId;
            Security::jsonResponse(true, ['item' => $item]);
            break;

        // -----------------------------------------------------------------
        // 8. SOLICITUDES DE BENEFICIOS (benefit_requests)
        // -----------------------------------------------------------------
        case 'benefit_requests':
        case 'benefit_request':
            $targetWsId = resolveAuthorizedWorkspace($pdo, $authUser, $item['workspaceId'] ?? ($item['workspace_id'] ?? null));
            $brId = !empty($item['id']) ? (string)$item['id'] : ('br-' . round(microtime(true) * 1000));

            $sql = 'INSERT INTO benefit_requests (id, discount_id, user_id, workspace_id, personal_code, channel, status, requested_at, last_contact_at, used_at, purchase_amount, discount_amount, member_comment, member_rating, not_completed_reason, admin_notes)
                    VALUES (:id, :discount_id, :user_id, :workspace_id, :personal_code, :channel, :status, NOW(), NOW(), :used_at, :purchase_amount, :discount_amount, :member_comment, :member_rating, :not_completed_reason, :admin_notes)
                    ON DUPLICATE KEY UPDATE
                    status = VALUES(status),
                    last_contact_at = VALUES(last_contact_at),
                    used_at = VALUES(used_at),
                    purchase_amount = VALUES(purchase_amount),
                    discount_amount = VALUES(discount_amount),
                    member_comment = VALUES(member_comment),
                    member_rating = VALUES(member_rating),
                    not_completed_reason = VALUES(not_completed_reason),
                    admin_notes = VALUES(admin_notes)';
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':id' => $brId,
                ':discount_id' => $item['discountId'] ?? ($item['discount_id'] ?? ''),
                ':user_id' => $authUser['id'],
                ':workspace_id' => $targetWsId,
                ':personal_code' => $item['personalCode'] ?? ($item['personal_code'] ?? 'HUMM-CODE'),
                ':channel' => $item['channel'] ?? 'whatsapp',
                ':status' => $item['status'] ?? 'contact_started',
                ':used_at' => $item['usedAt'] ?? ($item['used_at'] ?? null),
                ':purchase_amount' => isset($item['purchaseAmount']) ? (int)$item['purchaseAmount'] : null,
                ':discount_amount' => isset($item['discountAmount']) ? (int)$item['discountAmount'] : null,
                ':member_comment' => $item['memberComment'] ?? null,
                ':member_rating' => isset($item['memberRating']) ? (int)$item['memberRating'] : null,
                ':not_completed_reason' => $item['notCompletedReason'] ?? null,
                ':admin_notes' => $item['adminNotes'] ?? null
            ]);
            $item['id'] = $brId;
            Security::jsonResponse(true, ['item' => $item]);
            break;

        // =================================================================
        // ENTIDADES ADMINISTRATIVAS (EXCLUSIVAS ROL 'admin')
        // =================================================================

        // -----------------------------------------------------------------
        // 9. USUARIOS (users) - EXCLUSIVO ADMIN
        // -----------------------------------------------------------------
        case 'users':
            Security::requireRole('admin');

            if ($action === 'delete') {
                $id = (string)$targetId;
                if ($id === $authUser['id']) {
                    Security::jsonResponse(false, null, 'No puedes eliminar tu propio usuario administrador activo.', 400);
                }
                $stmt = $pdo->prepare('DELETE FROM users WHERE id = :id');
                $stmt->execute([':id' => $id]);
                Security::jsonResponse(true, ['id' => $id, 'deleted' => true]);
            } else {
                $userId = !empty($item['id']) ? (string)$item['id'] : ('usr-' . round(microtime(true) * 1000));
                $passHash = '';
                $mustChangePass = !empty($item['mustChangePassword']) ? 1 : 0;
                $generatedTempPass = null;

                if (!empty($item['password'])) {
                    $passHash = password_hash((string)$item['password'], PASSWORD_BCRYPT);
                } else {
                    $checkUser = $pdo->prepare('SELECT password_hash FROM users WHERE id = :id LIMIT 1');
                    $checkUser->execute([':id' => $userId]);
                    $existing = $checkUser->fetch();
                    if (!$existing) {
                        // Generar contraseña temporal segura de alta entropía por usuario
                        $generatedTempPass = bin2hex(random_bytes(8));
                        $passHash = password_hash($generatedTempPass, PASSWORD_BCRYPT);
                        $mustChangePass = 1;
                    }
                }

                $sql = 'INSERT INTO users (id, workspace_id, name, email, phone, password_hash, role, specialty, avatar, is_active, assigned_tool_ids, advisor_name, advisor_email, must_change_password)
                        VALUES (:id, :workspace_id, :name, :email, :phone, :password_hash, :role, :specialty, :avatar, :is_active, :assigned_tool_ids, :advisor_name, :advisor_email, :must_change_password)
                        ON DUPLICATE KEY UPDATE
                        name = VALUES(name),
                        email = VALUES(email),
                        phone = VALUES(phone),
                        workspace_id = IF(VALUES(workspace_id) IS NOT NULL AND VALUES(workspace_id) != "", VALUES(workspace_id), workspace_id),
                        password_hash = IF(VALUES(password_hash) != "" AND VALUES(password_hash) IS NOT NULL, VALUES(password_hash), password_hash),
                        role = VALUES(role),
                        specialty = VALUES(specialty),
                        avatar = VALUES(avatar),
                        is_active = VALUES(is_active),
                        assigned_tool_ids = VALUES(assigned_tool_ids),
                        advisor_name = VALUES(advisor_name),
                        advisor_email = VALUES(advisor_email),
                        must_change_password = VALUES(must_change_password)';
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    ':id' => $userId,
                    ':workspace_id' => $item['workspaceId'] ?? ($item['workspace_id'] ?? null),
                    ':name' => $item['name'] ?? 'Usuario',
                    ':email' => $item['email'] ?? '',
                    ':phone' => $item['phone'] ?? null,
                    ':password_hash' => $passHash,
                    ':role' => in_array($item['role'] ?? '', ['admin', 'advisor', 'entrepreneur'], true) ? $item['role'] : 'entrepreneur',
                    ':specialty' => $item['specialty'] ?? null,
                    ':avatar' => $item['avatar'] ?? (isset($item['name']) ? strtoupper(substr($item['name'], 0, 2)) : 'U'),
                    ':is_active' => isset($item['isActive']) ? ($item['isActive'] ? 1 : 0) : 1,
                    ':assigned_tool_ids' => json_encode($item['assignedToolIds'] ?? ($item['assigned_tool_ids'] ?? []), JSON_UNESCAPED_UNICODE),
                    ':advisor_name' => $item['advisorName'] ?? ($item['advisor_name'] ?? null),
                    ':advisor_email' => $item['advisorEmail'] ?? ($item['advisor_email'] ?? null),
                    ':must_change_password' => $mustChangePass
                ]);
                $item['id'] = $userId;
                unset($item['password']);
                if ($generatedTempPass !== null) {
                    $item['temp_password'] = $generatedTempPass;
                }
                Security::jsonResponse(true, ['item' => $item]);
            }
            break;

        // -----------------------------------------------------------------
        // 10. ESPACIOS DE TRABAJO (workspaces)
        // -----------------------------------------------------------------
        case 'workspaces':
        case 'workspace':
            if ($action === 'delete') {
                Security::requireRole('admin');
                $id = (string)$targetId;
                $stmt = $pdo->prepare('DELETE FROM workspaces WHERE id = :id');
                $stmt->execute([':id' => $id]);
                Security::jsonResponse(true, ['id' => $id, 'deleted' => true]);
            } else {
                $wsId = !empty($item['id']) ? (string)$item['id'] : ('ws-' . round(microtime(true) * 1000));

                // Si es emprendedor, solo puede actualizar campos de perfil de su propio espacio
                if ($role === 'entrepreneur') {
                    if ($wsId !== $sessionWsId) {
                        Security::jsonResponse(false, null, 'No puedes modificar otro espacio de emprendimiento.', 403);
                    }
                    $stmt = $pdo->prepare('UPDATE workspaces SET phone = :phone, city = :city, region = :region, industry = :industry, description = :description, kanban_columns = :kanban WHERE id = :id');
                    $stmt->execute([
                        ':id' => $wsId,
                        ':phone' => $item['phone'] ?? null,
                        ':city' => $item['city'] ?? ($item['comuna'] ?? null),
                        ':region' => $item['region'] ?? null,
                        ':industry' => $item['industry'] ?? null,
                        ':description' => $item['description'] ?? null,
                        ':kanban' => !empty($item['kanbanColumns']) ? json_encode($item['kanbanColumns'], JSON_UNESCAPED_UNICODE) : null
                    ]);
                    Security::jsonResponse(true, ['item' => $item]);
                }

                // Para administradores: Transacción atómica de creación/actualización y auto-vinculación
                Security::requireRole('admin');
                $pdo->beginTransaction();
                try {
                    $sql = 'INSERT INTO workspaces (id, name, owner_name, email, phone, city, region, industry, description, kanban_columns, membership_status, membership_type, advisor_name, advisor_email)
                            VALUES (:id, :name, :owner_name, :email, :phone, :city, :region, :industry, :description, :kanban_columns, :membership_status, :membership_type, :advisor_name, :advisor_email)
                            ON DUPLICATE KEY UPDATE
                            name = VALUES(name),
                            owner_name = VALUES(owner_name),
                            email = VALUES(email),
                            phone = VALUES(phone),
                            city = VALUES(city),
                            region = VALUES(region),
                            industry = VALUES(industry),
                            description = VALUES(description),
                            kanban_columns = IF(VALUES(kanban_columns) IS NOT NULL, VALUES(kanban_columns), kanban_columns),
                            membership_status = VALUES(membership_status),
                            membership_type = VALUES(membership_type),
                            advisor_name = VALUES(advisor_name),
                            advisor_email = VALUES(advisor_email)';
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute([
                        ':id' => $wsId,
                        ':name' => $item['name'] ?? 'Emprendimiento',
                        ':owner_name' => $item['ownerName'] ?? ($item['ownerFirstName'] ?? 'Dueño'),
                        ':email' => $item['email'] ?? '',
                        ':phone' => $item['phone'] ?? null,
                        ':city' => $item['city'] ?? ($item['comuna'] ?? null),
                        ':region' => $item['region'] ?? null,
                        ':industry' => $item['industry'] ?? null,
                        ':description' => $item['description'] ?? null,
                        ':kanban_columns' => !empty($item['kanbanColumns']) ? json_encode($item['kanbanColumns'], JSON_UNESCAPED_UNICODE) : null,
                        ':membership_status' => $item['membershipStatus'] ?? 'active',
                        ':membership_type' => $item['membershipType'] ?? 'Membresía Humm Co-Creation',
                        ':advisor_name' => $item['advisorName'] ?? null,
                        ':advisor_email' => $item['advisorEmail'] ?? null
                    ]);

                    // Auto-vincular usuario con el mismo correo atómicamente
                    if (!empty($item['email'])) {
                        $upUser = $pdo->prepare('UPDATE users SET workspace_id = :ws WHERE LOWER(TRIM(email)) = LOWER(TRIM(:email)) AND (workspace_id IS NULL OR workspace_id = "")');
                        $upUser->execute([':ws' => $wsId, ':email' => $item['email']]);
                    }

                    $pdo->commit();
                    $item['id'] = $wsId;
                    Security::jsonResponse(true, ['item' => $item]);
                } catch (Throwable $t) {
                    $pdo->rollBack();
                    throw $t;
                }
            }
            break;

        // -----------------------------------------------------------------
        // 11. PLANES DE SUSCRIPCIÓN (subscription_plans) - EXCLUSIVO ADMIN
        // -----------------------------------------------------------------
        case 'subscription_plans':
            Security::requireRole('admin');
            if ($action === 'delete') {
                $stmt = $pdo->prepare('DELETE FROM subscription_plans WHERE id = :id');
                $stmt->execute([':id' => $targetId]);
                Security::jsonResponse(true, ['id' => $targetId, 'deleted' => true]);
            } else {
                $sql = 'INSERT INTO subscription_plans (id, name, price, trial_days, description, features, status, sort_order)
                        VALUES (:id, :name, :price, :trial_days, :description, :features, :status, :sort_order)
                        ON DUPLICATE KEY UPDATE
                        name = VALUES(name), price = VALUES(price), trial_days = VALUES(trial_days), description = VALUES(description), features = VALUES(features), status = VALUES(status), sort_order = VALUES(sort_order)';
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    ':id' => $item['id'],
                    ':name' => $item['name'],
                    ':price' => max(0, (int)($item['price'] ?? 0)),
                    ':trial_days' => max(0, (int)($item['trialDays'] ?? ($item['trial_days'] ?? 14))),
                    ':description' => $item['description'] ?? '',
                    ':features' => json_encode($item['features'] ?? [], JSON_UNESCAPED_UNICODE),
                    ':status' => $item['status'] ?? 'active',
                    ':sort_order' => (int)($item['sortOrder'] ?? ($item['sort_order'] ?? 1))
                ]);
                Security::jsonResponse(true, ['item' => $item]);
            }
            break;

        // -----------------------------------------------------------------
        // 12. SUSCRIPCIONES (subscriptions) - EXCLUSIVO ADMIN
        // -----------------------------------------------------------------
        case 'subscriptions':
            Security::requireRole('admin');
            if ($action === 'delete') {
                $stmt = $pdo->prepare('DELETE FROM subscriptions WHERE id = :id');
                $stmt->execute([':id' => $targetId]);
                Security::jsonResponse(true, ['id' => $targetId, 'deleted' => true]);
            } else {
                $sql = 'INSERT INTO subscriptions (id, user_id, workspace_id, client_name, client_email, client_phone, business_name, plan_id, plan_name, monthly_price, status, trial_days_total, trial_days_left, is_trial, payment_status, joined_date, last_payment_date, next_billing_date, payment_method, payment_link)
                        VALUES (:id, :user_id, :workspace_id, :client_name, :client_email, :client_phone, :business_name, :plan_id, :plan_name, :monthly_price, :status, :trial_days_total, :trial_days_left, :is_trial, :payment_status, :joined_date, :last_payment_date, :next_billing_date, :payment_method, :payment_link)
                        ON DUPLICATE KEY UPDATE
                        plan_id = VALUES(plan_id), plan_name = VALUES(plan_name), monthly_price = VALUES(monthly_price), status = VALUES(status), trial_days_total = VALUES(trial_days_total), trial_days_left = VALUES(trial_days_left), is_trial = VALUES(is_trial), payment_status = VALUES(payment_status), client_phone = VALUES(client_phone), business_name = VALUES(business_name), joined_date = VALUES(joined_date), last_payment_date = VALUES(last_payment_date), next_billing_date = VALUES(next_billing_date), payment_method = VALUES(payment_method), payment_link = VALUES(payment_link)';
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    ':id' => $item['id'],
                    ':user_id' => $item['userId'] ?? ($item['user_id'] ?? $item['id']),
                    ':workspace_id' => $item['workspaceId'] ?? ($item['workspace_id'] ?? null),
                    ':client_name' => $item['clientName'] ?? ($item['client_name'] ?? 'Emprendedor Humm'),
                    ':client_email' => $item['clientEmail'] ?? ($item['client_email'] ?? ''),
                    ':client_phone' => $item['clientPhone'] ?? ($item['client_phone'] ?? null),
                    ':business_name' => $item['businessName'] ?? ($item['business_name'] ?? 'Emprendimiento'),
                    ':plan_id' => $item['planId'] ?? ($item['plan_id'] ?? 'plan-base'),
                    ':plan_name' => $item['planName'] ?? ($item['plan_name'] ?? 'Plan Base'),
                    ':monthly_price' => max(0, (int)($item['monthlyPrice'] ?? ($item['monthly_price'] ?? 0))),
                    ':status' => $item['status'] ?? 'trial',
                    ':trial_days_total' => (int)($item['trialDaysTotal'] ?? ($item['trial_days_total'] ?? 14)),
                    ':trial_days_left' => (int)($item['trialDaysLeft'] ?? ($item['trial_days_left'] ?? 14)),
                    ':is_trial' => !empty($item['isTrial'] ?? $item['is_trial']) ? 1 : 0,
                    ':payment_status' => $item['paymentStatus'] ?? ($item['payment_status'] ?? 'pending'),
                    ':joined_date' => $item['joinedDate'] ?? ($item['joined_date'] ?? date('Y-m-d')),
                    ':last_payment_date' => $item['lastPaymentDate'] ?? ($item['last_payment_date'] ?? null),
                    ':next_billing_date' => $item['nextBillingDate'] ?? ($item['next_billing_date'] ?? null),
                    ':payment_method' => $item['paymentMethod'] ?? ($item['payment_method'] ?? 'Webpay'),
                    ':payment_link' => $item['paymentLink'] ?? ($item['payment_link'] ?? null)
                ]);
                Security::jsonResponse(true, ['item' => $item]);
            }
            break;

        // -----------------------------------------------------------------
        // 13. CONVENIOS Y BENEFICIOS (company_discounts) - EXCLUSIVO ADMIN
        // -----------------------------------------------------------------
        case 'company_discounts':
        case 'discounts':
            Security::requireRole('admin');
            if ($action === 'delete') {
                $stmt = $pdo->prepare('DELETE FROM company_discounts WHERE id = :id');
                $stmt->execute([':id' => $targetId]);
                Security::jsonResponse(true, ['id' => $targetId, 'deleted' => true]);
            } else {
                $sql = 'INSERT INTO company_discounts (id, company_name, logo, discount_title, category, description, contact_person, contact_role, phone, whatsapp, instagram, email, preferred_channel, code, url, starts_at, expires_at, min_purchase, max_discount, whatsapp_template, instagram_template, email_template, humm_responsible, is_featured, status)
                        VALUES (:id, :company_name, :logo, :discount_title, :category, :description, :contact_person, :contact_role, :phone, :whatsapp, :instagram, :email, :preferred_channel, :code, :url, :starts_at, :expires_at, :min_purchase, :max_discount, :whatsapp_template, :instagram_template, :email_template, :humm_responsible, :is_featured, :status)
                        ON DUPLICATE KEY UPDATE
                        company_name = VALUES(company_name), logo = VALUES(logo), discount_title = VALUES(discount_title), category = VALUES(category), description = VALUES(description), contact_person = VALUES(contact_person), contact_role = VALUES(contact_role), phone = VALUES(phone), whatsapp = VALUES(whatsapp), instagram = VALUES(instagram), email = VALUES(email), preferred_channel = VALUES(preferred_channel), code = VALUES(code), url = VALUES(url), starts_at = VALUES(starts_at), expires_at = VALUES(expires_at), min_purchase = VALUES(min_purchase), max_discount = VALUES(max_discount), whatsapp_template = VALUES(whatsapp_template), instagram_template = VALUES(instagram_template), email_template = VALUES(email_template), humm_responsible = VALUES(humm_responsible), is_featured = VALUES(is_featured), status = VALUES(status)';
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    ':id' => $item['id'],
                    ':company_name' => $item['companyName'] ?? ($item['company_name'] ?? 'Empresa'),
                    ':logo' => $item['logo'] ?? '🎁',
                    ':discount_title' => $item['discountTitle'] ?? ($item['discount_title'] ?? 'Beneficio'),
                    ':category' => $item['category'] ?? 'Servicios',
                    ':description' => $item['description'] ?? '',
                    ':contact_person' => $item['contactPerson'] ?? null,
                    ':contact_role' => $item['contactRole'] ?? null,
                    ':phone' => $item['phone'] ?? null,
                    ':whatsapp' => $item['whatsapp'] ?? null,
                    ':instagram' => $item['instagram'] ?? null,
                    ':email' => $item['email'] ?? null,
                    ':preferred_channel' => $item['preferredChannel'] ?? 'whatsapp',
                    ':code' => $item['code'] ?? null,
                    ':url' => $item['url'] ?? null,
                    ':starts_at' => $item['startsAt'] ?? null,
                    ':expires_at' => $item['expiresAt'] ?? null,
                    ':min_purchase' => isset($item['minPurchase']) ? (int)$item['minPurchase'] : null,
                    ':max_discount' => isset($item['maxDiscount']) ? (int)$item['maxDiscount'] : null,
                    ':whatsapp_template' => $item['whatsappTemplate'] ?? null,
                    ':instagram_template' => $item['instagramTemplate'] ?? null,
                    ':email_template' => $item['emailTemplate'] ?? null,
                    ':humm_responsible' => $item['hummResponsible'] ?? 'Equipo Humm',
                    ':is_featured' => !empty($item['isFeatured'] ?? $item['featured']) ? 1 : 0,
                    ':status' => $item['status'] ?? 'active'
                ]);
                Security::jsonResponse(true, ['item' => $item]);
            }
            break;

        // -----------------------------------------------------------------
        // 14. HERRAMIENTAS (tools) - EXCLUSIVO ADMIN
        // -----------------------------------------------------------------
        case 'tools':
            Security::requireRole('admin');
            if ($action === 'delete') {
                $stmt = $pdo->prepare('DELETE FROM tools WHERE id = :id');
                $stmt->execute([':id' => $targetId]);
                Security::jsonResponse(true, ['id' => $targetId, 'deleted' => true]);
            } else {
                $sql = 'INSERT INTO tools (id, name, description, category, status, url, icon, sort_order, is_visible, is_included)
                        VALUES (:id, :name, :description, :category, :status, :url, :icon, :sort_order, :is_visible, :is_included)
                        ON DUPLICATE KEY UPDATE
                        name = VALUES(name), description = VALUES(description), category = VALUES(category), status = VALUES(status), url = VALUES(url), icon = VALUES(icon), sort_order = VALUES(sort_order), is_visible = VALUES(is_visible), is_included = VALUES(is_included)';
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    ':id' => $item['id'],
                    ':name' => $item['name'] ?? '',
                    ':description' => $item['description'] ?? '',
                    ':category' => $item['category'] ?? 'Gestión',
                    ':status' => $item['status'] ?? 'disponible',
                    ':url' => $item['url'] ?? '',
                    ':icon' => $item['icon'] ?? '🚀',
                    ':sort_order' => (int)($item['sortOrder'] ?? ($item['order'] ?? 1)),
                    ':is_visible' => isset($item['isVisible']) ? ($item['isVisible'] ? 1 : 0) : 1,
                    ':is_included' => isset($item['isIncluded']) ? ($item['isIncluded'] ? 1 : 0) : 1
                ]);
                Security::jsonResponse(true, ['item' => $item]);
            }
            break;

        // -----------------------------------------------------------------
        // 15. COMUNICADOS (broadcasts) - EXCLUSIVO ADMIN
        // -----------------------------------------------------------------
        case 'broadcasts':
        case 'broadcast':
            Security::requireRole('admin');
            if ($action === 'delete') {
                $stmt = $pdo->prepare('DELETE FROM broadcasts WHERE id = :id');
                $stmt->execute([':id' => $targetId]);
                Security::jsonResponse(true, ['id' => $targetId, 'deleted' => true]);
            } else {
                $bcId = !empty($item['id']) ? (string)$item['id'] : ('bc-' . round(microtime(true) * 1000));
                $sql = 'INSERT INTO broadcasts (id, title, category, target_audience, content, author_name, channels, reach_count)
                        VALUES (:id, :title, :category, :target_audience, :content, :author_name, :channels, :reach_count)
                        ON DUPLICATE KEY UPDATE
                        title = VALUES(title), category = VALUES(category), target_audience = VALUES(target_audience), content = VALUES(content), author_name = VALUES(author_name), channels = VALUES(channels), reach_count = VALUES(reach_count)';
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    ':id' => $bcId,
                    ':title' => $item['title'] ?? 'Comunicado',
                    ':category' => $item['category'] ?? 'Noticia',
                    ':target_audience' => $item['targetAudience'] ?? 'Todos',
                    ':content' => $item['content'] ?? '',
                    ':author_name' => $item['authorName'] ?? $authUser['name'],
                    ':channels' => json_encode($item['channels'] ?? [], JSON_UNESCAPED_UNICODE),
                    ':reach_count' => (int)($item['reachCount'] ?? 0)
                ]);
                $item['id'] = $bcId;
                Security::jsonResponse(true, ['item' => $item]);
            }
            break;

        default:
            Security::jsonResponse(false, null, "Entidad '{$entity}' no reconocida o no permitida.", 400);
            break;
    }

} catch (Throwable $e) {
    error_log("Error en save.php [{$entity}]: " . $e->getMessage());
    Security::jsonResponse(false, null, 'Error al procesar la operación en la base de datos.', 500);
}
