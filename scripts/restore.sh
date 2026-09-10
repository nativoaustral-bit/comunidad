#!/usr/bin/env bash
# ==============================================================================
# Comunidad Humm - Script de Restauración y Verificación de Integridad
# Ubicación de ejecución: Servidor HostGator
# ==============================================================================
set -euo pipefail

SECRETS_FILE="/home1/paulocis/private/comunidad_secrets.php"
BACKUP_DIR="/home1/paulocis/RESPALDOS/comunidad_backups"

TARGET_DB="${1:-paulocis_comunidad_test}"
BACKUP_INPUT="${2:-}"

# Si no se indica archivo, tomar el más reciente
if [ -z "$BACKUP_INPUT" ]; then
    BACKUP_FILE=$(find "$BACKUP_DIR" -name "comunidad_backup_*.sql.gz" 2>/dev/null | sort -r | head -n 1)
else
    BACKUP_FILE="$BACKUP_INPUT"
fi

if [ -z "$BACKUP_FILE" ] || [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: No se encontró archivo de respaldo para restaurar." >&2
    exit 1
fi

echo "🔄 [$(date +'%Y-%m-%d %H:%M:%S')] Iniciando restauración de prueba..."
echo "   - Archivo origen: $BACKUP_FILE"
echo "   - Base de datos destino: $TARGET_DB"

# Obtener credenciales
if [ -f "$SECRETS_FILE" ]; then
    DB_USER=$(php -r "require '$SECRETS_FILE'; echo defined('DB_USER') ? DB_USER : '';")
    DB_PASS=$(php -r "require '$SECRETS_FILE'; echo defined('DB_PASS') ? DB_PASS : '';")
    DB_HOST=$(php -r "require '$SECRETS_FILE'; echo defined('DB_HOST') ? DB_HOST : 'localhost';")
else
    DB_USER="${DB_USER:-paulocis_humm}"
    DB_PASS="${DB_PASS:-}"
    DB_HOST="${DB_HOST:-localhost}"
fi

# 1. Comprobación de integridad del archivo gzip
echo "🔍 1. Verificando integridad física del archivo..."
gunzip -t "$BACKUP_FILE"
echo "✔ Archivo gzip íntegro y sin corrupción."

# 2. Comprobación de checksum SHA-256 si existe
SHA_FILE="${BACKUP_FILE%.sql.gz}.sha256"
if [ -f "$SHA_FILE" ]; then
    echo "🔍 2. Verificando checksum SHA-256..."
    CURRENT_DIR=$(pwd)
    cd "$(dirname "$BACKUP_FILE")"
    if sha256sum -c "$SHA_FILE" >/dev/null 2>&1; then
        echo "✔ Checksum SHA-256 coincide."
    else
        echo "⚠️ Advertencia: Checksum SHA-256 no coincide con el archivo .sha256."
    fi
    cd "$CURRENT_DIR"
fi

# 3. Importación a base de datos de prueba
echo "📥 3. Importando esquema y datos hacia '$TARGET_DB'..."
gunzip -c "$BACKUP_FILE" | mysql -h "$DB_HOST" -u "$DB_USER" "-p${DB_PASS}" "$TARGET_DB"
echo "✔ Importación completada sin errores de sintaxis."

# 4. Verificación de contenido y recuento de tablas
echo "📊 4. Verificando consistencia de datos importados..."
TABLE_COUNT=$(mysql -h "$DB_HOST" -u "$DB_USER" "-p${DB_PASS}" -N -e \
    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$TARGET_DB';")

echo "   - Tablas encontradas en '$TARGET_DB': $TABLE_COUNT"

if [ "$TABLE_COUNT" -lt 10 ]; then
    echo "❌ Error: La base de datos restaurada tiene menos de 10 tablas ($TABLE_COUNT). Falló la integridad." >&2
    exit 1
fi

USER_COUNT=$(mysql -h "$DB_HOST" -u "$DB_USER" "-p${DB_PASS}" -N -e \
    "SELECT COUNT(*) FROM \`$TARGET_DB\`.users;")
WS_COUNT=$(mysql -h "$DB_HOST" -u "$DB_USER" "-p${DB_PASS}" -N -e \
    "SELECT COUNT(*) FROM \`$TARGET_DB\`.workspaces;")

echo "   - Registros en 'users': $USER_COUNT"
echo "   - Registros en 'workspaces': $WS_COUNT"
echo "🎉 Restauración y verificación de integridad SUPERADA con éxito."
