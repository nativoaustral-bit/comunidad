# 🚀 Comunidad Humm Co-Creation - Plataforma de Gestión y Ecosistema Emprendedor

Bienvenido al repositorio central de **Comunidad Humm Co-Creation** (`Mi Humm`), una solución web integral, modular y de alto rendimiento concebida para potenciar la organización comercial, herramientas digitales, acompañamiento y crecimiento de emprendedores en Chile.

---

## 📌 Tabla de Contenidos
1. [Visión General del Proyecto](#-visión-general-del-proyecto)
2. [Arquitectura y Stack Tecnológico](#-arquitectura-y-stack-tecnológico)
3. [Estructura del Proyecto](#-estructura-del-proyecto)
4. [Módulos y Funcionalidades](#-módulos-y-funcionalidades)
5. [Experiencia y Optimización Móvil](#-experiencia-y-optimización-móvil)
6. [Infraestructura de Correo Institucional](#-infraestructura-de-correo-institucional)
7. [Blindaje y Auto-Reparación de Cuentas (5 Capas)](#-blindaje-y-auto-reparación-de-cuentas-5-capas)
8. [Modelo de Datos y Base de Datos (MySQL)](#-modelo-de-datos-y-base-de-datos-mysql)
9. [Seguridad, Autenticación y Cambio de Clave](#-seguridad-autenticación-y-cambio-de-clave)
10. [Despliegue y Mantenimiento en Servidor Producción](#-despliegue-y-mantenimiento-en-servidor-producción)
11. [Credenciales y Accesos](#-credenciales-y-accesos)

---

## 🌟 Visión General del Proyecto

**Comunidad Humm** es una plataforma web híbrida (Single Page Application moderna, ultraliviana y reactiva sin dependencias de frameworks pesados) que provee:
* **Entorno de Gestión para Emprendedores**: Panel de control comercial (KPIs), registro ágil de ventas, gestión de clientes (CRM), embudo de oportunidades comerciales, tareas y compromisos estilo Kanban, calendario comercial de eventos con exportación iCal / sincronización, bloc de notas rápidas, catálogo de herramientas Humm y red de convenios/beneficios.
* **Panel de Administración Central (Admin Humm)**: Monitoreo de métricas globales del ecosistema, cálculo de MRR real (excluyendo períodos de prueba), creación y gestión de espacios de emprendimiento (*workspaces* aislados), administración de usuarios y tutores/ejecutivos, control de planes y suscripciones mensuales (+IVA), catálogo global de herramientas, y gestión de alianzas con plantillas WhatsApp de copia rápida.

---

## 🛠️ Arquitectura y Stack Tecnológico

### 1. Frontend
* **Core**: HTML5 Semántico y JavaScript ES6+ Modular nativo (sin dependencias pesadas, garantizando tiempos de carga inferiores a 200 ms).
* **Módulos ES6 Unificados**: Arquitectura singleton limpia donde todos los submódulos y vistas importan instancias compartidas de estado (`store.js`) y autenticación (`auth.js`).
* **Estilos (CSS)**: Vanilla CSS estructurado con variables de diseño (Design Tokens), soporte para **Modo Claro / Modo Oscuro**, layout responsivo completo y componentes adaptados para escritorio y dispositivos móviles.
* **Gestión de Estado**: Patrón de Store reactivo (`js/store.js`) con arquitectura *Offline-First / Cache-First* (LocalStorage + Sincronización bidireccional en tiempo real con MySQL vía API REST).
* **Visualización de Datos**: Gráficos analíticos mediante SVG / Canvas nativo (`js/chart.js`).

### 2. Backend (API REST)
* **Lenguaje**: PHP 8.x nativo orientado a microservicios livianos con salida JSON estricta (`setApiHeaders()`).
* **Capa de Persistencia**: PDO con sentencias preparadas y parametrizadas contra inyecciones SQL (`api/db.php`).
* **Infraestructura de Correo Saliente**: Cliente socket SMTP nativo con cifrado SSL (puerto 465) y fallback mediante `mail()` con Envelope Sender (`-fcomunidad@humm.cl`).
* **Endpoints Principales**:
  * `api/auth.php`: Autenticación segura asíncrona mediante Bcrypt (`password_verify`), cambio de contraseña desde perfil, recuperación por correo y auto-reparación de workspaces.
  * `api/data.php`: Endpoint consolidado de lectura y mapeo de datos por rol y workspace, con rutina automática de consistencia de enlaces.
  * `api/save.php`: Endpoint transaccional de guardado y eliminación con blindaje contra sobreescritura de `workspace_id` con `NULL` y enlace bidireccional por email.
  * `api/mail.php`: Servicio de despacho de correos HTML institucionales autenticado desde `comunidad@humm.cl` con diagnóstico y logs.

### 3. Base de Datos
* **Motor**: MySQL / MariaDB (InnoDB, Charset `utf8mb4`, Collation `utf8mb4_unicode_ci`).
* **Servidor**: HostGator cPanel (`paulocis_humm_comunidad`).

---

## 📂 Estructura del Proyecto

```text
COMUNIDAD/
├── index.html               # SPA principal: estructura, login limpio, modales, bottom nav y contenedor de vistas
├── schema.sql               # Esquema DDL de las 15 tablas relacionales para MySQL en producción
├── deploy.sh                # Script Bash automatizado para despliegue (Git + Rsync a HostGator)
├── .htaccess                # Configuración Apache con políticas anti-caché para scripts y vistas
├── GUIA_HOSTGATOR.md        # Manual técnico y credenciales de configuración de hosting
├── README.md                # Esta documentación técnica y operativa
│
├── api/                     # Microservicios backend PHP
│   ├── config.php           # Configuración de credenciales de base de datos MySQL y SMTP (comunidad@humm.cl)
│   ├── db.php               # Clase singleton DB para conexión PDO y respuestas JSON normalizadas
│   ├── data.php             # Endpoint GET: carga y mapeo de datos consolidados según rol + auto-enlace SQL
│   ├── save.php             # Endpoint POST: persistencia blindada y mutaciones transaccionales en MySQL
│   ├── auth.php             # Endpoint de autenticación, verificación Bcrypt y auto-reparación de sesión
│   └── mail.php             # Servicio de correo SMTP/PHP nativo autenticado (Alertas, Bienvenida, Recuperación)
│
├── js/                      # Lógica JavaScript Modular (ES6)
│   ├── app.js               # Controlador central: enrutador hash, eventos globales, modales y temas
│   ├── auth.js              # Manejador de sesiones asíncronas, roles, permisos y auto-enlace de workspace
│   ├── store.js             # Estado reactivo global, persistencia local y sincronización bidireccional
│   ├── chart.js             # Generador de gráficos analíticos de ventas y rendimiento
│   ├── chile-data.js        # Dataset completo de las 16 regiones y 346 comunas de Chile
│   └── views/               # Controladores de vista individuales
│       ├── dashboard.js     # Vista Inicio: KPIs, barra rápida para terreno y tutor asignado
│       ├── tasks.js         # Vista Tareas: Kanban con selector de columnas táctil en móviles
│       ├── calendar.js      # Vista Calendario: vistas mes/semana/agenda, agendamiento interactivo y feed iCal
│       ├── notes.js         # Vista Bloc de Notas: compositor moderno, checklists interactivas y paleta visual
│       ├── sales.js         # Vista Ventas: modo ágil móvil con botón destacado y tablas colapsables
│       ├── customers.js     # Vista Clientes: tarjetas táctiles con llamada directa y WhatsApp
│       ├── opportunities.js # Vista Oportunidades y Pipeline Comercial
│       ├── tools.js         # Vista Catálogo de Soluciones Humm
│       ├── discounts.js     # Vista Convenios y Beneficios con carrusel táctil de categorías
│       ├── account.js       # Vista Mi Cuenta y Configuración de Perfil (con cambio de clave)
│       └── admin.js         # Vista Administración: MRR real, plantilla WhatsApp alianzas y gestión
│
└── styles/                  # Hojas de Estilo CSS
    ├── main.css             # Reset, tipografía, temas claro/oscuro y variables globales
    ├── layout.css           # Grid principal, sidebar, topbar, bottom nav móvil y safe area insets
    └── components.css       # Botones, tarjetas touch, bottom sheet modales, chips deslizables y tabs
```

---

## 🎯 Módulos y Funcionalidades

### 1. Panel de Emprendedores (`#inicio`)
* **Métricas Principales**: Total de ventas del mes, comparación vs mes anterior, tareas pendientes, clientes activos y oportunidades abiertas.
* **Barra de Acciones Rápidas Móvil**: Accesos de un toque para registrar venta, nueva tarea, cliente o nota rápida en terreno.
* **Tutor Humm Asignado**: Tarjeta con nombre, correo y botón de contacto directo con el asesor.
* **Accesos Rápidos a Soluciones**: Tarjetas con accesos directos a las herramientas contratadas.

### 2. Gestión Comercial
* **Ventas (`#ventas`)**: Modo ágil para teléfonos móviles con botón destacado `+ Registrar Venta`, resumen financiero compacto (Total Facturado, Al Día y Pendiente) y tabla colapsable para auditoría.
* **Clientes (`#clientes`)**: Directorio CRM con tarjetas adaptadas para smartphones que incorporan botones directos de WhatsApp y llamada telefónica inmediata (`tel:`).
* **Oportunidades (`#oportunidades`)**: Embudo comercial por etapas (Prospección, Contacto, Propuesta, Ganada, Perdida).

### 3. Organización y Productividad
* **Tablero de Tareas (`#tareas`)**: 
  * Tablero Kanban interactivo con estados *Por hacer*, *En proceso* y *Terminadas*.
  * Selector táctil de columnas a pantalla completa en dispositivos móviles, prioridades por color, fechas de entrega sincronizables y botón de 1 toque para marcar completada.
* **Calendario Comercial & Agenda (`#calendario`)**:
  * **Agendamiento Rápido y Multicanal**: Apertura instantánea mediante el botón principal `+ Agendar Compromiso` o pinchando directamente en cualquier celda de día (en vistas Mensual o Semanal), precargando automáticamente la fecha elegida.
  * **Tipología de Eventos**: Clasificación visual para reuniones de clientes, visitas a terreno/proveedores, mentorías Humm, entregas/despachos y cobros comerciales.
  * **Enlaces Virtuales Flexibles**: Integración con Google Meet, Zoom o Microsoft Teams con apertura directa en 1 clic.
  * **Conmutador Compromiso vs Tarea**: Posibilidad de transformar un agendamiento en tarea para el Kanban en el mismo modal sin perder los datos ingresados.
  * **Sincronización Externa e iCal Feed**: Generación y descarga de archivos universales `.ICS`, suscripción en vivo (iCalendar Feed) para iPhone/Mac/Thunderbird y enlace con Google Calendar y Outlook.
* **Bloc de Notas del Emprendedor (`#notas`)**:
  * **Compositor Dinámico Superior**: Campo de título con etiqueta destacada (`🏷️ Título de la nota *`) y halo de foco de marca; área de texto amplia con redimensionamiento dinámico y atajo de teclado `Ctrl + Enter`.
  * **Herramientas de Formato Rápido**: Botones dedicados para insertar casillas de verificación interactivas (`☑️ + Casilla`) y viñetas ordenadas (`• + Viñeta`).
  * **Paleta Visual de Colores y Categorías**: Selector de 6 muestras de color pastel (Amarillo, Verde Menta, Azul Cielo, Lavanda, Coral Rosa y Gris Neutro) y chips de categorización con iconos temáticos.
  * **Checklists Interactivas en Tarjetas**: Las tarjetas del muro interpretan automáticamente sintaxis `- [ ]` y `- [x]`, permitiendo marcar y tachar pendientes directamente en la tarjeta con sincronización en tiempo real.
  * **Gestión y Persistencia**: Fijado de notas prioritarias al inicio del muro (`pinned`), copiado rápido al portapapeles, edición y eliminación con confirmación y sincronización en MySQL (`quick_notes`).

### 4. Catálogo de Soluciones y Red de Convenios Comerciales
* **Herramientas Humm (`#herramientas`)**: Soluciones como ReLoop, Hummailing, Kinetic Control, Humm Radar, Humm Link y Orientador de Financiamiento.
* **Alianzas y Beneficios (`#beneficios`)**: Convenios comerciales exclusivos con empresas colaboradoras.
  * **Filtros Táctiles Deslizables**: Carrusel horizontal suave para filtrar beneficios por rubro en pantallas táctiles.
  * **Contacto Comercial Directo**: Conexión inmediata vía WhatsApp (principal), Instagram Direct, Correo Electrónico o Sitio Web.
  * **Generador de Códigos Personales**: Asignación de código único y trazable `HUMM-[ALIAS]-[XXXX]` al solicitar el convenio.

### 5. Panel de Administración Central (`#admin-dashboard` / `#admin`)
* **Métricas Globales y MRR Real**:
  * **MRR Estimado**: Cálculo estricto que **excluye automáticamente a clientes en período de prueba** (`isClientInTrial`).
  * **Suscripciones Activas vs En Prueba**: Indicadores claros que diferencian clientes que pagan al día de aquellos en días de prueba gratuitos.
* **Plantilla WhatsApp para Nuevas Alianzas**:
  * Panel desplegable con mensaje oficial formateado para invitar cordialmente a nuevas empresas a la comunidad.
  * Botón de **Copia Rápida en 1 clic** al portapapeles y botón directo para abrir WhatsApp Web con el mensaje pre-cargado.
  * Banner de asistencia integrado dentro del modal de creación de convenios.
* **Trazabilidad de Beneficios (`#admin-benefit-requests`)**: Dashboard de solicitudes comerciales con auditoría y exportación CSV.
* **Gestión de Tutores y Usuarios**: Creación, activación/desactivación y asignación de tutores y emprendedores con auto-vinculación a sus emprendimientos.

---

## 📱 Experiencia y Optimización Móvil

La plataforma cuenta con un diseño responsivo pensado para su uso en terreno desde teléfonos celulares:

1. **Barra de Navegación Inferior (`bottom-nav`)**: Muestra los 5 módulos esenciales para la operación diaria: **Inicio**, **Tareas**, **Notas**, **Clientes** y **Beneficios**.
2. **Cierre Automático de Navegación**: El menú lateral se repliega de forma automática al presionar cualquier enlace en pantallas móviles.
3. **Modales Adaptativos (Bottom Sheets)**: Los formularios y modales se anclan a la parte inferior de la pantalla en dispositivos móviles para facilitar la interacción con una sola mano.
4. **Carrusel Táctil de Filtros**: Chips horizontales deslizables para seleccionar categorías en notas y beneficios sin ocupar espacio vertical.
5. **Acciones Telefónicas Nativas**: Enlaces directos `tel:+56...` y accesos directos a WhatsApp para comunicarse con clientes o aliados en un solo toque.

---

## ✉️ Infraestructura de Correo Institucional

El despacho de correos se encuentra centralizado y autenticado mediante una cuenta exclusiva de la plataforma:

* **Casilla Saliente**: `comunidad@humm.cl`
* **Nombre de Remitente**: `Comunidad Humm Co-Creation`
* **Protocolo**: Conexión socket SMTP nativa con cifrado SSL en puerto `465` (o TLS en puerto `587`).
* **Garantía de Entregabilidad**: Incorpora el parámetro Envelope Sender (`-fcomunidad@humm.cl`) para superar validaciones SPF, DKIM y DMARC en Gmail, Outlook y servidores corporativos.
* **Feedback en Tiempo Real en la UI**: Al crear un usuario en el panel de administración, el modal consulta el resultado real del envío y muestra un badge verde de confirmación o resalta los botones de WhatsApp/Copiar si el correo no pudo ser entregado.
* **Flujos Integrados**:
  1. Bienvenida con credenciales y link de acceso para nuevos emprendedores y tutores.
  2. Notificaciones de recuperación y cambio de contraseñas.
  3. Alertas automáticas de soporte y solicitudes de asistencia para inicio de sesión.
  4. Avisos de nuevos convenios y beneficios solicitados.

---

## 🛡️ Blindaje y Auto-Reparación de Cuentas (5 Capas)

Para evitar la desvinculación accidental de los emprendimientos (*workspaces*) respecto a los usuarios, la plataforma cuenta con un sistema de auto-reparación y protección en 5 niveles:

1. **Blindaje en MySQL (`api/save.php`)**: La sentencia `ON DUPLICATE KEY UPDATE` utiliza `IF(VALUES(workspace_id) IS NOT NULL AND VALUES(workspace_id) != '', VALUES(workspace_id), workspace_id)`. Una actualización parcial de clave o estado nunca borrará el negocio asociado.
2. **Auto-enlace Bidireccional al Crear Negocios (`api/save.php` y `store.js`)**: Al registrar un nuevo emprendimiento, el sistema busca de inmediato al usuario que tenga el mismo correo y lo vincula automáticamente.
3. **Auto-reparación en Inicio de Sesión (`api/auth.php`)**: Al hacer login o verificar sesión, si el emprendedor no tuviera `workspace_id`, el backend busca el negocio por email, lo vincula permanentemente en MySQL y entrega el entorno completo.
4. **Auto-reparación en Carga de Datos (`api/data.php`)**: Cada consulta a la base de datos ejecuta una rutina SQL de consistencia que re-vincula a cualquier usuario huérfano.
5. **Auto-reparación en el Navegador (`js/auth.js` y `js/app.js`)**: El método `getCurrentWorkspace()` detecta ausencias de ID en caliente, busca coincidencia por email y actualiza la sesión para que el usuario nunca vea su panel en blanco.

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
| 8 | `tasks` | Tareas y compromisos de productividad estilo Kanban. |
| 9 | `calendar_events` | Eventos, reuniones y compromisos agendados en el calendario. |
| 10 | `quick_notes` | Bloc de notas del emprendedor con compositor dinámico, checklists interactivas y categorización. |
| 11 | `support_requests` | Requerimientos de soporte enviados a tutores o administración. |
| 12 | `company_discounts` | Convenios y beneficios de empresas aliadas con canales de contacto directo y condiciones comerciales. |
| 13 | `benefit_requests` | Trazabilidad de convenios por emprendedor con código personal `HUMM-[ALIAS]-[XXXX]`. |
| 14 | `tools` | Catálogo de herramientas con logos en `MEDIUMTEXT`, estados y URLs. |
| 15 | `broadcasts` | Comunicados, noticias y avisos de difusión masiva para la comunidad. |

---

## 🔐 Seguridad, Autenticación y Cambio de Clave

1. **Autenticación Asíncrona con Bcrypt**: Contraseñas procesadas mediante hash **Bcrypt** (`$2y$10$...`) en `api/auth.php`.
2. **Formulario de Login Seguro**: Campos vacíos por defecto (`autocomplete="off"`), visualizador interactivo de contraseña y mensajes de error específicos.
3. **Flujos de Cambio y Recuperación**:
   * **Desde "Mi Cuenta" (`#cuenta`)**: Cambio de contraseña en tiempo real validando la clave actual y grabando el nuevo hash Bcrypt en MySQL.
   * **Recuperación "¿Olvidaste tu contraseña?"**: Envío de correo desde `comunidad@humm.cl` con enlace directo para restablecer la contraseña.
4. **Control de Caché en Producción**: Configuración en `.htaccess` y parámetros de versión de assets dinámicos en `index.html` (`app.js?v=9.3`, `components.css?v=4.1`) para garantizar la carga instantánea de los cambios sin caché residual en los navegadores de los usuarios.

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
./deploy.sh "mensaje de commit descriptivo"
```
El script `./deploy.sh` ejecuta automáticamente:
1. `git add`, `git commit` y `git push origin main` hacia GitHub.
2. Sincronización diferencial rápida con `rsync` hacia el servidor HostGator.

---

## 🔑 Credenciales y Accesos

* **Acceso Administrador Central**:
  * **URL**: [https://comunidad.humm.cl](https://comunidad.humm.cl)
  * **Email**: `contacto@humm.cl`
  * **Rol**: Administrador general del ecosistema.
* **Acceso Emprendedor / Cuenta Principal**:
  * **Email**: `rmerino@hummcocreation.com`
  * **Rol**: Emprendedor con espacio de trabajo asignado.
* **Cuenta de Correo de la Plataforma**:
  * **Casilla**: `comunidad@humm.cl`
  * **Uso**: Envío de correos de bienvenida, recuperación de contraseñas y notificaciones institucionales.

---

*Desarrollado para **Comunidad Humm Co-Creation** — Todos los derechos reservados.*
