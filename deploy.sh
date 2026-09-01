#!/bin/bash
set -e

echo "🚀 Iniciando despliegue de Comunidad Humm a GitHub y Servidor Producción..."

# 1. Enviar cambios locales a GitHub
echo "📦 Enviando cambios a GitHub (nativoaustral-bit/comunidad)..."
git push origin main

# 2. Sincronizar archivos al servidor de producción HostGator
echo "🌐 Actualizando servidor de producción (HostGator)..."
rsync -avz --exclude='.git' --exclude='.github' --exclude='.DS_Store' -e "ssh -p 2222" ./ paulocis@humm.cl:/home1/paulocis/public_html/comunidad/

echo "✅ ¡Despliegue completado con éxito! Comunidad Humm actualizada en https://comunidad.humm.cl/"
