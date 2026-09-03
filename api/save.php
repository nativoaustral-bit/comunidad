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

$item = $input['item'] ?? $input;
$targetId = $input['id'] ?? (is_array($item) ? ($item['id'] ?? '') : $item);

try {
    switch ($entity) {
        // -----------------------------------------------------------------
        // 1. VENTAS (sales)
        // -----------------------------------------------------------------
        case 'sales':
            if ($action === 'delete') {
                $id = $targetId;
                $stmt = $pdo->prepare('DELETE FROM sales WHERE id = :id');
                $stmt->execute([':id' => $id]);
                DB::jsonResponse(true, ['id' => $id, 'deleted' => true]);
            } else {
                $item = $input['item'] ?? $input;
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
                    ':id' => $item['id'],
                    ':workspace_id' => $item['workspaceId'] ?? ($item['workspace_id'] ?? null),
                    ':customer_id' => $item['customerId'] ?? ($item['customer_id'] ?? null),
                    ':customer_name' => $item['customerName'] ?? ($item['customer_name'] ?? 'Venta General'),
                    ':total_amount' => (int)($item['amount'] ?? ($item['totalAmount'] ?? ($item['total_amount'] ?? 0))),
                    ':payment_status' => $item['paymentStatus'] ?? ($item['payment_status'] ?? 'pagado'),
                    ':payment_method' => $item['paymentMethod'] ?? ($item['payment_method'] ?? 'Transferencia'),
                    ':sale_date' => $item['date'] ?? ($item['saleDate'] ?? ($item['sale_date'] ?? date('Y-m-d'))),
                    ':due_date' => $item['dueDate'] ?? ($item['due_date'] ?? null),
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
                $id = $targetId;
                $stmt = $pdo->prepare('DELETE FROM customers WHERE id = :id');
                $stmt->execute([':id' => $id]);
                DB::jsonResponse(true, ['id' => $id, 'deleted' => true]);
            } else {
                $name = $item['name'] ?? trim(($item['firstName'] ?? '') . ' ' . ($item['lastName'] ?? ''));
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
                    ':id' => $item['id'],
                    ':workspace_id' => $item['workspaceId'] ?? ($item['workspace_id'] ?? null),
                    ':name' => $name,
                    ':last_name' => $item['lastName'] ?? ($item['last_name'] ?? null),
                    ':rut' => $item['rut'] ?? null,
                    ':email' => $item['email'] ?? null,
                    ':phone' => $item['phone'] ?? null,
                    ':company' => $item['company'] ?? null,
                    ':region' => $item['region'] ?? null,
                    ':comuna' => $item['comuna'] ?? null,
                    ':city' => $item['city'] ?? null,
                    ':address' => $item['address'] ?? null,
                    ':source_channel' => $item['sourceChannel'] ?? ($item['source_channel'] ?? 'Recomendación'),
                    ':status' => $item['status'] ?? 'active',
                    ':total_purchases' => (int)($item['totalPurchases'] ?? ($item['total_purchases'] ?? 0)),
                    ':last_purchase_date' => $item['lastPurchaseDate'] ?? ($item['last_purchase_date'] ?? null),
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
                $id = $targetId;
                $stmt = $pdo->prepare('DELETE FROM tasks WHERE id = :id');
                $stmt->execute([':id' => $id]);
                DB::jsonResponse(true, ['id' => $id, 'deleted' => true]);
            } else {
                $item = $input['item'] ?? $input;
                $status = $item['status'] ?? 'todo';
                if ($status === '' || $status === 'pendiente') $status = 'todo';
                elseif ($status === 'en_proceso' || $status === 'en_progreso') $status = 'in_progress';
                elseif ($status === 'completada') $status = 'done';

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
                    ':id' => $item['id'],
                    ':workspace_id' => $item['workspaceId'] ?? ($item['workspace_id'] ?? null),
                    ':title' => $item['title'],
                    ':description' => $item['description'] ?? null,
                    ':priority' => $item['priority'] ?? 'media',
                    ':status' => $status,
                    ':start_date' => $item['startDate'] ?? ($item['start_date'] ?? null),
                    ':due_date' => $item['dueDate'] ?? ($item['due_date'] ?? null),
                    ':tag' => $item['tag'] ?? null,
                    ':customer_id' => $item['customerId'] ?? ($item['customer_id'] ?? null),
                    ':opportunity_id' => $item['opportunityId'] ?? ($item['opportunity_id'] ?? null),
                    ':completed_at' => $item['completedAt'] ?? ($item['completed_at'] ?? null),
                    ':assigned_to' => $item['assignedTo'] ?? ($item['assigned_to'] ?? null)
                ]);
                DB::jsonResponse(true, ['item' => $item]);
            }
            break;

        // -----------------------------------------------------------------
        // 4. EVENTOS CALENDARIO (calendar_events)
        // -----------------------------------------------------------------
        case 'calendar_events':
        case 'events':
            if ($action === 'delete') {
                $id = $targetId;
                $stmt = $pdo->prepare('DELETE FROM calendar_events WHERE id = :id');
                $stmt->execute([':id' => $id]);
                DB::jsonResponse(true, ['id' => $id, 'deleted' => true]);
            } else {
                $item = $input['item'] ?? $input;
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
                    ':id' => $item['id'],
                    ':workspace_id' => $item['workspaceId'] ?? ($item['workspace_id'] ?? null),
                    ':title' => $item['title'],
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
                DB::jsonResponse(true, ['item' => $item]);
            }
            break;

        // -----------------------------------------------------------------
        // 5. BLOC DE NOTAS (quick_notes)
        // -----------------------------------------------------------------
        case 'quick_notes':
            if ($action === 'delete') {
                $id = $targetId;
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
                $id = $targetId;
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
            if ($action === 'delete') {
                $id = $targetId;
                $stmt = $pdo->prepare('DELETE FROM subscriptions WHERE id = :id');
                $stmt->execute([':id' => $id]);
                DB::jsonResponse(true, ['id' => $id, 'deleted' => true]);
            } else {
                $item = $input['item'] ?? $input;
                $sql = 'INSERT INTO subscriptions (id, user_id, workspace_id, client_name, client_email, client_phone, business_name, plan_id, plan_name, monthly_price, status, trial_days_total, trial_days_left, is_trial, payment_status, joined_date, last_payment_date, next_billing_date, payment_method, payment_link)
                        VALUES (:id, :user_id, :workspace_id, :client_name, :client_email, :client_phone, :business_name, :plan_id, :plan_name, :monthly_price, :status, :trial_days_total, :trial_days_left, :is_trial, :payment_status, :joined_date, :last_payment_date, :next_billing_date, :payment_method, :payment_link)
                        ON DUPLICATE KEY UPDATE
                        plan_id = VALUES(plan_id),
                        plan_name = VALUES(plan_name),
                        monthly_price = VALUES(monthly_price),
                        status = VALUES(status),
                        trial_days_total = VALUES(trial_days_total),
                        trial_days_left = VALUES(trial_days_left),
                        is_trial = VALUES(is_trial),
                        payment_status = VALUES(payment_status),
                        client_phone = VALUES(client_phone),
                        business_name = VALUES(business_name),
                        joined_date = VALUES(joined_date),
                        last_payment_date = VALUES(last_payment_date),
                        next_billing_date = VALUES(next_billing_date),
                        payment_method = VALUES(payment_method),
                        payment_link = VALUES(payment_link)';
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
                    ':monthly_price' => (int)($item['monthlyPrice'] ?? ($item['monthly_price'] ?? 0)),
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
                DB::jsonResponse(true, ['item' => $item]);
            }
            break;

        // -----------------------------------------------------------------
        // 8. USUARIOS (users)
        // -----------------------------------------------------------------
        case 'users':
            if ($action === 'delete') {
                $id = $targetId;
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

                $sql = 'INSERT INTO users (id, workspace_id, name, email, phone, password_hash, role, specialty, avatar, is_active, assigned_tool_ids, advisor_name, advisor_email, must_change_password, reset_token)
                        VALUES (:id, :workspace_id, :name, :email, :phone, :password_hash, :role, :specialty, :avatar, :is_active, :assigned_tool_ids, :advisor_name, :advisor_email, :must_change_password, :reset_token)
                        ON DUPLICATE KEY UPDATE
                        name = VALUES(name),
                        email = VALUES(email),
                        phone = VALUES(phone),
                        workspace_id = VALUES(workspace_id),
                        password_hash = IF(VALUES(password_hash) != "" AND VALUES(password_hash) IS NOT NULL, VALUES(password_hash), password_hash),
                        role = VALUES(role),
                        specialty = VALUES(specialty),
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
                    ':workspace_id' => $item['workspaceId'] ?? ($item['workspace_id'] ?? null),
                    ':name' => $item['name'],
                    ':email' => $item['email'],
                    ':phone' => $item['phone'] ?? null,
                    ':password_hash' => $passHash,
                    ':role' => $item['role'] ?? 'entrepreneur',
                    ':specialty' => $item['specialty'] ?? null,
                    ':avatar' => $item['avatar'] ?? (isset($item['name']) ? strtoupper(substr($item['name'], 0, 2)) : 'U'),
                    ':is_active' => isset($item['isActive']) ? ($item['isActive'] ? 1 : 0) : (isset($item['is_active']) ? ($item['is_active'] ? 1 : 0) : 1),
                    ':assigned_tool_ids' => json_encode($item['assignedToolIds'] ?? ($item['assigned_tool_ids'] ?? []), JSON_UNESCAPED_UNICODE),
                    ':advisor_name' => !empty($item['advisorName'] ?? $item['advisor_name']) ? ($item['advisorName'] ?? $item['advisor_name']) : null,
                    ':advisor_email' => !empty($item['advisorEmail'] ?? $item['advisor_email']) ? ($item['advisorEmail'] ?? $item['advisor_email']) : null,
                    ':must_change_password' => !empty($item['mustChangePassword'] ?? $item['must_change_password']) ? 1 : 0,
                    ':reset_token' => $item['resetToken'] ?? ($item['reset_token'] ?? null)
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
                $id = $targetId;
                $stmt = $pdo->prepare('DELETE FROM company_discounts WHERE id = :id');
                $stmt->execute([':id' => $id]);
                DB::jsonResponse(true, ['id' => $id, 'deleted' => true]);
            } else {
                $item = $input['item'] ?? $input;
                $sql = 'INSERT INTO company_discounts (
                            id, company_name, logo, discount_title, category, description,
                            contact_person, contact_role, phone, whatsapp, instagram, email,
                            preferred_channel, code, url, starts_at, expires_at, min_purchase,
                            max_discount, whatsapp_template, instagram_template, email_template,
                            humm_responsible, is_featured, status
                        ) VALUES (
                            :id, :company_name, :logo, :discount_title, :category, :description,
                            :contact_person, :contact_role, :phone, :whatsapp, :instagram, :email,
                            :preferred_channel, :code, :url, :starts_at, :expires_at, :min_purchase,
                            :max_discount, :whatsapp_template, :instagram_template, :email_template,
                            :humm_responsible, :is_featured, :status
                        )
                        ON DUPLICATE KEY UPDATE
                        company_name = VALUES(company_name),
                        logo = VALUES(logo),
                        discount_title = VALUES(discount_title),
                        category = VALUES(category),
                        description = VALUES(description),
                        contact_person = VALUES(contact_person),
                        contact_role = VALUES(contact_role),
                        phone = VALUES(phone),
                        whatsapp = VALUES(whatsapp),
                        instagram = VALUES(instagram),
                        email = VALUES(email),
                        preferred_channel = VALUES(preferred_channel),
                        code = VALUES(code),
                        url = VALUES(url),
                        starts_at = VALUES(starts_at),
                        expires_at = VALUES(expires_at),
                        min_purchase = VALUES(min_purchase),
                        max_discount = VALUES(max_discount),
                        whatsapp_template = VALUES(whatsapp_template),
                        instagram_template = VALUES(instagram_template),
                        email_template = VALUES(email_template),
                        humm_responsible = VALUES(humm_responsible),
                        is_featured = VALUES(is_featured),
                        status = VALUES(status)';
                $discCompany = $item['companyName'] ?? ($item['company_name'] ?? 'Empresa Aliada');
                $discLogo = $item['logo'] ?? '🎁';
                $discTitle = $item['discountTitle'] ?? ($item['discount_title'] ?? 'Beneficio Exclusivo Humm');
                $discCat = $item['category'] ?? 'Servicios Generales';
                $discDesc = $item['description'] ?? '';
                $discCode = !empty($item['code']) ? trim((string)$item['code']) : null;
                $discUrl = !empty($item['url']) ? trim((string)$item['url']) : null;
                $discStarts = !empty($item['startsAt']) ? $item['startsAt'] : (!empty($item['starts_at']) ? $item['starts_at'] : null);
                $discExpires = !empty($item['expiresAt']) ? $item['expiresAt'] : (!empty($item['expires_at']) ? $item['expires_at'] : null);
                $discFeatured = !empty($item['featured']) || !empty($item['is_featured']) ? 1 : 0;
                $discStatus = $item['status'] ?? 'active';

                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    ':id' => $item['id'] ?? ('disc-' . round(microtime(true) * 1000)),
                    ':company_name' => $discCompany,
                    ':logo' => $discLogo,
                    ':discount_title' => $discTitle,
                    ':category' => $discCat,
                    ':description' => $discDesc,
                    ':contact_person' => $item['contactPerson'] ?? ($item['contact_person'] ?? null),
                    ':contact_role' => $item['contactRole'] ?? ($item['contact_role'] ?? null),
                    ':phone' => $item['phone'] ?? null,
                    ':whatsapp' => $item['whatsapp'] ?? null,
                    ':instagram' => $item['instagram'] ?? null,
                    ':email' => $item['email'] ?? null,
                    ':preferred_channel' => $item['preferredChannel'] ?? ($item['preferred_channel'] ?? 'whatsapp'),
                    ':code' => $discCode,
                    ':url' => $discUrl,
                    ':starts_at' => $discStarts,
                    ':expires_at' => $discExpires,
                    ':min_purchase' => !empty($item['minPurchase'] ?? $item['min_purchase']) ? (int)($item['minPurchase'] ?? $item['min_purchase']) : null,
                    ':max_discount' => !empty($item['maxDiscount'] ?? $item['max_discount']) ? (int)($item['maxDiscount'] ?? $item['max_discount']) : null,
                    ':whatsapp_template' => $item['whatsappTemplate'] ?? ($item['whatsapp_template'] ?? null),
                    ':instagram_template' => $item['instagramTemplate'] ?? ($item['instagram_template'] ?? null),
                    ':email_template' => $item['emailTemplate'] ?? ($item['email_template'] ?? null),
                    ':humm_responsible' => $item['hummResponsible'] ?? ($item['humm_responsible'] ?? null),
                    ':is_featured' => $discFeatured,
                    ':status' => $discStatus
                ]);
                DB::jsonResponse(true, ['item' => $item]);
            }
            break;

        // -----------------------------------------------------------------
        // 9.5. SOLICITUDES DE BENEFICIOS (benefit_requests)
        // -----------------------------------------------------------------
        case 'benefit_requests':
        case 'benefit_request':
            if ($action === 'delete') {
                $id = $targetId;
                $stmt = $pdo->prepare('DELETE FROM benefit_requests WHERE id = :id');
                $stmt->execute([':id' => $id]);
                DB::jsonResponse(true, ['id' => $id, 'deleted' => true]);
            } else {
                $item = $input['item'] ?? $input;
                $discountId = $item['discountId'] ?? ($item['discount_id'] ?? '');
                $userId = $item['userId'] ?? ($item['user_id'] ?? '');
                $workspaceId = $item['workspaceId'] ?? ($item['workspace_id'] ?? '');

                // Si no viene id o personal_code, verificar si ya existe solicitud previa
                if (empty($item['id']) || empty($item['personalCode'])) {
                    $stmtCheck = $pdo->prepare('SELECT * FROM benefit_requests WHERE workspace_id = :ws AND discount_id = :disc LIMIT 1');
                    $stmtCheck->execute([':ws' => $workspaceId, ':disc' => $discountId]);
                    $existing = $stmtCheck->fetch();
                    if ($existing) {
                        // Si ya existe, actualizamos last_contact_at y devolvemos la existente
                        $stmtUp = $pdo->prepare('UPDATE benefit_requests SET last_contact_at = NOW(), channel = :ch WHERE id = :id');
                        $stmtUp->execute([':ch' => $item['channel'] ?? ($existing['channel'] ?? 'whatsapp'), ':id' => $existing['id']]);
                        $existing['channel'] = $item['channel'] ?? ($existing['channel'] ?? 'whatsapp');
                        $existing['last_contact_at'] = date('Y-m-d H:i:s');
                        DB::jsonResponse(true, ['item' => $existing, 'is_existing' => true]);
                        exit;
                    }
                }

                // Generación de código seguro si no se proveyó
                $personalCode = $item['personalCode'] ?? ($item['personal_code'] ?? null);
                if (empty($personalCode)) {
                    // Obtener nombre del aliado para el prefijo
                    $stmtAliado = $pdo->prepare('SELECT company_name, discount_title FROM company_discounts WHERE id = :id LIMIT 1');
                    $stmtAliado->execute([':id' => $discountId]);
                    $aliado = $stmtAliado->fetch();
                    $aliasRaw = $aliado ? ($aliado['company_name'] ?: $aliado['discount_title']) : 'BENEFICIO';
                    // Limpiar alias: solo letras y números, max 8 chars
                    $alias = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $aliasRaw));
                    if (empty($alias)) $alias = 'BENEFICIO';
                    $alias = substr($alias, 0, 8);
                    
                    // Generar 4 caracteres aleatorios
                    $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
                    $randPart = '';
                    for ($i = 0; $i < 4; $i++) {
                        $randPart .= $chars[random_int(0, strlen($chars) - 1)];
                    }
                    $personalCode = "HUMM-{$alias}-{$randPart}";
                }

                $reqId = $item['id'] ?? ('req-' . round(microtime(true) * 1000));
                $status = $item['status'] ?? 'contact_started';
                $channel = $item['channel'] ?? 'whatsapp';
                $usedAt = !empty($item['usedAt']) ? $item['usedAt'] : (!empty($item['used_at']) ? $item['used_at'] : ($status === 'used' ? date('Y-m-d H:i:s') : null));

                $sql = 'INSERT INTO benefit_requests (
                            id, discount_id, user_id, workspace_id, personal_code, channel, status,
                            requested_at, last_contact_at, used_at, purchase_amount, discount_amount,
                            member_comment, member_rating, not_completed_reason, admin_notes
                        ) VALUES (
                            :id, :discount_id, :user_id, :workspace_id, :personal_code, :channel, :status,
                            :requested_at, :last_contact_at, :used_at, :purchase_amount, :discount_amount,
                            :member_comment, :member_rating, :not_completed_reason, :admin_notes
                        )
                        ON DUPLICATE KEY UPDATE
                        channel = VALUES(channel),
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
                    ':id' => $reqId,
                    ':discount_id' => $discountId,
                    ':user_id' => $userId,
                    ':workspace_id' => $workspaceId,
                    ':personal_code' => $personalCode,
                    ':channel' => $channel,
                    ':status' => $status,
                    ':requested_at' => $item['requestedAt'] ?? ($item['requested_at'] ?? date('Y-m-d H:i:s')),
                    ':last_contact_at' => date('Y-m-d H:i:s'),
                    ':used_at' => $usedAt,
                    ':purchase_amount' => !empty($item['purchaseAmount'] ?? $item['purchase_amount']) ? (int)($item['purchaseAmount'] ?? $item['purchase_amount']) : null,
                    ':discount_amount' => !empty($item['discountAmount'] ?? $item['discount_amount']) ? (int)($item['discountAmount'] ?? $item['discount_amount']) : null,
                    ':member_comment' => $item['memberComment'] ?? ($item['member_comment'] ?? null),
                    ':member_rating' => !empty($item['memberRating'] ?? $item['member_rating']) ? (int)($item['memberRating'] ?? $item['member_rating']) : null,
                    ':not_completed_reason' => $item['notCompletedReason'] ?? ($item['not_completed_reason'] ?? null),
                    ':admin_notes' => $item['adminNotes'] ?? ($item['admin_notes'] ?? null)
                ]);

                $savedItem = [
                    'id' => $reqId,
                    'discountId' => $discountId,
                    'userId' => $userId,
                    'workspaceId' => $workspaceId,
                    'personalCode' => $personalCode,
                    'channel' => $channel,
                    'status' => $status,
                    'requestedAt' => $item['requestedAt'] ?? ($item['requested_at'] ?? date('Y-m-d H:i:s')),
                    'lastContactAt' => date('Y-m-d H:i:s'),
                    'usedAt' => $usedAt,
                    'purchaseAmount' => !empty($item['purchaseAmount'] ?? $item['purchase_amount']) ? (int)($item['purchaseAmount'] ?? $item['purchase_amount']) : null,
                    'discountAmount' => !empty($item['discountAmount'] ?? $item['discount_amount']) ? (int)($item['discountAmount'] ?? $item['discount_amount']) : null,
                    'memberComment' => $item['memberComment'] ?? ($item['member_comment'] ?? null),
                    'memberRating' => !empty($item['memberRating'] ?? $item['member_rating']) ? (int)($item['memberRating'] ?? $item['member_rating']) : null,
                    'notCompletedReason' => $item['notCompletedReason'] ?? ($item['not_completed_reason'] ?? null),
                    'adminNotes' => $item['adminNotes'] ?? ($item['admin_notes'] ?? null)
                ];

                DB::jsonResponse(true, ['item' => $savedItem]);
            }
            break;

        // -----------------------------------------------------------------
        // 10. HERRAMIENTAS (tools)
        // -----------------------------------------------------------------
        case 'tools':
            if ($action === 'delete') {
                $id = $targetId;
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
                $id = $targetId;
                $stmt = $pdo->prepare('DELETE FROM workspaces WHERE id = :id');
                $stmt->execute([':id' => $id]);
                DB::jsonResponse(true, ['id' => $id, 'deleted' => true]);
            } else {
                $item = $input['item'] ?? $input;
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
                        kanban_columns = VALUES(kanban_columns),
                        membership_status = VALUES(membership_status),
                        membership_type = VALUES(membership_type),
                        advisor_name = VALUES(advisor_name),
                        advisor_email = VALUES(advisor_email)';
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    ':id' => $item['id'],
                    ':name' => $item['name'],
                    ':owner_name' => $item['ownerName'] ?? ($item['owner_name'] ?? 'Titular'),
                    ':email' => $item['email'],
                    ':phone' => $item['phone'] ?? null,
                    ':city' => $item['city'] ?? ($item['comuna'] ?? null),
                    ':region' => $item['region'] ?? null,
                    ':industry' => $item['industry'] ?? null,
                    ':description' => $item['description'] ?? null,
                    ':kanban_columns' => is_array($item['kanbanColumns'] ?? null) ? json_encode($item['kanbanColumns'], JSON_UNESCAPED_UNICODE) : ($item['kanban_columns'] ?? null),
                    ':membership_status' => $item['membershipStatus'] ?? ($item['membership_status'] ?? 'active'),
                    ':membership_type' => $item['membershipType'] ?? ($item['membership_type'] ?? 'Membresía Humm Co-Creation'),
                    ':advisor_name' => !empty($item['advisorName'] ?? $item['advisor_name']) ? ($item['advisorName'] ?? $item['advisor_name']) : null,
                    ':advisor_email' => !empty($item['advisorEmail'] ?? $item['advisor_email']) ? ($item['advisorEmail'] ?? $item['advisor_email']) : null
                ]);
                DB::jsonResponse(true, ['item' => $item]);
            }
            break;

        // -----------------------------------------------------------------
        // 11.5. OPORTUNIDADES COMERCIALES (opportunities)
        // -----------------------------------------------------------------
        case 'opportunities':
        case 'opportunity':
            if ($action === 'delete') {
                $id = $targetId;
                $stmt = $pdo->prepare('DELETE FROM opportunities WHERE id = :id');
                $stmt->execute([':id' => $id]);
                DB::jsonResponse(true, ['id' => $id, 'deleted' => true]);
            } else {
                $item = $input['item'] ?? $input;
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
                $contact = $item['contactName'] ?? ($item['contact_name'] ?? ($item['customerName'] ?? ($item['customer_name'] ?? 'Contacto')));
                $amount = (int)($item['estimatedAmount'] ?? ($item['estimated_amount'] ?? ($item['estimatedValue'] ?? ($item['estimated_value'] ?? ($item['value'] ?? 0)))));
                $stageVal = $item['stage'] ?? ($item['status'] ?? 'prospecto');
                $stmt->execute([
                    ':id' => $item['id'] ?? ('opp-' . round(microtime(true) * 1000)),
                    ':workspace_id' => $item['workspaceId'] ?? ($item['workspace_id'] ?? null),
                    ':title' => $item['title'] ?? 'Oportunidad',
                    ':contact_name' => $contact,
                    ':customer_name' => $contact,
                    ':phone' => $item['phone'] ?? null,
                    ':email' => $item['email'] ?? null,
                    ':product_interest' => $item['productInterest'] ?? ($item['product_interest'] ?? null),
                    ':estimated_amount' => $amount,
                    ':estimated_value' => $amount,
                    ':status' => $item['status'] ?? ($item['stage'] ?? 'nuevo'),
                    ':stage' => $stageVal,
                    ':next_action' => $item['nextAction'] ?? ($item['next_action'] ?? null),
                    ':follow_up_date' => $item['followUpDate'] ?? ($item['follow_up_date'] ?? null),
                    ':expected_close_date' => $item['followUpDate'] ?? ($item['expectedCloseDate'] ?? ($item['expected_close_date'] ?? null)),
                    ':source_channel' => $item['sourceChannel'] ?? ($item['source_channel'] ?? 'Otro'),
                    ':notes' => $item['notes'] ?? null,
                    ':customer_id' => $item['customerId'] ?? ($item['customer_id'] ?? null)
                ]);
                DB::jsonResponse(true, ['item' => $item]);
            }
            break;

        // -----------------------------------------------------------------
        // 12. DIFUSIÓN Y COMUNICADOS (broadcasts)
        // -----------------------------------------------------------------
        case 'broadcasts':
        case 'broadcast':
            if ($action === 'delete') {
                $id = $targetId;
                $stmt = $pdo->prepare('DELETE FROM broadcasts WHERE id = :id');
                $stmt->execute([':id' => $id]);
                DB::jsonResponse(true, ['id' => $id, 'deleted' => true]);
            } else {
                $item = $input['item'] ?? $input;
                $sql = 'INSERT INTO broadcasts (id, title, category, target_audience, content, author_name, channels, reach_count)
                        VALUES (:id, :title, :category, :target_audience, :content, :author_name, :channels, :reach_count)
                        ON DUPLICATE KEY UPDATE
                        title = VALUES(title),
                        category = VALUES(category),
                        target_audience = VALUES(target_audience),
                        content = VALUES(content),
                        author_name = VALUES(author_name),
                        channels = VALUES(channels),
                        reach_count = VALUES(reach_count)';
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    ':id' => $item['id'] ?? ('bc-' . round(microtime(true) * 1000)),
                    ':title' => $item['title'] ?? 'Comunicado',
                    ':category' => $item['category'] ?? 'Noticia de la Comunidad',
                    ':target_audience' => $item['targetAudience'] ?? ($item['target_audience'] ?? 'Todos los Emprendedores'),
                    ':content' => $item['content'] ?? '',
                    ':author_name' => $item['authorName'] ?? ($item['author_name'] ?? 'Administración Humm'),
                    ':channels' => is_array($item['channels'] ?? null) ? json_encode($item['channels'], JSON_UNESCAPED_UNICODE) : ($item['channels'] ?? '[]'),
                    ':reach_count' => (int)($item['reachCount'] ?? ($item['reach_count'] ?? 0))
                ]);
                DB::jsonResponse(true, ['item' => $item]);
            }
            break;

        // -----------------------------------------------------------------
        // 13. REQUERIMIENTOS DE SOPORTE (support_requests)
        // -----------------------------------------------------------------
        case 'support_requests':
        case 'support_request':
            if ($action === 'delete') {
                $id = $targetId;
                $stmt = $pdo->prepare('DELETE FROM support_requests WHERE id = :id');
                $stmt->execute([':id' => $id]);
                DB::jsonResponse(true, ['id' => $id, 'deleted' => true]);
            } else {
                $item = $input['item'] ?? $input;
                $sql = 'INSERT INTO support_requests (id, workspace_id, user_id, workspace_name, user_name, user_email, request_type, subject, description, contact_preference, advisor_name, advisor_email, status)
                        VALUES (:id, :workspace_id, :user_id, :workspace_name, :user_name, :user_email, :request_type, :subject, :description, :contact_preference, :advisor_name, :advisor_email, :status)
                        ON DUPLICATE KEY UPDATE
                        status = VALUES(status),
                        advisor_name = VALUES(advisor_name),
                        advisor_email = VALUES(advisor_email)';
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    ':id' => $item['id'] ?? ('req-' . round(microtime(true) * 1000)),
                    ':workspace_id' => $item['workspaceId'] ?? ($item['workspace_id'] ?? 'ws-general'),
                    ':user_id' => $item['userId'] ?? ($item['user_id'] ?? null),
                    ':workspace_name' => $item['workspaceName'] ?? ($item['workspace_name'] ?? 'Emprendimiento'),
                    ':user_name' => $item['userName'] ?? ($item['user_name'] ?? 'Emprendedor'),
                    ':user_email' => $item['userEmail'] ?? ($item['user_email'] ?? ''),
                    ':request_type' => $item['requestType'] ?? ($item['request_type'] ?? 'Consulta general'),
                    ':subject' => $item['subject'] ?? 'Solicitud de apoyo',
                    ':description' => $item['description'] ?? '',
                    ':contact_preference' => $item['contactPreference'] ?? ($item['contact_preference'] ?? 'Coordinar reunión virtual'),
                    ':advisor_name' => $item['advisorName'] ?? ($item['advisor_name'] ?? null),
                    ':advisor_email' => $item['advisorEmail'] ?? ($item['advisor_email'] ?? null),
                    ':status' => $item['status'] ?? 'pendiente'
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
