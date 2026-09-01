# 🚀 Guía de Despliegue en HostGator (cPanel) - Mi Humm

Esta guía te explica paso a paso cómo montar **Mi Humm** en tu servidor **HostGator** con **PHP 8 y MySQL** en menos de 5 minutos.

---

## 📋 Resumen del Stack

* **Frontend**: HTML5, CSS3, JavaScript Vanilla Moderno (SPA).
* **Backend**: PHP 8.x con PDO y Prepared Statements (carpeta `/api`).
* **Base de Datos**: MySQL / MariaDB (motor InnoDB, transaccional y seguro).
* **Costos adicionales**: **$0** (todo corre en tu plan cPanel existente).

---

## 🛠️ Paso 1: Crear la Base de Datos en cPanel

1. Ingresa a tu **cPanel de HostGator** (`tudominio.cl/cpanel`).
2. En la sección **Bases de datos**, haz clic en **"Asistente de bases de datos MySQL"** (o *Bases de datos MySQL*).
3. **Nombre de la base de datos**: Escribe un nombre, por ejemplo: `humm` (el nombre completo quedará como `tuusuario_humm`). Haz clic en *Siguiente paso*.
4. **Crear usuario de base de datos**:
   - Nombre de usuario: `user_humm` (quedará como `tuusuario_user_humm`).
   - Contraseña: Crea una contraseña segura (ej. `Humm2026!Segura`) y **guárdala**.
5. **Añadir usuario a la base de datos**:
   - Marca la casilla **"TODOS LOS PRIVILEGIOS"** (*ALL PRIVILEGES*).
   - Haz clic en *Hacer cambios*.

---

## 🗄️ Paso 2: Importar las Tablas en phpMyAdmin

1. En tu cPanel, en la sección **Bases de datos**, haz clic en **phpMyAdmin**.
2. En la columna izquierda, haz clic sobre la base de datos que creaste (`tuusuario_humm`).
3. En el menú superior, haz clic en la pestaña **"Importar"**.
4. Haz clic en **"Seleccionar archivo"** y elige el archivo `schema.sql` de tu proyecto.
5. Baja hasta el final y haz clic en el botón **"Continuar"** (o *Importar*).
6. ¡Listo! Verás que se crearon automáticamente las 13 tablas con todos los datos iniciales de planes, usuarios y herramientas.

---

## ⚙️ Paso 3: Configurar las Credenciales en `api/config.php`

Abre el archivo `api/config.php` y coloca los datos que creaste en el Paso 1:

```php
define('DB_HOST', 'localhost'); // En HostGator siempre es localhost
define('DB_PORT', 3306);
define('DB_NAME', 'tuusuario_humm');      // El nombre completo de tu BD
define('DB_USER', 'tuusuario_user_humm'); // El usuario que creaste
define('DB_PASS', 'TuPasswordCreado');    // La contraseña que creaste
define('DB_CHARSET', 'utf8mb4');
```

---

## 📤 Paso 4: Subir los Archivos a HostGator

Tienes 2 opciones muy rápidas:

### Opción A: Por Administrador de Archivos de cPanel (Recomendada)
1. En tu computadora, comprime todos los archivos del proyecto en un archivo `.zip` (incluyendo `index.html`, `js/`, `styles/`, `api/`).
2. En cPanel, abre **"Administrador de archivos"** (*File Manager*).
3. Entra a la carpeta `public_html` (o a la carpeta de tu subdominio, por ejemplo `comunidad.humm.cl`).
4. Haz clic en **"Cargar"** (*Upload*) y sube el archivo `.zip`.
5. Haz clic derecho sobre el `.zip` subido y selecciona **"Extraer"** (*Extract*).

### Opción B: Por FileZilla / FTP
1. Conéctate con tus credenciales FTP de HostGator.
2. Arrastra todos los archivos y carpetas a la carpeta pública (`public_html` o subdominio).

---

## 🔑 Accesos Iniciales para Probar

Una vez subido, puedes ingresar a tu dominio y probar con estos usuarios:

* **Administrador Central**:
  - Correo: `admin@humm.cl`
  - Contraseña: `admin` (o `humm`)
* **Emprendedor 1 (Taller Austral)**:
  - Correo: `carolina@humm.cl`
  - Contraseña: `humm`
* **Emprendedor 2 (Café del Valle)**:
  - Correo: `juan@humm.cl`
  - Contraseña: `humm`

---

## 🛡️ Copias de Seguridad (Backups)

Para respaldar tu base de datos en cualquier momento:
1. En cPanel, entra a **phpMyAdmin**.
2. Selecciona tu base de datos `tuusuario_humm`.
3. Haz clic en **"Exportar"** > **"Rápido"** > **"Continuar"** y se descargará un archivo `.sql` con toda la información actualizada.
