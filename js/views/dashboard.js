/**
 * MI HUMM - VISTA INICIO (DASHBOARD)
 * Comunidad Humm Co-Creation
 */

import { store, formatCLP, formatDateCL, isDateOverdue, formatMonthName } from '../store.js';
import { auth } from '../auth.js';
import { SalesChart } from '../chart.js';

export function renderDashboard(container) {
  const ws = auth.getCurrentWorkspace();
  if (!ws) {
    container.innerHTML = `<div class="empty-state"><p>No hay un espacio de emprendimiento activo.</p></div>`;
    return;
  }

  const tasks = store.getTasks(ws.id);
  const sales = store.getSales(ws.id);
  const customers = store.getCustomers(ws.id);
  const opportunities = store.getOpportunities(ws.id);
  const assignedTools = store.getToolsForWorkspace(ws.id);
  const kanbanCols = store.getKanbanColumns(ws.id);

  // 1. Cálculos de métricas
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;

  const currentMonthSale = sales.find(s => s.year === currentYear && s.month === currentMonth);
  const prevMonthSale = sales.find(s => s.year === prevYear && s.month === prevMonth);

  const currentMonthAmount = currentMonthSale ? currentMonthSale.amount : 0;
  const prevMonthAmount = prevMonthSale ? prevMonthSale.amount : 0;

  let comparisonHtml = '';
  if (currentMonthSale && prevMonthSale) {
    if (prevMonthAmount === 0) {
      comparisonHtml = `<span class="comparison-neutral">Sin registro previo comparable</span>`;
    } else {
      const diff = currentMonthAmount - prevMonthAmount;
      const pct = Math.round((diff / prevMonthAmount) * 100);
      if (diff >= 0) {
        comparisonHtml = `<span class="comparison-positive">↑ +${pct}% vs mes anterior (${formatCLP(diff)})</span>`;
      } else {
        comparisonHtml = `<span class="comparison-negative">↓ ${pct}% vs mes anterior (${formatCLP(diff)})</span>`;
      }
    }
  } else if (currentMonthSale && !prevMonthSale) {
    comparisonHtml = `<span class="comparison-neutral">Primer mes con registro</span>`;
  } else {
    comparisonHtml = `<span class="comparison-neutral">Aún sin registro para este mes</span>`;
  }

  const activeCustomersCount = customers.filter(c => c.status === 'active').length;
  const openOpportunities = opportunities.filter(o => o.status !== 'ganada' && o.status !== 'no_concretado');
  const completedTasksThisMonth = tasks.filter(t => {
    if (t.status !== 'done' || !t.completedAt) return false;
    const d = new Date(t.completedAt);
    return d.getFullYear() === currentYear && (d.getMonth() + 1) === currentMonth;
  }).length;

  const maxPerCol = 5;

  const renderCard = (task) => {
    const overdue = task.dueDate && isDateOverdue(task.dueDate) && task.status !== 'done';
    return `
      <div class="kanban-card ${overdue ? 'card-overdue' : ''}" data-task-id="${task.id}">
        <div class="kanban-card-top">
          <span class="badge priority-${task.priority}">
            <span class="badge-dot"></span>
            ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </span>
          ${task.tag ? `<span class="badge badge-neutral">${task.tag}</span>` : ''}
        </div>
        <div class="kanban-card-title">${task.title}</div>
        <div class="kanban-card-meta">
          <div class="card-date-badge ${overdue ? 'is-overdue' : ''}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            ${task.dueDate ? (overdue ? 'Atrasada: ' : '') + formatDateCL(task.dueDate) : 'Sin fecha'}
          </div>
          <div class="card-quick-actions">
            ${task.status !== 'done' ? `
              <button class="card-btn-action btn-mark-done" title="Marcar como terminada" data-task-id="${task.id}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </button>
            ` : ''}
            <button class="card-btn-action btn-edit-task" title="Editar tarea" data-task-id="${task.id}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
            </button>
          </div>
        </div>
        <!-- Selector rápido para teléfonos -->
        <select class="mobile-status-select" data-task-id="${task.id}">
          ${kanbanCols.map(c => `
            <option value="${c.id}" ${task.status === c.id ? 'selected' : ''}>${c.name}</option>
          `).join('')}
        </select>
      </div>
    `;
  };

  const advisorName = ws.advisorName || 'Equipo de Apoyo Humm';
  const advisorEmail = ws.advisorEmail || 'contacto@humm.cl';

  container.innerHTML = `
    <!-- ENCABEZADO DE BIENVENIDA -->
    <div class="view-header" style="margin-bottom: 20px;">
      <div class="view-title-group">
        <div style="display: flex; align-items: center; gap: 10px;">
          <h2>Hola, ${ws.ownerName || 'Emprendedor/a'} 👋</h2>
          <span class="badge badge-success text-xs">Comunidad Activa</span>
        </div>
        <p style="margin-top: 4px; color: var(--text-secondary);">
          Bienvenido/a al escritorio digital de <strong>${ws.name}</strong>. Resumen de tu avance y herramientas.
        </p>
      </div>
    </div>

    <!-- BANNER DE TUTOR / EJECUTIVO HUMM -->
    <div style="background: linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-surface-secondary) 100%); border: 1px solid var(--border-subtle); border-left: 4px solid var(--humm-red-primary); border-radius: var(--radius-lg); padding: 16px 20px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; box-shadow: var(--shadow-card);">
      <div style="display: flex; align-items: center; gap: 14px;">
        <div style="width: 44px; height: 44px; border-radius: 50%; background-color: var(--humm-red-subtle); color: var(--humm-red-primary); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.15rem; flex-shrink: 0;">
          🤝
        </div>
        <div>
          <div style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; color: var(--humm-red-primary);">Tu Tutor / Ejecutivo Humm Asignado</div>
          <div style="font-size: var(--font-size-md); font-weight: 700; color: var(--text-primary);">${advisorName}</div>
          <div style="font-size: var(--font-size-xs); color: var(--text-muted);">${advisorEmail} • Soporte y asesoría personalizada para tu negocio</div>
        </div>
      </div>
      <button class="btn btn-secondary btn-sm" id="btn-dash-request-support" style="background-color: var(--bg-surface); border-color: var(--border-strong);">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--humm-red-primary)" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        Solicitar apoyo o reunión
      </button>
    </div>

    <!-- COMUNICADOS Y NOVEDADES DE LA COMUNIDAD -->
    ${(() => {
      const broadcasts = store.getBroadcasts();
      if (!broadcasts || broadcasts.length === 0) return '';
      const latestBroadcasts = broadcasts.slice(0, 2);

      return `
        <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 18px 20px; margin-bottom: 26px; box-shadow: var(--shadow-card);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.15rem;">📢</span>
              <h3 style="font-size: var(--font-size-base); font-weight: 700; color: var(--text-primary); margin: 0;">
                Novedades y Beneficios de la Comunidad Humm
              </h3>
              <span class="badge badge-humm text-xs">Nuevo</span>
            </div>
            <span class="text-xs text-muted">Avisos oficiales para miembros</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${latestBroadcasts.map(bc => {
              const categoryBadge = bc.category.includes('Oferta') 
                ? 'badge-success' 
                : bc.category.includes('Taller') 
                  ? 'badge-info' 
                  : bc.category.includes('Alerta') 
                    ? 'badge-danger' 
                    : 'badge-humm';

              return `
                <div style="background: var(--bg-surface-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px 16px;">
                  <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <span class="badge ${categoryBadge} text-xs">${bc.category}</span>
                      <strong style="font-size: var(--font-size-sm); color: var(--text-primary);">${bc.title}</strong>
                    </div>
                    <span class="text-xs text-muted">📅 ${formatDateCL(bc.createdAt)}</span>
                  </div>
                  <div style="font-size: var(--font-size-xs); color: var(--text-secondary); line-height: 1.45; white-space: pre-line;">
                    ${bc.content}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    })()}

    <!-- INDICADORES CLAVE DEL NEGOCIO -->
    <div style="margin-bottom: 26px;">
      <h3 class="title-sm" style="margin-bottom: 12px;">Indicadores de tu negocio</h3>
      <div class="metrics-grid">
        <!-- Métrica 1: Ventas del mes -->
        <div class="metric-card" id="metric-card-sales" title="Ir a Ventas">
          <div class="metric-card-header">
            <span class="metric-card-title">Ventas ${formatMonthName(currentMonth)}</span>
            <div class="metric-icon-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
          </div>
          <div class="metric-value">${formatCLP(currentMonthAmount)}</div>
          <div class="metric-comparison">${comparisonHtml}</div>
        </div>

        <!-- Métrica 2: Clientes registrados -->
        <div class="metric-card" id="metric-card-customers" title="Ir a Clientes">
          <div class="metric-card-header">
            <span class="metric-card-title">Clientes Registrados</span>
            <div class="metric-icon-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
          </div>
          <div class="metric-value">${activeCustomersCount}</div>
          <div class="metric-comparison"><span class="comparison-neutral">${customers.length} en total en la base</span></div>
        </div>

        <!-- Métrica 3: Oportunidades abiertas -->
        <div class="metric-card" id="metric-card-opps" title="Ir a Oportunidades">
          <div class="metric-card-header">
            <span class="metric-card-title">Oportunidades Abiertas</span>
            <div class="metric-icon-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polygon points="12 6 12 12 16 14"></polygon>
              </svg>
            </div>
          </div>
          <div class="metric-value">${openOpportunities.length}</div>
          <div class="metric-comparison"><span class="comparison-neutral">Por concretar este periodo</span></div>
        </div>

        <!-- Métrica 4: Tareas completadas -->
        <div class="metric-card" id="metric-card-tasks-done" title="Ir a Tareas">
          <div class="metric-card-header">
            <span class="metric-card-title">Tareas Terminadas</span>
            <div class="metric-icon-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
          </div>
          <div class="metric-value">${completedTasksThisMonth}</div>
          <div class="metric-comparison"><span class="comparison-positive">Finalizadas este mes</span></div>
        </div>
      </div>
    </div>

    <!-- KANBAN DE TAREAS RESUMIDO -->
    <div style="margin-bottom: 30px;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;">
        <div>
          <h2 class="title-lg" style="margin: 0;">Tus tareas</h2>
          <p class="text-secondary text-sm" style="margin-top: 2px;">Organiza lo que debes hacer y avanza paso a paso.</p>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-secondary btn-sm" id="btn-goto-tasks">
            Ver todas las tareas (${tasks.length})
          </button>
          <button class="btn btn-primary btn-sm" id="btn-quick-new-task">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Nueva Tarea
          </button>
        </div>
      </div>

      <div class="kanban-board ${kanbanCols.length > 3 ? 'kanban-scrollable' : ''}" style="${kanbanCols.length > 3 ? 'display: flex; overflow-x: auto; padding-bottom: 12px; gap: 16px;' : 'display: grid; grid-template-columns: repeat(' + kanbanCols.length + ', 1fr); gap: 16px;'}">
        ${kanbanCols.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          return `
            <div class="kanban-column" data-status="${col.id}" style="${kanbanCols.length > 3 ? 'min-width: 280px; width: 280px; flex-shrink: 0;' : ''}">
              <div class="kanban-column-header">
                <div class="column-title-wrap">
                  <div class="column-indicator-dot ${col.dotClass || 'dot-todo'}"></div>
                  <span class="kanban-column-title">${col.name}</span>
                </div>
                <span class="kanban-counter-pill">${colTasks.length}</span>
              </div>
              <div class="kanban-cards-list kanban-dropzone" data-status="${col.id}">
                ${colTasks.length > 0
                  ? colTasks.slice(0, maxPerCol).map(renderCard).join('')
                  : '<div class="empty-state" style="padding: 20px 10px; margin: 0;"><p class="text-xs text-muted">Sin tareas</p></div>'
                }
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- GRÁFICO DE VENTAS (ÚLTIMOS 12 MESES EN CLP) -->
    <div class="chart-container-card" style="margin-bottom: 24px;">
      <div class="chart-header">
        <div class="chart-title-area">
          <h3>Evolución de ventas mensuales</h3>
          <p>Visualiza tus ingresos registrados en pesos chilenos durante los últimos doce meses.</p>
        </div>
        <button class="btn btn-secondary btn-sm" id="btn-chart-register-sale">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Ingresar ventas del mes
        </button>
      </div>
      <div id="dashboard-sales-chart-wrapper"></div>
    </div>

    <!-- FILA INFERIOR: OPORTUNIDADES Y HERRAMIENTAS -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; margin-bottom: 24px;">
      <!-- RESUMEN DE OPORTUNIDADES QUE REQUIEREN ATENCIÓN -->
      <div class="adaptive-item-card" style="padding: 20px; height: 100%;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
          <div>
            <h3 class="title-sm">Oportunidades de seguimiento</h3>
            <p class="text-xs text-muted">Potenciales ventas que requieren tu atención</p>
          </div>
          <button class="btn btn-ghost btn-sm" id="btn-dash-goto-opps" style="color: var(--humm-red-primary);">
            Ver oportunidades →
          </button>
        </div>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          ${openOpportunities.length > 0
            ? openOpportunities.slice(0, 3).map(opp => {
                const isOver = opp.followUpDate && isDateOverdue(opp.followUpDate);
                return `
                  <div style="padding: 12px; background-color: var(--bg-surface-secondary); border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                      <strong style="font-size: var(--font-size-sm);">${opp.contactName}</strong>
                      <span class="badge badge-info text-xs">${opp.status.toUpperCase()}</span>
                    </div>
                    <div style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-bottom: 6px;">
                      ${opp.title} ${opp.estimatedAmount ? `• <strong>${formatCLP(opp.estimatedAmount)}</strong>` : ''}
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: var(--font-size-xs); color: var(--text-muted);">
                      <span>${opp.nextAction || 'Seguimiento'}</span>
                      <span class="${isOver ? 'text-danger font-bold' : ''}">
                        ${opp.followUpDate ? formatDateCL(opp.followUpDate) : 'Sin fecha'}
                      </span>
                    </div>
                  </div>
                `;
              }).join('')
            : '<p class="text-xs text-muted text-center py-3">No tienes oportunidades pendientes de seguimiento.</p>'
          }
        </div>
      </div>

      <!-- ACCESO RÁPIDO A HERRAMIENTAS ACTIVADAS -->
      <div class="adaptive-item-card" style="padding: 20px; height: 100%;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
          <div>
            <h3 class="title-sm">Herramientas Humm</h3>
            <p class="text-xs text-muted">Accede a tus soluciones habilitadas</p>
          </div>
          <button class="btn btn-ghost btn-sm" id="btn-dash-goto-tools" style="color: var(--humm-red-primary);">
            Ver todas (${assignedTools.length}) →
          </button>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          ${assignedTools.slice(0, 4).map(tool => `
            <div style="padding: 12px; background-color: var(--bg-surface-secondary); border-radius: var(--radius-md); border: 1px solid var(--border-subtle); display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="font-weight: 700; font-size: var(--font-size-sm); color: var(--text-primary); margin-bottom: 2px;">${tool.name}</div>
                <div style="font-size: var(--font-size-xs); color: var(--text-muted); line-height: 1.25; margin-bottom: 8px;">${tool.description}</div>
              </div>
              <button class="btn btn-secondary btn-sm btn-open-tool" data-url="${tool.url}" data-name="${tool.name}">
                Abrir
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  // Renderizar gráfico de ventas
  const chartWrapper = container.querySelector('#dashboard-sales-chart-wrapper');
  if (chartWrapper) {
    const chart = new SalesChart(chartWrapper);
    chart.render(sales);
  }

  // Event Listeners
  container.querySelector('#btn-dash-request-support')?.addEventListener('click', () => {
    if (window.MiHummApp) window.MiHummApp.openRequestSupportModal();
  });

  container.querySelector('#btn-goto-tasks')?.addEventListener('click', () => {
    window.location.hash = '#tareas';
  });

  container.querySelector('#btn-quick-new-task')?.addEventListener('click', () => {
    if (window.MiHummApp) window.MiHummApp.openModal('modal-task');
  });

  container.querySelector('#metric-card-sales')?.addEventListener('click', () => {
    window.location.hash = '#ventas';
  });

  container.querySelector('#btn-chart-register-sale')?.addEventListener('click', () => {
    if (window.MiHummApp) window.MiHummApp.openModal('modal-sale');
  });

  container.querySelector('#metric-card-customers')?.addEventListener('click', () => {
    window.location.hash = '#clientes';
  });

  container.querySelector('#metric-card-opps')?.addEventListener('click', () => {
    window.location.hash = '#oportunidades';
  });

  container.querySelector('#metric-card-tasks-done')?.addEventListener('click', () => {
    window.location.hash = '#tareas';
  });

  container.querySelector('#btn-dash-goto-opps')?.addEventListener('click', () => {
    window.location.hash = '#oportunidades';
  });

  container.querySelector('#btn-dash-goto-tools')?.addEventListener('click', () => {
    window.location.hash = '#herramientas';
  });

  // Acciones en tarjetas Kanban
  container.querySelectorAll('.btn-mark-done').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const taskId = btn.getAttribute('data-task-id');
      store.updateTask(taskId, { status: 'done' });
      if (window.MiHummApp) {
        window.MiHummApp.showToast('¡Tarea completada! Excelente avance.', 'success');
        window.MiHummApp.refreshCurrentView();
      }
    });
  });

  container.querySelectorAll('.btn-edit-task').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const taskId = btn.getAttribute('data-task-id');
      if (window.MiHummApp) window.MiHummApp.openEditTaskModal(taskId);
    });
  });

  container.querySelectorAll('.mobile-status-select').forEach(sel => {
    sel.addEventListener('change', (e) => {
      const taskId = sel.getAttribute('data-task-id');
      const newStatus = e.target.value;
      store.updateTask(taskId, { status: newStatus });
      if (window.MiHummApp) {
        window.MiHummApp.showToast('Estado de tarea actualizado', 'success');
        window.MiHummApp.refreshCurrentView();
      }
    });
  });

  container.querySelectorAll('.btn-open-tool').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.getAttribute('data-name');
      const url = btn.getAttribute('data-url');
      if (window.MiHummApp) {
        window.MiHummApp.launchTool(name, url);
      }
    });
  });
}
