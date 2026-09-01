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
                $sql = 'INSERT INTO users (id, workspace_id, name, email, password_hash, role, avatar, is_active, assigned_tool_ids, advisor_name, advisor_email)
                        VALUES (:id, :workspace_id, :name, :email, :password_hash, :role, :avatar, :is_active, :assigned_tool_ids, :advisor_name, :advisor_email)
                        ON DUPLICATE KEY UPDATE
                        name = VALUES(name),
                        email = VALUES(email),
                        workspace_id = VALUES(workspace_id),
                        role = VALUES(role),
                        avatar = VALUES(avatar),
                        is_active = VALUES(is_active),
                        assigned_tool_ids = VALUES(assigned_tool_ids),
                        advisor_name = VALUES(advisor_name),
                        advisor_email = VALUES(advisor_email)';
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    ':id' => $item['id'],
                    ':workspace_id' => $item['workspaceId'] ?? $item['workspace_id'] ?? null,
                    ':name' => $item['name'],
                    ':email' => $item['email'],
                    ':password_hash' => !empty($item['password']) ? password_hash($item['password'], PASSWORD_BCRYPT) : '$2y$10$7rXmFhLgN5PjTwH9kQ3beeU2vK4yN1oM7sT3qP8wO0sT4qR8wN2h6',
                    ':role' => $item['role'] ?? 'entrepreneur',
                    ':avatar' => $item['avatar'] ?? 'U',
                    ':is_active' => isset($item['isActive']) ? ($item['isActive'] ? 1 : 0) : 1,
                    ':assigned_tool_ids' => json_encode($item['assignedToolIds'] ?? $item['assigned_tool_ids'] ?? [], JSON_UNESCAPED_UNICODE),
                    ':advisor_name' => $item['advisorName'] ?? $item['advisor_name'] ?? null,
                    ':advisor_email' => $item['advisorEmail'] ?? $item['advisor_email'] ?? null
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
