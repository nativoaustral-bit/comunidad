# INFORME HUMM REMEDIATION GATE — COMUNIDAD HUMM

**Fecha de Evaluación:** 10 de Septiembre de 2026  
**Entorno Evaluado:** Producción (`https://comunidad.humm.cl`)  
**Infraestructura:** HostGator cPanel Shared Hosting — PHP 8.3 (cli/fpm) — MySQL 8 / InnoDB  
**Tipo de Evaluación:** Auditoría Técnica Adversarial, Verificación de Remediación y Gate Operacional  
**Repositorio:** `nativoaustral-bit/comunidad` (Commit: `f03fa2d`)  

---

## 1. RESUMEN EJECUTIVO Y VEREDICTO FINAL

Tras la auditoría inicial **HUMM RELEASE GATE v2** (cuyo dictamen fue **🔴 NO APTO PARA PILOTO** debido a la exposición de credenciales en DocumentRoot, backdoors maestros, ausencia de autenticación server-side en endpoints clave y carencia de aislamiento multi-tenant), se ejecutó el **Plan de Remediación Técnica Aprobado con Ajustes Obligatorios**.

La remediación se ejecutó respetando estrictamente las restricciones de negocio y operacionales:
* **Sin migración de infraestructura:** Se mantuvo HostGator cPanel + PHP 8 + MySQL InnoDB.
* **Sin cambio de framework ni agregación de microservicios ni Redis.**
* **Sin incorporación de nuevas funcionalidades ni onboarding de usuarios adicionales.**

### Veredicto del Gate de Remediación:

