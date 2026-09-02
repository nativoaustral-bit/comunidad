/**
 * MI HUMM - MÓDULO HERRAMIENTAS HUMM (CATÁLOGO DE SOLUCIONES)
 * Comunidad Humm Co-Creation
 */

import { store } from '../store.js';
import { auth } from '../auth.js';

export function renderToolsView(container) {
  const ws = auth.getCurrentWorkspace();
  const currentUser = auth.getCurrentUser();
  if (!ws && currentUser?.role !== 'admin') return;

  const allTools = store.getAllTools().filter(t => t.isVisible !== false);
  // Herramientas asignadas específicamente al usuario o a su workspace
  const assignedToolIds = currentUser?.role === 'admin'
    ? allTools.map(t => t.id)
    : (currentUser && Array.isArray(currentUser.assignedToolIds) && currentUser.assignedToolIds.length > 0
        ? currentUser.assignedToolIds
        : (ws?.assignedTools && ws.assignedTools.length > 0 ? ws.assignedTools : allTools.map(t => t.id)));

  const categoryIcons = {
    'Ventas': '💰',
    'Comunicación': '📣',
    'Gestión': '⚙️',
    'Diagnóstico': '📊',
    'Financiamiento': '🌱'
  };

  const statusBadges = {
    'disponible': { text: 'Disponible', class: 'badge-success' },
    'proximamente': { text: 'Próximamente', class: 'badge-info' },
    'requiere_activacion': { text: 'Requiere activación', class: 'badge-warning' },
    'servicio_adicional': { text: 'Servicio adicional', class: 'badge-humm' }
  };

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h2>Herramientas Humm</h2>
        <p>Accede a soluciones creadas para ayudarte a organizar, comunicar, vender y controlar tu emprendimiento.</p>
      </div>
      <div class="view-actions">
        <span class="badge badge-humm font-semibold" style="padding: 6px 12px; font-size: var(--font-size-xs);">
          Ecosistema Comunidad Humm
        </span>
      </div>
    </div>

    <!-- Pestañas de Filtro por Categoría -->
    <div class="filter-tabs" id="tools-category-tabs">
      <button class="filter-tab-btn active" data-category="all">Todas las soluciones (${allTools.length})</button>
      <button class="filter-tab-btn" data-category="Ventas">Ventas</button>
      <button class="filter-tab-btn" data-category="Comunicación">Comunicación</button>
      <button class="filter-tab-btn" data-category="Gestión">Gestión</button>
      <button class="filter-tab-btn" data-category="Diagnóstico">Diagnóstico</button>
      <button class="filter-tab-btn" data-category="Financiamiento">Financiamiento</button>
    </div>

    <!-- GRID DE TARJETAS DE HERRAMIENTAS -->
    <div id="tools-grid-container" class="tools-grid"></div>
  `;

  function filterAndRender(selectedCategory = 'all') {
    const grid = container.querySelector('#tools-grid-container');
    if (!grid) return;

    const filtered = selectedCategory === 'all'
      ? allTools
      : allTools.filter(t => t.category === selectedCategory);

    grid.innerHTML = filtered.map(tool => {
      const isAssigned = assignedToolIds.includes(tool.id);
      let effectiveStatus = tool.status || 'disponible';
      if (effectiveStatus === 'disponible' && !isAssigned) {
        effectiveStatus = 'requiere_activacion';
      }

      const badgeCfg = statusBadges[effectiveStatus] || statusBadges['disponible'];

      return `
        <div class="tool-card">
          <div>
            <div class="tool-card-top">
              <div class="tool-icon-frame" style="overflow: hidden; padding: 2px;">
                ${tool.icon && (tool.icon.startsWith('data:image/') || tool.icon.startsWith('http://') || tool.icon.startsWith('https://') || tool.icon.startsWith('/'))
                  ? `<img src="${tool.icon}" alt="${tool.name}" style="width: 100%; height: 100%; object-fit: contain;" />`
                  : (tool.icon && tool.icon.length <= 4 ? tool.icon : (categoryIcons[tool.category] || '🚀'))}
              </div>
              <span class="badge ${badgeCfg.class}">
                <span class="badge-dot"></span>
                ${badgeCfg.text}
              </span>
            </div>

            <div class="tool-info" style="margin-top: 14px;">
              <div class="tool-category-badge">${tool.category}</div>
              <h4>${tool.name}</h4>
              <p>${tool.description}</p>
            </div>
          </div>

          <div style="padding-top: 14px; border-top: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between;">
            ${effectiveStatus === 'disponible' ? `
              <button class="btn btn-primary btn-block btn-launch-tool" data-url="${tool.url}" data-name="${tool.name}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
                Abrir herramienta
              </button>
            ` : effectiveStatus === 'proximamente' ? `
              <button class="btn btn-secondary btn-block" disabled style="opacity: 0.7;">
                Disponible pronto
              </button>
            ` : `
              <button class="btn btn-secondary btn-block btn-request-tool" data-tool-name="${tool.name}">
                Solicitar activación
              </button>
            `}
          </div>
        </div>
      `;
    }).join('');

    attachEvents();
  }

  function attachEvents() {
    container.querySelectorAll('.btn-launch-tool').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-name');
        const url = btn.getAttribute('data-url');
        if (window.MiHummApp) {
          window.MiHummApp.launchTool(name, url);
        }
      });
    });

    container.querySelectorAll('.btn-request-tool').forEach(btn => {
      btn.addEventListener('click', () => {
        const toolName = btn.getAttribute('data-tool-name');
        if (window.MiHummApp) {
          window.MiHummApp.showToast(`Has solicitado la activación de ${toolName}. Un asesor de Humm se contactará contigo.`, 'success');
        }
      });
    });
  }

  // Manejo de tabs de categorías
  container.querySelectorAll('.filter-tab-btn').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.filter-tab-btn').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      filterAndRender(tab.getAttribute('data-category'));
    });
  });

  filterAndRender('all');
}
