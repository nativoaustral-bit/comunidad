/**
 * MI HUMM - PÁGINAS DEDICADAS DE ADMINISTRACIÓN CENTRAL
 * Dashboard Comunidad, Alertas, Solicitudes, Emprendimientos, Clientes, Tutores & Catálogo
 * Comunidad Humm Co-Creation
 */

import { store, formatDateCL, formatCLP } from '../store.js';
import { auth } from '../auth.js';

let currentAlertFilter = 'all';  // 'all', 'critical', 'warning', 'info'
let currentRequestFilter = 'all'; // 'all', 'pendiente', 'en_proceso', 'respondido'
let customerSearchQuery = '';

/**
 * Enrutador principal de las vistas de administración
 */
export function renderAdminView(container, viewName = 'admin-dashboard') {
  const user = auth.getCurrentUser();
  if (!user || user.role !== 'admin') {
    container.innerHTML = `<div class="empty-state"><p>Acceso restringido solo para Administradores de Humm.</p></div>`;
    return;
  }

  switch (viewName) {
    case 'admin-users':
      renderAdminUsersView(container);
      break;
    case 'admin-subscriptions':
    case 'admin-sales':
      renderAdminSubscriptionsView(container);
      break;
    case 'admin-alerts':
      renderAdminAlertsView(container);
      break;
    case 'admin-requests':
      renderAdminRequestsView(container);
      break;
    case 'admin-members':
      renderAdminMembersView(container);
      break;
    case 'admin-customers':
      renderAdminCustomersView(container);
      break;
    case 'admin-advisors':
      renderAdminAdvisorsView(container);
      break;
    case 'admin-broadcasts':
      renderAdminBroadcastsView(container);
      break;
    case 'admin-discounts':
      renderAdminDiscountsView(container);
      break;
    case 'admin-tools':
      renderAdminToolsView(container);
      break;
    case 'admin-dashboard':
    case 'admin':
    default:
      renderAdminDashboard(container);
      break;
  }
}