```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│                🟢 APTO PARA PILOTO CONTROLADO                         │
│                                                                        │
│   Todas las vulnerabilidades P0 han sido neutralizadas y verificadas   │
│   directamente contra https://comunidad.humm.cl.                       │
│   Suite adversarial: 21 de 21 pruebas superadas (100% PASS).          │
│   Continuidad comprobada con respaldo off-site y restauración real.    │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. CUMPLIMIENTO DETALLADO DE LOS 6 AJUSTES OBLIGATORIOS

### 2.1. Ajuste 1 — Sesiones Server-Side Exclusivamente Mediante Cookies PHP Seguras
* **Implementación:** Se construyó la capa centralizada `api/security.php` que inicializa y gestiona sesiones nativas PHP (`session_start()`) bajo la cookie `HUMM_SESSID`.
* **Atributos de la Cookie:**
  * `HttpOnly = true`: Inaccesible desde JavaScript (`document.cookie`), mitigando robo de sesión por XSS.
  * `Secure = true`: Transmitida exclusivamente bajo HTTPS (HSTS configurado con `max-age=31536000`).
  * `SameSite = Lax`: Prevención de transmisión en contextos cruzados no confiables.
  * `session.use_strict_mode = 1`: El servidor rechaza identificadores de sesión no inicializados por él mismo.
  * `session.use_only_cookies = 1`: Se bloquea el paso de identificador de sesión vía GET/URL.
* **Ciclo de Vida y Regeneración:**
  * Al autenticar exitosamente en `api/auth.php`, se ejecuta `session_regenerate_id(true)` para evitar ataques de fijación de sesión (*session fixation*).
  * Expiración por inactividad calculada estrictamente en el backend: **60 minutos para rol `admin`** y **120 minutos para usuarios regulares**.
  * Eliminación total del soporte `Authorization: Bearer <sessionId>` para la SPA web.
  * La SPA nunca almacena tokens de sesión en `localStorage` ni `sessionStorage`. El cierre de sesión (`action=logout`) destruye la sesión server-side, borra la cookie en el cliente mediante expiración negativa y limpia la memoria local con `store.clearAllUserData()`.

### 2.2. Ajuste 2 — Protección CSRF Obligatoria para Todas las Mutaciones de Estado
* **Implementación:**
  * Al inicializar la sesión server-side, se genera un token criptográfico seguro: `$_SESSION['csrf_token'] = bin2hex(random_bytes(32))`.
  * El token se suministra al cliente al momento de login o verificación de sesión.
  * La función `Security::validateCsrfToken()` intercepta obligatoriamente toda petición `POST`, `PUT` o `DELETE` en `api/save.php`, `api/auth.php` y `api/mail.php`.
  * La validación utiliza comparación de tiempo constante `hash_equals($_SESSION['csrf_token'], $token)` contra la cabecera `X-CSRF-Token` o el payload JSON.
* **Comprobación:** Cualquier petición mutante autenticada que omita `X-CSRF-Token` o envíe un token falsificado es inmediatamente rechazada con **HTTP 403 Forbidden** (`Error de seguridad CSRF: token ausente o inválido`).

### 2.3. Ajuste 3 — Definición Formal del Rol `advisor` y Matriz RBAC Explícita
* **Regla de Negocio:** Un asesor (`advisor`) **NO** posee acceso global a todos los emprendimientos. Su visibilidad y capacidad operativa está limitada exclusivamente a los emprendimientos donde su correo coincide con el campo `advisor_email` de la tabla `workspaces`.
* **Validación Server-Side:** Se implementó `Security::requireWorkspaceAccess($pdo, $workspaceId)` tanto en `api/data.php` (lectura) como en `api/save.php` (escritura).
* **Matriz Formal de Control de Acceso (RBAC):**

| Operación / Recurso | Administrador (`admin`) | Asesor (`advisor`) | Emprendedor (`entrepreneur`) | Anónimo |
|---|:---:|:---:|:---:|:---:|
| **Consultar Catálogo de Herramientas** | ✅ Global | ✅ Global | ✅ Global | ❌ 401 |
| **Consultar Workspaces** | ✅ Todos (auditoría) | ⚠️ Solo asignados (`advisor_email`) | ⚠️ Solo su propio `workspace_id` | ❌ 401 |
| **Modificar Datos del Workspace** | ✅ Sí | ⚠️ Solo asignados | ⚠️ Solo su propio workspace | ❌ 401 |
| **Gestionar Clientes / Ventas / Tareas** | ✅ Sí | ⚠️ Solo en asignados | ⚠️ Solo en su propio workspace | ❌ 401 |
| **Eliminar Registros de Negocio** | ✅ Sí | ⚠️ Solo en asignados | ⚠️ Solo registros de su workspace | ❌ 401 |
| **Gestionar Usuarios del Sistema** | ✅ Total | ❌ 403 Forbidden | ❌ 403 Forbidden | ❌ 401 |
| **Gestionar Planes de Suscripción** | ✅ Total | ❌ 403 Forbidden | ❌ 403 Forbidden | ❌ 401 |
| **Publicar Comunicados Globales** | ✅ Total | ❌ 403 Forbidden | ❌ 403 Forbidden | ❌ 401 |
| **Disparar Correos Transaccionales** | ✅ Sí | ❌ 403 Forbidden | ❌ 403 Forbidden | ❌ 401 |

### 2.4. Ajuste 4 — Secretos Productivos Fuera del DocumentRoot y Rotación de Credenciales
* **Ubicación Fisiológica:** Los secretos se extrajeron físicamente de `/public_html/comunidad/api/` y se ubicaron en:
  `/home1/paulocis/private/comunidad_secrets.php`
  * Permisos del archivo: `0600` (lectura/escritura exclusiva del usuario del sistema `paulocis`).
  * Permisos del directorio `/home1/paulocis/private`: `0700` (inaccesible para Apache / `nobody` y usuarios web).
* **Limpieza de Repositorio:**
  * El archivo `api/config.php` solo contiene lógica de resolución y fallbacks vacíos.
  * Se generó y versionó `api/config.example.php` como plantilla sanitizada.
  * Se purgó `api/config.local.php` de producción y se incluyó en `.gitignore`.
* **Rotación Obligatoria de Credenciales:**
  * **Base de Datos:** Se creó un usuario MySQL dedicado `paulocis_mihumm` con una contraseña criptográfica aleatoria de 24 caracteres (`[a-zA-Z0-9_-#]`), asignando privilegios sobre `paulocis_humm_comunidad` y eliminando la dependencia del usuario compartido `paulocis_humm`.
  * **Clave de Aplicación:** Se rotó `APP_SECRET` generando un token criptográfico de 256 bits (`secrets.token_hex(32)`).
  * **Contraseña de Administrador:** Se neutralizó la contraseña histórica (`humm2026`) del usuario `contacto@humm.cl`, estableciendo un hash bcrypt (`$2y$10$`) para la nueva credencial segura (`Admin2026!#HummSecure`).

### 2.5. Ajuste 5 — Fortalecimiento de la Mitigación XSS
* **Refactorización Frontend:** Se eliminó la dependencia de inyección directa de cadenas sin escapar. En todas las vistas dinámicas (`customers.js`, `opportunities.js`, `tasks.js`, `sales.js`, `calendar.js`, `dashboard.js`, `admin.js`), los datos provistos por el usuario son tratados mediante:
  1. `textContent` para nodos de texto directos.
  2. `escapeHtml()` estricto con codificación de entidades HTML (`&`, `<`, `>`, `"`, `'`) antes de interpolar en plantillas literales.
* **Pruebas de Validación:** Se ejecutó `tests/unit_security_tests.php` validando la neutralización de los siguientes vectores:
  * `<script>alert("XSS")</script>` → `&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;` (Neutralizado)
  * `"><img src=x onerror=alert(1)>` → `&quot;&gt;&lt;img src=x onerror=alert(1)&gt;` (Neutralizado)
  * `<svg/onload=alert(document.cookie)>` → `&lt;svg/onload=alert(document.cookie)&gt;` (Neutralizado)

### 2.6. Ajuste 6 — Continuidad Operacional, Automatización de Backups y Restauración Real
Siguiendo la arquitectura probada en **ReLoop**:
1. **Script de Respaldo Local (`scripts/backup.sh`):**
   * Ubicado en `/home1/paulocis/scripts/backup.sh` (permisos `0700`).
   * Ejecuta `mysqldump` con flags transaccionales InnoDB: `--single-transaction --quick --no-tablespaces --routines --triggers`.
   * Comprime con `gzip -9` y genera checksum `sha256sum`.
   * Almacena en `/home1/paulocis/RESPALDOS/comunidad_backups/`.
   * Aplica política de retención automática de 14 días (`find ... -mtime +14 -delete`).
   * Configurado en crontab de HostGator para ejecución periódica:
     `15 * * * * /home1/paulocis/scripts/backup.sh >> /home1/paulocis/comunidad_backup_cron.log 2>&1`
2. **Copia Off-Site Periódica (`scripts/pull_offsite_backup.sh`):**
   * Sincroniza mediante `rsync` vía SSH (puerto 2222) hacia almacenamiento externo controlado por Humm (`/Users/rmerinog/PLATAFORMAS/RESPALDOS/comunidad_offsite/`).
   * Verifica automáticamente la integridad del archivo `.sql.gz` (`gunzip -t`) y el checksum SHA-256 de cada archivo descargado.
   * **Resultado de verificación real:** 2 respaldos sincronizados y verificados al 100% (`comunidad_backup_20260910_172100.sql.gz` y `comunidad_backup_20260910_173122.sql.gz`).
3. **Prueba de Restauración Real (`scripts/restore.sh`):**
   * Se creó una base de datos de prueba en cPanel: `paulocis_comunidad_test`.
   * Se ejecutó la restauración completa del respaldo generado en vivo.
   * **Resultados de integridad comprobados:**
     * Integridad física gzip: **VÁLIDA**.
     * Checksum SHA-256 (`b31095619f880f6c910c2cd3e137af4646a23e06b4f568a82947616086a66a74`): **COINCIDE**.
     * Tablas restauradas: **15 tablas creadas**.
     * Registros verificados: `users` = 4 registros, `workspaces` = 3 registros.
     * Conclusión de la prueba: **RESTAURACIÓN Y VERIFICACIÓN DE INTEGRIDAD SUPERADA**.

---

## 3. TABLA COMPARATIVA: ESTADO ANTES vs ESTADO DESPUÉS

Todas las comprobaciones del estado "DESPUÉS" fueron ejecutadas de forma adversarial directamente contra el endpoint en vivo `https://comunidad.humm.cl` mediante la suite automatizada `tests/security_tests.php`.

| ID | Vector / Prueba Adversarial | Estado ANTES (Gate v2) | Estado DESPUÉS (Remediation Gate) | Evidencia en Producción |
|:---:|:---|:---|:---|:---|
| **P0-1** | Volcado anónimo de datos (`GET api/data.php`) | **200 OK**<br>Dump global de base de datos sin login | **401 Unauthorized**<br>Acceso bloqueado en backend | `{"success":false,"error":"Acceso no autorizado. Sesión no activa."}` |
| **P0-2** | Escritura anónima (`POST api/save.php`) | **400 Bad Request**<br>Endpoint escuchaba peticiones anónimas | **401 Unauthorized**<br>Escritura bloqueada | `{"success":false,"error":"Acceso no autorizado. Sesión no activa."}` |
| **P0-3** | Open Relay de correo (`POST api/mail.php` anónimo) | **200 OK / 409**<br>Permitía envío o activación sin sesión | **401 Unauthorized**<br>Envío anónimo neutralizado | `{"success":false,"error":"Acceso no autorizado. Sesión no activa."}` |
| **P0-4** | Backdoor maestro `humm2026` | **200 OK**<br>Login exitoso como admin sin clave real | **401 Unauthorized**<br>Backdoor eliminado de código y BD | `{"success":false,"error":"Credenciales incorrectas. Verifica tus datos."}` |
| **P0-5** | Contraseña por defecto `admin` | **200 OK**<br>Login por omisión habilitado | **401 Unauthorized**<br>Bypass eliminado | `{"success":false,"error":"Credenciales incorrectas. Verifica tus datos."}` |
| **P0-6** | Endpoint `reset_password_direct` | **Vulnerable**<br>Cualquiera cambiaba claves sin token | **400 / 404**<br>Endpoint eliminado | `{"success":false,"error":"Acción no válida o no permitida."}` |
| **P0-7** | Exposición de secretos en DocumentRoot | **Crítico**<br>Credenciales en `public_html/api/config.php` | **Protegido**<br>Secretos en `/home1/paulocis/private/` (0600) | `HTTP 403/404` en `/private/` y `config.example.php` sanitizado |
| **P0-8** | Petición mutante con sesión pero SIN CSRF | **Inexistente**<br>No había validación CSRF | **403 Forbidden**<br>Rechazo obligatorio | `{"success":false,"error":"Error de seguridad CSRF: token ausente o inválido."}` |
| **P0-9** | Petición mutante con CSRF falsificado | **Inexistente** | **403 Forbidden**<br>Comparación `hash_equals` rechaza token | `{"success":false,"error":"Error de seguridad CSRF: token ausente o inválido."}` |
| **P0-10**| Lectura cruzada entre workspaces | **Vulnerable**<br>Parámetro cliente permitía ver otros datos | **Aislado**<br>Emprendedor solo recibe su propio workspace | Query forzada server-side a `$_SESSION['workspace_id']` |
| **P0-11**| Escalación de privilegios de emprendedor | **Vulnerable**<br>Cualquier usuario guardaba planes y roles | **403 Forbidden**<br>Control RBAC en backend | `{"success":false,"error":"Acceso denegado: permisos insuficientes para esta operación."}` |
| **P0-12**| Atributos de Cookie de Sesión | **LocalStorage**<br>Token manipulable por JS | **HttpOnly + Secure + SameSite=Lax** | Cabecera `Set-Cookie: HUMM_SESSID=...; path=/; secure; HttpOnly; SameSite=Lax` |
| **P0-13**| Mitigación XSS en Frontend | **Artesanal / Frágil**<br>Interpolaciones en `innerHTML` | **Robusta**<br>`textContent` + `escapeHtml()` contextual | 10/10 pruebas unitarias con payloads complejos pasadas |
| **P0-14**| Continuidad Operacional (Backups) | **Manual / Inexistente**<br>Sin cron ni copia externa | **Automatizado**<br>Cron horario + réplica off-site | Verificación SHA-256 e importación exitosa en base de prueba |
| **P0-15**| Flujo Legítimo de Usuario | **Inestable** | **200 OK**<br>Login, sesiones, CSRF y guardado 100% operativos | Mutación legítima verificada con código 200 en producción |

---

## 4. RESULTADO DE LA EJECUCIÓN ADVERSARIAL EN VIVO

Ejecución de la suite permanente contra `https://comunidad.humm.cl`:

```text
══════════════════════════════════════════════════════════════════════════════
  COMUNIDAD HUMM - SUITE DE PRUEBAS ADVERSARIALES Y SEGURIDAD
  Objetivo: https://comunidad.humm.cl
  Fecha: 2026-09-10 22:46:43
══════════════════════════════════════════════════════════════════════════════

1. VERIFICACIÓN DE CONTROL DE ACCESO ANÓNIMO (401 Esperado)
------------------------------------------------------------
  ✔ [PASS] GET api/data.php anónimo retorna HTTP 401 (Datos protegidos)
  ✔ [PASS] POST api/save.php anónimo retorna HTTP 401 (Escritura no autorizada bloqueada)
  ✔ [PASS] POST api/mail.php anónimo retorna HTTP 401 (Open Relay neutralizado)

2. NEUTRALIZACIÓN DE BACKDOORS Y ENDPOINTS INSEGUROS
-----------------------------------------------------
  ✔ [PASS] Backdoor maestro 'humm2026' RECHAZADO (401)
  ✔ [PASS] Contraseña por defecto 'admin' RECHAZADA (401)
  ✔ [PASS] Endpoint vulnerable 'reset_password_direct' INEXISTENTE/RECHAZADO (>=400)

3. PROTECCIÓN DE SECRETOS Y ARCHIVOS DE CONFIGURACIÓN
-----------------------------------------------------
  ✔ [PASS] api/config.example.php no expone contraseñas reales
  ✔ [PASS] Directorio /private/ fuera de DocumentRoot es inaccesible (403/404)
  ✔ [PASS] api/config.local.php no accesible o inexistente en producción

4. SESIONES SEGURAS BASADAS EN COOKIES Y PROTECCIÓN CSRF
---------------------------------------------------------
  ✔ [PASS] Autenticación legítima exitosa con nueva contraseña rotada (200 OK)
  ✔ [PASS] Cookie de sesión configurada con HttpOnly
  ✔ [PASS] Cookie de sesión configurada con SameSite
  ✔ [PASS] Backend entrega token CSRF al autenticar
  ✔ [PASS] Petición con sesión válida SIN CSRF es RECHAZADA (403)
  ✔ [PASS] Petición con CSRF inválido/falsificado es RECHAZADA (403)
  ✔ [PASS] GET api/data.php con sesión legítima retorna 200 OK
  ✔ [PASS] Mutación legítima (POST save.php) con sesión y CSRF válido retorna 200 OK

5. AISLAMIENTO MULTI-TENANT Y PREVENCIÓN DE ESCALACIÓN DE PRIVILEGIOS
--------------------------------------------------------------------
  ✔ [PASS] Autenticación legítima de Emprendedor exitosa
  ✔ [PASS] Emprendedor SOLO recibe su propio workspace (Aislamiento de lectura estricto)
  ✔ [PASS] Emprendedor intentando modificar entidades de administración RECHAZADO (403)
  ✔ [PASS] Emprendedor intentando crear/modificar usuario con rol admin RECHAZADO (403)

══════════════════════════════════════════════════════════════════════════════
  RESUMEN DE PRUEBAS DE SEGURIDAD: ✅ TODAS LAS PRUEBAS PASARON (21/21)
══════════════════════════════════════════════════════════════════════════════
```

---

## 5. CONDICIONES OPERACIONALES ESTRICTAS PARA EL PILOTO CONTROLADO

El veredicto **🟢 APTO PARA PILOTO CONTROLADO** es válido únicamente bajo el estricto cumplimiento de las siguientes directrices operacionales:

1. **No liberar usuarios adicionales ni apertura pública:** El piloto debe restringirse exclusivamente a los emprendedores actualmente registrados en la plataforma. No se debe habilitar autorregistro abierto sin supervisión.
2. **Monitoreo diario de respaldos off-site:** Ejecutar periódicamente `./scripts/pull_offsite_backup.sh` desde el nodo de almacenamiento externo y vigilar el log horario `/home1/paulocis/comunidad_backup_cron.log`.
3. **No realizar modificaciones de código en producción:** Todo cambio futuro debe pasar por el flujo local, validación de sintaxis (`php -l`), ejecución de `tests/unit_security_tests.php` y despliegue a través de `deploy.sh`.
4. **Conservar secretos aislados:** Nunca crear `config.local.php` en el DocumentRoot de HostGator ni subir archivos `.env` o respaldos `.sql.gz` a la carpeta pública.
5. **No introducir dependencias complejas:** Mantener la arquitectura monolítica simple, robusta y eficiente sobre HostGator + PHP 8 + MySQL InnoDB.

---

**Auditoría y Certificación Técnica Finalizada.**  
*Equipo de Auditoría y Seguridad Antigravity — Humm Co-Creation.*
