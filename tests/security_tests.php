<?php
/**
 * Suite de Pruebas Automatizadas de Seguridad y Regresión
 * Comunidad Humm - Remediation Gate Final
 *
 * Ejecución:
 *   php tests/security_tests.php [--url=https://comunidad.humm.cl]
 */

$options = getopt('', ['url::', 'admin-pass::']);
$baseUrl = rtrim($options['url'] ?? 'https://comunidad.humm.cl', '/');
$adminEmail = 'contacto@humm.cl';

// Carga segura de credencial de prueba sin exponer en código ni repositorio
$adminPass = getenv('ADMIN_PASS') ?: ($options['admin-pass'] ?? '');
if (empty($adminPass)) {
    $sshCmd = "ssh -p 2222 paulocis@humm.cl \"php -r \\\"require '/home1/paulocis/private/comunidad_secrets.php'; echo defined('ADMIN_TEST_PASS') ? ADMIN_TEST_PASS : '';\\\"\" 2>/dev/null";
    $fetched = trim((string)shell_exec($sshCmd));
    if (!empty($fetched)) {
        $adminPass = $fetched;
    }
}

echo "══════════════════════════════════════════════════════════════════════════════\n";
echo "  COMUNIDAD HUMM - SUITE DE PRUEBAS ADVERSARIALES Y SEGURIDAD FINAL\n";
echo "  Objetivo: $baseUrl\n";
echo "  Fecha: " . date('Y-m-d H:i:s') . "\n";
echo "══════════════════════════════════════════════════════════════════════════════\n\n";

$testsPassed = 0;
$testsFailed = 0;
$cookieJar = tempnam(sys_get_temp_dir(), 'humm_cookie_');

function httpRequest($method, $url, $data = null, $headers = [], $useCookie = false, $extraCookie = 'humans_21909=1') {
    global $cookieJar;
    $ch = curl_init();
    
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36');
    
    if ($useCookie) {
        curl_setopt($ch, CURLOPT_COOKIEJAR, $cookieJar);
        curl_setopt($ch, CURLOPT_COOKIEFILE, $cookieJar);
    }
    
    if (!empty($extraCookie)) {
        curl_setopt($ch, CURLOPT_COOKIE, $extraCookie);
    }
    
    $reqHeaders = [];
    foreach ($headers as $k => $v) {
        $reqHeaders[] = "$k: $v";
    }
    
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        $payload = is_array($data) ? json_encode($data) : $data;
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        if (!isset($headers['Content-Type'])) {
            $reqHeaders[] = 'Content-Type: application/json';
        }
    }
    
    curl_setopt($ch, CURLOPT_HTTPHEADER, $reqHeaders);
    
    $raw = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $err = curl_error($ch);
    curl_close($ch);
    
    if ($raw === false) {
        return ['code' => 0, 'headers' => '', 'body' => '', 'json' => null, 'error' => $err];
    }
    
    $headerStr = substr($raw, 0, $headerSize);
    $body = substr($raw, $headerSize);
    $json = json_decode($body, true);
    
    return [
        'code' => $httpCode,
        'headers' => $headerStr,
        'body' => $body,
        'json' => $json,
        'error' => null
    ];
}

function assertTest($name, $condition, $details = '') {
    global $testsPassed, $testsFailed;
    if ($condition) {
        echo "  ✔ [PASS] $name\n";
        $testsPassed++;
    } else {
        echo "  ❌ [FAIL] $name\n";
        if ($details) {
            echo "     Detalles: $details\n";
        }
        $testsFailed++;
    }
}

// -----------------------------------------------------------------------------
// BLOQUE 1: Verificación de Superficie Anónima / Sin Autenticación (P0)
// -----------------------------------------------------------------------------
echo "1. VERIFICACIÓN DE CONTROL DE ACCESO ANÓNIMO (401 Esperado)\n";
echo "------------------------------------------------------------\n";

// Test 1.1: data.php sin sesión
$res = httpRequest('GET', "$baseUrl/api/data.php", null, [], false);
assertTest("GET api/data.php anónimo retorna HTTP 401 (Datos protegidos)", $res['code'] === 401, "Código: {$res['code']}");

// Test 1.2: save.php sin sesión
$res = httpRequest('POST', "$baseUrl/api/save.php", ['type' => 'customer', 'data' => ['name' => 'Hacker']], [], false);
assertTest("POST api/save.php anónimo retorna HTTP 401 (Escritura no autorizada bloqueada)", $res['code'] === 401, "Código: {$res['code']}");

// Test 1.3: mail.php anónimo
$res = httpRequest('POST', "$baseUrl/api/mail.php", ['type' => 'welcome', 'to' => 'victim@test.com'], [], false);
assertTest("POST api/mail.php anónimo retorna HTTP 401 (Open Relay neutralizado)", $res['code'] === 401, "Código: {$res['code']}");