// =========================================================================
// 1. DASHBOARD DE LA COMUNIDAD (MÉTRICAS & ACCESO RÁPIDO A URGENTES)
// =========================================================================
export function renderAdminDashboard(container) {
  const metrics = store.getCommunityMetrics();
  const alerts = store.getCommunityAlerts();
  const workspaces = store.getAllWorkspaces();
  const supportRequests = store.getSupportRequests();

  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const warningAlerts = alerts.filter(a => a.severity === 'warning');
  const pendingRequests = supportRequests.filter(r => r.status === 'pendiente');

  container.innerHTML = `
    <!-- ENCABEZADO -->
    <div class="view-header">
      <div class="view-title-group">
        <div style="display: flex; align-items: center; gap: 8px;">
          <h2>Dashboard de la Comunidad</h2>
          <span class="badge badge-humm text-xs">Monitoreo General</span>
        </div>
        <p>Visión global del avance comercial, salud de los emprendimientos y alertas prioritarias de la comunidad.</p>
      </div>
      <div class="view-actions">
        <button class="btn btn-secondary btn-sm" id="btn-admin-create-ws">
          + Nuevo Emprendimiento
        </button>
        <button class="btn btn-primary btn-sm" id="btn-admin-create-user">
          + Nuevo Usuario
        </button>
      </div>
    </div>

    <!-- 4 HERO KPIS GLOBALES -->
    <div class="metrics-grid" style="margin-bottom: 24px;">
      <div class="metric-card">
        <div class="metric-card-header">
          <span class="metric-card-title">Emprendimientos</span>
          <div class="metric-card-icon">🏢</div>
        </div>
        <div class="metric-card-value">${metrics.totalMembers}</div>
        <div class="metric-card-footer">
          <span class="text-xs text-muted"><strong>${metrics.activeMembers}</strong> membresías activas • <strong>${metrics.activeUsers}</strong> usuarios</span>
        </div>
      </div>

      <div class="metric-card" style="border-left: 3px solid var(--success);">
        <div class="metric-card-header">
          <span class="metric-card-title">Ventas Comunidad (Mes)</span>
          <div class="metric-card-icon">💰</div>
        </div>
        <div class="metric-card-value" style="color: var(--success); font-size: 1.45rem;">
          ${formatCLP(metrics.currentMonthSales)}
        </div>
        <div class="metric-card-footer">
          <span class="text-xs text-muted">Total acumulado año: <strong>${formatCLP(metrics.currentYearSales)}</strong></span>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-card-header">
          <span class="metric-card-title">Clientes en la Red</span>
          <div class="metric-card-icon">👥</div>
        </div>
        <div class="metric-card-value">${metrics.totalCustomers}</div>
        <div class="metric-card-footer">
          <span class="text-xs text-muted">En las carteras de los miembros</span>
        </div>
      </div>

      <div class="metric-card" style="border-left: 3px solid var(--humm-red-primary);">
        <div class="metric-card-header">
          <span class="metric-card-title">Engagement & Avance</span>
          <div class="metric-card-icon">⚡</div>
        </div>
        <div class="metric-card-value" style="color: var(--humm-red-primary);">
          ${metrics.completedTasks} <span style="font-size: 0.9rem; font-weight: 500; color: var(--text-secondary);">/ ${metrics.totalTasks} tareas</span>
        </div>
        <div class="metric-card-footer">
          <span class="text-xs text-muted">${metrics.openOpportunitiesCount} oportunidades activas (${formatCLP(metrics.pipelineValue)})</span>
        </div>
      </div>
    </div>

    <!-- SECCIÓN CLAVE: BOTONES Y TARJETAS PARA VISUALIZAR LOS URGENTES -->
    <div style="margin-bottom: 28px;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
        <h3 style="font-size: var(--font-size-base); font-weight: 700; display: flex; align-items: center; gap: 8px;">
          <span>🚨</span> Casos Urgentes y Atención Requerida
        </h3>
        <span class="text-xs text-muted">Haz clic en cualquier caso para ir directo a la sección</span>
      </div>

      <div class="grid grid-3" style="gap: 16px;">
        <!-- Tarjeta 1: Solicitudes de Apoyo Pendientes -->
        <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-left: 4px solid var(--danger); border-radius: var(--radius-md); padding: 16px; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-weight: 700; font-size: var(--font-size-sm); color: var(--text-primary);">Solicitudes Pendientes</span>
              <span class="badge ${pendingRequests.length > 0 ? 'badge-danger' : 'badge-success'}">${pendingRequests.length}</span>
            </div>
            <p class="text-xs text-secondary" style="margin-bottom: 12px; line-height: 1.35;">
              ${pendingRequests.length > 0 
                ? `Hay <strong>${pendingRequests.length}</strong> solicitud(es) de emprendedores esperando respuesta o reunión.` 
                : '✅ Todas las solicitudes de apoyo han sido atendidas.'}
            </p>
          </div>
          <button class="btn ${pendingRequests.length > 0 ? 'btn-primary' : 'btn-secondary'} btn-sm btn-block btn-nav-action" data-nav-target="admin-requests">
            Ver Solicitudes de Apoyo ➔
          </button>
        </div>

        <!-- Tarjeta 2: Emprendedores sin ventas este mes -->
        <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-left: 4px solid var(--warning); border-radius: var(--radius-md); padding: 16px; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-weight: 700; font-size: var(--font-size-sm); color: var(--text-primary);">Sin Ventas este Mes</span>
              <span class="badge badge-warning">${warningAlerts.filter(a => a.type === 'no_sales').length}</span>
            </div>
            <p class="text-xs text-secondary" style="margin-bottom: 12px; line-height: 1.35;">
              Emprendedores activos que aún no han registrado ventas en agosto 2026. Requieren llamado de su tutor.
            </p>
          </div>
          <button class="btn btn-secondary btn-sm btn-block btn-nav-action" data-nav-target="admin-alerts">
            Revisar Alertas de Ventas ➔
          </button>
        </div>

        <!-- Tarjeta 3: Oportunidades con Seguimiento Atrasado -->
        <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-left: 4px solid #f59e0b; border-radius: var(--radius-md); padding: 16px; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-weight: 700; font-size: var(--font-size-sm); color: var(--text-primary);">Seguimientos Vencidos</span>
              <span class="badge badge-warning">${warningAlerts.filter(a => a.type === 'overdue_opportunity').length}</span>
            </div>
            <p class="text-xs text-secondary" style="margin-bottom: 12px; line-height: 1.35;">
              Oportunidades comerciales de miembros con fecha de contacto expirada para coordinar reactivación.
            </p>
          </div>
          <button class="btn btn-secondary btn-sm btn-block btn-nav-action" data-nav-target="admin-alerts">
            Ver Oportunidades en Riesgo ➔
          </button>
        </div>
      </div>
    </div>

    <!-- COMPARATIVA DE VENTAS Y TUTORES -->
    <div class="grid grid-2" style="gap: 20px; margin-bottom: 28px;">
      <!-- Ventas del Mes por Emprendimiento -->
      <div class="metric-card" style="display: flex; flex-direction: column;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span style="font-weight: 700; font-size: var(--font-size-md);">Ventas del Mes por Emprendimiento</span>
          <button class="btn btn-ghost btn-sm btn-nav-action" data-nav-target="admin-members" style="font-size: var(--font-size-xs);">
            Ver todos ➔
          </button>
        </div>
        <p class="text-xs text-muted" style="margin-bottom: 16px;">
          Facturación reportada durante agosto 2026 en pesos chilenos.
        </p>

        <div style="display: flex; flex-direction: column; gap: 14px; flex-grow: 1; justify-content: space-around;">
          ${workspaces.map(ws => {
            const wsSales = store.getSales(ws.id);
            const now = new Date();
            const thisMonthSale = wsSales.find(s => parseInt(s.year, 10) === now.getFullYear() && parseInt(s.month, 10) === (now.getMonth() + 1));
            const amount = thisMonthSale ? thisMonthSale.amount : 0;
            const maxAmount = metrics.currentMonthSales > 0 ? metrics.currentMonthSales : 1;
            const pct = Math.min(100, Math.round((amount / maxAmount) * 100));

            return `
              <div>
                <div style="display: flex; justify-content: space-between; font-size: var(--font-size-sm); margin-bottom: 4px;">
                  <span style="font-weight: 600;">${ws.name}</span>
                  <span style="font-weight: 700; color: ${amount > 0 ? 'var(--text-primary)' : 'var(--text-muted)'};">
                    ${amount > 0 ? formatCLP(amount) : 'Sin registro este mes'}
                  </span>
                </div>
                <div style="width: 100%; height: 8px; background: var(--bg-surface-secondary); border-radius: var(--radius-full); overflow: hidden;">
                  <div style="width: ${pct}%; height: 100%; background: ${amount > 0 ? 'var(--humm-red-primary)' : 'transparent'}; border-radius: var(--radius-full);"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Resumen de Tutores Humm -->
      <div class="metric-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span style="font-weight: 700; font-size: var(--font-size-md);">Tutores y Acompañamiento Humm</span>
          <button class="btn btn-ghost btn-sm btn-nav-action" data-nav-target="admin-advisors" style="font-size: var(--font-size-xs);">
            Administrar tutores ➔
          </button>
        </div>
        <p class="text-xs text-muted" style="margin-bottom: 16px;">
          Asignación y estado de requerimientos por tutor.
        </p>

        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${store.getAdvisorsSummary().map(adv => `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: var(--bg-surface-secondary); border-radius: var(--radius-md);">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.25rem;">👩‍💼</span>
                <div>
                  <div style="font-weight: 700; font-size: var(--font-size-sm);">${adv.name}</div>
                  <div class="text-xs text-muted">${adv.email}</div>
                </div>
              </div>
              <div style="text-align: right;">
                <span class="badge badge-info text-xs">${adv.workspaces.length} Emprendimientos</span>
                ${adv.pendingRequestsCount > 0 ? `<div style="font-size: 11px; color: var(--danger); font-weight: 600; margin-top: 2px;">${adv.pendingRequestsCount} pendientes</div>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  attachCommonAdminEvents(container);
}

// =========================================================================
// 2. CENTRO DE ALERTAS
// =========================================================================
export function renderAdminAlertsView(container) {
  const alerts = store.getCommunityAlerts();
  const filteredAlerts = currentAlertFilter === 'all' 
    ? alerts 
    : alerts.filter(a => a.severity === currentAlertFilter);

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <div style="display: flex; align-items: center; gap: 8px;">
          <h2>Centro de Alertas de la Comunidad</h2>
          <span class="badge badge-warning text-xs">${alerts.length} Detectadas</span>
        </div>
        <p>Monitoreo proactivo de situaciones comerciales, solicitudes desatendidas y seguimientos vencidos.</p>
      </div>
    </div>

    <div class="data-table-container">
      <div class="table-toolbar" style="flex-wrap: wrap; gap: 12px;">
        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          <button class="btn ${currentAlertFilter === 'all' ? 'btn-primary' : 'btn-ghost'} btn-sm alert-filter-btn" data-filter="all">
            Todas (${alerts.length})
          </button>
          <button class="btn ${currentAlertFilter === 'critical' ? 'btn-primary' : 'btn-ghost'} btn-sm alert-filter-btn" data-filter="critical">
            🔴 Críticas (${alerts.filter(a => a.severity === 'critical').length})
          </button>
          <button class="btn ${currentAlertFilter === 'warning' ? 'btn-primary' : 'btn-ghost'} btn-sm alert-filter-btn" data-filter="warning">
            🟠 Advertencias (${alerts.filter(a => a.severity === 'warning').length})
          </button>
          <button class="btn ${currentAlertFilter === 'info' ? 'btn-primary' : 'btn-ghost'} btn-sm alert-filter-btn" data-filter="info">
            🔵 Informativas (${alerts.filter(a => a.severity === 'info').length})
          </button>
        </div>
      </div>

      <div style="padding: 16px; display: flex; flex-direction: column; gap: 12px;">
        ${filteredAlerts.length > 0 ? filteredAlerts.map(alert => {
          const badgeClass = alert.severity === 'critical' 
            ? 'badge-danger' 
            : alert.severity === 'warning' 
              ? 'badge-warning' 
              : 'badge-info';

          const severityLabel = alert.severity === 'critical' 
            ? 'Crítica' 
            : alert.severity === 'warning' 
              ? 'Atención' 
              : 'Informativa';

          return `
            <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-left: 4px solid ${alert.severity === 'critical' ? 'var(--danger)' : alert.severity === 'warning' ? 'var(--warning)' : 'var(--info)'}; border-radius: var(--radius-md); padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
              <div style="flex: 1; min-width: 260px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                  <span class="badge ${badgeClass} text-xs">
                    <span class="badge-dot"></span>
                    ${severityLabel}
                  </span>
                  <span style="font-weight: 700; font-size: var(--font-size-sm); color: var(--text-primary);">${alert.title}</span>
                </div>
                <div style="font-size: var(--font-size-xs); color: var(--text-secondary); line-height: 1.4;">
                  ${alert.description}
                </div>
                <div class="text-xs text-muted" style="margin-top: 4px;">
                  👤 Tutor asignado: <strong>${alert.advisorName}</strong> (${alert.advisorEmail})
                </div>
              </div>

              <div style="display: flex; gap: 8px;">
                ${alert.targetTab === 'requests' ? `
                  <button class="btn btn-primary btn-sm btn-nav-action" data-nav-target="admin-requests">
                    Ver Solicitud
                  </button>
                ` : `
                  <button class="btn btn-secondary btn-sm btn-audit-ws" data-ws-id="${alert.workspaceId}">
                    Auditar Espacio
                  </button>
                `}
              </div>
            </div>
          `;
        }).join('') : `
          <div style="text-align: center; padding: 36px; color: var(--text-muted);">
            ✅ No hay alertas activas en este filtro. Toda la comunidad se encuentra al día.
          </div>
        `}
      </div>
    </div>
  `;

  attachCommonAdminEvents(container);
}

// =========================================================================
// 3. BANDEJA DE SOLICITUDES DE APOYO
// =========================================================================
export function renderAdminRequestsView(container) {
  const supportRequests = store.getSupportRequests();
  const filteredRequests = currentRequestFilter === 'all'
    ? supportRequests
    : supportRequests.filter(r => r.status === currentRequestFilter);

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <div style="display: flex; align-items: center; gap: 8px;">
          <h2>Solicitudes de Apoyo y Requerimientos</h2>
          <span class="badge badge-humm text-xs">${supportRequests.length} Totales</span>
        </div>
        <p>Bandeja centralizada de reuniones, dudas técnicas y requerimientos comerciales enviados por los emprendedores.</p>
      </div>
    </div>

    <div class="data-table-container">
      <div class="table-toolbar" style="flex-wrap: wrap; gap: 12px;">
        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          <button class="btn ${currentRequestFilter === 'all' ? 'btn-primary' : 'btn-ghost'} btn-sm req-filter-btn" data-filter="all">
            Todas (${supportRequests.length})
          </button>
          <button class="btn ${currentRequestFilter === 'pendiente' ? 'btn-primary' : 'btn-ghost'} btn-sm req-filter-btn" data-filter="pendiente">
            🔴 Pendientes (${supportRequests.filter(r => r.status === 'pendiente').length})
          </button>
          <button class="btn ${currentRequestFilter === 'en_proceso' ? 'btn-primary' : 'btn-ghost'} btn-sm req-filter-btn" data-filter="en_proceso">
            🟠 En proceso (${supportRequests.filter(r => r.status === 'en_proceso').length})
          </button>
          <button class="btn ${currentRequestFilter === 'respondido' ? 'btn-primary' : 'btn-ghost'} btn-sm req-filter-btn" data-filter="respondido">
            🟢 Respondidas (${supportRequests.filter(r => r.status === 'respondido').length})
          </button>
        </div>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th>Fecha & Emprendedor</th>
            <th>Tipo & Asunto</th>
            <th>Detalle del Requerimiento</th>
            <th>Tutor Asignado</th>
            <th>Preferencia Contacto</th>
            <th>Estado</th>
            <th style="text-align: right;">Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${filteredRequests.length > 0 ? filteredRequests.map(req => {
            const ws = store.getWorkspace(req.workspaceId);
            const wsName = ws ? ws.name : 'Emprendimiento';

            return `
              <tr>
                <td>
                  <div style="font-weight: 700; color: var(--text-primary);">${wsName}</div>
                  <div class="text-xs text-secondary">${req.userName}</div>
                  <div class="text-xs text-muted" style="margin-top: 2px;">📅 ${formatDateCL(req.createdAt)}</div>
                </td>
                <td>
                  <span class="badge badge-info text-xs">${req.requestType}</span>
                  <div style="font-weight: 600; font-size: var(--font-size-sm); margin-top: 4px;">${req.subject}</div>
                </td>
                <td style="max-width: 280px; font-size: var(--font-size-xs); color: var(--text-secondary); line-height: 1.35;">
                  ${req.description}
                </td>
                <td>
                  <div style="font-weight: 600; font-size: var(--font-size-xs);">${req.advisorName}</div>
                  <div style="font-size: 11px; color: var(--text-muted);">${req.advisorEmail}</div>
                </td>
                <td>
                  <span class="badge badge-neutral text-xs">${req.contactPreference}</span>
                </td>
                <td>
                  <span class="badge ${req.status === 'respondido' ? 'badge-success' : req.status === 'en_proceso' ? 'badge-warning' : 'badge-humm'}">
                    <span class="badge-dot"></span>
                    ${req.status.charAt(0).toUpperCase() + req.status.slice(1).replace('_', ' ')}
                  </span>
                </td>
                <td style="text-align: right;">
                  <select class="form-control admin-change-req-status" data-req-id="${req.id}" style="font-size: 11px; padding: 4px 6px; width: auto; display: inline-block;">
                    <option value="pendiente" ${req.status === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                    <option value="en_proceso" ${req.status === 'en_proceso' ? 'selected' : ''}>En proceso</option>
                    <option value="respondido" ${req.status === 'respondido' ? 'selected' : ''}>Respondido</option>
                  </select>
                </td>
              </tr>
            `;
          }).join('') : `
            <tr>
              <td colspan="7" style="text-align: center; padding: 32px;" class="text-muted">
                No hay solicitudes registradas en este filtro.
              </td>
            </tr>
          `}
        </tbody>
      </table>
    </div>
  `;

  attachCommonAdminEvents(container);
}

// =========================================================================
// 4. DIRECTORIO DE EMPRENDIMIENTOS Y MIEMBROS
// =========================================================================
export function renderAdminMembersView(container) {
  const workspaces = store.getAllWorkspaces();
  const users = store.getAllUsers();

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <div style="display: flex; align-items: center; gap: 8px;">
          <h2>Emprendimientos y Miembros</h2>
          <span class="badge badge-humm text-xs">${workspaces.length} Registrados</span>
        </div>
        <p>Directorio central de negocios, ubicación geográfica chilena, tutores asignados y estado de membresía.</p>
      </div>
      <div class="view-actions">
        <button class="btn btn-primary btn-sm" id="btn-admin-create-ws">
          + Nuevo Emprendimiento
        </button>
      </div>
    </div>

    <div class="data-table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Emprendimiento / Ubicación</th>
            <th>Titular & Usuario</th>
            <th>Tutor / Correo Apoyo</th>
            <th>Métricas Clave (Mes)</th>
            <th>Membresía</th>
            <th>Estado</th>
            <th>Herramientas</th>
            <th style="text-align: right;">Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${workspaces.map(ws => {
            const wsUser = users.find(u => u.workspaceId === ws.id) || { id: 'usr-none', name: 'Sin usuario', email: ws.email, lastAccess: null, isActive: true };
            const assignedCount = (ws.assignedTools || []).length;
            const advisorName = ws.advisorName || 'Valentina Castro';
            const advisorEmail = ws.advisorEmail || 'valentina@humm.cl';

            const wsSales = store.getSales(ws.id);
            const now = new Date();
            const thisMonthSale = wsSales.find(s => parseInt(s.year, 10) === now.getFullYear() && parseInt(s.month, 10) === (now.getMonth() + 1));
            const monthAmount = thisMonthSale ? thisMonthSale.amount : 0;
            const wsCustomersCount = store.getCustomers(ws.id).length;
            const wsTasksDone = store.getTasks(ws.id).filter(t => t.status === 'done').length;

            const locationText = [ws.comuna || ws.city, ws.locality, ws.region].filter(Boolean).join(', ') || 'Chile';
            const ownerDisplay = ws.ownerName || (ws.ownerFirstName ? `${ws.ownerFirstName} ${ws.ownerLastName}` : wsUser.name);

            return `
              <tr>
                <td>
                  <div style="font-weight: 700; color: var(--text-primary);">${ws.name}</div>
                  ${ws.rut ? `<div class="text-xs" style="color: var(--text-secondary); font-family: monospace; font-size: 11px;">RUT: ${ws.rut}</div>` : ''}
                  <div class="text-xs text-muted" style="margin-top: 2px;">📍 ${locationText} • ${ws.industry || 'Emprendimiento'}</div>
                  ${ws.address ? `<div class="text-xs text-muted" style="font-size: 11px;">🏠 ${ws.address}</div>` : ''}
                </td>
                <td>
                  <div style="font-weight: 700;">${ownerDisplay}</div>
                  <div class="text-xs text-secondary">${wsUser.email}</div>
                  ${ws.phone ? `<div class="text-xs text-muted" style="font-size: 11px;">📞 ${ws.phone}</div>` : ''}
                  <div class="text-xs text-secondary" style="font-size: 11px; margin-top: 2px;">
                    Último acceso: ${wsUser.lastAccess ? formatDateCL(wsUser.lastAccess) : 'Sin ingresos'}
                  </div>
                </td>
                <td>
                  <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px;">
                    <div>
                      <div style="font-weight: 600; font-size: var(--font-size-xs); color: var(--text-primary);">${advisorName}</div>
                      <div style="font-size: 11px; color: var(--humm-red-primary);">${advisorEmail}</div>
                    </div>
                    <button class="btn btn-ghost btn-sm btn-edit-ws-advisor" data-ws-id="${ws.id}" data-ws-name="${ws.name}" data-advisor-name="${advisorName}" data-advisor-email="${advisorEmail}" title="Editar tutor asignado">
                      ✏️
                    </button>
                  </div>
                </td>
                <td>
                  <div style="font-size: var(--font-size-xs); font-weight: 700; color: ${monthAmount > 0 ? 'var(--success)' : 'var(--warning)'};">
                    ${monthAmount > 0 ? formatCLP(monthAmount) : 'Sin venta este mes'}
                  </div>
                  <div class="text-xs text-muted" style="font-size: 11px;">
                    ${wsCustomersCount} clientes • ${wsTasksDone} tareas hechas
                  </div>
                </td>
                <td>
                  <span class="badge badge-neutral text-xs">${ws.membershipType}</span>
                </td>
                <td>
                  <span class="badge ${wsUser.isActive ? 'badge-success' : 'badge-danger'}">
                    <span class="badge-dot"></span>
                    ${wsUser.isActive ? 'Activo' : 'Suspendido'}
                  </span>
                </td>
                <td>
                  <button class="btn btn-ghost btn-sm btn-manage-ws-tools" data-ws-id="${ws.id}" style="font-size: var(--font-size-xs);">
                    ⚙️ ${assignedCount} activas
                  </button>
                </td>
                <td style="text-align: right;">
                  <div style="display: flex; justify-content: flex-end; gap: 4px;">
                    <button class="btn btn-secondary btn-sm btn-audit-ws" data-ws-id="${ws.id}" title="Ver como emprendedor">
                      Ver espacio
                    </button>
                    <button class="btn btn-ghost btn-sm btn-toggle-user-status" data-user-id="${wsUser.id}" title="${wsUser.isActive ? 'Suspender cuenta' : 'Reactivar cuenta'}">
                      ${wsUser.isActive ? '⏸️' : '▶️'}
                    </button>
                    <button class="btn btn-ghost btn-sm btn-reset-pass" data-user-id="${wsUser.id}" data-email="${wsUser.email}" title="Restablecer clave">
                      🔑
                    </button>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  attachCommonAdminEvents(container);
}

// =========================================================================
// 5. CLIENTES DE LA RED
// =========================================================================
export function renderAdminCustomersView(container) {
  const allCustomers = store.getAllCommunityCustomers();
  const filteredCustomers = customerSearchQuery.trim() === ''
    ? allCustomers
    : allCustomers.filter(c => 
        (c.name || '').toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
        (c.email || '').toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
        (c.phone || '').toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
        (c.workspaceName || '').toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
        (c.category || '').toLowerCase().includes(customerSearchQuery.toLowerCase())
      );

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <div style="display: flex; align-items: center; gap: 8px;">
          <h2>Clientes de la Red</h2>
          <span class="badge badge-humm text-xs">${allCustomers.length} Clientes</span>
        </div>
        <p>Base consolidada de todos los contactos y clientes registrados por los emprendedores de la comunidad.</p>
      </div>
    </div>

    <div class="data-table-container">
      <div class="table-toolbar" style="flex-wrap: wrap; gap: 12px;">
        <div style="flex: 1; min-width: 260px;">
          <input type="text" id="admin-customer-search" class="form-control" placeholder="🔍 Buscar por cliente, correo, teléfono o emprendimiento..." value="${customerSearchQuery}" />
        </div>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th>Cliente / Contacto</th>
            <th>Emprendimiento Dueño</th>
            <th>Teléfono / WhatsApp</th>
            <th>Correo Electrónico</th>
            <th>Categoría</th>
            <th>Ubicación</th>
            <th>Última Compra</th>
          </tr>
        </thead>
        <tbody>
          ${filteredCustomers.length > 0 ? filteredCustomers.map(cust => `
            <tr>
              <td>
                <div style="font-weight: 700; color: var(--text-primary);">${cust.name}</div>
                ${cust.notes ? `<div class="text-xs text-muted" style="font-size: 11px;">📝 ${cust.notes}</div>` : ''}
              </td>
              <td>
                <span class="badge badge-neutral text-xs" style="font-weight: 600;">
                  🏢 ${cust.workspaceName}
                </span>
                <div class="text-xs text-muted" style="margin-top: 2px;">${cust.workspaceIndustry}</div>
              </td>
              <td>
                <span style="font-family: monospace; font-size: var(--font-size-xs);">${cust.phone || '-'}</span>
              </td>
              <td>
                <span style="font-size: var(--font-size-xs); color: var(--text-secondary);">${cust.email || '-'}</span>
              </td>
              <td>
                <span class="badge badge-info text-xs">${cust.category || 'General'}</span>
              </td>
              <td>
                <span class="text-xs text-secondary">${cust.city || cust.workspaceCity || 'Chile'}</span>
              </td>
              <td>
                <span class="text-xs text-muted">${cust.lastPurchaseDate ? formatDateCL(cust.lastPurchaseDate) : 'Sin compras'}</span>
              </td>
            </tr>
          `).join('') : `
            <tr>
              <td colspan="7" style="text-align: center; padding: 32px;" class="text-muted">
                No se encontraron clientes que coincidan con la búsqueda.
              </td>
            </tr>
          `}
        </tbody>
      </table>
    </div>
  `;

  const searchInput = container.querySelector('#admin-customer-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      customerSearchQuery = e.target.value;
      renderAdminCustomersView(container);
    });
  }

  attachCommonAdminEvents(container);
}

// =========================================================================
// 6. TUTORES Y EJECUTIVOS HUMM
// =========================================================================
let adminAdvisorsSearchQuery = '';
let adminAdvisorsFilter = 'all';

function openAdvisorAssignmentModalDirect(targetUserId = null, targetWsId = null, preselectedAdvisor = null, container = null) {
  const modal = document.getElementById('modal-edit-ws-advisor');
  const form = document.getElementById('form-admin-edit-advisor');
  if (!modal || !form) return;

  const users = store.getAllUsers();
  const workspaces = store.getAllWorkspaces();
  const targetSelect = document.getElementById('edit-advisor-target-user');
  const advisorSelect = document.getElementById('edit-advisor-select');
  const customFields = document.getElementById('advisor-custom-fields');
  const nameInput = document.getElementById('edit-advisor-name');
  const emailInput = document.getElementById('edit-advisor-email');

  // Poblar select de usuarios y emprendimientos
  if (targetSelect) {
    let optionsHtml = '<optgroup label="👤 Usuarios de la Comunidad">';
    users.filter(u => u.role !== 'admin').forEach(u => {
      const ws = u.workspaceId ? workspaces.find(w => w.id === u.workspaceId) : null;
      const wsText = ws ? ` (${ws.name})` : '';
      const selected = (targetUserId && u.id === targetUserId) ? 'selected' : '';
      optionsHtml += `<option value="user:${u.id}" ${selected}>${u.name} - ${u.email}${wsText}</option>`;
    });
    optionsHtml += '</optgroup><optgroup label="🏢 Emprendimientos Directos">';
    workspaces.forEach(w => {
      const selected = (targetWsId && w.id === targetWsId) ? 'selected' : '';
      optionsHtml += `<option value="ws:${w.id}" ${selected}>${w.name} (Dueño: ${w.ownerName})</option>`;
    });
    optionsHtml += '</optgroup>';
    targetSelect.innerHTML = optionsHtml;
  }

  // Preseleccionar tutor si se proporcionó
  if (advisorSelect) {
    if (preselectedAdvisor) {
      const matching = Array.from(advisorSelect.options).find(opt => opt.value.startsWith(preselectedAdvisor));
      if (matching) {
        advisorSelect.value = matching.value;
        if (customFields) customFields.style.display = 'none';
      } else {
        advisorSelect.value = 'custom';
        if (customFields) {
          customFields.style.display = 'block';
          if (nameInput) nameInput.value = preselectedAdvisor;
        }
      }
    } else {
      advisorSelect.value = 'Valentina Castro|valentina@humm.cl';
      if (customFields) customFields.style.display = 'none';
    }

    advisorSelect.onchange = () => {
      if (advisorSelect.value === 'custom') {
        if (customFields) customFields.style.display = 'block';
      } else {
        if (customFields) customFields.style.display = 'none';
        const [advName, advEmail] = advisorSelect.value.split('|');
        if (nameInput) nameInput.value = advName;
        if (emailInput) emailInput.value = advEmail;
      }
    };
  }

  // Manejar submit del formulario
  form.onsubmit = (e) => {
    e.preventDefault();
    let advisorName = '';
    let advisorEmail = '';

    if (advisorSelect.value === 'custom') {
      advisorName = nameInput ? nameInput.value.trim() : '';
      advisorEmail = emailInput ? emailInput.value.trim() : '';
    } else {
      const parts = advisorSelect.value.split('|');
      advisorName = parts[0];
      advisorEmail = parts[1];
    }

    if (!advisorName || !advisorEmail) {
      if (window.MiHummApp) window.MiHummApp.showToast('Por favor completa el nombre y correo del tutor', 'danger');
      return;
    }

    const selectedTarget = targetSelect ? targetSelect.value : '';
    if (selectedTarget.startsWith('user:')) {
      const uId = selectedTarget.replace('user:', '');
      store.assignAdvisorToUserOrWorkspace({ userId: uId, advisorName, advisorEmail });
      const targetUser = store.getUser(uId);
      const name = targetUser ? targetUser.name : 'Usuario';
      if (window.MiHummApp) window.MiHummApp.showToast(`Tutor "${advisorName}" asignado a ${name}`, 'success');
    } else if (selectedTarget.startsWith('ws:')) {
      const wId = selectedTarget.replace('ws:', '');
      store.assignAdvisorToUserOrWorkspace({ workspaceId: wId, advisorName, advisorEmail });
      const targetWs = store.getWorkspace(wId);
      const name = targetWs ? targetWs.name : 'Emprendimiento';
      if (window.MiHummApp) window.MiHummApp.showToast(`Tutor "${advisorName}" asignado a ${name}`, 'success');
    }

    modal.classList.remove('active');
    document.body.style.overflow = '';
    if (container) renderAdminAdvisorsView(container);
  };

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

export function renderAdminAdvisorsView(container) {
  const advisors = store.getAdvisorsSummary();
  const users = store.getAllUsers().filter(u => u.role !== 'admin');
  const workspaces = store.getAllWorkspaces();

  // Filtrado de usuarios de la comunidad para la tabla
  const filteredUsers = users.filter(u => {
    const ws = u.workspaceId ? workspaces.find(w => w.id === u.workspaceId) : null;
    const advisorName = u.advisorName || (ws ? ws.advisorName : null) || 'Valentina Castro';

    if (adminAdvisorsFilter !== 'all' && advisorName !== adminAdvisorsFilter) {
      return false;
    }

    if (adminAdvisorsSearchQuery.trim() !== '') {
      const q = adminAdvisorsSearchQuery.toLowerCase();
      const userName = (u.name || '').toLowerCase();
      const userEmail = (u.email || '').toLowerCase();
      const wsName = ws ? ws.name.toLowerCase() : '';
      const advName = advisorName.toLowerCase();

      if (!userName.includes(q) && !userEmail.includes(q) && !wsName.includes(q) && !advName.includes(q)) {
        return false;
      }
    }

    return true;
  });

  const totalAssigned = users.length;
  const totalRequests = store.getSupportRequests().length;

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <div style="display: flex; align-items: center; gap: 8px;">
          <h2>Tutores y Ejecutivos Humm</h2>
          <span class="badge badge-humm text-xs">${advisors.length} Tutores Activos</span>
        </div>
        <p>Supervisión del equipo de tutores, asignación de cuentas y gestión personalizada de apoyo para los usuarios y emprendimientos de la comunidad.</p>
      </div>
      <div class="view-actions">
        <button class="btn btn-primary" id="btn-admin-assign-advisor-top">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <line x1="19" y1="8" x2="19" y2="14"></line>
            <line x1="22" y1="11" x2="16" y2="11"></line>
          </svg>
          Asignar Tutor a Usuario
        </button>
      </div>
    </div>

    <!-- TARJETAS DE INDICADORES -->
    <div class="metrics-grid" style="margin-bottom: 24px;">
      <div class="metric-card">
        <div class="metric-card-header">
          <span class="metric-card-title">Tutores & Ejecutivos</span>
          <div class="metric-icon-box" style="background: rgba(229, 56, 59, 0.12); color: var(--humm-red-primary);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
        </div>
        <div class="metric-value">${advisors.length}</div>
        <div class="metric-comparison"><span class="comparison-neutral">Equipo Humm disponible</span></div>
      </div>

      <div class="metric-card">
        <div class="metric-card-header">
          <span class="metric-card-title">Usuarios Asignados</span>
          <div class="metric-icon-box" style="background: rgba(16, 185, 129, 0.12); color: var(--success);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
        </div>
        <div class="metric-value" style="color: var(--success);">${totalAssigned}</div>
        <div class="metric-comparison"><span class="comparison-positive">100% con tutor asignado</span></div>
      </div>

      <div class="metric-card">
        <div class="metric-card-header">
          <span class="metric-card-title">Solicitudes Atendidas</span>
          <div class="metric-icon-box" style="background: rgba(59, 130, 246, 0.12); color: #3B82F6;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
        </div>
        <div class="metric-value">${totalRequests}</div>
        <div class="metric-comparison"><span class="comparison-neutral">Requerimientos de apoyo</span></div>
      </div>

      <div class="metric-card">
        <div class="metric-card-header">
          <span class="metric-card-title">Tiempo de Respuesta</span>
          <div class="metric-icon-box" style="background: rgba(245, 158, 11, 0.12); color: #F59E0B;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
        </div>
        <div class="metric-value" style="font-size: 1.4rem;">&lt; 4 hrs</div>
        <div class="metric-comparison"><span class="comparison-positive">Atención prioritaria</span></div>
      </div>
    </div>

    <!-- SECCIÓN 1: TARJETAS DE TUTORES ACTIVOS -->
    <div style="margin-bottom: 30px;">
      <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 14px; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
        <span>👔</span> Equipo de Tutores y Ejecutivos Asignados
      </h3>
      <div class="grid grid-3" style="gap: 16px;">
        ${advisors.map(adv => {
          const userCount = adv.users ? adv.users.length : adv.workspaces.length;
          return `
            <div class="data-table-container" style="padding: 18px; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 42px; height: 42px; border-radius: 50%; background: var(--humm-red-light); color: var(--humm-red-primary); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.05rem;">
                      ${adv.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    <div>
                      <h4 style="font-size: 14px; font-weight: 700; margin: 0; color: var(--text-primary);">${adv.name}</h4>
                      <div class="text-xs text-muted">${adv.email}</div>
                    </div>
                  </div>
                  <span class="badge badge-info text-xs" style="font-weight: 700;">${userCount} Usuarios</span>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px;">
                  <div style="background: var(--bg-surface-secondary); padding: 8px; border-radius: var(--radius-sm); text-align: center;">
                    <div style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary);">${adv.totalRequestsCount}</div>
                    <div class="text-xs text-muted">Solicitudes</div>
                  </div>
                  <div style="background: var(--bg-surface-secondary); padding: 8px; border-radius: var(--radius-sm); text-align: center;">
                    <div style="font-size: 1.1rem; font-weight: 700; color: ${adv.pendingRequestsCount > 0 ? 'var(--danger)' : 'var(--success)'};">${adv.pendingRequestsCount}</div>
                    <div class="text-xs text-muted">Pendientes</div>
                  </div>
                </div>

                <div style="font-weight: 600; font-size: 11.5px; margin-bottom: 6px; color: var(--text-secondary);">
                  Cuentas a su cargo:
                </div>
                <div style="display: flex; flex-direction: column; gap: 4px; max-height: 120px; overflow-y: auto; margin-bottom: 12px;">
                  ${adv.users && adv.users.length > 0 ? adv.users.map(u => {
                    const ws = u.workspaceId ? workspaces.find(w => w.id === u.workspaceId) : null;
                    return `
                      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11.5px; padding: 4px 8px; background: var(--bg-surface-secondary); border-radius: var(--radius-xs);">
                        <span style="font-weight: 600; color: var(--text-primary);">${u.name}</span>
                        <span class="text-xs text-muted">${ws ? ws.name : 'Comunidad'}</span>
                      </div>
                    `;
                  }).join('') : `
                    <div class="text-xs text-muted" style="padding: 6px 0;">Sin usuarios asignados directamente</div>
                  `}
                </div>
              </div>

              <button class="btn btn-secondary btn-sm btn-assign-to-this-advisor" data-advisor-name="${adv.name}" data-advisor-email="${adv.email}" style="width: 100%; font-size: 12px; font-weight: 600;">
                + Asignar Usuarios a este Tutor
              </button>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- SECCIÓN 2: TABLA GENERAL DE ASIGNACIONES DE USUARIOS -->
    <div class="data-table-container">
      <div class="table-toolbar" style="flex-wrap: wrap; gap: 12px; align-items: center; justify-content: space-between;">
        <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center; flex: 1;">
          <div class="input-with-icon" style="max-width: 280px; min-width: 220px; flex: 1;">
            <span class="input-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
            <input type="text" id="admin-advisors-search" class="form-control" placeholder="Buscar usuario, empresa o tutor..." value="${adminAdvisorsSearchQuery}" />
          </div>

          <div style="min-width: 170px;">
            <select id="admin-advisors-filter" class="form-select" style="font-size: 13px; font-weight: 600; padding: 7px 10px;">
              <option value="all" ${adminAdvisorsFilter === 'all' ? 'selected' : ''}>👔 Todos los tutores</option>
              ${advisors.map(adv => `<option value="${adv.name}" ${adminAdvisorsFilter === adv.name ? 'selected' : ''}>${adv.name}</option>`).join('')}
            </select>
          </div>

          ${(adminAdvisorsSearchQuery || adminAdvisorsFilter !== 'all') ? `
            <button class="btn btn-ghost btn-sm" id="btn-clear-advisors-filters" style="font-size: 12px; color: var(--humm-red-primary); padding: 6px 10px; font-weight: 700;">
              ✕ Limpiar filtros
            </button>
          ` : ''}
        </div>

        <div style="font-size: 13px; color: var(--text-secondary); background: var(--bg-body); padding: 7px 14px; border-radius: var(--radius-md); border: 1px solid var(--border-color); white-space: nowrap;">
          <strong>${filteredUsers.length}</strong> usuarios listados
        </div>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th>Usuario de la Comunidad</th>
            <th>Emprendimiento</th>
            <th>Tutor / Ejecutivo Asignado</th>
            <th>Correo de Soporte Humm</th>
            <th>Estado</th>
            <th style="text-align: right;">Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${filteredUsers.length > 0 ? filteredUsers.map(u => {
            const ws = u.workspaceId ? workspaces.find(w => w.id === u.workspaceId) : null;
            const currentAdvName = u.advisorName || (ws ? ws.advisorName : null) || 'Valentina Castro';
            const currentAdvEmail = u.advisorEmail || (ws ? ws.advisorEmail : null) || 'valentina@humm.cl';

            return `
              <tr>
                <td>
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 36px; height: 36px; border-radius: 50%; background: var(--humm-red-primary); color: #FFF; font-weight: 700; font-size: 13px; display: flex; align-items: center; justify-content: center;">
                      ${u.avatar || u.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style="font-weight: 700; color: var(--text-primary);">${u.name}</div>
                      <div class="text-xs text-muted">${u.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  ${ws ? `
                    <div style="font-weight: 600; color: var(--text-primary);">${ws.name}</div>
                    <div class="text-xs text-muted">${ws.industry || 'Comunidad Humm'}</div>
                  ` : `
                    <span class="text-xs text-muted">Acceso Central</span>
                  `}
                </td>
                <td>
                  <span class="badge badge-info text-xs" style="font-size: 12px; font-weight: 700; padding: 4px 8px;">
                    👔 ${currentAdvName}
                  </span>
                </td>
                <td style="font-family: monospace; font-size: 12px; color: var(--text-secondary);">
                  ${currentAdvEmail}
                </td>
                <td>
                  <span class="badge ${u.isActive !== false ? 'badge-success' : 'badge-danger'} text-xs">
                    ${u.isActive !== false ? '🟢 Activo' : '🔴 Inactivo'}
                  </span>
                </td>
                <td style="text-align: right;">
                  <button class="btn btn-primary btn-sm btn-reassign-user-advisor" data-user-id="${u.id}" data-ws-id="${u.workspaceId || ''}" data-advisor-name="${currentAdvName}" style="font-size: 11.5px; font-weight: 600; padding: 5px 10px;">
                    👔 Asignar / Cambiar Tutor
                  </button>
                </td>
              </tr>
            `;
          }).join('') : `
            <tr>
              <td colspan="6" style="text-align: center; padding: 40px;">
                <div style="font-size: 28px; margin-bottom: 8px;">👔</div>
                <div style="font-weight: 700; color: var(--text-primary);">No se encontraron usuarios</div>
                <p class="text-xs text-muted" style="margin-top: 4px;">Intenta cambiar los filtros o el término de búsqueda.</p>
              </td>
            </tr>
          `}
        </tbody>
      </table>
    </div>
  `;

  // Listeners de búsqueda y filtros
  const searchInput = container.querySelector('#admin-advisors-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      adminAdvisorsSearchQuery = e.target.value;
      renderAdminAdvisorsView(container);
      const updated = container.querySelector('#admin-advisors-search');
      if (updated) {
        updated.focus();
        updated.setSelectionRange(updated.value.length, updated.value.length);
      }
    });
  }

  container.querySelector('#admin-advisors-filter')?.addEventListener('change', (e) => {
    adminAdvisorsFilter = e.target.value;
    renderAdminAdvisorsView(container);
  });

  container.querySelector('#btn-clear-advisors-filters')?.addEventListener('click', () => {
    adminAdvisorsSearchQuery = '';
    adminAdvisorsFilter = 'all';
    renderAdminAdvisorsView(container);
  });

  // Botón superior Asignar Tutor
  container.querySelector('#btn-admin-assign-advisor-top')?.addEventListener('click', (e) => {
    e.preventDefault();
    openAdvisorAssignmentModalDirect(null, null, null, container);
  });

  // Botones de asignar a este tutor desde las tarjetas
  container.querySelectorAll('.btn-assign-to-this-advisor').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const advName = btn.getAttribute('data-advisor-name');
      openAdvisorAssignmentModalDirect(null, null, advName, container);
    });
  });

  // Botones de reasignar en cada fila de usuario
  container.querySelectorAll('.btn-reassign-user-advisor').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const userId = btn.getAttribute('data-user-id');
      const wsId = btn.getAttribute('data-ws-id');
      const advName = btn.getAttribute('data-advisor-name');
      openAdvisorAssignmentModalDirect(userId, wsId, advName, container);
    });
  });
}

