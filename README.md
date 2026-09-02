# 🚀 Comunidad Humm Co-Creation - Plataforma de Gestión y Ecosistema Emprendedor

Bienvenido al repositorio central de **Comunidad Humm Co-Creation** (`Mi Humm`), una solución web integral y modular concebida para potenciar la organización comercial, herramientas digitales, acompañamiento y crecimiento de emprendedores en Chile.

---

## 📌 Tabla de Contenidos
1. [Visión General del Proyecto](#-visión-general-del-proyecto)
2. [Arquitectura y Stack Tecnológico](#-arquitectura-y-stack-tecnológico)
3. [Estructura del Proyecto](#-estructura-del-proyecto)
4. [Módulos y Funcionalidades](#-módulos-y-funcionalidades)
5. [Modelo de Datos y Base de Datos (MySQL)](#-modelo-de-datos-y-base-de-datos-mysql)
6. [Seguridad, Autenticación y Sincronización](#-seguridad-autenticación-y-sincronización)
7. [Despliegue y Mantenimiento en Servidor Producción](#-despliegue-y-mantenimiento-en-servidor-producción)
8. [Credenciales y Accesos](#-credenciales-y-accesos)

---

## 🌟 Visión General del Proyecto

**Comunidad Humm** es una plataforma web híbrida (Single Page Application moderna y ultraliviana sin dependencias pesadas de frameworks) que provee:
* **Entorno de Gestión para Emprendedores**: Panel de control comercial (KPIs), registro de ventas, gestión de clientes (CRM), embudo de oportunidades comerciales, tareas y compromisos estilo Kanban, calendario de eventos, bloc de notas rápidas, catálogo de herramientas Humm y red de convenios/beneficios.
* **Panel de Administración Central (Admin Humm)**: Monitoreo de métricas globales del ecosistema, creación y gestión de espacios de emprendimiento (workspaces), administración de usuarios y tutores/ejecutivos, control de planes y suscripciones mensuales (+IVA), catálogo global de herramientas y convenios comerciales.

---

## 🛠️ Arquitectura y Stack Tecnológico

### 1. Frontend
* **Core**: HTML5 Semántico y JavaScript ES6+ Modular nativo (sin dependencias ni frameworks pesados, garantizando tiempos de carga inferiores a 200 ms).
* **Estilos (CSS)**: Vanilla CSS estructurado con variables de diseño (Design Tokens), soporte para **Modo Claro / Modo Oscuro**, layout responsivo y componentes accesibles.
* **Gestión de Estado**: Patrón de Store reactivo (`js/store.js`) con arquitectura *Offline-First / Cache-First* (LocalStorage + Sincronización bidireccional en tiempo real con MySQL vía API REST).
* **Visualización de Datos**: Gráficos analíticos mediante SVG / Canvas nativo (`js/chart.js`).

### 2. Backend (API REST)
* **Lenguaje**: PHP 8.x nativo orientado a microservicios livianos con salida JSON estricta (`setApiHeaders()`).
* **Capa de Persistencia**: PDO con sentencias preparadas y parametrizadas contra inyecciones SQL (`api/db.php`).
* **Endpoints Principales**:
  * `api/auth.php`: Autenticación segura asíncrona mediante Bcrypt (`password_verify`).
  * `api/data.php`: Endpoint consolidado de lectura y mapeo de datos por rol y workspace.
  * `api/save.php`: Endpoint transaccional de guardado y eliminación con `INSERT ... ON DUPLICATE KEY UPDATE` y `DELETE`.
  * `api/mail.php`: Despacho de correos HTML con diseño responsivo institucional desde el servidor de producción.

### 3. Base de Datos
* **Motor**: MySQL / MariaDB (InnoDB, Charset `utf8mb4`, Collation `utf8mb4_unicode_ci`).
* **Servidor**: HostGator cPanel (`paulocis_humm_comunidad`).

---

## 📂 Estructura del Proyecto

```text
COMUNIDAD/
├── index.html               # SPA principal: estructura, modales, vistas y contenedor de la app
├── schema.sql               # Esquema DDL de tablas relacionales para MySQL en producción
├── deploy.sh                # Script Bash automatizado para despliegue (Git + Rsync a HostGator)
├── .htaccess                # Configuración Apache con políticas anti-caché para scripts y vistas
├── GUIA_HOSTGATOR.md        # Manual técnico y credenciales de configuración de hosting
├── README.md                # Esta documentación técnica y operativa
│
├── api/                     # Microservicios backend PHP
│   ├── config.php           # Configuración de credenciales de base de datos
│   ├── db.php               # Clase singleton DB para conexión PDO y respuestas JSON normalizadas
│   ├── data.php             # Endpoint GET: carga y mapeo de datos consolidados según rol
│   ├── save.php             # Endpoint POST: persistencia y mutaciones transaccionales en MySQL
│   ├── auth.php             # Endpoint de autenticación y verificación de contraseñas Bcrypt
│   └── mail.php             # Servicio de despacho de correos HTML (Bienvenida y Recuperación)
│
├── js/                      # Lógica JavaScript Modular (ES6)
│   ├── app.js               # Controlador central: enrutador hash, eventos globales, modales y temas
│   ├── auth.js              # Manejador de sesiones asíncronas, roles y auditoría
│   ├── store.js             # Estado reactivo global, persistencia local y sincronización con API REST
│   ├── chart.js             # Generador de gráficos analíticos de ventas y rendimiento
│   ├── chile-data.js        # Dataset completo de las 16 regiones y 346 comunas de Chile
│   └── views/               # Controladores de vista individuales
│       ├── dashboard.js     # Vista Inicio: KPIs, accesos directos y tutor asignado
│       ├── tasks.js         # Vista Tareas y Compromisos (Kanban)
│       ├── calendar.js      # Vista Calendario Comercial y Reuniones
│       ├── notes.js         # Vista Bloc de Notas Rápidas
│       ├── sales.js         # Vista Gestión de Ventas y Cobros
│       ├── customers.js     # Vista Directorio de Clientes (CRM)
│       ├── opportunities.js # Vista Oportunidades y Pipeline Comercial
│       ├── tools.js         # Vista Catálogo de Soluciones Humm
│       ├── discounts.js     # Vista Red de Convenios y Descuentos
│       ├── account.js       # Vista Mi Cuenta y Configuración de Perfil
│       └── admin.js         # Vista Panel de Administración Central (Métricas, Planes, Usuarios...)
│
└── styles/                  # Hojas de Estilo CSS
    ├── main.css             # Reset, tipografía, temas claro/oscuro y variables globales
    ├── layout.css           # Grid principal, sidebar, topbar, vistas responsivas
    └── components.css       # Botones, tarjetas, formularios, tablas, badges y modales
```

---

## 🎯 Módulos y Funcionalidades

### 1. Panel de Emprendedores (`#inicio`)
* **Métricas Principales**: Total de ventas del mes, tareas pendientes, clientes activos y oportunidades abiertas.
* **Tutor Humm Asignado**: Tarjeta con nombre, correo y botón de contacto directo con el asesor.
* **Accesos Rápidos a Soluciones**: Tarjetas con los accesos directos a las herramientas contratadas.

### 2. Gestión Comercial
* **Ventas (`#ventas`)**: Registro de ingresos, método de pago, cliente asociado, fechas y estado (pagado, pendiente, abono, vencido).
* **Clientes (`#clientes`)**: Directorio CRM con RUT, teléfono, correo, comuna, empresa e historial de compras.
* **Oportunidades (`#oportunidades`)**: Embudo comercial por etapas (Prospección, Contacto, Propuesta, Ganada, Perdida).

### 3. Organización y Productividad
* **Tareas (`#tareas`)**: Tablero Kanban interactivo con columnas personalizables, prioridades y fechas límite.
* **Calendario (`#calendario`)**: Hitos comerciales, reuniones virtuales, mentorías y entregas.
* **Notas Rápidas (`#notas`)**: Tarjetas de notas estilo Post-it con colores personalizables, fijado prioritario y categorías.

### 4. Catálogo de Soluciones y Red de Convenios Comerciales
* **Herramientas Humm (`#herramientas`)**: Soluciones como ReLoop, Hummailing, Kinetic Control, Humm Radar, Humm Link y Orientador de Financiamiento. Soporte de logos en imagen oficial (`PNG`, `JPG`, `WebP`, `SVG`) o emojis.
* **Alianzas y Beneficios (`#beneficios`)**: Convenios comerciales exclusivos con empresas colaboradoras.
  * **Contacto Comercial Directo**: Conexión inmediata vía WhatsApp (principal), Instagram Direct (con copia automática de mensaje), Correo Electrónico o Sitio Web.
  * **Generador de Códigos Personales**: Asignación de código único y trazable `HUMM-[ALIAS]-[XXXX]` al momento de solicitar el convenio (sin cupones genéricos expuestos).
  * **Mis Beneficios Solicitados**: Historial de convenios solicitados por el miembro con opción de retomar conversación, marcar como utilizado (indicando compra y ahorro) o reportar motivo de no concreción.

### 5. Panel de Administración Central (`#admin-dashboard` / `#admin`)
* **Métricas Globales**: Ventas totales del ecosistema, número de emprendimientos activos, solicitudes de soporte.
* **Contactos Generados por Beneficios (`#admin-benefit-requests`)**: Dashboard de trazabilidad comercial con KPIs (solicitudes totales, del mes, compras concretadas, ahorro total informado y no concretadas), filtros multicriterio por aliado, canal y estado, auditoría y exportación a planilla CSV.
* **Crear Espacio de Emprendimiento**: Formulario con comunas de Chile y selector dinámico de tutor/asesor que autocompleta el correo de apoyo.
* **Ventas y Suscripciones**: Gestión de planes de venta mensual con formato `/mes +IVA` (Plan Emprendedor Base, Plan Crecimiento Humm, Plan Pro Co-Creation), control de períodos de prueba y emisión de links de pago por WhatsApp y Correo.
* **Gestión de Tutores y Ejecutivos**: Creación, activación/desactivación y asignación de tutores y asesores de la red Humm.
* **Creación de Usuarios**: Asignación de rol, vinculación a negocio, selección de herramientas permitidas, envío automático de correo de bienvenida y botón directo para compartir credenciales por WhatsApp.
* **Difusión y Comunicados Masivos**: Publicación de noticias y comunicados hacia toda la comunidad.

---

## 🗄️ Modelo de Datos y Base de Datos (MySQL)

El archivo [`schema.sql`](file:///Users/rmerinog/PLATAFORMAS/COMUNIDAD/schema.sql) define las 15 tablas relacionales:

| # | Tabla | Propósito |
| :--- | :--- | :--- |
| 1 | `workspaces` | Espacios de emprendimiento (Nombre, RUT, dueño, contacto, región, comuna, tutor asignado). |
| 2 | `users` | Cuentas de acceso con roles (`entrepreneur`, `advisor`, `admin`), contraseñas Bcrypt y herramientas asignadas. |
| 3 | `subscription_plans` | Planes de suscripción mensual Humm con precios, días de prueba, características y orden. |
| 4 | `subscriptions` | Suscripciones activas, días de prueba restantes, estado de pago y links de cobranza. |
| 5 | `sales` | Transacciones y ventas registradas por los emprendimientos. |
| 6 | `customers` | Base de datos de clientes de cada negocio (CRM). |
| 7 | `opportunities` | Oportunidades del embudo comercial de ventas. |
| 8 | `tasks` | Tareas y compromisos de productividad. |
| 9 | `calendar_events` | Eventos, reuniones y compromisos agendados en el calendario. |
| 10 | `quick_notes` | Notas rápidas y recordatorios categorizados. |
| 11 | `support_requests` | Requerimientos de soporte enviados a tutores o administración. |
| 12 | `company_discounts` | Convenios y beneficios de empresas aliadas con canales de contacto directo (WhatsApp, Instagram, Email, Web) y condiciones comerciales. |
| 13 | `benefit_requests` | Trazabilidad y solicitudes de beneficios por emprendedor con código personal `HUMM-[ALIAS]-[XXXX]`, canal, estado y feedback de uso. |
| 14 | `tools` | Catálogo de herramientas con logos en `MEDIUMTEXT`, estados y URLs. |
| 15 | `broadcasts` | Comunicados, noticias y avisos de difusión masiva para la comunidad. |

---

## 🔐 Seguridad, Autenticación y Sincronización

1. **Autenticación Asíncrona con Bcrypt**:
   * Las contraseñas en MySQL se procesan y validan exclusivamente mediante hash **Bcrypt** (`$2y$10$...`) en `api/auth.php`.
   * El sistema no utiliza contraseñas genéricas en texto plano ni mecanismos de bypass offline.
   * Mensaje de seguridad estándar unificado: `"Usuario o clave incorrecta."`.
2. **Persistencia y Sincronización Integral**:
   * Cualquier mutación en el frontend (creación, edición o eliminación de planes, convenios, herramientas, ventas, clientes, etc.) actualiza inmediatamente el estado local e invoca `this.apiSave(...)` hacia `api/save.php`.
   * Al iniciar sesión, `store.syncWithBackend()` descarga el estado consolidado desde MySQL garantizando consistencia absoluta entre sesiones.
3. **Flujo de Cambio de Contraseña**:
   * Permite actualizar la clave desde el perfil (`#mi-cuenta`) o mediante el enlace de recuperación (`#cambiar-clave?email=...`), invalidando inmediatamente la contraseña anterior.
4. **Control de Caché en Producción**:
   * Configuración en `.htaccess` y query strings de versión (`?v=3.5`) en [index.html](file:///Users/rmerinog/PLATAFORMAS/COMUNIDAD/index.html) para asegurar la carga inmediata de los scripts actualizados en el navegador.

---

## 🚀 Despliegue y Mantenimiento en Servidor Producción

### Infraestructura de Producción
* **URL Pública**: [https://comunidad.humm.cl](https://comunidad.humm.cl)
* **Servidor SSH**: `humm.cl:2222` (Usuario: `paulocis`)
* **Ruta de Producción**: `/home1/paulocis/public_html/comunidad/`
* **Base de Datos**: `paulocis_humm_comunidad` (Usuario: `paulocis_humm`)
* **Repositorio GitHub**: [https://github.com/nativoaustral-bit/comunidad.git](https://github.com/nativoaustral-bit/comunidad.git)

### Cómo Desplegar Actualizaciones
Para realizar un despliegue completo y seguro en un solo comando:
```bash
./deploy.sh
```
El script `./deploy.sh` ejecuta automáticamente:
1. Sincronización y `git push origin main` hacia GitHub.
2. Sincronización diferencial rápida con `rsync` hacia el servidor HostGator.

---

## 🔑 Credenciales y Accesos

* **Acceso Administrador Central**:
  * **URL**: [https://comunidad.humm.cl](https://comunidad.humm.cl)
  * **Email**: `contacto@humm.cl`
  * **Contraseña**: *(Definida por el administrador en la plataforma)*

---

*Desarrollado para **Comunidad Humm Co-Creation** — Todos los derechos reservados.*
