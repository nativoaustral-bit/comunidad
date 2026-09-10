#!/bin/bash
set -euo pipefail

echo "🚀 Iniciando proceso de despliegue controlado de Comunidad Humm..."

# 0. Gate de Pre-despliegue: Comprobación de sintaxis PHP y pruebas unitarias
echo "🔍 0. Ejecutando comprobación de sintaxis y pruebas de seguridad locales..."
php -l api/security.php
php -l api/auth.php
php -l api/config.php
php -l api/data.php
php -l api/db.php
php -l api/mail.php
php -l api/save.php

php tests/unit_security_tests.php
echo "✔ Gates de pre-despliegue SUPERADOS con éxito."

# 1. Enviar cambios locales a GitHub
echo "📦 Guardando y enviando cambios a GitHub (nativoaustral-bit/comunidad)..."
git add .
COMMIT_MSG="${1:-"Remediación Técnica Integral y Cierre de Vulnerabilidades P0 ($(date +'%Y-%m-%d %H:%M'))"}"
if ! git diff-index --quiet HEAD --; then
  git commit -m "$COMMIT_MSG"
fi
git push origin main

# 2. Sincronizar archivos al servidor de producción HostGator
# Excluyendo estrictamente credenciales locales, respaldos y directorios de prueba
echo "🌐 Actualizando servidor de producción (HostGator)..."
rsync -avz \
  --exclude='.git' \
  --exclude='.github' \
  --exclude='.DS_Store' \
  --exclude='api/config.local.php' \
  --exclude='tests/' \
  --exclude='scratch/' \
  --exclude='backups/' \
  --exclude='*.sql.gz' \
  --exclude='.env*' \
  -e "ssh -p 2222" ./ paulocis@humm.cl:/home1/paulocis/public_html/comunidad/

echo "✅ ¡Despliegue completado con éxito! Cambios en GitHub y en https://comunidad.humm.cl/"
