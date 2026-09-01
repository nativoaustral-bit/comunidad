# 🚀 Comunidad Humm Co-Creation - Plataforma de Gestión y Ecosistema Emprendedor

Bienvenido al repositorio central de **Comunidad Humm Co-Creation** (`Mi Humm`), una solución integral concebida para potenciar el crecimiento, organización comercial, herramientas y acompañamiento de emprendedores en Chile.

---

## 📌 Tabla de Contenidos
1. [Visión General del Proyecto](#-visión-general-del-proyecto)
2. [Arquitectura y Stack Tecnológico](#-arquitectura-y-stack-tecnológico)
3. [Estructura del Proyecto](#-estructura-del-proyecto)
4. [Módulos y Funcionalidades](#-módulos-y-funcionalidades)
5. [Modelo de Datos y Base de Datos (MySQL)](#-modelo-de-datos-y-base-de-datos-mysql)
6. [Flujo de Autenticación, Seguridad y Correos](#-flujo-de-autenticación-seguridad-y-correos)
7. [Despliegue y Mantenimiento en Servidor Producción](#-despliegue-y-mantenimiento-en-servidor-producción)
8. [Credenciales y Accesos Iniciales](#-credenciales-y-accesos-iniciales)

---

## 🌟 Visión General del Proyecto

**Comunidad Humm** es una plataforma web híbrida (SPA moderna sin dependencias pesadas) que combina:
* Un **entorno de gestión para emprendedores**: panel de control comercial, control de ventas, tareas, calendario, cartera de clientes, embudo de oportunidades, notas rápidas, catálogo de herramientas Humm y red de beneficios/convenios.
* Un **panel de administración central (Admin Humm)**: métricas agregadas del ecosistema, creación de espacios de emprendimiento, gestión de usuarios, asignación de tutores/ejecutivos, configuración de planes mensuales (+IVA), catálogo global de herramientas y alianzas con subida de logos.

---

## 🛠️ Arquitectura y Stack Tecnológico

### 1. Frontend
* **Core**: HTML5 Semántico y JavaScript ES6+ Modular nativo (sin frameworks como React o Angular, garantizando tiempos de carga inferiores a 200 ms y máxima ligereza).
* **Estilos (CSS)**: Vanilla CSS estructurado con variables de diseño (Design Tokens), soporte para temas **Modo Claro / Modo Oscuro**, layout responsivo y modales con scroll interno.
* **Gestión de Estado**: Patrón de Store reactivo (`store.js`) con arquitectura *Offline-First / Cache-First* (LocalStorage + Sincronización en tiempo real con MySQL vía API REST).
* **Renderizado de Gráficos**: Motor de visualización SVG / Canvas nativo (`chart.js`).

### 2. Backend (API REST)
* **Lenguaje**: PHP 8.x nativo orientado a micro-endpoints livianos con salida JSON estricta (`setApiHeaders()`).
* **Conexión a Datos**: PDO con sentencias preparadas contra inyecciones SQL (`api/db.php`).
* **Servicio de Correos**: Despacho automático de plantillas HTML responsivas mediante la función `mail()` de PHP en HostGator (`api/mail.php`).

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
├── GUIA_HOSTGATOR.md        # Manual técnico y credenciales de configuración de hosting
├── README.md                # Esta documentación técnica y operativa
│
├── api/                     # Microservicios backend PHP
│   ├── config.php           # Configuración de base de datos (Host, Usuario, Clave, DB Name)
│   ├── db.php               # Clase singleton DB para conexión PDO y respuestas JSON
│   ├── data.php             # Endpoint GET: carga inicial de datos por rol y usuario
│   ├── save.php             # Endpoint POST: persistencia y mutaciones (INSERT/UPDATE/DELETE)
│   ├── auth.php             # Endpoint de autenticación y verificación de sesiones
│   └── mail.php             # Servicio de despacho de correos HTML (Bienvenida y Recuperación)
│
├── js/                      # Lógica JavaScript Modular
│   ├── app.js               # Controlador central: enrutador hash, eventos, modales y temas
│   ├── auth.js              # Manejador de sesiones, login, roles y auditoría (impersonation)
│   ├── store.js             # Estado reactivo global, sincronización con API y localStorage
│   ├── chart.js             # Generador de gráficos analíticos de ventas y rendimiento
│   ├── chile-data.js        # Dataset completo de 16 regiones y 346 comunas de Chile
│   └── views/               # Controladores de vista individuales
│       ├── dashboard.js     # Vista Inicio: KPIs, accesos directos y tutor asignado
│       ├── tasks.js         # Vista Tareas y Compromisos
│       ├── calendar.js      # Vista Calendario Comercial
│       ├── notes.js         # Vista Notas Rápidas
│       ├── sales.js         # Vista Gestión de Ventas
│       ├── customers.js     # Vista Directorio de Clientes
│       ├── opportunities.js # Vista Oportunidades / Embudo Comercial
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
* **Accesos Rápidos a Soluciones**: Tarjetas con los logos oficiales de las herramientas contratadas.

### 2. Gestión Comercial
* **Ventas (`#ventas`)**: Registro de ingresos, método de pago, cliente asociado, fechas y estado (pagado / pendiente).
* **Clientes (`#clientes`)**: Directorio con RUT, teléfono, correo, comuna e historial de compras.
* **Oportunidades (`#oportunidades`)**: Embudo de ventas por etapas (Prospección, Contacto, Propuesta, Ganada, Perdida).

### 3. Organización y Productividad
* **Tareas (`#tareas`)**: Clasificación por prioridad (Alta, Media, Baja) y estado con fechas de vencimiento.
* **Calendario (`#calendario`)**: Hitos comerciales, reuniones y entregas.
* **Notas Rápidas (`#notas`)**: Tarjetas de notas estilo Post-it con colores personalizables y categorías.

### 4. Catálogo de Soluciones y Convenios
* **Herramientas Humm (`#herramientas`)**: Soluciones como ReLoop, Hummailing, Kinetic Control, Humm Radar, Humm Link y Orientador de Financiamiento. Soporte de logos en imagen oficial (`PNG`, `JPG`, `WebP`, `SVG`).
* **Alianzas y Beneficios (`#beneficios`)**: Convenios con empresas colaboradoras con logo oficial, código de descuento y enlace web directo.

### 5. Panel de Administración Central (`#admin-dashboard` / `#admin`)
* **Métricas Globales**: Ventas totales del ecosistema, número de emprendimientos activos, solicitudes de soporte.
* **Crear Espacio de Emprendimiento**: Formulario con comunas de Chile y selector dinámico de tutor/asesor que autocompleta el correo de apoyo.
* **Ventas y Suscripciones**: Gestión de planes de venta mensual con formato `/mes +IVA` (Plan Emprendedor Base, Plan Crecimiento Humm, Plan Pro Co-Creation).
* **Creación de Usuarios**: Asignación de rol, vinculación a negocio, selección de herramientas permitidas, envío automático de correo de bienvenida y botón directo para compartir credenciales por WhatsApp.

---

## 🗄️ Modelo de Datos y Base de Datos (MySQL)

El archivo [`schema.sql`](file:///Users/rmerinog/PLATAFORMAS/COMUNIDAD/schema.sql) contiene las definiciones completas:

| Tabla | Propósito |
| :--- | :--- |
| `workspaces` | Espacios de emprendimiento (Nombre, RUT, dueño, contacto, región, comuna, tutor asignado). |
| `users` | Usuarios con roles (`entrepreneur`, `advisor`, `admin`), contraseñas bcrypt y herramientas asignadas. |
| `subscription_plans` | Planes mensuales Humm con precios, días de prueba y características. |
| `subscriptions` | Estado de suscripción activa de cada negocio. |
| `sales` | Transacciones y ventas registradas por los emprendimientos. |
| `customers` | Base de datos de clientes de cada negocio. |
| `opportunities` | Oportunidades del embudo comercial de ventas. |
| `tasks` | Tareas y compromisos de productividad. |
| `calendar_events` | Eventos y compromisos agendados en el calendario. |
| `notes` | Notas rápidas y recordatorios categorizados. |
| `company_discounts` | Convenios y descuentos de empresas aliadas con logos en `MEDIUMTEXT`. |
| `tools` | Catálogo de herramientas con logos en `MEDIUMTEXT`, estado y URLs. |
| `support_requests` | Requerimientos de soporte enviados a tutores o administración. |

---

## 🔐 Flujo de Autenticación, Seguridad y Correos

1. **Autenticación Segura**:
   * Las contraseñas en MySQL se almacenan con hash **Bcrypt** (`$2y$10$...`).
   * En el frontend se maneja sesión persistente en `sessionStorage` / `localStorage` con expiración.
2. **Envío de Correos de Bienvenida**:
   * Al dar de alta a un usuario, `api/mail.php` despacha un correo HTML desde `contacto@humm.cl` con credenciales de acceso y botón directo para ingresar.
3. **Flujo de Cambio de Contraseña**:
   * El correo incluye el botón **`🔐 Cambiar mi Contraseña`** que dirige a `https://comunidad.humm.cl/#cambiar-clave?email=...`.
   * El sistema abre el modal `#modal-reset-password`, actualiza la clave en MySQL y permite el ingreso directo.

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
El script `./deploy.sh` realiza automáticamente:
1. Sincronización y `git push origin main` hacia GitHub.
2. Sincronización diferencial rápida con `rsync` hacia el servidor HostGator respetando los permisos del servidor web.

---

## 🔑 Credenciales y Accesos Iniciales

* **Acceso Administrador Central**:
  * **URL**: [https://comunidad.humm.cl](https://comunidad.humm.cl)
  * **Email**: `admin@humm.cl`
  * **Contraseña**: `admin` *(o la configurada por el administrador)*

---

*Desarrollado para **Comunidad Humm Co-Creation** - Todos los derechos reservados.*