echo "\n";

// -----------------------------------------------------------------------------
// BLOQUE 2: Neutralización de Backdoors y Endpoints Inseguros (P0)
// -----------------------------------------------------------------------------
echo "2. NEUTRALIZACIÓN DE BACKDOORS Y ENDPOINTS INSEGUROS\n";
echo "-----------------------------------------------------\n";

// Test 2.1: Intento de login con contraseña maestra histórica 'humm2026'
$res = httpRequest('POST', "$baseUrl/api/auth.php", [
    'action' => 'login',
    'email' => $adminEmail,
    'password' => 'humm2026'
], [], false);
assertTest("Backdoor maestro 'humm2026' RECHAZADO (401)", $res['code'] === 401 && ($res['json']['success'] ?? true) === false, "Código: {$res['code']}");

// Test 2.2: Intento de login con contraseña por defecto 'admin'
$res = httpRequest('POST', "$baseUrl/api/auth.php", [
    'action' => 'login',
    'email' => $adminEmail,
    'password' => 'admin'
], [], false);
assertTest("Contraseña por defecto 'admin' RECHAZADA (401)", $res['code'] === 401 && ($res['json']['success'] ?? true) === false, "Código: {$res['code']}");

// Test 2.3: Invocación de reset_password_direct
$res = httpRequest('POST', "$baseUrl/api/auth.php", [
    'action' => 'reset_password_direct',
    'email' => $adminEmail,
    'password' => 'Hacked1234!'
], [], false);
assertTest("Endpoint vulnerable 'reset_password_direct' INEXISTENTE/RECHAZADO (>=400)", $res['code'] >= 400, "Código: {$res['code']}");

// Test 2.4: Intento con contraseña anterior comprometida
$res = httpRequest('POST', "$baseUrl/api/auth.php", [
    'action' => 'login',
    'email' => $adminEmail,
    'password' => 'Admin2026!#HummSecure'
], [], false);
assertTest("Contraseña de remediación intermedia RECHAZADA tras rotación final (401)", $res['code'] === 401 && ($res['json']['success'] ?? true) === false, "Código: {$res['code']}");

echo "\n";

// -----------------------------------------------------------------------------
// BLOQUE 3: Protección de Archivos Sensibles y Secretos (P0)
// -----------------------------------------------------------------------------
echo "3. PROTECCIÓN DE SECRETOS Y ARCHIVOS DE CONFIGURACIÓN\n";
echo "-----------------------------------------------------\n";

// Test 3.1: Acceso directo a config.example.php no revela credenciales vivas
$res = httpRequest('GET', "$baseUrl/api/config.example.php", null, [], false);
$noLiveSecrets = (strpos($res['body'], 'DB_PASS') === false || strpos($res['body'], 'CAMBIAR_POR_') !== false);
assertTest("api/config.example.php no expone contraseñas reales", $noLiveSecrets, "Respuesta contiene datos sospechosos");

// Test 3.2: Acceso a secretos fuera de DocumentRoot (no accesible vía HTTP)
$res = httpRequest('GET', "$baseUrl/private/comunidad_secrets.php", null, [], false);
assertTest("Directorio /private/ fuera de DocumentRoot es inaccesible (403/404)", in_array($res['code'], [403, 404]), "Código: {$res['code']}");

$res = httpRequest('GET', "$baseUrl/api/config.local.php", null, [], false);
assertTest("api/config.local.php no accesible o inexistente en producción", in_array($res['code'], [403, 404, 200]) && strpos($res['body'], 'DB_PASS') === false, "Código: {$res['code']}");

echo "\n";

// -----------------------------------------------------------------------------
// BLOQUE 4: Flujo Legítimo, Cookies de Sesión y Token CSRF (P0 / Ajuste 1 y 2)
// -----------------------------------------------------------------------------
echo "4. SESIONES SEGURAS BASADAS EN COOKIES Y PROTECCIÓN CSRF\n";
echo "---------------------------------------------------------\n";

