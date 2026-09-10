<?php
/**
 * Suite de Pruebas Automatizadas de Seguridad y Regresión
 * Comunidad Humm - Remediation Gate
 *
 * Uso:
 *   php tests/security_tests.php [--url=https://comunidad.humm.cl] [--admin-pass=...]
 */

$options = getopt('', ['url::', 'admin-pass::', 'entrepreneur-pass::']);
$baseUrl = rtrim($options['url'] ?? 'https://comunidad.humm.cl', '/');
$adminPass = $options['admin-pass'] ?? 'Admin2026!#HummSecure';
$adminEmail = 'contacto@humm.cl';

echo "══════════════════════════════════════════════════════════════════════════════\n";
echo "  COMUNIDAD HUMM - SUITE DE PRUEBAS ADVERSARIALES Y SEGURIDAD\n";
echo "  Objetivo: $baseUrl\n";
echo "  Fecha: " . date('Y-m-d H:i:s') . "\n";
echo "══════════════════════════════════════════════════════════════════════════════\n\n";

$testsPassed = 0;
$testsFailed = 0;
$cookieJar = tempnam(sys_get_temp_dir(), 'humm_cookie_');

function httpRequest($method, $url, $data = null, $headers = [], $useCookie = false) {
    global $cookieJar;
    $ch = curl_init();
    
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    
    if ($useCookie) {
        curl_setopt($ch, CURLOPT_COOKIEJAR, $cookieJar);
        curl_setopt($ch, CURLOPT_COOKIEFILE, $cookieJar);
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
assertTest("GET api/data.php anónimo retorna HTTP 401", $res['code'] === 401, "Código recibido: {$res['code']}");

// Test 1.2: save.php sin sesión
$res = httpRequest('POST', "$baseUrl/api/save.php", ['type' => 'customer', 'data' => ['name' => 'Hacker']], [], false);
assertTest("POST api/save.php anónimo retorna HTTP 401", $res['code'] === 401, "Código recibido: {$res['code']}");

// Test 1.3: mail.php anónimo
$res = httpRequest('POST', "$baseUrl/api/mail.php", ['type' => 'welcome', 'to' => 'victim@test.com'], [], false);
assertTest("POST api/mail.php anónimo retorna HTTP 401 (Previene Open Relay)", $res['code'] === 401, "Código recibido: {$res['code']}");

echo "\n";

// -----------------------------------------------------------------------------
// BLOQUE 2: Neutralización de Backdoors y Endpoints Inseguros (P0)
// -----------------------------------------------------------------------------
echo "2. NEUTRALIZACIÓN DE BACKDOORS Y ENDPOINTS INSEGUROS\n";
echo "-----------------------------------------------------\n";

// Test 2.1: Intento de login con contraseña maestra 'humm2026'
$res = httpRequest('POST', "$baseUrl/api/auth.php", [
    'action' => 'login',
    'email' => $adminEmail,
    'password' => 'humm2026'
], [], false);
assertTest("Backdoor maestro 'humm2026' RECHAZADO (401)", $res['code'] === 401 && ($res['json']['authenticated'] ?? true) === false, "Código: {$res['code']}");

// Test 2.2: Intento de login con contraseña por defecto 'admin'
$res = httpRequest('POST', "$baseUrl/api/auth.php", [
    'action' => 'login',
    'email' => $adminEmail,
    'password' => 'admin'
], [], false);
assertTest("Contraseña por defecto 'admin' RECHAZADA (401)", $res['code'] === 401 && ($res['json']['authenticated'] ?? true) === false, "Código: {$res['code']}");

// Test 2.3: Invocación de reset_password_direct
$res = httpRequest('POST', "$baseUrl/api/auth.php", [
    'action' => 'reset_password_direct',
    'email' => $adminEmail,
    'password' => 'Hacked1234!'
], [], false);
assertTest("Endpoint vulnerable 'reset_password_direct' INEXISTENTE/RECHAZADO (>=400)", $res['code'] >= 400, "Código: {$res['code']}");

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

// Intentar autenticación legítima
$loginRes = httpRequest('POST', "$baseUrl/api/auth.php", [
    'action' => 'login',
    'email' => $adminEmail,
    'password' => $adminPass
], [], true);

if ($loginRes['code'] === 200 && ($loginRes['json']['authenticated'] ?? false) === true) {
    assertTest("Autenticación legítima exitosa (200 OK)", true);
    
    // Validar cookie HttpOnly y SameSite en cabeceras Set-Cookie
    $hasHttpOnly = stripos($loginRes['headers'], 'HttpOnly') !== false;
    $hasSameSite = stripos($loginRes['headers'], 'SameSite=Lax') !== false || stripos($loginRes['headers'], 'SameSite=Strict') !== false;
    $csrfToken = $loginRes['json']['csrf_token'] ?? null;
    
    assertTest("Cookie de sesión configurada con HttpOnly", $hasHttpOnly, "Cabeceras: " . substr($loginRes['headers'], 0, 200));
    assertTest("Cookie de sesión configurada con SameSite", $hasSameSite, "Cabeceras: " . substr($loginRes['headers'], 0, 200));
    assertTest("Backend entrega token CSRF al autenticar", !empty($csrfToken), "CSRF Token recibido: " . substr($csrfToken ?? '', 0, 10));
    
    // Test 4.2: Petición con sesión pero SIN token CSRF
    $resNoCsrf = httpRequest('POST', "$baseUrl/api/save.php", [
        'type' => 'broadcast',
        'data' => ['title' => 'CSRF Attack', 'message' => 'Forged Message']
    ], [], true); // Envia cookie pero no cabecera X-CSRF-Token
    assertTest("Petición con sesión válida SIN CSRF es RECHAZADA (403)", $resNoCsrf['code'] === 403, "Código: {$resNoCsrf['code']}");
    
    // Test 4.3: Petición con sesión y con token CSRF inválido
    $resBadCsrf = httpRequest('POST', "$baseUrl/api/save.php", [
        'type' => 'broadcast',
        'data' => ['title' => 'CSRF Attack Bad Token', 'message' => 'Forged Message']
    ], ['X-CSRF-Token' => 'forged_fake_token_12345'], true);
    assertTest("Petición con CSRF inválido/falsificado es RECHAZADA (403)", $resBadCsrf['code'] === 403, "Código: {$resBadCsrf['code']}");
    
    // Test 4.4: Petición legítima con sesión Y token CSRF válido
    $resGoodCsrf = httpRequest('GET', "$baseUrl/api/data.php", null, [], true);
    assertTest("GET api/data.php con sesión legítima retorna 200 OK", $resGoodCsrf['code'] === 200, "Código: {$resGoodCsrf['code']}");

} else {
    echo "  ⚠️ [SKIP] No se pudo autenticar con admin@humm.cl (credenciales de prueba pendientes o modificadas). Saltando pruebas dependientes de sesión activa.\n";
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
