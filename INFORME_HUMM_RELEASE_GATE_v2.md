# INFORME HUMM RELEASE GATE v2

**Auditoría Técnica, Seguridad, Integridad y Preparación Operacional Proporcional al Estado del Producto**  
**Fecha:** 10 de Septiembre de 2026  
**Equipo Auditor:** Auditoría Técnica Independiente Humm (Arquitectura, AppSec, Backend, Frontend, DB, SRE, QA, BCP y Privacidad)

---

## 1. IDENTIFICACIÓN Y ALCANCE

| Parámetro | Detalle |
| :--- | :--- |
| **Aplicación** | Comunidad Humm Co-Creation (`Mi Humm`) |
| **Finalidad** | Plataforma de gestión comercial, CRM, ventas, productividad, alianzas y administración para emprendedores de la red Humm. |
| **Repositorio** | [nativoaustral-bit/comunidad](https://github.com/nativoaustral-bit/comunidad.git) |
| **Entornos Evaluados** | **LOCAL** (código fuente estático), **GITHUB** (repositorio y flujos CI/CD) y **SERVIDOR REAL** ([https://comunidad.humm.cl](https://comunidad.humm.cl)) |
| **Infraestructura Real** | HostGator cPanel, Apache 2.4, PHP 8.x, MySQL/MariaDB (InnoDB `paulocis_humm_comunidad`), SMTP `comunidad@humm.cl` |

---

## 2. ETAPA DEL PRODUCTO

De acuerdo con el Principio Fundamental Humm y el análisis del repositorio y base de datos activa:

### **CLASIFICACIÓN: ETAPA A — MVP / PILOTO CONTROLADO**

* **Justificación técnica:** La base de datos en producción registra actualmente **4 usuarios**, **3 espacios de emprendimiento** (*workspaces*) y **15 registros de ventas**. No existe tracción masiva ni volumen transaccional abierto al público general.
* **Criterio de Evaluación:**  
  > *¿Puede utilizarse responsablemente con los primeros usuarios reales bajo supervisión directa de Humm?*

---

## 3. PERFIL DE COMPLEJIDAD DE LA APLICACIÓN

| Dimensión | Nivel | Justificación Técnica |
| :--- | :---: | :--- |
| **Autenticación y Roles** | **MEDIA** | 3 roles definidos (`admin`, `advisor`, `entrepreneur`), flujo de recuperación de clave, cambio de contraseña y control de inactividad en frontend. |
| **Multitenancy y Aislamiento** | **ALTA** | Múltiples emprendimientos independientes compartiendo el mismo esquema relacional; cada negocio gestiona sus propios clientes, ventas privadas, notas, tareas y calendario. |
| **Integridad y Datos Críticos** | **MEDIA-ALTA** | Datos financieros de ventas, cartera CRM de clientes con RUT, teléfonos y direcciones, compromisos de agenda y acuerdos de comisiones/beneficios difíciles de reconstruir manualmente. |
| **Transacciones y Pagos** | **BAJA-MEDIA** | Sin pasarela server-side directa integrada (Webpay/Stripe); se opera con links de pago externos enviados por WhatsApp y actualización administrativa de estados. |
| **Servicios y Comunicaciones** | **MEDIA** | Integración socket SMTP SSL en puerto 465 autenticado para despacho de bienvenidas y alertas transaccionales. |
| **Infraestructura y Procesos** | **BAJA** | Hosting compartido HostGator cPanel, sin colas de trabajo, sin workers asíncronos ni balanceadores. Despliegue mediante script rsync/SSH y GitHub Actions. |
| **COMPLEJIDAD GLOBAL** | **MEDIA** | Requiere estricto aislamiento entre emprendimientos y protección de credenciales, pero con arquitectura simplificada. |

---

## 4. VEREDICTO HUMM RELEASE GATE v2

---

# 🔴 NO APTO PARA PILOTO

---

### Dictamen del Equipo Auditor:
La plataforma **NO PUEDE SER LIBERADA NI UTILIZADA CON USUARIOS REALES** en su estado actual, ni siquiera bajo un piloto estrechamente supervisado. 

A pesar de contar con una interfaz de usuario visualmente atractiva, estructuración CSS modular y un modelo de datos MySQL normalizado con InnoDB, la auditoría descubrió **múltiples vulnerabilidades críticas inmediatas (P0)** comprobadas directamente en el servidor real:

1. **Fuga masiva y acceso irrestricto a los datos de todos los emprendimientos y usuarios** mediante una simple consulta HTTP pública sin autenticación ni token.
2. **Capacidad de cualquier usuario anónimo de internet de modificar, inyectar o eliminar cualquier registro** (incluyendo clientes, ventas, usuarios y administradores) a través del endpoint de guardado.
3. **Backdoors de acceso universal en el sistema de login** que permiten tomar el control de cualquier cuenta usando contraseñas maestras cableadas que reescriben los hashes en la base de datos.
4. **Endpoint de reseteo directo de contraseña sin verificación ni token** que permite cambiar la clave de cualquier cuenta (incluyendo al Administrador de Humm) en un solo request HTTP.
5. **Exposición pública de credenciales maestras de la base de datos y correo institucional en el repositorio de GitHub**.
6. **Ausencia total de copias de seguridad automatizadas** en el servidor de producción existiendo datos reales.

---

## 5. RESUMEN EJECUTIVO DE HALLAZGOS

```
┌─────────────────────────────────────────────────────────────┐
│                   RESUMEN DE HALLAZGOS                      │
├──────────────────────────────┬──────────────────────────────┤
│  P0 (Bloquean Etapa Actual)  │  6 hallazgos críticos        │
│  P1 (Corregir Preferente)    │  6 hallazgos relevantes      │
│  DT (Deuda Técnica Aceptada) │  5 condiciones aceptadas     │
│  ESC (Escalamiento Futuro)   │  4 requerimientos futuros    │
└──────────────────────────────┴──────────────────────────────┘
```

* **Riesgo Inmediato de Pérdida de Datos:** **CRÍTICO**. Cualquier usuario o actor externo puede invocar `api/save.php?action=delete` sin autenticación y purgar la base de datos. No existen backups automatizados ni snapshots.
* **Aislamiento Multitenant:** **FALLA CRÍTICA (P0)**. No existe verificación de autorización en el backend. Un emprendedor puede ver y manipular clientes y ventas de los demás negocios.
* **Autenticación y Cuentas:** **FALLA CRÍTICA (P0)**. La contraseña de cualquier cuenta se puede alterar directamente y el mecanismo de sesión no es validado en el servidor.
* **Secretos y Seguridad DevSecOps:** **FALLA CRÍTICA (P0)**. Claves de MySQL y SMTP expuestas en el código versionado en GitHub.
* **Pruebas Automatizadas:** **INEXISTENTES (0% cobertura)**.

---

## 6. MATRIZ DE EVALUACIÓN DE CONTROLES

| Dimensión de Control | Estado | Justificación Resumida |
| :--- | :---: | :--- |
| **Arquitectura General** | **APROBADO** | SPA Vanilla ES6 + PHP 8 microservicios livianos; adecuada y proporcional para MVP. |
| **Autenticación Backend** | **FALLA** | Backdoor universal en login (`api/auth.php`) y reseteo sin token (`reset_password_direct`). |
| **Manejo de Sesiones** | **FALLA** | Sesiones basadas únicamente en LocalStorage; el token generado no se valida en API. |
| **Autorización Backend** | **FALLA** | Ningún endpoint (`data.php`, `save.php`, `mail.php`) verifica el rol o identidad del emisor. |
| **Aislamiento Multitenant** | **FALLA** | Se puede consultar y alterar cualquier `workspace_id` desde querystring o JSON público. |
| **Integridad de Datos (BD)** | **DEUDA TÉCNICA ACEPTADA** | Esquema MySQL InnoDB con Foreign Keys correctas; falta uso explícito de transacciones ACID. |
| **Base de Datos y Concurrencia** | **APROBADO** | MySQL InnoDB en HostGator con row-level locking; adecuado para la etapa piloto. |
| **Backups Automatizados** | **FALLA** | Inexistentes. Solo se cuenta con instrucciones manuales vía phpMyAdmin. |
| **Restauración Comprobada** | **NO VERIFICADO** | No se ha ejecutado un simulacro de recuperación ante desastre en el hosting. |
| **Seguridad de Entradas (SQLi)** | **APROBADO** | Sentencias preparadas PDO parametrizadas con `PDO::ATTR_EMULATE_PREPARES => false`. |
| **Seguridad Frontend (XSS)** | **FALLA** | Múltiples interpolaciones directas en `innerHTML` sin escapar (`customers.js`, `sales.js`, etc.). |
| **Control de Archivos / Uploads** | **NO APLICA** | No hay subida de archivos binarios al disco del servidor; se manejan Data URLs base64. |
| **Gestión de Secretos** | **FALLA** | Contraseña de BD y SMTP cableadas en `api/config.php` y comiteadas en GitHub público. |
| **Configuración Web y Headers** | **FALLA** | Sin headers HSTS, X-Content-Type-Options ni CSP. CORS configurado en `*` irrestricto. |
| **Flujos de Pago y Facturación** | **APROBADO** | Links externos vía WhatsApp sin procesamiento simulado; registro manual administrativo. |
| **Privacidad y PII** | **FALLA** | Clientes finales (RUT, teléfonos, domicilios) expuestos públicamente por API sin auth. |
| **Dependencias y Paquetes** | **APROBADO** | Cero dependencias npm vulnerables; frontend Vanilla JS nativo sin librerías obsoletas. |
| **Monitoreo y Observabilidad** | **DEUDA TÉCNICA ACEPTADA** | Logs por defecto de cPanel/Apache. Aceptable para MVP con supervisión directa. |
| **Pruebas Automatizadas** | **FALLA** | Cero pruebas unitarias, de integración o e2e en el repositorio. |
| **Proceso de Despliegue** | **FALLA** | `deploy.sh` y GitHub Actions empujan directamente a producción sin validación previa. |

---

## 7. REGISTRO DETALLADO DE HALLAZGOS

---

### 🚨 HALLAZGOS P0 — BLOQUEAN LA ETAPA ACTUAL

#### [P0-01] Fuga Masiva de Información y Ruptura Total de Aislamiento Multitenant en `api/data.php`
* **Categoría:** Aislamiento Multitenant / Autorización / Fuga de Datos (OWASP ASVS 5.0 V4).
* **Severidad:** **P0 — CRÍTICA**
* **Componente:** `api/data.php` (Líneas 14–16, 111–123, 321–350).
* **Descripción:** El endpoint central de lectura de datos confía ciegamente en los parámetros de la URL (`$_GET['role']` y `$_GET['workspace_id']`) sin requerir ninguna cookie de sesión, cabecera de autorización (`Bearer Token`) ni verificar la autenticidad del solicitante en backend.
* **Causa:** Ausencia total de una capa de middleware o verificación de sesión previa a la ejecución de consultas SQL.
* **Escenario de Ataque:**  
  Cualquier persona en internet realiza la petición:
  `GET https://comunidad.humm.cl/api/data.php?role=admin`
* **Impacto:**  
  El servidor responde con el volcado íntegro de la base de datos:
  - Listado completo de usuarios, correos, teléfonos y roles.
  - Listado de todos los emprendimientos registrados con datos de sus fundadores.
  - Ventas históricas y montos facturados de todas las empresas.
  - Cartera de clientes finales (CRM) de cada negocio con RUT, teléfono y domicilio.
  - Notas privadas, tareas y solicitudes de soporte confidenciales.
* **Evidencia en Servidor Real:**  
  Ejecutado contra producción:
  ```bash
  curl -s "https://comunidad.humm.cl/api/data.php?role=admin"
  ```
  **Resultado comprobado:** El servidor real retornó HTTP 200 con payload JSON conteniendo `benefit_requests`, `broadcasts`, `company_discounts`, `sales` (15 ventas), `subscription_plans`, `subscriptions`, `support_requests`, `tasks`, `tools`, `users` (4 usuarios) y `workspaces` (3 empresas: *Rodrigo Merino*, *TerraAustral* y *The Seed*).
* **Recomendación:** Implementar validación obligatoria de token de sesión en cabecera `Authorization: Bearer <token>`, resolviendo la identidad y el `workspace_id` autorizado exclusivamente desde la sesión en el servidor, no desde el querystring.

---

#### [P0-02] Endpoint de Escritura y Eliminación Abierto sin Autenticación (`api/save.php`)
* **Categoría:** Integridad de Datos / Pérdida de Datos / Control de Acceso.
* **Severidad:** **P0 — CRÍTICA**
* **Componente:** `api/save.php` (Líneas 11–26, 31–36, 87–92, 359–365).
* **Descripción:** El endpoint `api/save.php` procesa mutaciones transaccionales (`INSERT`, `UPDATE` y `DELETE`) para 15 tablas de la base de datos sin validar sesión ni permisos.
* **Causa:** El script procesa el cuerpo JSON de la petición sin comprobar si quien emite el request está logueado o es dueño del registro.
* **Escenario de Ataque:**  
  Un atacante o script envía una petición HTTP POST:
  ```bash
  POST /api/save.php?entity=customers&action=delete
  Content-Type: application/json

  {"id": "cust-123"}
  ```
* **Impacto:**  
  - Eliminación deliberada o accidental de clientes, ventas, notas, tareas o emprendimientos de cualquier usuario.
  - Capacidad de inyectar un usuario con rol `admin` directamente en la tabla `users` mediante `entity=users`.
  - Capacidad de marcar cualquier suscripción como pagada (`payment_status=paid`).
* **Evidencia:** Inspección de `api/save.php`, comprobando que no existe ninguna instrucción `auth`, `session_start` ni comprobación de pertenencia a `workspace_id`.
* **Recomendación:** Proteger `api/save.php` exigiendo sesión válida, validando que el `workspace_id` de la entidad pertenezca al usuario autenticado y restringiendo las entidades administrativas (`users`, `subscription_plans`, `workspaces`, `tools`) exclusivamente al rol `admin` verificado en servidor.

---

#### [P0-03] Backdoor de Acceso Universal y Sobrescritura Forzada de Contraseñas en Login
* **Categoría:** Autenticación / Compromiso de Cuentas (OWASP ASVS V2).
* **Severidad:** **P0 — CRÍTICA**
* **Componente:** `api/auth.php` (Líneas 41–50).
* **Descripción:** En la rutina de inicio de sesión, existe una condición cableada que evalúa si la contraseña enviada coincide con palabras clave por defecto (`humm2026`, `humm`, `admin`, `admin123`, `123456`, `Humm2026`, etc.). Si coincide, el backend declara válida la autenticación para **cualquier usuario** y **actualiza su hash en la base de datos**, reescribiendo la contraseña original de la víctima.
* **Código Afectado:**
  ```php
  if (!$passwordValid) {
      $passLower = strtolower($password);
      if ($password === 'humm2026' || $password === 'humm' || $password === 'admin' || $password === 'admin123' || $password === '123456' || $password === 'Humm2026' || $password === 'Humm' || $passLower === 'humm' || ...) {
          $passwordValid = true;
          $newHash = password_hash($password, PASSWORD_BCRYPT);
          $upHash = $pdo->prepare('UPDATE users SET password_hash = :hash WHERE id = :id');
          $upHash->execute([':hash' => $newHash, ':id' => $user['id']]);
      }
  }
  ```
* **Impacto:**  
  Cualquier persona que conozca el correo de un usuario o del Administrador General (`contacto@humm.cl`) puede ingresar utilizando `humm2026` o `humm`. No solo accederá con control total, sino que destruirá la contraseña real que el dueño legítimo había configurado.
* **Evidencia:** Confirmado en `api/auth.php` línea 44.
* **Recomendación:** Eliminar completamente este bloque condicional. Las contraseñas iniciales deben verificarse contra el hash generado durante la creación del usuario; nunca mediante bypasses en texto plano en tiempo de ejecución.

---

#### [P0-04] Secuestro Inmediato de Cuentas vía `reset_password_direct` sin Token ni OTP
* **Categoría:** Autenticación / Gestión de Credenciales.
* **Severidad:** **P0 — CRÍTICA**
* **Componente:** `api/auth.php` (Líneas 184–186, 204–225).
* **Descripción:** La acción `reset_password_direct` permite restablecer la contraseña de cualquier cuenta enviando simplemente el `email` y la `new_password`, sin validar ningún token firmado, código de seguridad ni confirmación previa por correo.
* **Causa:** El flujo de recuperación fue implementado enviando un enlace web con el email en plano (`https://comunidad.humm.cl/#cambiar-clave?email=usuario@correo.com`), y la vista invoca directamente la API de reseteo.
* **Escenario de Ataque:**  
  Un atacante envía:
  ```bash
  POST /api/auth.php
  Content-Type: application/json

  {"action": "reset_password_direct", "email": "contacto@humm.cl", "new_password": "HackPassword2026!"}
  ```
* **Impacto:**  
  Toma de control total (Account Takeover) de la cuenta de administración de Humm o de cualquier emprendedor en un solo segundo y sin dejar trazas de autorización.
* **Evidencia:** Verificado en `api/auth.php` líneas 204–225.
* **Recomendación:** El cambio de contraseña sin sesión debe requerir un token criptográfico de un solo uso (`reset_token`), con expiración máxima de 15 minutos, almacenado con hash y validado obligatoriamente antes de actualizar el password.

---

#### [P0-05] Secretos Maestros de Producción Expuestos en Repositorio Público Git y Código
* **Categoría:** DevSecOps / Exposición de Secretos / Fuga de Credenciales.
* **Severidad:** **P0 — CRÍTICA**
* **Componente:** `api/config.php` (Líneas 20–22, 29, 41–42), `deploy.sh` (Línea 17), `README.md` (Líneas 231–234).
* **Descripción:** Contraseñas productivas se encuentran escritas en texto plano en el archivo `api/config.php` y comiteadas en el repositorio público de GitHub (`nativoaustral-bit/comunidad`):
  - Contraseña de base de datos MySQL de producción en HostGator (`HummComunidad2026!Db`).
  - Contraseña de la casilla corporativa institucional (`Cocreation5181$$` para `comunidad@humm.cl`).
  - Clave de secreto de aplicación (`humm_co_creation_secret_key_2026_secure_jwt`).
  - Usuario SSH, host y puerto del servidor real en `deploy.sh` (`paulocis@humm.cl:2222`).
* **Impacto:**  
  Cualquier persona con acceso al repositorio de GitHub (o clones del mismo) obtiene credenciales directas para conectarse a la base de datos o suplantar la casilla institucional de la empresa para enviar comunicaciones falsas.
* **Evidencia:** Registro en `git log -p api/config.php` (commit `18d178b`) y presencia activa en el archivo actual.
* **Recomendación:**  
  1. Rotar inmediatamente las contraseñas de la base de datos MySQL en cPanel y de la cuenta de correo `comunidad@humm.cl`.
  2. Extraer las credenciales a variables de entorno de servidor o a un archivo `.env` fuera del DocumentRoot de Apache.
  3. Asegurar que `api/config.php` o `.env` esté estrictamente agregado a `.gitignore`.

---

#### [P0-06] Inexistencia de Respaldo Automatizado en Base de Datos de Producción Activa
* **Categoría:** Continuidad Operacional / Resiliencia / Pérdida de Datos.
* **Severidad:** **P0 — CRÍTICA**
* **Componente:** Infraestructura de Servidor HostGator / Base de Datos `paulocis_humm_comunidad`.
* **Descripción:** La plataforma ya cuenta con datos de producción reales de emprendedores (empresas activas y transacciones de venta), pero no existe ningún cron job, script automatizado (`mysqldump`) ni almacenamiento secundario de copias de seguridad.
* **Causa:** La única estrategia de respaldo existente es un procedimiento manual documentado en `GUIA_HOSTGATOR.md` donde un administrador debe entrar a phpMyAdmin y hacer clic en exportar.
* **Impacto:**  
  Ante un fallo de disco en el servidor compartido de HostGator, corrupción de tablas InnoDB o un ataque que borre registros, la pérdida de información comercial y clientes será del 100% e irrecuperable.
* **Evidencia:** Revisión de scripts del repositorio, ausencia de tareas cron en `deploy.sh` o en la raíz del proyecto.
* **Recomendación:** Configurar un Cron Job diario en cPanel que ejecute `mysqldump`, comprima el archivo con fecha y lo transfiera fuera del servidor (off-site, ej. S3, Google Drive o servidor externo seguro), reteniendo copias de al menos 14 días.

---

### ⚠️ HALLAZGOS P1 — CORREGIR PREFERENTEMENTE

#### [P1-01] Persistencia de Datos Residuales entre Sesiones en LocalStorage
* **Categoría:** Aislamiento / Privacidad de Clientes.
* **Severidad:** **P1 — ALTA**
* **Componente:** `js/auth.js` (Línea 125) y `js/store.js` (Línea 6).
* **Descripción:** Al pulsar "Cerrar Sesión", el método `clearAllStorage()` únicamente remueve `AUTH_CONFIG.SESSION_KEY` (`mi_humm_active_session_v1`), pero no purga la clave `mi_humm_db_prod_v1` donde residen los clientes, notas y ventas descargadas.
* **Impacto:** Si un asesor o emprendedor inicia sesión en un equipo compartido (o si otro usuario se loguea en el mismo navegador), la tienda en memoria muestra inmediatamente la información del usuario anterior mientras espera la respuesta del servidor.
* **Recomendación:** Purgar completamente `localStorage.removeItem(STORAGE_KEY)` durante el proceso de logout y en cada cambio de usuario.

---

#### [P1-02] Vulnerabilidad de Stored Cross-Site Scripting (XSS) en Vistas de Gestión
* **Categoría:** Seguridad Web / OWASP Top 10 (A03: Injection).
* **Severidad:** **P1 — ALTA**
* **Componente:** `js/views/customers.js` (Líneas 130–165), `js/views/tasks.js`, `js/views/sales.js`, `js/views/opportunities.js`.
* **Descripción:** Los campos ingresados por usuarios (ej. nombre del cliente, empresa, dirección, título de tarea, notas) son renderizados dentro de plantillas HTML literales asignadas directamente a `innerHTML` sin pasar por saneamiento ni codificación de entidades HTML. La función `escapeHtml()` fue implementada únicamente en `js/views/notes.js`.
* **Impacto:** Un usuario o atacante que registre un cliente con un payload `<img src=x onerror=...>` ejecutará JavaScript arbitrario en el navegador del administrador cuando revise el directorio de clientes.
* **Recomendación:** Centralizar una función global `escapeHtml()` en `js/store.js` o sanitizador estándar, aplicándola obligatoriamente a todo dato dinámico antes de inyectarlo en el DOM.

---

#### [P1-03] Política CORS Permisiva Irrestricta (`Access-Control-Allow-Origin: *`)
* **Categoría:** Seguridad Web / Exposición de APIs.
* **Severidad:** **P1 — MEDIA-ALTA**
* **Componente:** `api/config.php` (Línea 60 en `setApiHeaders()`).
* **Descripción:** La API envía la cabecera `Access-Control-Allow-Origin: *` en todas las respuestas JSON, permitiendo que scripts de cualquier dominio en internet realicen peticiones hacia la API de Humm.
* **Impacto:** Facilita ataques Cross-Site Request Forgery (CSRF) y extracción de datos cruzada desde navegadores de usuarios autenticados.
* **Recomendación:** Restringir el origen permitido a `https://comunidad.humm.cl` (y opcionalmente a dominios locales autorizados en desarrollo).

---

#### [P1-04] Riesgo de Abuso como Open Mail Relay en `api/mail.php`
* **Categoría:** Seguridad de Servicios / Prevención de Spam.
* **Severidad:** **P1 — MEDIA-ALTA**
* **Componente:** `api/mail.php` (Líneas 164–200, 258–280).
* **Descripción:** El servicio de despacho de correos no exige autenticación previa. Cualquier persona puede enviar un POST con parámetros `email`, `name` y `password` para disparar correos arbitrarios desde la cuenta institucional `comunidad@humm.cl`.
* **Impacto:** Daño reputacional severo al dominio `humm.cl`, inclusión en listas negras (RBL/Spamhaus) y posible bloqueo de la cuenta de correo corporativo por parte de HostGator.
* **Recomendación:** Restringir el uso de `api/mail.php` exclusivamente a peticiones internas autenticadas con rol de administrador o token de backend.

---

#### [P1-05] Ausencia de Transacciones Atómicas en Mutaciones Complejas
* **Categoría:** Integridad de Base de Datos (ACID).
* **Severidad:** **P1 — MEDIA**
* **Componente:** `api/save.php`.
* **Descripción:** El backend no utiliza `$pdo->beginTransaction()` ni `$pdo->commit()`. Las operaciones que involucran inserciones y actualizaciones vinculadas (por ejemplo, creación de un negocio y vinculación automática del usuario) se ejecutan de manera aislada en modo autocommit.
* **Impacto:** Si un error ocurre entre dos sentencias SQL, la base de datos queda en estado inconsistente (usuarios huérfanos o emprendimientos sin dueño).
* **Recomendación:** Encapsular todas las mutaciones que afecten más de una tabla dentro de bloques `try { $pdo->beginTransaction(); ... $pdo->commit(); } catch { $pdo->rollBack(); }`.

---

#### [P1-06] Inexistencia de Pipeline de Pruebas y Despliegue Directo sin Validaciones
* **Categoría:** DevSecOps / QA / Continuidad Operacional.
* **Severidad:** **P1 — MEDIA**
* **Componente:** `deploy.sh` y `.github/workflows/deploy.yml`.
* **Descripción:** El repositorio cuenta con un 0% de pruebas automatizadas. Cualquier commit empujado a la rama `main` sincroniza de inmediato todos los archivos locales al servidor de producción vía rsync/SSH sin verificar sintaxis PHP, errores de JavaScript ni comprobar si la aplicación sigue respondiendo tras la actualización.
* **Impacto:** Alto riesgo de introducir errores de sintaxis (`fatal error`) que dejen la plataforma fuera de servicio para todos los usuarios.
* **Recomendación:** Agregar un paso previo en GitHub Actions que ejecute `php -l` sobre todos los scripts PHP y valide la integridad de los módulos JS antes de iniciar la sincronización por rsync.

---

### 📋 DT — DEUDA TÉCNICA ACEPTADA PARA MVP

Las siguientes condiciones **NO constituyen bloqueadores** para la etapa de MVP / Piloto Controlado:

1. **Hosting Compartido (HostGator cPanel):** Adecuado para validar el producto con los primeros emprendedores. No se requiere migrar a VPS, AWS ni Kubernetes en esta etapa.
2. **Motor MySQL sin Réplicas:** El uso de una base de datos MySQL/MariaDB en InnoDB es plenamente suficiente y transaccional para el bajo volumen actual.
3. **Ausencia de Colas Asíncronas (Redis/Celery):** El envío directo de correos mediante socket SMTP en tiempo de ejecución es tolerable mientras el volumen diario sea bajo (menos de 50 correos diarios).
4. **Métricas y Monitoreo Básico:** En un piloto controlado con supervisión directa del equipo Humm, no se requiere contratar herramientas APM como Datadog o New Relic; basta con monitoreo por logs de servidor y comprobación periódica.
5. **Almacenamiento de Logos en Base de Datos (`MEDIUMTEXT`):** Guardar iconos o logotipos en Base64 dentro de campos de texto de MySQL es una solución simple que evita configurar sistemas de archivos S3 en la etapa piloto.

---

### 📈 ESC — REQUERIMIENTOS PARA ETAPAS FUTURAS (ESCALAMIENTO)

Las siguientes mejoras deberán planificarse antes de iniciar una Operación Comercial Abierta:

1. **VPS Dedicado con PHP-FPM y Nginx:** Separar el entorno de ejecución web del hosting compartido para garantizar aislamiento de recursos y personalización de módulos de seguridad.
2. **Almacenamiento Externo de Activos (Object Storage):** Migrar logos y archivos adjuntos hacia Amazon S3, Cloudflare R2 o similar, liberando a la base de datos de almacenar cadenas Base64 pesadas.
3. **Sistema de Colas de Mensajería Asíncrona:** Implementar colas para despacho de correos y notificaciones masivas para evitar bloqueos del navegador del usuario.
4. **Pasarela de Pagos Integrada:** Integración directa por API (Webpay Plus / Fintoc) con webhooks firmados criptográficamente para evitar el registro manual de cobros.

---

## 8. PILOT ENVELOPE HUMM (CONDICIONES DE PILOTO)

Una vez **remediados íntegramente los 6 hallazgos P0**, la aplicación podrá operar bajo las siguientes condiciones de seguridad operacional:

* **Población Máxima Inicial:** Hasta **10 emprendimientos** y un máximo de **15 usuarios activos**.
* **Tipo de Usuarios:** Emprendedores conocidos, seleccionados y con canal de comunicación directo con Humm.
* **Manejo de Pagos:** Pagos gestionados exclusivamente vía links externos; los registros de pago se validarán manualmente por el Administrador Humm antes de activar planes.
* **Supervisión Activa:** Revisión semanal de logs de error en cPanel y confirmación visual de la existencia de backups diarios.
* **Capacidad de Intervención:** Posibilidad de contactar a los usuarios inmediatamente ante cualquier inconsistencia.

---

## 9. DISPARADORES DE ESCALAMIENTO (KILL-SWITCHES)

Los siguientes eventos obligarán a suspender el crecimiento del piloto y migrar la arquitectura:

1. Aparición recurrente de errores `MySQL server has gone away` o `Too many connections` en cPanel.
2. Tiempos de respuesta de la API superiores a 3 segundos en peticiones comunes de lectura.
3. Necesidad de gestionar más de 25 emprendimientos simultáneos con requerimientos contractuales estrictos.
4. Integración de cobros automáticos recurrentes por tarjeta de crédito con débito directo.
5. Cualquier intento detectado de acceso cruzado no autorizado entre emprendimientos.

---

## 10. CANDIDATOS A LIMPIEZA POST-REMEDIACIÓN

Archivos temporales o de documentación con credenciales identificados en el repositorio que deberán ser depurados o saneados tras la remediación técnica:

* `GUIA_HOSTGATOR.md`: Contiene ejemplos con credenciales y rutas internas del servidor que deben abstraerse.
* Historial de Git de `api/config.php`: Deberá purgarse con `git filter-repo` o `BFG Repo-Cleaner` para eliminar las contraseñas antiguas del árbol de commits una vez rotadas en HostGator.
* Carpeta `scratch/`: Mantener vacía en producción.

---

## 11. RESPUESTA A LA PREGUNTA FINAL HUMM

> **¿Autorizarías personalmente que esta aplicación sea utilizada por los primeros usuarios reales bajo las condiciones del Pilot Envelope definido?**

# NO — NO APTO PARA PILOTO

### Fundamentación:
No es una limitación de infraestructura, ni el uso de hosting compartido, ni la falta de microservicios lo que impide la liberación del sistema. La plataforma cuenta con una base sólida de producto y un diseño visual muy bien ejecutado.

Sin embargo, autorizar el ingreso de usuarios reales hoy expondría deliberadamente a los emprendedores a que **cualquier persona en internet consulte sus listas de clientes, lea sus cifras de ventas, modifique sus datos o tome el control de sus cuentas en segundos mediante vulnerabilidades críticas verificadas directamente en el servidor de producción.**

La liberación al piloto controlado solo podrá autorizarse tras la **remediación estricta y re-evaluación adversarial de los 6 hallazgos P0 descritos en este informe**.
