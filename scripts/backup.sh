#!/usr/bin/env bash
# ==============================================================================
# Comunidad Humm - Script de Respaldo Automatizado de Base de Datos
# Ubicación de ejecución: Servidor HostGator (cron o manual)
# ==============================================================================
set -euo pipefail

# 1. Rutas de configuración y destino
SECRETS_FILE="/home1/paulocis/private/comunidad_secrets.php"
BACKUP_DIR="/home1/paulocis/RESPALDOS/comunidad_backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILENAME="comunidad_backup_${TIMESTAMP}.sql.gz"
BACKUP_FILE="${BACKUP_DIR}/${BACKUP_FILENAME}"
SHA256_FILE="${BACKUP_DIR}/comunidad_backup_${TIMESTAMP}.sha256"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

# 2. Extracción segura de credenciales desde archivo fuera de DocumentRoot
if [ -f "$SECRETS_FILE" ]; then
    DB_USER=$(php -r "require '$SECRETS_FILE'; echo defined('DB_USER') ? DB_USER : '';")
    DB_PASS=$(php -r "require '$SECRETS_FILE'; echo defined('DB_PASS') ? DB_PASS : '';")
    DB_NAME=$(php -r "require '$SECRETS_FILE'; echo defined('DB_NAME') ? DB_NAME : '';")
    DB_HOST=$(php -r "require '$SECRETS_FILE'; echo defined('DB_HOST') ? DB_HOST : 'localhost';")
else
    # Fallback a variables de entorno si se ejecuta en contenedor o entorno alternativo
    DB_USER="${DB_USER:-paulocis_humm}"
    DB_PASS="${DB_PASS:-}"
    DB_NAME="${DB_NAME:-paulocis_humm_comunidad}"
    DB_HOST="${DB_HOST:-localhost}"
fi

if [ -z "$DB_PASS" ]; then
    echo "❌ Error: No se pudo obtener la contraseña de la base de datos." >&2
    exit 1
fi

echo "📦 [$(date +'%Y-%m-%d %H:%M:%S')] Iniciando respaldo de '${DB_NAME}'..."

# 3. Dump con InnoDB consistente (--single-transaction), compresión gzip
mysqldump \
    -h "$DB_HOST" \
    -u "$DB_USER" \
    "-p${DB_PASS}" \
    --single-transaction \
    --quick \
    --no-tablespaces \
    --routines \
    --triggers \
    --default-character-set=utf8mb4 \
    "$DB_NAME" | gzip -9 > "$BACKUP_FILE"

# 4. Verificación de integridad gzip
if ! gunzip -t "$BACKUP_FILE"; then
    echo "❌ Error: El archivo comprimido generado está corrupto." >&2
    rm -f "$BACKUP_FILE"
    exit 1
fi

# 5. Cálculo de checksum SHA-256
cd "$BACKUP_DIR"
sha256sum "$BACKUP_FILENAME" > "$SHA256_FILE"
FILE_SIZE=$(ls -lh "$BACKUP_FILENAME" | awk '{print $5}')
SHA_VAL=$(awk '{print $1}' "$SHA256_FILE")

echo "✔ Respaldo generado con éxito:"
echo "   - Archivo: ${BACKUP_FILENAME} (${FILE_SIZE})"
echo "   - SHA-256: ${SHA_VAL}"
echo "   - Destino: ${BACKUP_DIR}"

# 6. Política de retención: conservar últimos 14 días
DELETED_COUNT=$(find "$BACKUP_DIR" -name "comunidad_backup_*.sql.gz" -mtime +14 -delete -print 2>/dev/null | wc -l || echo 0)
find "$BACKUP_DIR" -name "comunidad_backup_*.sha256" -mtime +14 -delete 2>/dev/null || true

echo "ℹ️ Política de retención aplicada: ${DELETED_COUNT} archivos antiguos eliminados (>14 días)."
echo "🎉 [$(date +'%Y-%m-%d %H:%M:%S')] Respaldo completado exitosamente."
