#!/bin/bash
# ==============================================================================
# Comunidad Humm - Sincronización Automática de Respaldo Off-Site Fuera de HostGator
# Ejecución: Almacenamiento independiente controlado por Humm
# ==============================================================================
set -euo pipefail

LOCAL_OFFSITE_DIR="${1:-/Users/rmerinog/PLATAFORMAS/RESPALDOS/comunidad_offsite}"
REMOTE_BACKUP_DIR="paulocis@humm.cl:/home1/paulocis/RESPALDOS/comunidad_backups/"

mkdir -p "$LOCAL_OFFSITE_DIR"

echo "📥 [$(date +'%Y-%m-%d %H:%M:%S')] Iniciando sincronización de respaldos off-site desde HostGator..."
rsync -avz -e "ssh -p 2222" \
  "$REMOTE_BACKUP_DIR" \
  "$LOCAL_OFFSITE_DIR/"

echo "🔍 Verificando integridad de los respaldos recibidos..."
cd "$LOCAL_OFFSITE_DIR"

FAILURES=0
SUCCESSES=0

for archive in *.sql.gz; do
    [ -f "$archive" ] || continue
    sha_file="${archive%.sql.gz}.sha256"
    
    # 1. Comprobar que no esté corrupto el gzip
    if gzip -t "$archive" 2>/dev/null; then
        echo "  ✔ $archive: Gzip íntegro."
    else
        echo "  ❌ $archive: Gzip corrupto."
        FAILURES=$((FAILURES + 1))
        continue
    fi
    
    # 2. Comprobar hash SHA-256 si existe
    if [ -f "$sha_file" ]; then
        EXPECTED=$(awk '{print $1}' "$sha_file")
        if command -v sha256sum >/dev/null 2>&1; then
            ACTUAL=$(sha256sum "$archive" | awk '{print $1}')
        else
            ACTUAL=$(shasum -a 256 "$archive" | awk '{print $1}')
        fi
        
        if [ "$EXPECTED" = "$ACTUAL" ]; then
            echo "  ✔ $archive: Checksum SHA-256 coincide ($ACTUAL)"
            SUCCESSES=$((SUCCESSES + 1))
        else
            echo "  ❌ $archive: Checksum SHA-256 NO coincide (Esp: $EXPECTED, Obt: $ACTUAL)"
            FAILURES=$((FAILURES + 1))
        fi
    fi
done

if [ "$FAILURES" -gt 0 ]; then
    echo "❌ Error: Se detectaron $FAILURES fallos de integridad en respaldos off-site." >&2
    exit 1
fi

echo "🎉 Respaldo off-site completado y verificado en $LOCAL_OFFSITE_DIR ($SUCCESSES archivos verificados)."