// =========================================================================
// 7. CATÁLOGO DE HERRAMIENTAS
// =========================================================================
export function renderAdminToolsView(container) {
  const tools = store.getAllTools();

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <div style="display: flex; align-items: center; gap: 8px;">
          <h2>Catálogo Global de Herramientas Humm</h2>
          <span class="badge badge-humm text-xs">${tools.length} Herramientas</span>
        </div>
        <p>Herramientas y soluciones digitales disponibles para activar en los planes de los emprendedores.</p>
      </div>
      <div class="view-actions">
        <button class="btn btn-primary btn-sm" id="btn-admin-new-tool">
          + Nueva Herramienta
        </button>
      </div>
    </div>

    <div class="data-table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Nombre & Herramienta</th>
            <th>Categoría</th>
            <th>Descripción</th>
            <th>URL / Enlace</th>
            <th>Estado</th>
            <th style="text-align: right;">Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${tools.map(tool => `
            <tr>
              <td>
                <div style="font-weight: 700;">${tool.name}</div>
              </td>
              <td>
                <span class="badge badge-neutral text-xs">${tool.category}</span>
              </td>
              <td class="text-xs text-secondary" style="max-width: 250px;">
                ${tool.description}
              </td>
              <td style="font-family: monospace; font-size: 11px; color: var(--text-muted);">
                ${tool.url}
              </td>
              <td>
                <span class="badge ${tool.status === 'disponible' ? 'badge-success' : 'badge-info'}">
                  ${tool.status}
                </span>
              </td>
              <td style="text-align: right;">
                <button class="btn btn-ghost btn-sm btn-edit-tool" data-tool-id="${tool.id}" title="Editar herramienta">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                  </svg>
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  attachCommonAdminEvents(container);
}

// =========================================================================
// 8. COMUNICADOS, NOTICIAS & OFERTAS A LA COMUNIDAD
// =========================================================================
export function renderAdminBroadcastsView(container) {
  const broadcasts = store.getBroadcasts();
  const workspaces = store.getAllWorkspaces();
  const allCustomers = store.getAllCommunityCustomers();

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <div style="display: flex; align-items: center; gap: 8px;">
          <h2>Comunicados, Noticias y Ofertas</h2>
          <span class="badge badge-humm text-xs">${broadcasts.length} Difundidos</span>
        </div>
        <p>Envío de mensajes masivos, anuncios, beneficios comerciales, talleres y ofertas a todos los miembros y clientes de la comunidad.</p>
      </div>
      <div class="view-actions">
        <button class="btn btn-primary btn-sm" id="btn-admin-new-broadcast">
          📢 + Redactar Comunicado
        </button>
      </div>
    </div>

    <!-- METRICAS DE ALCANCE -->
    <div class="metrics-grid" style="margin-bottom: 24px;">
      <div class="metric-card">
        <div class="metric-card-header">
          <span class="metric-card-title">Emprendimientos Alcanzables</span>
          <div class="metric-card-icon">🏢</div>
        </div>
        <div class="metric-card-value">${workspaces.length}</div>
        <div class="metric-card-footer">
          <span class="text-xs text-muted">Reciben alertas en su escritorio Mi Humm</span>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-card-header">
          <span class="metric-card-title">Clientes en la Red</span>
          <div class="metric-card-icon">👥</div>
        </div>
        <div class="metric-card-value">${allCustomers.length}</div>
        <div class="metric-card-footer">
          <span class="text-xs text-muted">Contactos registrados en la base global</span>
        </div>
      </div>

      <div class="metric-card" style="border-left: 3px solid var(--success);">
        <div class="metric-card-header">
          <span class="metric-card-title">Total Comunicados</span>
          <div class="metric-card-icon">📢</div>
        </div>
        <div class="metric-card-value" style="color: var(--success);">${broadcasts.length}</div>
        <div class="metric-card-footer">
          <span class="text-xs text-muted">Difusiones activas e históricas</span>
        </div>
      </div>
    </div>

    <!-- LISTADO DE COMUNICADOS DIFUNDIDOS -->
    <div class="data-table-container">
      <div class="table-toolbar">
        <div>
          <div style="font-weight: 700; font-size: var(--font-size-md);">
            Historial de Comunicados Enviados
          </div>
          <div class="text-xs text-muted">Mensajes visibles en los escritorios de los miembros y enviados por canales oficiales</div>
        </div>
      </div>

      <div style="padding: 16px; display: flex; flex-direction: column; gap: 16px;">
        ${broadcasts.length > 0 ? broadcasts.map(bc => {
          const categoryBadge = bc.category.includes('Oferta') 
            ? 'badge-success' 
            : bc.category.includes('Taller') 
              ? 'badge-info' 
              : bc.category.includes('Alerta') 
                ? 'badge-danger' 
                : 'badge-humm';

          return `
            <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 18px; position: relative;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 8px; flex-wrap: wrap;">
                <div>
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                    <span class="badge ${categoryBadge} text-xs">${bc.category}</span>
                    <span class="badge badge-neutral text-xs">🎯 ${bc.targetAudience}</span>
                    <span class="text-xs text-muted">📅 ${formatDateCL(bc.createdAt)}</span>
                  </div>
                  <h3 style="font-size: var(--font-size-base); font-weight: 700; color: var(--text-primary); margin: 0;">
                    ${bc.title}
                  </h3>
                </div>

                <button class="btn btn-ghost btn-sm btn-delete-broadcast" data-bc-id="${bc.id}" title="Eliminar comunicado" style="color: var(--text-muted);">
                  🗑️
                </button>
              </div>

              <p style="font-size: var(--font-size-sm); color: var(--text-secondary); line-height: 1.45; margin-bottom: 12px; white-space: pre-line;">
                ${bc.content}
              </p>

              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: 10px; font-size: var(--font-size-xs); color: var(--text-muted); flex-wrap: wrap; gap: 8px;">
                <div>
                  👤 Publicado por: <strong>${bc.authorName}</strong>
                </div>
                <div style="display: flex; gap: 6px; align-items: center;">
                  <span>Canales:</span>
                  ${(bc.channels || ['Mi Humm']).map(ch => `<span class="badge badge-neutral text-xs">${ch}</span>`).join('')}
                </div>
              </div>
            </div>
          `;
        }).join('') : `
          <div style="text-align: center; padding: 40px; color: var(--text-muted);">
            No hay comunicados difundidos aún. Haz clic en <strong>"📢 + Redactar Comunicado"</strong> para enviar la primera noticia u oferta.
          </div>
        `}
      </div>
    </div>
  `;

  attachCommonAdminEvents(container);
}

// =========================================================================
// 9. ALIANZAS Y DESCUENTOS DE EMPRESAS PARA LA COMUNIDAD
// =========================================================================
export function renderAdminDiscountsView(container) {
  const discounts = store.getCompanyDiscounts();

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <div style="display: flex; align-items: center; gap: 8px;">
          <h2>Alianzas y Descuentos de Empresas</h2>
          <span class="badge badge-humm text-xs">${discounts.length} Convenios</span>
        </div>
        <p>Crea y administra las tarjetas de beneficios y descuentos que visualizan los emprendedores en su plataforma.</p>
      </div>
      <div class="view-actions">
        <button class="btn btn-primary btn-sm" id="btn-admin-new-discount">
          🎁 + Nueva Alianza / Descuento
        </button>
      </div>
    </div>

    <div class="data-table-container">
      <div class="table-toolbar">
        <div>
          <div style="font-weight: 700; font-size: var(--font-size-md);">
            Convenios Activos para Emprendedores (${discounts.length})
          </div>
          <div class="text-xs text-muted">Beneficios visibles en la sección "Beneficios & Descuentos" de los miembros</div>
        </div>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th>Empresa / Aliado</th>
            <th>Beneficio / Descuento</th>
            <th>Categoría</th>
            <th>Código Promocional</th>
            <th>Vigencia</th>
            <th>Estado</th>
            <th style="text-align: right;">Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${discounts.length > 0 ? discounts.map(item => `
            <tr>
              <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <div style="width: 38px; height: 38px; border-radius: var(--radius-md); background: var(--bg-surface-secondary); display: flex; align-items: center; justify-content: center; font-size: 1.4rem; border: 1px solid var(--border-subtle); overflow: hidden; flex-shrink: 0; padding: 2px;">
                    ${item.logo && (item.logo.startsWith('data:image/') || item.logo.startsWith('http://') || item.logo.startsWith('https://') || item.logo.startsWith('/')) 
                      ? `<img src="${item.logo}" alt="${item.companyName}" style="width: 100%; height: 100%; object-fit: contain;" />` 
                      : `<span>${item.logo || '🎁'}</span>`}
                  </div>
                  <div>
                    <div style="font-weight: 700; color: var(--text-primary);">${item.companyName}</div>
                    ${item.featured ? `<span class="badge badge-humm text-xs" style="font-size: 10px; padding: 1px 6px;">⭐ Destacado</span>` : ''}
                  </div>
                </div>
              </td>
              <td>
                <div style="font-weight: 700; color: var(--humm-red-primary); font-size: var(--font-size-sm);">${item.discountTitle}</div>
                <div class="text-xs text-secondary" style="max-width: 280px; line-height: 1.35; margin-top: 2px;">
                  ${item.description}
                </div>
              </td>
              <td>
                <span class="badge badge-neutral text-xs">${item.category}</span>
              </td>
              <td>
                ${item.code ? `<span style="font-family: monospace; font-weight: 700; font-size: 12px; background: var(--bg-surface-secondary); padding: 3px 8px; border-radius: 4px; border: 1px dashed var(--border-strong);">${item.code}</span>` : '<span class="text-xs text-muted">Sin código</span>'}
              </td>
              <td>
                <span class="text-xs text-secondary">${item.expiresAt ? formatDateCL(item.expiresAt) : 'Permanente'}</span>
              </td>
              <td>
                <span class="badge ${item.status === 'active' ? 'badge-success' : 'badge-neutral'}">
                  <span class="badge-dot"></span>
                  ${item.status === 'active' ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td style="text-align: right;">
                <div style="display: flex; justify-content: flex-end; gap: 4px;">
                  <button class="btn btn-ghost btn-sm btn-edit-discount" data-disc-id="${item.id}" title="Editar beneficio">
                    ✏️
                  </button>
                  <button class="btn btn-ghost btn-sm btn-delete-discount" data-disc-id="${item.id}" title="Eliminar beneficio" style="color: var(--danger);">
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          `).join('') : `
            <tr>
              <td colspan="7" style="text-align: center; padding: 32px;" class="text-muted">
                No hay alianzas creadas aún. Haz clic en "+ Nueva Alianza / Descuento" para agregar la primera.
              </td>
            </tr>
          `}
        </tbody>
      </table>
    </div>
  `;

  attachCommonAdminEvents(container);
}

// =========================================================================
// LISTENERS Y ACCIONES COMUNES DEL PANEL ADMINISTRADOR
// =========================================================================
function attachCommonAdminEvents(container) {
  // Navegación interna entre vistas administrativas
  container.querySelectorAll('.btn-nav-action').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetView = btn.getAttribute('data-nav-target');
      if (targetView) {
        window.location.hash = `#${targetView}`;
      }
    });
  });

  // Filtros de Alertas
  container.querySelectorAll('.alert-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentAlertFilter = btn.getAttribute('data-filter');
      renderAdminAlertsView(container);
    });
  });

  // Filtros de Solicitudes
  container.querySelectorAll('.req-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentRequestFilter = btn.getAttribute('data-filter');
      renderAdminRequestsView(container);
    });
  });

  // Auditar / Ver espacio
  container.querySelectorAll('.btn-audit-ws').forEach(btn => {
    btn.addEventListener('click', () => {
      const wsId = btn.getAttribute('data-ws-id');
      auth.impersonateWorkspace(wsId);
      window.location.hash = '#inicio';
      if (window.MiHummApp) {
        window.MiHummApp.showToast(`Visualizando espacio como Administrador Humm`, 'info');
        window.MiHummApp.checkAuthenticationState();
        window.MiHummApp.handleHashChange();
      }
    });
  });

  // Activar / Suspender usuario
  container.querySelectorAll('.btn-toggle-user-status').forEach(btn => {
    btn.addEventListener('click', () => {
      const userId = btn.getAttribute('data-user-id');
      const targetUser = store.getUser(userId);
      if (!targetUser) return;
      const newActive = !targetUser.isActive;
      store.updateUser(userId, { isActive: newActive });
      if (window.MiHummApp) {
        window.MiHummApp.showToast(`Cuenta ${newActive ? 'reactivada' : 'suspendida temporalmente'}`, 'success');
        renderAdminMembersView(container);
      }
    });
  });

  // Restablecer contraseña
  container.querySelectorAll('.btn-reset-pass').forEach(btn => {
    btn.addEventListener('click', () => {
      const userId = btn.getAttribute('data-user-id');
      const email = btn.getAttribute('data-email');
      const newPass = prompt(`Ingresa la nueva contraseña para ${email}:`, 'humm2026');
      if (newPass && newPass.trim().length >= 4) {
        store.updateUser(userId, { password: newPass.trim() });
        if (window.MiHummApp) window.MiHummApp.showToast(`Contraseña restablecida exitosamente`, 'success');
      }
    });
  });

  // Administrar herramientas de un workspace
  container.querySelectorAll('.btn-manage-ws-tools').forEach(btn => {
    btn.addEventListener('click', () => {
      const wsId = btn.getAttribute('data-ws-id');
      if (window.MiHummApp) window.MiHummApp.openManageWsToolsModal(wsId);
    });
  });

  // Crear nuevo workspace
  container.querySelector('#btn-admin-create-ws')?.addEventListener('click', () => {
    if (window.MiHummApp) window.MiHummApp.openModal('modal-create-ws');
  });

  // Crear nuevo usuario
  container.querySelector('#btn-admin-create-user')?.addEventListener('click', () => {
    if (window.MiHummApp) window.MiHummApp.openModal('modal-create-user');
  });

  // Crear nueva herramienta
  container.querySelector('#btn-admin-new-tool')?.addEventListener('click', () => {
    if (window.MiHummApp) window.MiHummApp.openModal('modal-tool-edit');
  });

  // Editar tutor/ejecutivo asignado a un workspace
  container.querySelectorAll('.btn-edit-ws-advisor').forEach(btn => {
    btn.addEventListener('click', () => {
      const wsId = btn.getAttribute('data-ws-id');
      const wsName = btn.getAttribute('data-ws-name');
      const advName = btn.getAttribute('data-advisor-name');
      const advEmail = btn.getAttribute('data-advisor-email');
      if (window.MiHummApp) {
        window.MiHummApp.openEditWsAdvisorModal(wsId, wsName, advName, advEmail);
      }
    });
  });

  // Cambiar estado de solicitud de requerimiento
  container.querySelectorAll('.admin-change-req-status').forEach(select => {
    select.addEventListener('change', (e) => {
      const reqId = select.getAttribute('data-req-id');
      const newStatus = e.target.value;
      store.updateSupportRequestStatus(reqId, newStatus);
      if (window.MiHummApp) {
        window.MiHummApp.showToast(`Estado de requerimiento actualizado a ${newStatus}`, 'success');
        renderAdminRequestsView(container);
      }
    });
  });

  // Crear nuevo comunicado
  container.querySelector('#btn-admin-new-broadcast')?.addEventListener('click', () => {
    if (window.MiHummApp) window.MiHummApp.openModal('modal-create-broadcast');
  });

  // Eliminar comunicado
  container.querySelectorAll('.btn-delete-broadcast').forEach(btn => {
    btn.addEventListener('click', () => {
      const bcId = btn.getAttribute('data-bc-id');
      if (confirm('¿Estás seguro de que deseas eliminar este comunicado?')) {
        store.deleteBroadcast(bcId);
        if (window.MiHummApp) {
          window.MiHummApp.showToast('Comunicado eliminado', 'info');
          renderAdminBroadcastsView(container);
        }
      }
    });
  });

  // Crear nuevo beneficio/descuento de empresa
  container.querySelector('#btn-admin-new-discount')?.addEventListener('click', () => {
    if (window.MiHummApp) window.MiHummApp.openCompanyDiscountModal();
  });

  // Editar beneficio/descuento de empresa
  container.querySelectorAll('.btn-edit-discount').forEach(btn => {
    btn.addEventListener('click', () => {
      const discId = btn.getAttribute('data-disc-id');
      if (window.MiHummApp) window.MiHummApp.openCompanyDiscountModal(discId);
    });
  });

  // Eliminar beneficio/descuento de empresa
  container.querySelectorAll('.btn-delete-discount').forEach(btn => {
    btn.addEventListener('click', () => {
      const discId = btn.getAttribute('data-disc-id');
      if (confirm('¿Estás seguro de que deseas eliminar este convenio/descuento?')) {
        store.deleteCompanyDiscount(discId);
        if (window.MiHummApp) {
          window.MiHummApp.showToast('Beneficio eliminado', 'info');
          renderAdminDiscountsView(container);
        }
      }
    });
  });

  // Editar herramienta
  container.querySelectorAll('.btn-edit-tool').forEach(btn => {
    btn.addEventListener('click', () => {
      const toolId = btn.getAttribute('data-tool-id');
      if (window.MiHummApp) window.MiHummApp.openEditToolModal(toolId);
    });
  });
}

