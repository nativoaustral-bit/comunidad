#!/bin/bash
set -e

echo "🚀 Iniciando despliegue de Comunidad Humm a GitHub y Servidor Producción..."

# 1. Enviar cambios locales a GitHub
echo "📦 Guardando y enviando cambios a GitHub (nativoaustral-bit/comunidad)..."
git add .
COMMIT_MSG="${1:-"Actualización y mejoras en Comunidad Humm ($(date +'%Y-%m-%d %H:%M'))"}"
if ! git diff-index --quiet HEAD --; then
  git commit -m "$COMMIT_MSG"
fi
git push origin main

# 2. Sincronizar archivos al servidor de producción HostGator
echo "🌐 Actualizando servidor de producción (HostGator)..."
rsync -avz --exclude='.git' --exclude='.github' --exclude='.DS_Store' -e "ssh -p 2222" ./ paulocis@humm.cl:/home1/paulocis/public_html/comunidad/

echo "✅ ¡Despliegue completado con éxito! Cambios en GitHub y en https://comunidad.humm.cl/"
