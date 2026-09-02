<?php
/**
 * MI HUMM - CONTROLADOR DE ESCRITURA Y MUTACIÓN DE DATOS (CREATE / UPDATE / DELETE)
 * Operaciones ACID seguras con Prepared Statements para HostGator MySQL
 */

declare(strict_types=1);

require_once __DIR__ . '/db.php';

setApiHeaders();
$pdo = DB::getConnection();
$input = DB::getJsonInput();

$entity = $_GET['entity'] ?? $input['entity'] ?? '';
$action = $_GET['action'] ?? $input['action'] ?? 'save'; // 'save', 'delete', 'batch_sync'

if (empty($entity)) {
    DB::jsonResponse(false, null, 'Entidad no especificada.', 400);
}

try {
    switch ($entity) {
        // -----------------------------------------------------------------
        // 1. VENTAS (sales)
        // -----------------------------------------------------------------
        case 'sales':
            if ($action === 'delete') {
                $id = $input['id'] ?? '';
                $stmt = $pdo->prepare('DELETE FROM sales WHERE id = :id');
                $stmt->execute([':id' => $id]);
                DB::jsonResponse(true, ['id' => $id, 'deleted' => true]);
            } else {
                $item = $input['item'] ?? $input;
                $sql = 'INSERT INTO sales (id, workspace_id, customer_id, customer_name, total_amount, payment_status, payment_method, sale_date, notes)
                        VALUES (:id, :workspace_id, :customer_id, :customer_name, :total_amount, :payment_status, :payment_method, :sale_date, :notes)
                        ON DUPLICATE KEY UPDATE
                        customer_id = VALUES(customer_id),
                        customer_name = VALUES(customer_name),
                        total_amount = VALUES(total_amount),
                        payment_status = VALUES(payment_status),
                        payment_method = VALUES(payment_method),
                        sale_date = VALUES(sale_date),
                        notes = VALUES(notes)';
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    ':id' => $item['id'],
                    ':workspace_id' => $item['workspaceId'] ?? $item['workspace_id'],
                    ':customer_id' => $item['customerId'] ?? $item['customer_id'] ?? null,
                    ':customer_name' => $item['customerName'] ?? $item['customer_name'] ?? 'Venta General',
                    ':total_amount' => (int)($item['totalAmount'] ?? $item['total_amount'] ?? 0),
                    ':payment_status' => $item['paymentStatus'] ?? $item['payment_status'] ?? 'pagado',
                    ':payment_method' => $item['paymentMethod'] ?? $item['payment_method'] ?? 'Transferencia',
                    ':sale_date' => $item['saleDate'] ?? $item['sale_date'] ?? date('Y-m-d'),
                    ':notes' => $item['notes'] ?? ''
                ]);
                DB::jsonResponse(true, ['item' => $item]);
            }
            break;

        // -----------------------------------------------------------------
        // 2. CLIENTES (customers)
        // -----------------------------------------------------------------
        case 'customers':
            if ($action === 'delete') {
                $id = $input['id'] ?? '';
                $stmt = $pdo->prepare('DELETE FROM customers WHERE id = :id');
                $stmt->execute([':id' => $id]);
                DB::jsonResponse(true, ['id' => $id, 'deleted' => true]);
            } else {
                $item = $input['item'] ?? $input;
                $sql = 'INSERT INTO customers (id, workspace_id, name, email, phone, company, status, total_purchases, last_purchase_date, notes)
                        VALUES (:id, :workspace_id, :name, :email, :phone, :company, :status, :total_purchases, :last_purchase_date, :notes)
                        ON DUPLICATE KEY UPDATE
                        name = VALUES(name),
                        email = VALUES(email),
                        phone = VALUES(phone),
                        company = VALUES(company),
                        status = VALUES(status),
                        total_purchases = VALUES(total_purchases),
                        last_purchase_date = VALUES(last_purchase_date),
                        notes = VALUES(notes)';
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    ':id' => $item['id'],
                    ':workspace_id' => $item['workspaceId'] ?? $item['workspace_id'],
                    ':name' => $item['name'],
                    ':email' => $item['email'] ?? null,
                    ':phone' => $item['phone'] ?? null,
                    ':company' => $item['company'] ?? null,
                    ':status' => $item['status'] ?? 'activo',
                    ':total_purchases' => (int)($item['totalPurchases'] ?? $item['total_purchases'] ?? 0),
                    ':last_purchase_date' => $item['lastPurchaseDate'] ?? $item['last_purchase_date'] ?? null,
                    ':notes' => $item['notes'] ?? null
                ]);
                DB::jsonResponse(true, ['item' => $item]);
            }
            break;

        // -----------------------------------------------------------------
        // 3. TAREAS (tasks)
        // -----------------------------------------------------------------
        case 'tasks':
            if ($action === 'delete') {
                $id = $input['id'] ?? '';
                $stmt = $pdo->prepare('DELETE FROM tasks WHERE id = :id');
                $stmt->execute([':id' => $id]);
                DB::jsonResponse(true, ['id' => $id, 'deleted' => true]);
            } else {
                $item = $input['item'] ?? $input;
                $sql = 'INSERT INTO tasks (id, workspace_id, title, description, priority, status, due_date, assigned_to)
                        VALUES (:id, :workspace_id, :title, :description, :priority, :status, :due_date, :assigned_to)
                        ON DUPLICATE KEY UPDATE
                        title = VALUES(title),
                        description = VALUES(description),
                        priority = VALUES(priority),
                        status = VALUES(status),
                        due_date = VALUES(due_date),
                        assigned_to = VALUES(assigned_to)';
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    ':id' => $item['id'],
                    ':workspace_id' => $item['workspaceId'] ?? $item['workspace_id'],
                    ':title' => $item['title'],
                    ':description' => $item['description'] ?? null,
                    ':priority' => $item['priority'] ?? 'media',
                    ':status' => $item['status'] ?? 'pendiente',
                    ':due_date' => $item['dueDate'] ?? $item['due_date'] ?? null,
                    ':assigned_to' => $item['assignedTo'] ?? $item['assigned_to'] ?? null
                ]);
                DB::jsonResponse(true, ['item' => $item]);
            }
            break;

        // -----------------------------------------------------------------
        // 4. EVENTOS CALENDARIO (calendar_events)
        // -----------------------------------------------------------------
        case 'calendar_events':
            if ($action === 'delete') {
                $id = $input['id'] ?? '';
                $stmt = $pdo->prepare('DELETE FROM calendar_events WHERE id = :id');
                $stmt->execute([':id' => $id]);
                DB::jsonResponse(true, ['id' => $id, 'deleted' => true]);
            } else {
                $item = $input['item'] ?? $input;
                $sql = 'INSERT INTO calendar_events (id, workspace_id, title, event_type, customer_id, event_date, event_time, location, meeting_link, status, notes)
                        VALUES (:id, :workspace_id, :title, :event_type, :customer_id, :event_date, :event_time, :location, :meeting_link, :status, :notes)
                        ON DUPLICATE KEY UPDATE
                        title = VALUES(title),
                        event_type = VALUES(event_type),
                        customer_id = VALUES(customer_id),
                        event_date = VALUES(event_date),
                        event_time = VALUES(event_time),
                        location = VALUES(location),
                        meeting_link = VALUES(meeting_link),
                        status = VALUES(status),
                        notes = VALUES(notes)';
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    ':id' => $item['id'],
                    ':workspace_id' => $item['workspaceId'] ?? $item['workspace_id'],
                    ':title' => $item['title'],
                    ':event_type' => $item['eventType'] ?? $item['event_type'] ?? 'reunion',
                    ':customer_id' => $item['customerId'] ?? $item['customer_id'] ?? null,
                    ':event_date' => $item['eventDate'] ?? $item['event_date'] ?? date('Y-m-d'),
                    ':event_time' => $item['eventTime'] ?? $item['event_time'] ?? null,
                    ':location' => $item['location'] ?? null,
                    ':meeting_link' => $item['meetingLink'] ?? $item['meeting_link'] ?? null,
                    ':status' => $item['status'] ?? 'programado',
                    ':notes' => $item['notes'] ?? null
                ]);
                DB::jsonResponse(true, ['item' => $item]);
            }
            break;

        // -----------------------------------------------------------------
        // 5. BLOC DE NOTAS (quick_notes)
        // -----------------------------------------------------------------
        case 'quick_notes':
            if ($action === 'delete') {
                $id = $input['id'] ?? '';
                $stmt = $pdo->prepare('DELETE FROM quick_notes WHERE id = :id');
                $stmt->execute([':id' => $id]);
                DB::jsonResponse(true, ['id' => $id, 'deleted' => true]);
            } else {
                $item = $input['item'] ?? $input;
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
                    ':id' => $item['id'],
                    ':workspace_id' => $item['workspaceId'] ?? $item['workspace_id'],
                    ':title' => $item['title'] ?? 'Sin título',
                    ':content' => $item['content'] ?? '',
                    ':category' => $item['category'] ?? 'general',
                    ':color' => $item['color'] ?? 'yellow',
                    ':is_pinned' => !empty($item['isPinned'] ?? $item['is_pinned']) ? 1 : 0
                ]);
                DB::jsonResponse(true, ['item' => $item]);
            }
            break;

        // -----------------------------------------------------------------
        // 6. PLANES DE VENTA MENSUAL (subscription_plans)
        // -----------------------------------------------------------------
        case 'subscription_plans':
            if ($action === 'delete') {
                $id = $input['id'] ?? '';
                $stmt = $pdo->prepare('DELETE FROM subscription_plans WHERE id = :id');
                $stmt->execute([':id' => $id]);
                DB::jsonResponse(true, ['id' => $id, 'deleted' => true]);
            } else {
                $item = $input['item'] ?? $input;
                $sql = 'INSERT INTO subscription_plans (id, name, price, trial_days, description, features, status, sort_order)
                        VALUES (:id, :name, :price, :trial_days, :description, :features, :status, :sort_order)
                        ON DUPLICATE KEY UPDATE
                        name = VALUES(name),
                        price = VALUES(price),
                        trial_days = VALUES(trial_days),
                        description = VALUES(description),
                        features = VALUES(features),
                        status = VALUES(status),
                        sort_order = VALUES(sort_order)';
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    ':id' => $item['id'],
                    ':name' => $item['name'],
                    ':price' => (int)($item['price'] ?? 0),
                    ':trial_days' => (int)($item['trialDays'] ?? $item['trial_days'] ?? 14),
                    ':description' => $item['description'] ?? '',
                    ':features' => json_encode($item['features'] ?? [], JSON_UNESCAPED_UNICODE),
                    ':status' => $item['status'] ?? 'active',
                    ':sort_order' => (int)($item['sortOrder'] ?? $item['sort_order'] ?? 1)
                ]);
                DB::jsonResponse(true, ['item' => $item]);
            }
            break;

        // -----------------------------------------------------------------
        // 7. SUSCRIPCIONES Y CONDICIONES (subscriptions)
        // -----------------------------------------------------------------
        case 'subscriptions':
            $item = $input['item'] ?? $input;
            $sql = 'UPDATE subscriptions SET
                    plan_id = :plan_id,
                    plan_name = :plan_name,
                    monthly_price = :monthly_price,
                    status = :status,
                    trial_days_left = :trial_days_left,
                    is_trial = :is_trial,
                    payment_status = :payment_status,
                    client_phone = :client_phone,
                    joined_date = :joined_date,
                    last_payment_date = :last_payment_date,
                    next_billing_date = :next_billing_date
                    WHERE id = :id';
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':id' => $item['id'],
                ':plan_id' => $item['planId'] ?? $item['plan_id'],
                ':plan_name' => $item['planName'] ?? $item['plan_name'],
                ':monthly_price' => (int)($item['monthlyPrice'] ?? $item['monthly_price'] ?? 0),
                ':status' => $item['status'] ?? 'active',
                ':trial_days_left' => (int)($item['trialDaysLeft'] ?? $item['trial_days_left'] ?? 0),
                ':is_trial' => !empty($item['isTrial'] ?? $item['is_trial']) ? 1 : 0,
                ':payment_status' => $item['paymentStatus'] ?? $item['payment_status'] ?? 'pending',
                ':client_phone' => $item['clientPhone'] ?? $item['client_phone'] ?? null,
                ':joined_date' => $item['joinedDate'] ?? $item['joined_date'] ?? null,
                ':last_payment_date' => $item['lastPaymentDate'] ?? $item['last_payment_date'] ?? null,
                ':next_billing_date' => $item['nextBillingDate'] ?? $item['next_billing_date'] ?? null
            ]);
            DB::jsonResponse(true, ['item' => $item]);
            break;

        // -----------------------------------------------------------------
        // 8. USUARIOS (users)
        // -----------------------------------------------------------------
        case 'users':
            if ($action === 'delete') {
                $id = $input['id'] ?? '';
                $stmt = $pdo->prepare('DELETE FROM users WHERE id = :id');
                $stmt->execute([':id' => $id]);
                DB::jsonResponse(true, ['id' => $id, 'deleted' => true]);
            } else {
                $item = $input['item'] ?? $input;
                $userId = $item['id'] ?? ('usr-' . round(microtime(true) * 1000));

                $passHash = '';
                if (!empty($item['password'])) {
                    $passHash = password_hash($item['password'], PASSWORD_BCRYPT);
                } else {
                    $checkUser = $pdo->prepare('SELECT password_hash FROM users WHERE id = :id LIMIT 1');
                    $checkUser->execute([':id' => $userId]);
                    $existing = $checkUser->fetch();
                    if (!$existing) {
                        $passHash = password_hash('humm2026', PASSWORD_BCRYPT);
                    }
                }

                $sql = 'INSERT INTO users (id, workspace_id, name, email, password_hash, role, avatar, is_active, assigned_tool_ids, advisor_name, advisor_email, must_change_password, reset_token)
                        VALUES (:id, :workspace_id, :name, :email, :password_hash, :role, :avatar, :is_active, :assigned_tool_ids, :advisor_name, :advisor_email, :must_change_password, :reset_token)
                        ON DUPLICATE KEY UPDATE
                        name = VALUES(name),
                        email = VALUES(email),
                        workspace_id = VALUES(workspace_id),
                        password_hash = IF(VALUES(password_hash) != "" AND VALUES(password_hash) IS NOT NULL, VALUES(password_hash), password_hash),
                        role = VALUES(role),
                        avatar = VALUES(avatar),
                        is_active = VALUES(is_active),
                        assigned_tool_ids = VALUES(assigned_tool_ids),
                        advisor_name = VALUES(advisor_name),
                        advisor_email = VALUES(advisor_email),
                        must_change_password = VALUES(must_change_password),
                        reset_token = VALUES(reset_token)';
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    ':id' => $userId,
                    ':workspace_id' => $item['workspaceId'] ?? $item['workspace_id'] ?? null,
                    ':name' => $item['name'] ?? '',
                    ':email' => $item['email'] ?? '',
                    ':password_hash' => $passHash,
                    ':role' => $item['role'] ?? 'entrepreneur',
                    ':avatar' => $item['avatar'] ?? 'U',
                    ':is_active' => isset($item['isActive']) ? ($item['isActive'] ? 1 : 0) : 1,
                    ':assigned_tool_ids' => json_encode($item['assignedToolIds'] ?? $item['assigned_tool_ids'] ?? [], JSON_UNESCAPED_UNICODE),
                    ':advisor_name' => $item['advisorName'] ?? $item['advisor_name'] ?? null,
                    ':advisor_email' => $item['advisorEmail'] ?? $item['advisor_email'] ?? null,
                    ':must_change_password' => !empty($item['mustChangePassword'] ?? $item['must_change_password']) ? 1 : 0,
                    ':reset_token' => $item['resetToken'] ?? $item['reset_token'] ?? null
                ]);
                DB::jsonResponse(true, ['item' => $item]);
            }
            break;

        // -----------------------------------------------------------------
        // 9. ALIANZAS Y CONVENIOS (company_discounts)
        // -----------------------------------------------------------------
        case 'company_discounts':
        case 'discounts':
            if ($action === 'delete') {
                $id = $input['id'] ?? '';
                $stmt = $pdo->prepare('DELETE FROM company_discounts WHERE id = :id');
                $stmt->execute([':id' => $id]);
                DB::jsonResponse(true, ['id' => $id, 'deleted' => true]);
            } else {
                $item = $input['item'] ?? $input;
                $sql = 'INSERT INTO company_discounts (id, company_name, logo, discount_title, category, description, code, url, expires_at, is_featured, status)
                        VALUES (:id, :company_name, :logo, :discount_title, :category, :description, :code, :url, :expires_at, :is_featured, :status)
                        ON DUPLICATE KEY UPDATE
                        company_name = VALUES(company_name),
                        logo = VALUES(logo),
                        discount_title = VALUES(discount_title),
                        category = VALUES(category),
                        description = VALUES(description),
                        code = VALUES(code),
                        url = VALUES(url),
                        expires_at = VALUES(expires_at),
                        is_featured = VALUES(is_featured),
                        status = VALUES(status)';
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    ':id' => $item['id'],
                    ':company_name' => $item['companyName'] ?? $item['company_name'],
                    ':logo' => $item['logo'] ?? '🎁',
                    ':discount_title' => $item['discountTitle'] ?? $item['discount_title'],
                    ':category' => $item['category'] ?? 'Servicios Generales',
                    ':description' => $item['description'] ?? '',
                    ':code' => !empty($item['code']) ? trim($item['code']) : null,
                    ':url' => !empty($item['url']) ? trim($item['url']) : null,
                    ':expires_at' => !empty($item['expiresAt'] ?? $item['expires_at']) ? ($item['expiresAt'] ?? $item['expires_at']) : null,
                    ':is_featured' => !empty($item['featured'] ?? $item['is_featured']) ? 1 : 0,
                    ':status' => $item['status'] ?? 'active'
                ]);
                DB::jsonResponse(true, ['item' => $item]);
            }
            break;

        // -----------------------------------------------------------------
        // 10. HERRAMIENTAS (tools)
        // -----------------------------------------------------------------
        case 'tools':
            if ($action === 'delete') {
                $id = $input['id'] ?? '';
                $stmt = $pdo->prepare('DELETE FROM tools WHERE id = :id');
                $stmt->execute([':id' => $id]);
                DB::jsonResponse(true, ['id' => $id, 'deleted' => true]);
            } else {
                $item = $input['item'] ?? $input;
                $sql = 'INSERT INTO tools (id, name, description, category, status, url, icon, sort_order, is_visible, is_included)
                        VALUES (:id, :name, :description, :category, :status, :url, :icon, :sort_order, :is_visible, :is_included)
                        ON DUPLICATE KEY UPDATE
                        name = VALUES(name),
                        description = VALUES(description),
                        category = VALUES(category),
                        status = VALUES(status),
                        url = VALUES(url),
                        icon = VALUES(icon),
                        sort_order = VALUES(sort_order),
                        is_visible = VALUES(is_visible),
                        is_included = VALUES(is_included)';
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    ':id' => $item['id'],
                    ':name' => $item['name'],
                    ':description' => $item['description'] ?? '',
                    ':category' => $item['category'] ?? 'Gestión',
                    ':status' => $item['status'] ?? 'disponible',
                    ':url' => $item['url'] ?? '',
                    ':icon' => $item['icon'] ?? 'tool',
                    ':sort_order' => (int)($item['sortOrder'] ?? $item['sort_order'] ?? $item['order'] ?? 1),
                    ':is_visible' => isset($item['isVisible']) ? ($item['isVisible'] ? 1 : 0) : 1,
                    ':is_included' => isset($item['isIncluded']) ? ($item['isIncluded'] ? 1 : 0) : 1
                ]);
                DB::jsonResponse(true, ['item' => $item]);
            }
            break;

        // -----------------------------------------------------------------
        // 11. ESPACIOS DE EMPRENDIMIENTO (workspaces)
        // -----------------------------------------------------------------
        case 'workspaces':
        case 'workspace':
            if ($action === 'delete') {
                $id = $input['id'] ?? '';
                $stmt = $pdo->prepare('DELETE FROM workspaces WHERE id = :id');
                $stmt->execute([':id' => $id]);
                DB::jsonResponse(true, ['id' => $id, 'deleted' => true]);
            } else {
                $item = $input['item'] ?? $input;
                $sql = 'INSERT INTO workspaces (id, name, owner_name, email, phone, city, region, industry, description, membership_status, membership_type, advisor_name, advisor_email)
                        VALUES (:id, :name, :owner_name, :email, :phone, :city, :region, :industry, :description, :membership_status, :membership_type, :advisor_name, :advisor_email)
                        ON DUPLICATE KEY UPDATE
                        name = VALUES(name),
                        owner_name = VALUES(owner_name),
                        email = VALUES(email),
                        phone = VALUES(phone),
                        city = VALUES(city),
                        region = VALUES(region),
                        industry = VALUES(industry),
                        description = VALUES(description),
                        membership_status = VALUES(membership_status),
                        membership_type = VALUES(membership_type),
                        advisor_name = VALUES(advisor_name),
                        advisor_email = VALUES(advisor_email)';
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    ':id' => $item['id'],
                    ':name' => $item['name'],
                    ':owner_name' => $item['ownerName'] ?? $item['owner_name'] ?? 'Titular',
                    ':email' => $item['email'],
                    ':phone' => $item['phone'] ?? null,
                    ':city' => $item['city'] ?? $item['comuna'] ?? null,
                    ':region' => $item['region'] ?? null,
                    ':industry' => $item['industry'] ?? null,
                    ':description' => $item['description'] ?? null,
                    ':membership_status' => $item['membershipStatus'] ?? $item['membership_status'] ?? 'active',
                    ':membership_type' => $item['membershipType'] ?? $item['membership_type'] ?? 'Membresía Humm Co-Creation',
                    ':advisor_name' => !empty($item['advisorName'] ?? $item['advisor_name']) ? ($item['advisorName'] ?? $item['advisor_name']) : null,
                    ':advisor_email' => !empty($item['advisorEmail'] ?? $item['advisor_email']) ? ($item['advisorEmail'] ?? $item['advisor_email']) : null
                ]);
                DB::jsonResponse(true, ['item' => $item]);
            }
            break;

        default:
            DB::jsonResponse(false, null, "Entidad '$entity' no reconocida.", 400);
            break;
    }
} catch (Exception $e) {
    DB::jsonResponse(false, null, 'Error al guardar datos: ' . $e->getMessage(), 500);
}