// =========================================================================
// 10. GESTIÓN DE USUARIOS DE LA COMUNIDAD (CREAR, ACTIVAR/DESACTIVAR, HERRAMIENTAS)
// =========================================================================
let adminUsersSearchQuery = '';
let adminUsersRoleFilter = 'all';
let adminUsersStatusFilter = 'all';

function openAdminUserModalDirect(userId = null, container = null) {
  const modal = document.getElementById('modal-create-user');
  const form = document.getElementById('form-admin-create-user');
  if (!modal || !form) return;

  const allTools = store.getAllTools();
  const workspaces = store.getAllWorkspaces();
  const wsSelect = document.getElementById('admin-user-workspace');
  const toolsContainer = document.getElementById('admin-user-tools-list');
  const headerTitle = document.getElementById('modal-user-header-title');
  const nameInput = document.getElementById('admin-user-name');
  const emailInput = document.getElementById('admin-user-email');
  const passwordInput = document.getElementById('admin-user-password');
  const passwordHint = document.getElementById('admin-user-password-hint');
  const roleSelect = document.getElementById('admin-user-role');
  const activeCheckbox = document.getElementById('admin-user-is-active');
  const submitBtn = document.getElementById('btn-save-admin-user');

  // Cargar workspaces en el select
  if (wsSelect) {
    wsSelect.innerHTML = `
      <option value="">-- Sin asignar / Staff Central --</option>
      ${workspaces.map(w => `<option value="${w.id}">${w.name} (${w.ownerName})</option>`).join('')}
    `;
  }

  if (userId) {
    const user = store.getUser(userId);
    if (!user) return;

    form.setAttribute('data-edit-id', user.id);
    if (headerTitle) headerTitle.textContent = `Editar Usuario: ${user.name}`;
    if (nameInput) nameInput.value = user.name || '';
    if (emailInput) emailInput.value = user.email || '';
    if (passwordInput) {
      passwordInput.value = '';
      passwordInput.removeAttribute('required');
    }
    if (passwordHint) passwordHint.textContent = 'Dejar vacío para mantener la contraseña actual';
    if (roleSelect) roleSelect.value = user.role || 'entrepreneur';
    if (wsSelect) wsSelect.value = user.workspaceId || '';
    if (activeCheckbox) activeCheckbox.checked = user.isActive !== false;
    if (submitBtn) submitBtn.textContent = 'Guardar Cambios';

    // Herramientas asignadas
    const assigned = user.assignedToolIds || [];
    if (toolsContainer) {
      toolsContainer.innerHTML = allTools.map(t => {
        const isChecked = assigned.length === 0 || assigned.includes(t.id);
        return `
          <label style="display: flex; align-items: center; gap: 8px; font-size: 12.5px; cursor: pointer; padding: 6px 8px; border-radius: var(--radius-xs); background: var(--bg-surface); border: 1px solid var(--border-color);">
            <input type="checkbox" class="user-tool-checkbox" value="${t.id}" ${isChecked ? 'checked' : ''} style="width: 16px; height: 16px; accent-color: var(--humm-red-primary);" />
            <span style="font-weight: 600; color: var(--text-primary);">${t.name}</span>
          </label>
        `;
      }).join('');
    }
  } else {
    form.removeAttribute('data-edit-id');
    form.reset();
    if (headerTitle) headerTitle.textContent = 'Crear Usuario de la Comunidad';
    if (passwordInput) {
      passwordInput.value = 'humm2026';
      passwordInput.setAttribute('required', 'required');
    }
    if (passwordHint) passwordHint.textContent = 'Contraseña inicial: humm2026';
    if (roleSelect) roleSelect.value = 'entrepreneur';
    if (activeCheckbox) activeCheckbox.checked = true;
    if (submitBtn) submitBtn.textContent = 'Crear Usuario';

    if (toolsContainer) {
      toolsContainer.innerHTML = allTools.map(t => {
        return `
          <label style="display: flex; align-items: center; gap: 8px; font-size: 12.5px; cursor: pointer; padding: 6px 8px; border-radius: var(--radius-xs); background: var(--bg-surface); border: 1px solid var(--border-color);">
            <input type="checkbox" class="user-tool-checkbox" value="${t.id}" checked style="width: 16px; height: 16px; accent-color: var(--humm-red-primary);" />
            <span style="font-weight: 600; color: var(--text-primary);">${t.name}</span>
          </label>
        `;
      }).join('');
    }
  }

  // Configurar botones de marcar / desmarcar todas las herramientas
  const btnSelectAll = document.getElementById('btn-select-all-user-tools');
  if (btnSelectAll) {
    btnSelectAll.onclick = (e) => {
      e.preventDefault();
      document.querySelectorAll('.user-tool-checkbox').forEach(cb => cb.checked = true);
    };
  }

  const btnUnselectAll = document.getElementById('btn-unselect-all-user-tools');
  if (btnUnselectAll) {
    btnUnselectAll.onclick = (e) => {
      e.preventDefault();
      document.querySelectorAll('.user-tool-checkbox').forEach(cb => cb.checked = false);
    };
  }

  // Submit directo del formulario
  form.onsubmit = (e) => {
    e.preventDefault();
    const editId = form.getAttribute('data-edit-id');
    const name = (nameInput ? nameInput.value : '').trim();
    const email = (emailInput ? emailInput.value : '').trim();
    const password = (passwordInput ? passwordInput.value : '').trim();
    const role = roleSelect ? roleSelect.value : 'entrepreneur';
    const workspaceId = (wsSelect && wsSelect.value) ? wsSelect.value : null;
    const isActive = activeCheckbox ? activeCheckbox.checked : true;

    const toolCheckboxes = document.querySelectorAll('.user-tool-checkbox');
    const assignedToolIds = Array.from(toolCheckboxes).filter(cb => cb.checked).map(cb => cb.value);

    if (editId) {
      const updates = { name, email, role, workspaceId, isActive, assignedToolIds };
      if (password) updates.password = password;
      store.updateUser(editId, updates);
      if (window.MiHummApp && window.MiHummApp.showToast) {
        window.MiHummApp.showToast(`Usuario "${name}" actualizado con éxito`, 'success');
      }
    } else {
      store.createUser({
        name,
        email,
        password: password || 'humm2026',
        role,
        workspaceId,
        isActive,
        assignedToolIds
      });
      if (window.MiHummApp && window.MiHummApp.showToast) {
        window.MiHummApp.showToast(`Usuario "${name}" creado con éxito`, 'success');
      }
    }

    modal.classList.remove('active');
    document.body.style.overflow = '';
    if (container) renderAdminUsersView(container);
  };

  // Abrir modal
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

export function renderAdminUsersView(container) {
  const users = store.getAllUsers();
  const workspaces = store.getAllWorkspaces();
  const tools = store.getAllTools();

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.isActive).length;
  const inactiveUsers = users.filter(u => !u.isActive).length;
  const entrepreneurUsers = users.filter(u => u.role === 'entrepreneur').length;

  const filteredUsers = users.filter(u => {
    if (adminUsersRoleFilter !== 'all' && u.role !== adminUsersRoleFilter) return false;
    if (adminUsersStatusFilter === 'active' && !u.isActive) return false;
    if (adminUsersStatusFilter === 'inactive' && u.isActive) return false;

    if (adminUsersSearchQuery.trim() !== '') {
      const q = adminUsersSearchQuery.toLowerCase();
      const ws = u.workspaceId ? workspaces.find(w => w.id === u.workspaceId) : null;
      const wsName = ws ? ws.name.toLowerCase() : '';
      const userName = (u.name || '').toLowerCase();
      const userEmail = (u.email || '').toLowerCase();

      if (!userName.includes(q) && !userEmail.includes(q) && !wsName.includes(q)) {
        return false;
      }
    }

    return true;
  });

  const isFiltered = adminUsersSearchQuery.trim() !== '' || adminUsersRoleFilter !== 'all' || adminUsersStatusFilter !== 'all';

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <div style="display: flex; align-items: center; gap: 8px;">
          <h2>Usuarios de la Comunidad Humm</h2>
          <span class="badge badge-primary text-xs">${users.length} Registrados</span>
        </div>
        <p>Administra las cuentas de acceso, activa o desactiva miembros y define las herramientas Humm habilitadas para cada usuario.</p>
      </div>
      <div class="view-actions">
        <button class="btn btn-primary" id="btn-admin-create-user-page">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Crear Usuario
        </button>
      </div>
    </div>

    <!-- TARJETAS DE INDICADORES -->
    <div class="metrics-grid" style="margin-bottom: 24px;">
      <!-- Total Usuarios -->
      <div class="metric-card">
        <div class="metric-card-header">
          <span class="metric-card-title">Total Usuarios</span>
          <div class="metric-icon-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
        </div>
        <div class="metric-value">${totalUsers}</div>
        <div class="metric-comparison"><span class="comparison-neutral">Cuentas en plataforma</span></div>
      </div>

      <!-- Usuarios Activos -->
      <div class="metric-card">
        <div class="metric-card-header">
          <span class="metric-card-title">Usuarios Activos</span>
          <div class="metric-icon-box" style="background: rgba(16, 185, 129, 0.12); color: var(--success);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
        </div>
        <div class="metric-value" style="color: var(--success);">${activeUsers}</div>
        <div class="metric-comparison"><span class="comparison-positive">🟢 Acceso permitido</span></div>
      </div>

      <!-- Usuarios Desactivados / Inactivos -->
      <div class="metric-card">
        <div class="metric-card-header">
          <span class="metric-card-title">Cuentas Desactivadas</span>
          <div class="metric-icon-box" style="background: rgba(239, 68, 68, 0.12); color: var(--danger);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
        </div>
        <div class="metric-value" style="color: ${inactiveUsers > 0 ? 'var(--danger)' : 'var(--text-muted)'};">${inactiveUsers}</div>
        <div class="metric-comparison"><span class="${inactiveUsers > 0 ? 'comparison-negative' : 'comparison-neutral'}">🔴 Acceso bloqueado</span></div>
      </div>

      <!-- Emprendedores vs Staff -->
      <div class="metric-card">
        <div class="metric-card-header">
          <span class="metric-card-title">Emprendedores</span>
          <div class="metric-icon-box" style="background: rgba(229, 56, 59, 0.12); color: var(--humm-red-primary);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
        </div>
        <div class="metric-value">${entrepreneurUsers}</div>
        <div class="metric-comparison"><span class="comparison-neutral">${users.length - entrepreneurUsers} equipo / asesores</span></div>
      </div>
    </div>

    <!-- TABLA DE USUARIOS Y GESTIÓN DE ACCESOS -->
    <div class="data-table-container">
      <!-- BARRA DE HERRAMIENTAS Y FILTROS -->
      <div class="table-toolbar" style="flex-wrap: wrap; gap: 12px; align-items: center; justify-content: space-between;">
        <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center; flex: 1;">
          <!-- Buscador -->
          <div class="input-with-icon" style="max-width: 280px; min-width: 220px; flex: 1;">
            <span class="input-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
            <input type="text" id="admin-users-search" class="form-control" placeholder="Buscar por nombre, correo o empresa..." value="${adminUsersSearchQuery}" />
          </div>

          <!-- Filtro Rol -->
          <div style="min-width: 150px;">
            <select id="admin-users-role-filter" class="form-select" style="font-size: 13px; font-weight: 600; padding: 7px 10px;">
              <option value="all" ${adminUsersRoleFilter === 'all' ? 'selected' : ''}>👥 Todos los roles</option>
              <option value="entrepreneur" ${adminUsersRoleFilter === 'entrepreneur' ? 'selected' : ''}>🚀 Emprendedores</option>
              <option value="advisor" ${adminUsersRoleFilter === 'advisor' ? 'selected' : ''}>👔 Asesores / Tutores</option>
              <option value="admin" ${adminUsersRoleFilter === 'admin' ? 'selected' : ''}>🛡️ Administradores</option>
            </select>
          </div>

          <!-- Filtro Estado -->
          <div style="min-width: 140px;">
            <select id="admin-users-status-filter" class="form-select" style="font-size: 13px; font-weight: 600; padding: 7px 10px;">
              <option value="all" ${adminUsersStatusFilter === 'all' ? 'selected' : ''}>⚡ Todos los estados</option>
              <option value="active" ${adminUsersStatusFilter === 'active' ? 'selected' : ''}>🟢 Solo Activos</option>
              <option value="inactive" ${adminUsersStatusFilter === 'inactive' ? 'selected' : ''}>🔴 Solo Desactivados</option>
            </select>
          </div>

          ${isFiltered ? `
            <button class="btn btn-ghost btn-sm" id="btn-clear-admin-users-filters" style="font-size: 12px; color: var(--humm-red-primary); padding: 6px 10px; font-weight: 700;">
              ✕ Limpiar filtros
            </button>
          ` : ''}
        </div>

        <div style="font-size: 13px; color: var(--text-secondary); background: var(--bg-body); padding: 7px 14px; border-radius: var(--radius-md); border: 1px solid var(--border-color); white-space: nowrap;">
          <strong>${filteredUsers.length}</strong> ${filteredUsers.length === 1 ? 'usuario' : 'usuarios'} listados
        </div>
      </div>

      <!-- TABLA PRINCIPAL -->
      <table class="data-table">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Rol</th>
            <th>Emprendimiento</th>
            <th>Herramientas Habilitadas</th>
            <th>Estado de Acceso</th>
            <th style="text-align: right;">Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${filteredUsers.length > 0 ? filteredUsers.map(u => {
            const ws = u.workspaceId ? workspaces.find(w => w.id === u.workspaceId) : null;
            const assignedTools = u.assignedToolIds || [];
            const isAllTools = assignedTools.length === 0 || assignedTools.length >= tools.length;

            let roleBadge = '<span class="badge badge-humm text-xs">🚀 Emprendedor</span>';
            if (u.role === 'admin') {
              roleBadge = '<span class="badge badge-neutral text-xs" style="background: rgba(100, 116, 139, 0.2); color: var(--text-primary); font-weight: 700;">🛡️ Administrador</span>';
            } else if (u.role === 'advisor') {
              roleBadge = '<span class="badge badge-info text-xs">👔 Asesor / Tutor</span>';
            }

            return `
              <tr style="${!u.isActive ? 'opacity: 0.85; background: rgba(239, 68, 68, 0.03);' : ''}">
                <td>
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 36px; height: 36px; border-radius: 50%; background: ${u.isActive ? 'var(--humm-red-primary)' : '#94A3B8'}; color: #FFF; font-weight: 700; font-size: 13px; display: flex; align-items: center; justify-content: center;">
                      ${u.avatar || u.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style="font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                        ${u.name}
                        ${!u.isActive ? '<span class="badge badge-danger text-xs" style="padding: 1px 6px; font-size: 10px;">Bloqueado</span>' : ''}
                      </div>
                      <div class="text-xs text-muted">${u.email}</div>
                    </div>
                  </div>
                </td>
                <td>${roleBadge}</td>
                <td>
                  ${ws ? `
                    <div style="font-weight: 600; color: var(--text-primary);">${ws.name}</div>
                    <div class="text-xs text-muted">${ws.industry || 'Comunidad Humm'}</div>
                  ` : `
                    <span class="text-xs text-muted">Staff Central</span>
                  `}
                </td>
                <td>
                  <div style="display: flex; flex-wrap: wrap; gap: 4px; max-width: 260px;">
                    ${isAllTools ? `
                      <span class="badge badge-success text-xs" style="font-weight: 600;">
                        🌐 Todas habilitadas (${tools.length})
                      </span>
                    ` : assignedTools.map(tId => {
                      const t = tools.find(item => item.id === tId);
                      return t ? `<span class="badge badge-neutral text-xs" style="font-size: 10.5px; padding: 2px 6px;">${t.name}</span>` : '';
                    }).join('')}
                  </div>
                </td>
                <td>
                  <!-- UN SOLO BOTÓN INTERACTIVO DE ESTADO (ACTIVAR / DESACTIVAR) -->
                  <button class="btn btn-sm btn-toggle-user-active" data-user-id="${u.id}" title="Haz clic para ${u.isActive ? 'desactivar' : 'activar'} la cuenta" style="font-size: 11.5px; font-weight: 700; padding: 5px 10px; border-radius: var(--radius-sm); border: 1.5px solid ${u.isActive ? 'var(--success)' : 'var(--danger)'}; background: ${u.isActive ? 'var(--success-bg)' : 'var(--danger-bg)'}; color: ${u.isActive ? 'var(--success)' : 'var(--danger)'}; cursor: pointer;">
                    ${u.isActive ? '🟢 Activo (Desactivar)' : '🔴 Inactivo (Activar)'}
                  </button>
                </td>
                <td style="text-align: right;">
                  <div style="display: inline-flex; gap: 6px; align-items: center;">
                    <!-- Botón Editar Usuario Completo -->
                    <button class="btn btn-secondary btn-sm btn-edit-user-full" data-user-id="${u.id}" title="Editar datos y asignar/quitar herramientas" style="font-size: 12px; font-weight: 600; padding: 5px 10px;">
                      ✏️ Editar Usuario
                    </button>

                    ${u.role !== 'admin' ? `
                      <!-- Botón Eliminar -->
                      <button class="btn btn-ghost btn-sm btn-delete-admin-user" data-user-id="${u.id}" title="Eliminar usuario permanentemente" style="color: var(--danger); padding: 5px 8px;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    ` : ''}
                  </div>
                </td>
              </tr>
            `;
          }).join('') : `
            <tr>
              <td colspan="6" style="text-align: center; padding: 40px;">
                <div style="font-size: 28px; margin-bottom: 8px;">👥</div>
                <div style="font-weight: 700; color: var(--text-primary);">No se encontraron usuarios</div>
                <p class="text-xs text-muted" style="margin-top: 4px;">Intenta cambiar los filtros de búsqueda o rol.</p>
              </td>
            </tr>
          `}
        </tbody>
      </table>
    </div>
  `;

  // Event Listeners específicos de la vista de usuarios
  const searchInput = container.querySelector('#admin-users-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      adminUsersSearchQuery = e.target.value;
      renderAdminUsersView(container);
      const updated = container.querySelector('#admin-users-search');
      if (updated) {
        updated.focus();
        updated.setSelectionRange(updated.value.length, updated.value.length);
      }
    });
  }

  container.querySelector('#admin-users-role-filter')?.addEventListener('change', (e) => {
    adminUsersRoleFilter = e.target.value;
    renderAdminUsersView(container);
  });

  container.querySelector('#admin-users-status-filter')?.addEventListener('change', (e) => {
    adminUsersStatusFilter = e.target.value;
    renderAdminUsersView(container);
  });

  container.querySelector('#btn-clear-admin-users-filters')?.addEventListener('click', () => {
    adminUsersSearchQuery = '';
    adminUsersRoleFilter = 'all';
    adminUsersStatusFilter = 'all';
    renderAdminUsersView(container);
  });

  // Botón superior Crear Usuario
  container.querySelector('#btn-admin-create-user-page')?.addEventListener('click', (e) => {
    e.preventDefault();
    openAdminUserModalDirect(null, container);
  });

  // Toggle Activo / Inactivo en 1 solo botón
  container.querySelectorAll('.btn-toggle-user-active').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const userId = btn.getAttribute('data-user-id');
      const updatedUser = store.toggleUserStatus(userId);
      if (updatedUser) {
        const msg = updatedUser.isActive
          ? `Usuario "${updatedUser.name}" activado exitosamente.`
          : `Usuario "${updatedUser.name}" desactivado. Su acceso ha sido bloqueado.`;
        if (window.MiHummApp && window.MiHummApp.showToast) {
          window.MiHummApp.showToast(msg, updatedUser.isActive ? 'success' : 'info');
        }
        renderAdminUsersView(container);
      }
    });
  });

  // Editar usuario completo y herramientas
  container.querySelectorAll('.btn-edit-user-full').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const userId = btn.getAttribute('data-user-id');
      openAdminUserModalDirect(userId, container);
    });
  });

  // Eliminar usuario
  container.querySelectorAll('.btn-delete-admin-user').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const userId = btn.getAttribute('data-user-id');
      const user = store.getUser(userId);
      if (confirm(`¿Estás seguro de que deseas eliminar permanentemente la cuenta de ${user ? user.name : 'este usuario'}?`)) {
        store.deleteUser(userId);
        if (window.MiHummApp && window.MiHummApp.showToast) {
          window.MiHummApp.showToast('Usuario eliminado del sistema', 'info');
        }
        renderAdminUsersView(container);
      }
    });
  });
}

