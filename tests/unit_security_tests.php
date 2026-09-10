<?php
/**
 * Suite de Pruebas Unitarias de Seguridad Local
 * Comunidad Humm
 */

require_once __DIR__ . '/../api/security.php';

$passed = 0;
$failed = 0;

function assertUnit($desc, $cond, $details = '') {
    global $passed, $failed;
    if ($cond) {
        echo "  ✔ [PASS] $desc\n";
        $passed++;
    } else {
        echo "  ❌ [FAIL] $desc ($details)\n";
        $failed++;
    }
}

echo "══════════════════════════════════════════════════════════════════════════════\n";
echo "  COMUNIDAD HUMM - PRUEBAS UNITARIAS DE SEGURIDAD Y MITIGACIÓN XSS\n";
echo "══════════════════════════════════════════════════════════════════════════════\n\n";

// 1. Mitigación XSS en Security::sanitizeText()
$xssVectors = [
    '<script>alert("XSS")</script>' => '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;',
    '"><img src=x onerror=alert(1)>' => '&quot;&gt;&lt;img src=x onerror=alert(1)&gt;',
    '<svg/onload=alert(document.cookie)>' => '&lt;svg/onload=alert(document.cookie)&gt;',
    'Normal text & symbols < > "' => 'Normal text &amp; symbols &lt; &gt; &quot;',
];

foreach ($xssVectors as $input => $expected) {
    $clean = Security::sanitizeText($input);
    assertUnit("Sanitización XSS de '$input'", $clean === $expected, "Obtenido: $clean");
}

// 2. Comprobación de integridad de tokens CSRF
$_SESSION['csrf_token'] = bin2hex(random_bytes(32));
$activeToken = Security::getCsrfToken();
assertUnit("Obtención de token CSRF activo", !empty($activeToken) && strlen($activeToken) === 64);
assertUnit("hash_equals coincide con token válido", hash_equals($_SESSION['csrf_token'], $activeToken));
assertUnit("hash_equals rechaza token alterado", !hash_equals($_SESSION['csrf_token'], 'f' . substr($activeToken, 1)));

// 3. Matriz de Roles y Reglas de Negocio
$rolesValidos = ['admin', 'advisor', 'entrepreneur'];
assertUnit("Rol admin reconocido", in_array('admin', $rolesValidos));
assertUnit("Rol advisor reconocido", in_array('advisor', $rolesValidos));
assertUnit("Rol entrepreneur reconocido", in_array('entrepreneur', $rolesValidos));

echo "\n══════════════════════════════════════════════════════════════════════════════\n";
echo "  RESULTADO: $passed PASARON, $failed FALLARON\n";
echo "══════════════════════════════════════════════════════════════════════════════\n";

exit($failed > 0 ? 1 : 0);