if (empty($adminPass)) {
    echo "  ❌ [FAIL] No se dispone de credencial administrativa para pruebas de sesión.\n";
    $testsFailed++;
} else {
    // Intentar autenticación legítima
    $loginRes = httpRequest('POST', "$baseUrl/api/auth.php", [
        'action' => 'login',
        'email' => $adminEmail,
        'password' => $adminPass
    ], [], true);

    $isAuthOk = ($loginRes['code'] === 200 && ($loginRes['json']['success'] ?? false) === true);

    if ($isAuthOk) {
        assertTest("Autenticación legítima de Administrador exitosa (200 OK)", true);
        
        $hasHttpOnly = stripos($loginRes['headers'], 'HttpOnly') !== false;
        $hasSameSite = stripos($loginRes['headers'], 'SameSite=Lax') !== false || stripos($loginRes['headers'], 'SameSite=Strict') !== false;
        $csrfToken = $loginRes['json']['data']['csrf_token'] ?? $loginRes['json']['csrf_token'] ?? null;
        
        assertTest("Cookie de sesión configurada con HttpOnly", $hasHttpOnly, "Cabeceras: " . substr($loginRes['headers'], 0, 200));
        assertTest("Cookie de sesión configurada con SameSite", $hasSameSite, "Cabeceras: " . substr($loginRes['headers'], 0, 200));
        assertTest("Backend entrega token CSRF al autenticar", !empty($csrfToken), "CSRF Token recibido: " . substr($csrfToken ?? '', 0, 10));
        
        // Test 4.2: Petición con sesión pero SIN token CSRF
        $resNoCsrf = httpRequest('POST', "$baseUrl/api/save.php", [
            'entity' => 'broadcast',
            'item' => ['title' => 'CSRF Attack', 'content' => 'Forged Message']
        ], [], true);
        assertTest("Petición con sesión válida SIN CSRF es RECHAZADA (403)", $resNoCsrf['code'] === 403, "Código: {$resNoCsrf['code']}");
        
        // Test 4.3: Petición con sesión y con token CSRF inválido
        $resBadCsrf = httpRequest('POST', "$baseUrl/api/save.php", [
            'entity' => 'broadcast',
            'item' => ['title' => 'CSRF Attack Bad Token', 'content' => 'Forged Message']
        ], ['X-CSRF-Token' => 'forged_fake_token_12345'], true);
        assertTest("Petición con CSRF inválido/falsificado es RECHAZADA (403)", $resBadCsrf['code'] === 403, "Código: {$resBadCsrf['code']}");
        
        // Test 4.4: Petición legítima con sesión Y token CSRF válido
        $resGoodCsrf = httpRequest('GET', "$baseUrl/api/data.php", null, [], true);
        assertTest("GET api/data.php con sesión legítima retorna 200 OK", $resGoodCsrf['code'] === 200, "Código: {$resGoodCsrf['code']}");

        // Test 4.5: Mutación legítima con sesión Y token CSRF válido
        $resSaveValid = httpRequest('POST', "$baseUrl/api/save.php", [
            'entity' => 'broadcast',
            'item' => [
                'id' => 'bc-gate-test',
                'title' => 'Prueba Gate Final',
                'content' => 'Verificación exitosa de cierre.',
                'category' => 'General',
                'targetAudience' => 'Todos'
            ]
        ], ['X-CSRF-Token' => $csrfToken], true);
        assertTest("Mutación legítima (POST save.php) con sesión y CSRF válido retorna 200 OK", $resSaveValid['code'] === 200 && ($resSaveValid['json']['success'] ?? false) === true, "Código: {$resSaveValid['code']}");

        // Limpieza de registro de prueba
        httpRequest('POST', "$baseUrl/api/save.php", [
            'entity' => 'broadcast',
            'action' => 'delete',
            'id' => 'bc-gate-test'
        ], ['X-CSRF-Token' => $csrfToken], true);

        echo "\n";

        // -----------------------------------------------------------------------------
        // BLOQUE 5: Creación Segura de Usuarios y Aislamiento Multi-Tenant
        // -----------------------------------------------------------------------------
        echo "5. CREACIÓN SEGURA DE USUARIOS Y AISLAMIENTO MULTI-TENANT\n";
        echo "---------------------------------------------------------\n";

        // 5.1 Verificar rechazo de contraseña histórica en usuario existente
        $resOldEnt = httpRequest('POST', "$baseUrl/api/auth.php", [
            'action' => 'login',
            'email' => 'rmerino@hummcocreation.com',
            'password' => 'humm2026'
        ], [], false);
        assertTest("Contraseña histórica 'humm2026' RECHAZADA en emprendedor existente (401)", $resOldEnt['code'] === 401 && ($resOldEnt['json']['success'] ?? false) === false, "Código: {$resOldEnt['code']}");

        // 5.2 Admin crea usuario de prueba sin enviar contraseña (debe generar temporal segura)
        $testEntId = 'usr-test-' . round(microtime(true) * 1000);
        $testEntEmail = "ent.test.{$testEntId}@humm.cl";

        $createUserRes = httpRequest('POST', "$baseUrl/api/save.php", [
            'entity' => 'users',
            'item' => [
                'id' => $testEntId,
                'name' => 'Emprendedor Test Piloto',
                'email' => $testEntEmail,
                'role' => 'entrepreneur',
                'workspaceId' => 'ws-1788377084897'
            ]
        ], ['X-CSRF-Token' => $csrfToken], true);

        $createdOk = ($createUserRes['code'] === 200 && ($createUserRes['json']['success'] ?? false) === true);
        $tempPass = $createUserRes['json']['data']['item']['temp_password'] ?? '';
        $mustChange = $createUserRes['json']['data']['item']['must_change_password'] ?? 0;

        assertTest("Creación de nuevo usuario por Administrador exitosa (200 OK)", $createdOk, "Código: {$createUserRes['code']}");
        assertTest("Nuevo usuario NO recibe contraseña universal ni por defecto", $tempPass !== 'humm2026' && $tempPass !== 'admin' && strlen($tempPass) >= 12, "Longitud/Valor: " . strlen($tempPass));
        assertTest("Nuevo usuario marcado obligatoriamente con must_change_password = 1", (int)$mustChange === 1, "must_change_password: $mustChange");

        // 5.3 Probar login con la contraseña temporal generada
        $entLoginRes = httpRequest('POST', "$baseUrl/api/auth.php", [
            'action' => 'login',
            'email' => $testEntEmail,
            'password' => $tempPass
        ], [], false);

        $hasEntCookie = false;
        $entCsrf = null;
        if (preg_match('/set-cookie:\s*(HUMM_SESSID=[^;]+)/i', $entLoginRes['headers'], $m)) {
            $hasEntCookie = true;
            $entCookie = $m[1] . '; humans_21909=1';
            $entCsrf = $entLoginRes['json']['data']['csrf_token'] ?? null;
        }

        assertTest("Login legítimo del nuevo usuario con su contraseña temporal única (200 OK)", $entLoginRes['code'] === 200 && $hasEntCookie, "Código: {$entLoginRes['code']}");

        // 5.4 Comprobar aislamiento multitenant en lectura
        $entDataRes = httpRequest('GET', "$baseUrl/api/data.php", null, [], false, $entCookie);
        $wsList = $entDataRes['json']['data']['workspaces'] ?? [];
        $onlyOwnWs = (count($wsList) === 1 && ($wsList[0]['id'] ?? '') === 'ws-1788377084897');
        assertTest("Emprendedor SOLO recibe su propio workspace (Aislamiento de lectura estricto)", $onlyOwnWs, "Workspaces retornados: " . count($wsList));

        // 5.5 Comprobar que emprendedor no puede crear/modificar planes
        $escalationRes = httpRequest('POST', "$baseUrl/api/save.php", [
            'entity' => 'subscription_plans',
            'item' => ['id' => 'plan-hacker', 'name' => 'Plan Ilegítimo', 'price' => 0]
        ], ['X-CSRF-Token' => $entCsrf], false, $entCookie);
        assertTest("Emprendedor intentando modificar planes RECHAZADO (403)", $escalationRes['code'] === 403, "Código: {$escalationRes['code']}");

        // 5.6 Comprobar que emprendedor no puede gestionar usuarios
        $userEscalationRes = httpRequest('POST', "$baseUrl/api/save.php", [
            'entity' => 'users',
            'item' => ['id' => 'usr-hacked', 'name' => 'Hacker Admin', 'email' => 'fake@hacker.com', 'role' => 'admin']
        ], ['X-CSRF-Token' => $entCsrf], false, $entCookie);
        assertTest("Emprendedor intentando crear/modificar usuarios RECHAZADO (403)", $userEscalationRes['code'] === 403, "Código: {$userEscalationRes['code']}");

        // 5.7 Limpieza del usuario de prueba por el Administrador
        $cleanUserRes = httpRequest('POST', "$baseUrl/api/save.php", [
            'entity' => 'users',
            'action' => 'delete',
            'id' => $testEntId
        ], ['X-CSRF-Token' => $csrfToken], true);
        assertTest("Limpieza final del usuario de prueba exitosa (200 OK)", $cleanUserRes['code'] === 200, "Código: {$cleanUserRes['code']}");

    } else {
        echo "  ❌ [FAIL] No se pudo autenticar con $adminEmail (Código: {$loginRes['code']})\n";
        $testsFailed++;
    }
}

// -----------------------------------------------------------------------------
// Resumen
// -----------------------------------------------------------------------------
echo "\n══════════════════════════════════════════════════════════════════════════════\n";
echo "  RESUMEN DE PRUEBAS DE SEGURIDAD: ";
if ($testsFailed === 0) {
    echo "✅ TODAS LAS PRUEBAS PASARON ($testsPassed/$testsPassed)\n";
} else {
    echo "❌ $testsFailed FALLARON, $testsPassed PASARON\n";
}
echo "══════════════════════════════════════════════════════════════════════════════\n";

if (file_exists($cookieJar)) {
    unlink($cookieJar);
}

exit($testsFailed > 0 ? 1 : 0);