// =========================================================================
// 11. VENTAS, SUSCRIPCIONES Y COBROS RECURRENTES (ADMINISTRACIÓN)
// =========================================================================
let adminSubSearchQuery = '';
let adminSubPlanFilter = 'all';
let adminSubStatusFilter = 'all';
let adminSubPaymentFilter = 'all';
let selectedSubscriptionIds = new Set();

/**
 * Modal para Crear / Editar Planes de Venta Mensual
 */
function openAdminPlanModalDirect(planId = null, container = null) {
  const modal = document.getElementById('modal-admin-plan');
  const form = document.getElementById('form-admin-plan');
  if (!modal || !form) return;

  const headerTitle = document.getElementById('modal-plan-header-title');
  const nameInput = document.getElementById('admin-plan-name');
  const priceInput = document.getElementById('admin-plan-price');
  const trialInput = document.getElementById('admin-plan-trial-days');
  const descInput = document.getElementById('admin-plan-desc');
  const featInput = document.getElementById('admin-plan-features');
  const statusSelect = document.getElementById('admin-plan-status');
  const submitBtn = document.getElementById('btn-save-admin-plan');

  if (planId) {
    const plan = store.getSubscriptionPlan(planId);
    if (!plan) return;

    form.setAttribute('data-edit-id', plan.id);
    if (headerTitle) headerTitle.textContent = `🏷️ Editar Plan: ${plan.name}`;
    if (nameInput) nameInput.value = plan.name || '';
    if (priceInput) priceInput.value = plan.price || '';
    if (trialInput) trialInput.value = plan.trialDays !== undefined ? plan.trialDays : 14;
    if (descInput) descInput.value = plan.description || '';
    if (featInput) featInput.value = Array.isArray(plan.features) ? plan.features.join('\n') : (plan.features || '');
    if (statusSelect) statusSelect.value = plan.status || 'active';
    if (submitBtn) submitBtn.textContent = 'Guardar Cambios';
  } else {
    form.removeAttribute('data-edit-id');
    form.reset();
    if (headerTitle) headerTitle.textContent = '🏷️ Crear Nuevo Plan de Venta Mensual';
    if (trialInput) trialInput.value = 14;
    if (statusSelect) statusSelect.value = 'active';
    if (submitBtn) submitBtn.textContent = 'Guardar Plan de Venta';
  }

  form.onsubmit = (e) => {
    e.preventDefault();
    const editId = form.getAttribute('data-edit-id');
    const name = nameInput.value.trim();
    const price = parseInt(priceInput.value) || 0;
    const trialDays = parseInt(trialInput.value) || 0;
    const description = descInput.value.trim();
    const features = featInput.value.split('\n').map(f => f.trim()).filter(Boolean);
    const status = statusSelect.value;

    if (editId) {
      store.updateSubscriptionPlan(editId, { name, price, trialDays, description, features, status });
      if (window.MiHummApp) window.MiHummApp.showToast(`Plan "${name}" actualizado con éxito`, 'success');
    } else {
      store.createSubscriptionPlan({ name, price, trialDays, description, features, status });
      if (window.MiHummApp) window.MiHummApp.showToast(`Plan "${name}" creado exitosamente`, 'success');
    }

    modal.classList.remove('active');
    document.body.style.overflow = '';
    if (container) renderAdminSubscriptionsView(container);
  };

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

/**
 * Modal para Enviar Link de Pago (WhatsApp / Correo) Individual o Masivo
 */
function openSendPaymentLinkModalDirect(subIds = [], container = null) {
  const modal = document.getElementById('modal-admin-send-payment-link');
  const form = document.getElementById('form-admin-send-payment-link');
  if (!modal || !form) return;

  const allSubs = store.getClientSubscriptions();
  const targetSubs = allSubs.filter(s => subIds.includes(s.id));
  if (targetSubs.length === 0) return;

  const recipientsSummary = document.getElementById('payment-link-recipients-summary');
  const messageInput = document.getElementById('payment-link-custom-message');
  const previewBox = document.getElementById('payment-link-preview-box');

  // Resumen de destinatarios
  if (recipientsSummary) {
    if (targetSubs.length === 1) {
      const sub = targetSubs[0];
      recipientsSummary.innerHTML = `
        <strong>${sub.clientName}</strong> (${sub.businessName}) &bull; Tel: <code>${sub.clientPhone}</code> &bull; Correo: <code>${sub.clientEmail}</code>
        <div style="margin-top: 4px; font-weight: 700; color: var(--humm-red-primary);">Plan: ${sub.planName} &bull; ${formatCLP(sub.monthlyPrice)} / mes +IVA</div>
      `;
    } else {
      recipientsSummary.innerHTML = `
        <strong>${targetSubs.length} clientes seleccionados:</strong> ${targetSubs.map(s => s.clientName).join(', ')}
        <div style="margin-top: 4px; font-weight: 700; color: var(--humm-red-primary);">Monto total estimado: ${formatCLP(targetSubs.reduce((acc, s) => acc + s.monthlyPrice, 0))} +IVA</div>
      `;
    }
  }

  // Plantilla por defecto
  const defaultTemplate = `Hola {NOMBRE}! Te compartimos el link de pago para tu suscripción a {PLAN} en Mi Humm por {MONTO} +IVA.\n\nPuedes realizar tu pago seguro aquí:\n{LINK_PAGO}\n\nFecha de corte: {FECHA_CORTE}.\n¡Muchas gracias por formar parte de la comunidad Humm!`;
  if (messageInput) {
    messageInput.value = defaultTemplate;
  }

  // Actualizar vista previa
  const updatePreview = () => {
    if (!previewBox || !messageInput) return;
    const sampleSub = targetSubs[0];
    const previewText = messageInput.value
      .replace(/{NOMBRE}/g, sampleSub.clientName)
      .replace(/{PLAN}/g, sampleSub.planName)
      .replace(/{MONTO}/g, `${formatCLP(sampleSub.monthlyPrice)} +IVA`)
      .replace(/{LINK_PAGO}/g, sampleSub.paymentLink)
      .replace(/{FECHA_CORTE}/g, formatDateCL(sampleSub.nextBillingDate));
    previewBox.textContent = previewText;
  };

  if (messageInput) {
    messageInput.oninput = updatePreview;
  }
  updatePreview();

  form.onsubmit = (e) => {
    e.preventDefault();
    const selectedChannel = form.querySelector('input[name="payment_channel"]:checked')?.value || 'whatsapp';
    const customMessage = messageInput ? messageInput.value : '';

    const results = store.sendSubscriptionPaymentLinks({
      subIds: targetSubs.map(s => s.id),
      channel: selectedChannel,
      customMessage
    });

    if (results.length === 1 && (selectedChannel === 'whatsapp' || selectedChannel === 'both')) {
      window.open(results[0].waUrl, '_blank');
    }

    if (window.MiHummApp) {
      const channelLabel = selectedChannel === 'whatsapp' ? 'WhatsApp' : (selectedChannel === 'email' ? 'Correo Electrónico' : 'WhatsApp y Correo');
      window.MiHummApp.showToast(`Link de pago emitido exitosamente a ${results.length} cliente(s) vía ${channelLabel}`, 'success');
    }

    selectedSubscriptionIds.clear();
    modal.classList.remove('active');
    document.body.style.overflow = '';
    if (container) renderAdminSubscriptionsView(container);
  };

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

/**
 * Modal para Configurar y Editar Suscripción de Cliente
 */
function openEditSubscriptionModalDirect(subId, container = null) {
  const modal = document.getElementById('modal-admin-edit-subscription');
  const form = document.getElementById('form-admin-edit-subscription');
  if (!modal || !form) return;

  const sub = store.getClientSubscription(subId);
  if (!sub) return;

  const plans = store.getSubscriptionPlans();

  const clientNameEl = document.getElementById('admin-sub-client-name');
  const clientEmailEl = document.getElementById('admin-sub-client-email');
  const clientBadgeEl = document.getElementById('admin-sub-client-badge');
  const planSelect = document.getElementById('admin-sub-plan-select');
  const priceInput = document.getElementById('admin-sub-price');
  const statusSelect = document.getElementById('admin-sub-status');
  const trialDaysInput = document.getElementById('admin-sub-trial-days');
  const paymentStatusSelect = document.getElementById('admin-sub-payment-status');
  const phoneInput = document.getElementById('admin-sub-phone');
  const joinedDateInput = document.getElementById('admin-sub-joined-date');
  const nextBillingInput = document.getElementById('admin-sub-next-billing');

  if (clientNameEl) clientNameEl.textContent = sub.clientName;
  if (clientEmailEl) clientEmailEl.textContent = sub.clientEmail;
  if (clientBadgeEl) clientBadgeEl.textContent = sub.businessName;

  if (planSelect) {
    planSelect.innerHTML = plans.map(p => `
      <option value="${p.id}" ${p.id === sub.planId ? 'selected' : ''}>${p.name} (${formatCLP(p.price)}/mes +IVA)</option>
    `).join('');

    planSelect.onchange = () => {
      const selectedP = plans.find(p => p.id === planSelect.value);
      if (selectedP && priceInput) {
        priceInput.value = selectedP.price;
      }
    };
  }

  if (priceInput) priceInput.value = sub.monthlyPrice || 0;
  if (statusSelect) statusSelect.value = sub.status || 'active';
  if (trialDaysInput) trialDaysInput.value = sub.trialDaysLeft || 0;
  if (paymentStatusSelect) paymentStatusSelect.value = sub.paymentStatus || 'pending';
  if (phoneInput) phoneInput.value = sub.clientPhone || '';
  if (joinedDateInput) joinedDateInput.value = sub.joinedDate || '';
  if (nextBillingInput) nextBillingInput.value = sub.nextBillingDate || '';

  form.onsubmit = (e) => {
    e.preventDefault();
    const planId = planSelect ? planSelect.value : sub.planId;
    const monthlyPrice = parseInt(priceInput.value) || 0;
    const status = statusSelect.value;
    const trialDaysLeft = parseInt(trialDaysInput.value) || 0;
    const isTrial = status === 'trial' || trialDaysLeft > 0;
    const paymentStatus = paymentStatusSelect.value;
    const clientPhone = phoneInput.value.trim();
    const joinedDate = joinedDateInput.value;
    const nextBillingDate = nextBillingInput.value;

    const selectedPlan = plans.find(p => p.id === planId);
    const planName = selectedPlan ? selectedPlan.name : sub.planName;

    store.updateClientSubscription(sub.id, {
      planId,
      planName,
      monthlyPrice,
      status,
      trialDaysLeft,
      isTrial,
      paymentStatus,
      clientPhone,
      joinedDate,
      nextBillingDate
    });

    if (window.MiHummApp) {
      window.MiHummApp.showToast(`Condiciones de suscripción actualizadas para ${sub.clientName}`, 'success');
    }

    modal.classList.remove('active');
    document.body.style.overflow = '';
    if (container) renderAdminSubscriptionsView(container);
  };

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

/**
 * VISTA PRINCIPAL: Ventas, Suscripciones y Cobros Recurrentes
 */
export function renderAdminSubscriptionsView(container) {
  const plans = store.getSubscriptionPlans();
  const subscriptions = store.getClientSubscriptions();

  // Métricas
  const totalMRR = subscriptions
    .filter(s => s.status === 'active' || s.paymentStatus === 'paid')
    .reduce((acc, s) => acc + (s.monthlyPrice || 0), 0);

  const activePayingCount = subscriptions.filter(s => s.status === 'active' && !s.isTrial).length;
  const trialCount = subscriptions.filter(s => s.isTrial || s.status === 'trial').length;
  const overdueCount = subscriptions.filter(s => s.paymentStatus === 'overdue' || s.status === 'overdue').length;
  const paidCount = subscriptions.filter(s => s.paymentStatus === 'paid').length;

  // Filtrado de suscripciones
  const filteredSubs = subscriptions.filter(s => {
    if (adminSubPlanFilter !== 'all' && s.planId !== adminSubPlanFilter) return false;
    if (adminSubStatusFilter === 'active' && (s.status !== 'active' || s.isTrial)) return false;
    if (adminSubStatusFilter === 'trial' && !s.isTrial && s.status !== 'trial') return false;
    if (adminSubStatusFilter === 'overdue' && s.status !== 'overdue' && s.paymentStatus !== 'overdue') return false;

    if (adminSubPaymentFilter === 'paid' && s.paymentStatus !== 'paid') return false;
    if (adminSubPaymentFilter === 'pending' && s.paymentStatus !== 'pending') return false;
    if (adminSubPaymentFilter === 'overdue' && s.paymentStatus !== 'overdue') return false;

    if (adminSubSearchQuery.trim() !== '') {
      const q = adminSubSearchQuery.toLowerCase();
      const name = (s.clientName || '').toLowerCase();
      const email = (s.clientEmail || '').toLowerCase();
      const phone = (s.clientPhone || '').toLowerCase();
      const bName = (s.businessName || '').toLowerCase();
      const pName = (s.planName || '').toLowerCase();

      if (!name.includes(q) && !email.includes(q) && !phone.includes(q) && !bName.includes(q) && !pName.includes(q)) {
        return false;
      }
    }

    return true;
  });

  const isFiltered = adminSubSearchQuery || adminSubPlanFilter !== 'all' || adminSubStatusFilter !== 'all' || adminSubPaymentFilter !== 'all';
  const hasSelection = selectedSubscriptionIds.size > 0;

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <div style="display: flex; align-items: center; gap: 8px;">
          <h2>Ventas, Suscripciones y Cobros</h2>
          <span class="badge badge-primary text-xs">${subscriptions.length} Clientes</span>
        </div>
        <p>Controla las condiciones de venta mensual, períodos de prueba gratuitos, valores de cobro y emite links de pago por WhatsApp o Correo.</p>
      </div>
      <div class="view-actions" style="display: flex; gap: 8px; flex-wrap: wrap;">
        <button class="btn btn-secondary" id="btn-admin-open-plan-create">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Nuevo Plan de Venta
        </button>
        <button class="btn btn-primary" id="btn-admin-bulk-send-top">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
          Enviar Link de Cobro
        </button>
      </div>
    </div>

    <!-- SECCIÓN 1: GESTIÓN DE PLANES DE VENTA MENSUAL -->
    <div style="margin-bottom: 28px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
        <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin: 0; display: flex; align-items: center; gap: 8px;">
          <span>🏷️</span> Planes de Venta Mensual Humm
        </h3>
        <span class="text-xs text-muted">Asigna estos planes a los clientes según su etapa de crecimiento.</span>
      </div>

      <div class="grid grid-3" style="gap: 16px;">
        ${plans.map(plan => {
          const subsInPlan = subscriptions.filter(s => s.planId === plan.id).length;
          return `
            <div class="data-table-container" style="padding: 20px; display: flex; flex-direction: column; justify-content: space-between; position: relative; border-top: 4px solid var(--humm-red-primary);">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                  <h4 style="font-size: 15px; font-weight: 800; color: var(--text-primary); margin: 0;">${plan.name}</h4>
                  <span class="badge badge-primary text-xs" style="font-weight: 700;">${subsInPlan} Clientes</span>
                </div>

                <div style="display: flex; align-items: baseline; gap: 6px; margin-bottom: 8px;">
                  <span style="font-size: 1.6rem; font-weight: 800; color: var(--humm-red-primary);">${formatCLP(plan.price)}</span>
                  <span style="font-size: 12px; color: var(--text-muted); font-weight: 600;">/ mes +IVA</span>
                </div>

                <div style="margin-bottom: 12px;">
                  ${plan.trialDays > 0 ? `
                    <span class="badge badge-warning text-xs" style="font-weight: 700;">
                      🎁 ${plan.trialDays} días de prueba gratis
                    </span>
                  ` : `
                    <span class="badge badge-success text-xs" style="font-weight: 700;">
                      ⚡ Cobro directo (Sin prueba)
                    </span>
                  `}
                </div>

                <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.4; margin-bottom: 12px;">
                  ${plan.description}
                </p>

                <div style="font-size: 11.5px; color: var(--text-secondary); margin-bottom: 14px;">
                  ${Array.isArray(plan.features) ? plan.features.map(f => `
                    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                      <span style="color: var(--success); font-weight: 800;">✓</span>
                      <span>${f}</span>
                    </div>
                  `).join('') : ''}
                </div>
              </div>

              <div style="display: flex; gap: 6px; border-top: 1px solid var(--border-color); padding-top: 12px;">
                <button class="btn btn-secondary btn-sm btn-edit-plan" data-plan-id="${plan.id}" style="flex: 1; font-size: 11.5px; font-weight: 700;">
                  ✏️ Editar Plan
                </button>
                <button class="btn btn-ghost btn-sm btn-delete-plan" data-plan-id="${plan.id}" title="Eliminar plan" style="color: var(--danger); padding: 4px 8px;">
                  🗑️
                </button>
              </div>
            </div>
          `;
        }).join('')}

        <!-- Tarjeta Rápida Nuevo Plan -->
        <div class="data-table-container" style="padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 220px; border: 2px dashed var(--border-color); background: var(--bg-body); cursor: pointer;" id="card-quick-create-plan">
          <div style="width: 44px; height: 44px; border-radius: 50%; background: var(--bg-surface); display: flex; align-items: center; justify-content: center; font-size: 20px; margin-bottom: 10px; color: var(--humm-red-primary);">
            +
          </div>
          <div style="font-weight: 700; color: var(--text-primary); font-size: 14px;">Crear Nuevo Plan</div>
          <p class="text-xs text-muted" style="margin: 4px 0 0 0; text-align: center;">Define un nuevo valor mensual y días de prueba para la comunidad.</p>
        </div>
      </div>
    </div>

    <!-- SECCIÓN 2: INDICADORES CLAVE DE VENTAS & COBROS -->
    <div class="metrics-grid" style="margin-bottom: 24px;">
      <div class="metric-card">
        <div class="metric-card-header">
          <span class="metric-card-title">MRR Estimado</span>
          <div class="metric-icon-box" style="background: rgba(16, 185, 129, 0.12); color: var(--success);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
        </div>
        <div class="metric-value" style="color: var(--success); font-size: 1.5rem;">${formatCLP(totalMRR)}</div>
        <div class="metric-comparison"><span class="comparison-positive">Ingreso mensual recurrente</span></div>
      </div>

      <div class="metric-card">
        <div class="metric-card-header">
          <span class="metric-card-title">Suscripciones Activas</span>
          <div class="metric-icon-box" style="background: rgba(229, 56, 59, 0.12); color: var(--humm-red-primary);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
        </div>
        <div class="metric-value">${activePayingCount}</div>
        <div class="metric-comparison"><span class="comparison-neutral">Clientes pagando al día</span></div>
      </div>

      <div class="metric-card">
        <div class="metric-card-header">
          <span class="metric-card-title">En Período de Prueba</span>
          <div class="metric-icon-box" style="background: rgba(245, 158, 11, 0.12); color: #F59E0B;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
        </div>
        <div class="metric-value" style="color: #F59E0B;">${trialCount}</div>
        <div class="metric-comparison"><span class="comparison-neutral">Prueba gratuita en curso</span></div>
      </div>

      <div class="metric-card">
        <div class="metric-card-header">
          <span class="metric-card-title">Cobros Pendientes / Vencidos</span>
          <div class="metric-icon-box" style="background: rgba(239, 68, 68, 0.12); color: var(--danger);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
        </div>
        <div class="metric-value" style="color: ${overdueCount > 0 ? 'var(--danger)' : 'var(--text-muted)'};">${overdueCount}</div>
        <div class="metric-comparison"><span class="${overdueCount > 0 ? 'comparison-negative' : 'comparison-positive'}">${overdueCount > 0 ? 'Requieren envío de link de pago' : 'Todos al día'}</span></div>
      </div>
    </div>

    <!-- BARRA FLOTANTE DE ACCIONES MASIVAS -->
    ${hasSelection ? `
      <div style="background: var(--bg-surface-elevated); border: 2px solid var(--humm-red-primary); padding: 12px 18px; border-radius: var(--radius-lg); margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; box-shadow: var(--shadow-modal);">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span class="badge badge-primary text-xs" style="font-size: 13px; font-weight: 800; padding: 4px 10px;">
            ⚡ ${selectedSubscriptionIds.size} ${selectedSubscriptionIds.size === 1 ? 'cliente seleccionado' : 'clientes seleccionados'}
          </span>
          <span style="font-size: 13px; font-weight: 600; color: var(--text-primary);">
            Acciones masivas de cobro y links de pago:
          </span>
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button class="btn btn-sm" id="btn-bulk-whatsapp" style="background: #25D366; color: #FFF; font-weight: 700; border: none; font-size: 12px; padding: 6px 12px;">
            📱 Enviar por WhatsApp (${selectedSubscriptionIds.size})
          </button>
          <button class="btn btn-primary btn-sm" id="btn-bulk-email" style="font-weight: 700; font-size: 12px; padding: 6px 12px;">
            ✉️ Enviar por Correo (${selectedSubscriptionIds.size})
          </button>
          <button class="btn btn-secondary btn-sm" id="btn-bulk-mark-paid" style="font-weight: 600; font-size: 12px; padding: 6px 12px;">
            ✓ Marcar Pagados
          </button>
          <button class="btn btn-ghost btn-sm" id="btn-bulk-clear-selection" style="font-size: 12px; color: var(--text-muted);">
            ✕ Desmarcar
          </button>
        </div>
      </div>
    ` : ''}

    <!-- SECCIÓN 3: TABLA DE CLIENTES, CONDICIONES Y COBROS -->
    <div class="data-table-container">
      <div class="table-toolbar" style="flex-wrap: wrap; gap: 12px; align-items: center; justify-content: space-between;">
        <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center; flex: 1;">
          <!-- Buscador -->
          <div class="input-with-icon" style="max-width: 280px; min-width: 220px; flex: 1;">
            <span class="input-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
            <input type="text" id="admin-sub-search" class="form-control" placeholder="Buscar cliente, empresa o teléfono..." value="${adminSubSearchQuery}" />
          </div>

          <!-- Filtro Plan -->
          <div style="min-width: 160px;">
            <select id="admin-sub-plan-filter" class="form-select" style="font-size: 13px; font-weight: 600; padding: 7px 10px;">
              <option value="all" ${adminSubPlanFilter === 'all' ? 'selected' : ''}>🏷️ Todos los planes</option>
              ${plans.map(p => `<option value="${p.id}" ${adminSubPlanFilter === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}
            </select>
          </div>

          <!-- Filtro Condición -->
          <div style="min-width: 160px;">
            <select id="admin-sub-status-filter" class="form-select" style="font-size: 13px; font-weight: 600; padding: 7px 10px;">
              <option value="all" ${adminSubStatusFilter === 'all' ? 'selected' : ''}>⚡ Todas las condiciones</option>
              <option value="active" ${adminSubStatusFilter === 'active' ? 'selected' : ''}>🟢 Suscripción Activa</option>
              <option value="trial" ${adminSubStatusFilter === 'trial' ? 'selected' : ''}>🟡 En Período de Prueba</option>
              <option value="overdue" ${adminSubStatusFilter === 'overdue' ? 'selected' : ''}>🔴 Pago Vencido</option>
            </select>
          </div>

          <!-- Filtro Estado de Pago -->
          <div style="min-width: 150px;">
            <select id="admin-sub-payment-filter" class="form-select" style="font-size: 13px; font-weight: 600; padding: 7px 10px;">
              <option value="all" ${adminSubPaymentFilter === 'all' ? 'selected' : ''}>💳 Estado de Pago</option>
              <option value="paid" ${adminSubPaymentFilter === 'paid' ? 'selected' : ''}>🟢 Pagado al día</option>
              <option value="pending" ${adminSubPaymentFilter === 'pending' ? 'selected' : ''}>🟡 Pendiente</option>
              <option value="overdue" ${adminSubPaymentFilter === 'overdue' ? 'selected' : ''}>🔴 Vencido</option>
            </select>
          </div>

          ${isFiltered ? `
            <button class="btn btn-ghost btn-sm" id="btn-clear-sub-filters" style="font-size: 12px; color: var(--humm-red-primary); padding: 6px 10px; font-weight: 700;">
              ✕ Limpiar filtros
            </button>
          ` : ''}
        </div>

        <div style="font-size: 13px; color: var(--text-secondary); background: var(--bg-body); padding: 7px 14px; border-radius: var(--radius-md); border: 1px solid var(--border-color); white-space: nowrap;">
          <strong>${filteredSubs.length}</strong> clientes listados
        </div>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 40px; text-align: center;">
              <input type="checkbox" id="sub-select-all" style="width: 16px; height: 16px; accent-color: var(--humm-red-primary); cursor: pointer;" ${filteredSubs.length > 0 && filteredSubs.every(s => selectedSubscriptionIds.has(s.id)) ? 'checked' : ''} />
            </th>
            <th>Cliente / Emprendedor</th>
            <th>Emprendimiento</th>
            <th>Fecha Ingreso</th>
            <th>Plan & Valor Mensual</th>
            <th>Condición / Período</th>
            <th>Estado de Pago</th>
            <th style="text-align: right;">Acciones de Cobro</th>
          </tr>
        </thead>
        <tbody>
          ${filteredSubs.length > 0 ? filteredSubs.map(sub => {
            const isSelected = selectedSubscriptionIds.has(sub.id);
            return `
              <tr style="${isSelected ? 'background: rgba(229, 56, 59, 0.05);' : ''}">
                <td style="text-align: center;">
                  <input type="checkbox" class="sub-row-checkbox" data-sub-id="${sub.id}" ${isSelected ? 'checked' : ''} style="width: 16px; height: 16px; accent-color: var(--humm-red-primary); cursor: pointer;" />
                </td>
                <td>
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 36px; height: 36px; border-radius: 50%; background: var(--humm-red-primary); color: #FFF; font-weight: 700; font-size: 13px; display: flex; align-items: center; justify-content: center;">
                      ${sub.clientName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    <div>
                      <div style="font-weight: 700; color: var(--text-primary);">${sub.clientName}</div>
                      <div class="text-xs text-muted">${sub.clientEmail}</div>
                      <div class="text-xs" style="color: #25D366; font-weight: 600; display: flex; align-items: center; gap: 4px; margin-top: 2px;">
                        <span>📱</span> ${sub.clientPhone || 'Sin teléfono'}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style="font-weight: 600; color: var(--text-primary);">${sub.businessName}</div>
                </td>
                <td style="font-size: 12px; color: var(--text-secondary);">
                  ${formatDateCL(sub.joinedDate)}
                </td>
                <td>
                  <div>
                    <span class="badge badge-neutral text-xs" style="font-weight: 700; margin-bottom: 2px;">
                      ${sub.planName}
                    </span>
                    <div style="font-size: 13px; font-weight: 800; color: var(--text-primary);">
                      ${formatCLP(sub.monthlyPrice)} <span style="font-size: 10.5px; font-weight: normal; color: var(--text-muted);">/ mes +IVA</span>
                    </div>
                  </div>
                </td>
                <td>
                  ${sub.isTrial || sub.status === 'trial' ? `
                    <div>
                      <span class="badge badge-warning text-xs" style="font-weight: 700;">
                        🟡 Prueba (${sub.trialDaysLeft} días rest.)
                      </span>
                      <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
                        Corte: ${formatDateCL(sub.nextBillingDate)}
                      </div>
                    </div>
                  ` : sub.status === 'overdue' ? `
                    <span class="badge badge-danger text-xs" style="font-weight: 700;">
                      🔴 Pago Vencido
                    </span>
                  ` : `
                    <div>
                      <span class="badge badge-success text-xs" style="font-weight: 700;">
                        🟢 Suscripción Activa
                      </span>
                      <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
                        Próx: ${formatDateCL(sub.nextBillingDate)}
                      </div>
                    </div>
                  `}
                </td>
                <td>
                  ${sub.paymentStatus === 'paid' ? `
                    <span class="badge badge-success text-xs" style="font-weight: 700; padding: 4px 8px;">
                      🟢 Al día (Pagado)
                    </span>
                  ` : sub.paymentStatus === 'overdue' ? `
                    <span class="badge badge-danger text-xs" style="font-weight: 700; padding: 4px 8px;">
                      🔴 Vencido
                    </span>
                  ` : `
                    <span class="badge badge-warning text-xs" style="font-weight: 700; padding: 4px 8px;">
                      🟡 Pendiente
                    </span>
                  `}
                </td>
                <td style="text-align: right;">
                  <div style="display: inline-flex; gap: 6px; align-items: center;">
                    <!-- Botón Enviar Link de Pago -->
                    <button class="btn btn-primary btn-sm btn-send-single-link" data-sub-id="${sub.id}" title="Enviar link de pago por WhatsApp o Correo" style="font-size: 11.5px; font-weight: 700; padding: 5px 10px;">
                      💳 Enviar Link
                    </button>

                    <!-- Botón Editar Condición -->
                    <button class="btn btn-secondary btn-sm btn-edit-single-sub" data-sub-id="${sub.id}" title="Modificar plan, valor de cobro o período" style="font-size: 11.5px; font-weight: 600; padding: 5px 8px;">
                      ⚙️
                    </button>

                    <!-- Botón Marcar Pagado -->
                    ${sub.paymentStatus !== 'paid' ? `
                      <button class="btn btn-ghost btn-sm btn-mark-single-paid" data-sub-id="${sub.id}" title="Marcar como pagado este mes" style="color: var(--success); font-weight: 800; padding: 5px 8px; border: 1px solid var(--border-color);">
                        ✓
                      </button>
                    ` : ''}
                  </div>
                </td>
              </tr>
            `;
          }).join('') : `
            <tr>
              <td colspan="8" style="text-align: center; padding: 40px;">
                <div style="font-size: 28px; margin-bottom: 8px;">💳</div>
                <div style="font-weight: 700; color: var(--text-primary);">No se encontraron clientes con estos filtros</div>
                <p class="text-xs text-muted" style="margin-top: 4px;">Intenta cambiar los filtros de búsqueda o plan.</p>
              </td>
            </tr>
          `}
        </tbody>
      </table>
    </div>
  `;

  // Listeners de búsqueda y filtros
  const searchInput = container.querySelector('#admin-sub-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      adminSubSearchQuery = e.target.value;
      renderAdminSubscriptionsView(container);
      const updated = container.querySelector('#admin-sub-search');
      if (updated) {
        updated.focus();
        updated.setSelectionRange(updated.value.length, updated.value.length);
      }
    });
  }

  container.querySelector('#admin-sub-plan-filter')?.addEventListener('change', (e) => {
    adminSubPlanFilter = e.target.value;
    renderAdminSubscriptionsView(container);
  });

  container.querySelector('#admin-sub-status-filter')?.addEventListener('change', (e) => {
    adminSubStatusFilter = e.target.value;
    renderAdminSubscriptionsView(container);
  });

  container.querySelector('#admin-sub-payment-filter')?.addEventListener('change', (e) => {
    adminSubPaymentFilter = e.target.value;
    renderAdminSubscriptionsView(container);
  });

  container.querySelector('#btn-clear-sub-filters')?.addEventListener('click', () => {
    adminSubSearchQuery = '';
    adminSubPlanFilter = 'all';
    adminSubStatusFilter = 'all';
    adminSubPaymentFilter = 'all';
    renderAdminSubscriptionsView(container);
  });

  // Botones de crear plan
  container.querySelector('#btn-admin-open-plan-create')?.addEventListener('click', () => {
    openAdminPlanModalDirect(null, container);
  });
  container.querySelector('#card-quick-create-plan')?.addEventListener('click', () => {
    openAdminPlanModalDirect(null, container);
  });

  // Botón superior Enviar Cobro Masivo
  container.querySelector('#btn-admin-bulk-send-top')?.addEventListener('click', () => {
    const idsToSend = selectedSubscriptionIds.size > 0 ? Array.from(selectedSubscriptionIds) : subscriptions.map(s => s.id);
    openSendPaymentLinkModalDirect(idsToSend, container);
  });

  // Botón Editar Plan
  container.querySelectorAll('.btn-edit-plan').forEach(btn => {
    btn.addEventListener('click', () => {
      const planId = btn.getAttribute('data-plan-id');
      openAdminPlanModalDirect(planId, container);
    });
  });

  // Botón Eliminar Plan
  container.querySelectorAll('.btn-delete-plan').forEach(btn => {
    btn.addEventListener('click', () => {
      const planId = btn.getAttribute('data-plan-id');
      const plan = store.getSubscriptionPlan(planId);
      if (confirm(`¿Estás seguro de que deseas eliminar el plan "${plan ? plan.name : 'este plan'}"?`)) {
        store.deleteSubscriptionPlan(planId);
        if (window.MiHummApp) window.MiHummApp.showToast('Plan de venta eliminado', 'info');
        renderAdminSubscriptionsView(container);
      }
    });
  });

  // Checkbox Seleccionar Todos
  container.querySelector('#sub-select-all')?.addEventListener('change', (e) => {
    if (e.target.checked) {
      filteredSubs.forEach(s => selectedSubscriptionIds.add(s.id));
    } else {
      selectedSubscriptionIds.clear();
    }
    renderAdminSubscriptionsView(container);
  });

  // Checkboxes Individuales
  container.querySelectorAll('.sub-row-checkbox').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const subId = cb.getAttribute('data-sub-id');
      if (e.target.checked) {
        selectedSubscriptionIds.add(subId);
      } else {
        selectedSubscriptionIds.delete(subId);
      }
      renderAdminSubscriptionsView(container);
    });
  });

  // Botones de la barra de acciones masivas
  container.querySelector('#btn-bulk-whatsapp')?.addEventListener('click', () => {
    openSendPaymentLinkModalDirect(Array.from(selectedSubscriptionIds), container);
  });

  container.querySelector('#btn-bulk-email')?.addEventListener('click', () => {
    openSendPaymentLinkModalDirect(Array.from(selectedSubscriptionIds), container);
  });

  container.querySelector('#btn-bulk-mark-paid')?.addEventListener('click', () => {
    selectedSubscriptionIds.forEach(id => store.recordSubscriptionPayment(id));
    if (window.MiHummApp) window.MiHummApp.showToast(`${selectedSubscriptionIds.size} suscripciones marcadas como pagadas`, 'success');
    selectedSubscriptionIds.clear();
    renderAdminSubscriptionsView(container);
  });

  container.querySelector('#btn-bulk-clear-selection')?.addEventListener('click', () => {
    selectedSubscriptionIds.clear();
    renderAdminSubscriptionsView(container);
  });

  // Acciones individuales de la tabla
  container.querySelectorAll('.btn-send-single-link').forEach(btn => {
    btn.addEventListener('click', () => {
      const subId = btn.getAttribute('data-sub-id');
      openSendPaymentLinkModalDirect([subId], container);
    });
  });

  container.querySelectorAll('.btn-edit-single-sub').forEach(btn => {
    btn.addEventListener('click', () => {
      const subId = btn.getAttribute('data-sub-id');
      openEditSubscriptionModalDirect(subId, container);
    });
  });

  container.querySelectorAll('.btn-mark-single-paid').forEach(btn => {
    btn.addEventListener('click', () => {
      const subId = btn.getAttribute('data-sub-id');
      store.recordSubscriptionPayment(subId);
      if (window.MiHummApp) window.MiHummApp.showToast('Suscripción marcada como pagada al día', 'success');
      renderAdminSubscriptionsView(container);
    });
  });
}
