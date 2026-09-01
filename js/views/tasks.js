/**
 * MI HUMM - MÓDULO TAREAS (KANBAN COMPLETO & ETAPAS PERSONALIZABLES)
 * Comunidad Humm Co-Creation
 */

import { store, formatDateCL, isDateOverdue } from '../store.js';
import { auth } from '../auth.js';

export function renderTasksView(container) {
  const ws = auth.getCurrentWorkspace();
  if (!ws) return;

  const allTasks = store.getTasks(ws.id);
  const customers = store.getCustomers(ws.id);
  const opportunities = store.getOpportunities(ws.id);
  const columns = store.getKanbanColumns(ws.id);

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h2>Tablero de Tareas</h2>
        <p>Organiza tus actividades diarias, proyectos y compromisos por etapas configurables.</p>
      </div>
      <div class="view-actions" style="display: flex; gap: 8px; flex-wrap: wrap;">
        <button class="btn btn-secondary" id="btn-add-kanban-col-top" title="Agregar otra etapa al proceso">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Agregar Columna
        </button>

        <button class="btn btn-primary" id="btn-create-task-main">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Nueva Tarea
        </button>
      </div>
    </div>

    <!-- Barra de Búsqueda y Filtros -->
    <div class="table-toolbar" style="background-color: var(--bg-surface); border-radius: var(--radius-lg); margin-bottom: 20px; border: 1px solid var(--border-subtle);">
      <div class="table-search-box input-with-icon" style="max-width: 320px;">
        <span class="input-icon">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </span>
        <input type="text" id="task-search-input" class="form-control" placeholder="Buscar tarea..." />
      </div>

      <div class="table-filters" style="flex-wrap: wrap; gap: 8px; align-items: center;">
        <select id="task-filter-priority" class="form-control" style="width: auto; padding: 8px 12px; font-size: var(--font-size-xs);">
          <option value="all">Todas las prioridades</option>
          <option value="alta">Prioridad Alta</option>
          <option value="media">Prioridad Media</option>
          <option value="baja">Prioridad Baja</option>
        </select>

        <select id="task-filter-timing" class="form-control" style="width: auto; padding: 8px 12px; font-size: var(--font-size-xs);">
          <option value="all">Todas las fechas</option>
          <option value="overdue">Atrasadas</option>
          <option value="upcoming">Próximos 7 días</option>
        </select>

        ${columns.length > 3 || columns.some(c => (c.id === 'todo' && c.name !== 'Por hacer') || (c.id === 'in_progress' && c.name !== 'En proceso') || (c.id === 'done' && c.name !== 'Terminadas')) ? `
          <button class="btn btn-ghost btn-sm" id="btn-reset-kanban-cols" title="Restaurar nombres y columnas iniciales de fábrica" style="font-size: 11px; color: var(--text-muted);">
            🔄 Restaurar 3 columnas
          </button>
        ` : ''}
      </div>
    </div>

    <!-- TABLERO KANBAN MULTI-COLUMNA -->
    <div id="full-kanban-board" class="kanban-board ${columns.length > 3 ? 'kanban-scrollable' : ''}" style="${columns.length > 3 ? 'display: flex; overflow-x: auto; padding-bottom: 14px; gap: 16px;' : 'display: grid; grid-template-columns: repeat(' + columns.length + ', 1fr); gap: 16px;'}"></div>
  `;

  // Renderizar las columnas aplicando filtros actuales
  function filterAndRenderColumns() {
    const searchVal = container.querySelector('#task-search-input')?.value.toLowerCase().trim() || '';
    const priorityVal = container.querySelector('#task-filter-priority')?.value || 'all';
    const timingVal = container.querySelector('#task-filter-timing')?.value || 'all';

    let filtered = allTasks.filter(task => {
      // Filtro búsqueda
      if (searchVal && !task.title.toLowerCase().includes(searchVal) && !(task.description || '').toLowerCase().includes(searchVal) && !(task.tag || '').toLowerCase().includes(searchVal)) {
        return false;
      }
      // Filtro prioridad
      if (priorityVal !== 'all' && task.priority !== priorityVal) {
        return false;
      }
      // Filtro timing
      if (timingVal === 'overdue') {
        return task.dueDate && isDateOverdue(task.dueDate) && task.status !== 'done';
      }
      if (timingVal === 'upcoming') {
        if (!task.dueDate || task.status === 'done') return false;
        const due = new Date(task.dueDate);
        const now = new Date();
        const diffDays = (due - now) / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays <= 7;
      }
      return true;
    });

    const board = container.querySelector('#full-kanban-board');
    if (!board) return;

    if (allTasks.length === 0 && columns.length === 0) {
      board.innerHTML = `
        <div style="grid-column: 1 / -1; width: 100%;">
          <div class="empty-state">
            <div class="empty-state-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="12" y1="18" x2="12" y2="12"></line>
                <line x1="9" y1="15" x2="15" y2="15"></line>
              </svg>
            </div>
            <h4 class="empty-state-title">Comienza creando una tarea concreta</h4>
            <p class="empty-state-desc">Anota lo que debes hacer hoy o esta semana para avanzar en tu emprendimiento paso a paso.</p>
            <button class="btn btn-primary" id="btn-empty-create-task">
              Crear mi primera tarea
            </button>
          </div>
        </div>
      `;
      board.querySelector('#btn-empty-create-task')?.addEventListener('click', () => {
        if (window.MiHummApp) window.MiHummApp.openModal('modal-task');
      });
      return;
    }

    const currentCols = store.getKanbanColumns(ws.id);

    // Generar HTML de cada columna
    const colsHtml = currentCols.map(col => {
      const colTasks = filtered.filter(t => t.status === col.id);
      return `
        <div class="kanban-column" data-status="${col.id}" style="${currentCols.length > 3 ? 'min-width: 290px; width: 290px; flex-shrink: 0;' : ''}">
          <div class="kanban-column-header">
            <div class="column-title-wrap" style="flex: 1; min-width: 0;">
              <div class="column-indicator-dot ${col.dotClass || 'dot-todo'}"></div>
              <span class="kanban-column-title" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${col.name}">${col.name}</span>
            </div>

            <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0;">
              <span class="kanban-counter-pill">${colTasks.length}</span>
              
              <!-- Botón Editar Nombre de Columna -->
              <button class="btn-icon-sm btn-rename-col" data-col-id="${col.id}" data-col-name="${col.name}" title="Cambiar nombre de esta etapa/columna" style="background: none; border: none; cursor: pointer; padding: 2px; color: var(--text-muted); font-size: 13px;">
                ✏️
              </button>

              <!-- Botón Eliminar Columna (solo si es columna personalizada) -->
              ${!col.isDefault ? `
                <button class="btn-icon-sm btn-delete-col" data-col-id="${col.id}" data-col-name="${col.name}" title="Eliminar esta columna personalizada" style="background: none; border: none; cursor: pointer; padding: 2px; color: var(--danger); font-size: 13px;">
                  🗑️
                </button>
              ` : ''}
            </div>
          </div>

          <div class="kanban-cards-list kanban-dropzone" data-status="${col.id}">
            ${colTasks.map(task => {
              const overdue = task.dueDate && isDateOverdue(task.dueDate) && task.status !== 'done';
              const relatedCustomer = task.customerId ? customers.find(c => c.id === task.customerId) : null;
              const relatedOpp = task.opportunityId ? opportunities.find(o => o.id === task.opportunityId) : null;

              return `
                <div class="kanban-card ${overdue ? 'card-overdue' : ''}" 
                     draggable="true" 
                     data-task-id="${task.id}">
                  <div class="kanban-card-top">
                    <span class="badge priority-${task.priority}">
                      <span class="badge-dot"></span>
                      ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </span>
                    ${task.tag ? `<span class="badge badge-neutral">${task.tag}</span>` : ''}
                  </div>

                  <div class="kanban-card-title">${task.title}</div>
                  
                  ${task.description ? `
                    <div style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-bottom: 8px; line-height: 1.35;">
                      ${task.description}
                    </div>
                  ` : ''}

                  ${relatedCustomer || relatedOpp ? `
                    <div style="font-size: 0.72rem; color: var(--text-muted); margin-bottom: 6px; display: flex; gap: 4px; flex-wrap: wrap;">
                      ${relatedCustomer ? `<span class="badge badge-info text-xs">👤 ${relatedCustomer.firstName} ${relatedCustomer.lastName || ''}</span>` : ''}
                      ${relatedOpp ? `<span class="badge badge-warning text-xs">💼 ${relatedOpp.title}</span>` : ''}
                    </div>
                  ` : ''}

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
                      <button class="card-btn-action btn-edit-task" title="Editar tarea" data-task-id="${task.id}">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M12 20h9"></path>
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                        </svg>
                      </button>
                      <button class="card-btn-action btn-delete-task" title="Eliminar tarea" data-task-id="${task.id}">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </div>

                  <!-- Selector móvil rápido dinámico con todas las etapas -->
                  <select class="mobile-status-select" data-task-id="${task.id}">
                    ${currentCols.map(c => `
                      <option value="${c.id}" ${task.status === c.id ? 'selected' : ''}>${c.name}</option>
                    `).join('')}
                  </select>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Botón rápido para agregar tarea en esta columna -->
          <button class="btn btn-ghost btn-sm btn-quick-add-to-col" data-col-id="${col.id}" style="margin-top: 10px; font-size: 11px; color: var(--text-muted); justify-content: center; width: 100%; border: 1px dashed var(--border-subtle);">
            + Agregar tarea aquí
          </button>
        </div>
      `;
    }).join('');

    // Columna lateral para agregar nueva etapa
    const addColumnCardHtml = `
      <div class="kanban-add-column-card" style="min-width: 220px; width: 220px; flex-shrink: 0; background: var(--bg-surface-secondary); border: 2px dashed var(--border-strong); border-radius: var(--radius-lg); padding: 18px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; min-height: 200px;">
        <div style="font-size: 1.8rem; margin-bottom: 8px;">➕</div>
        <div style="font-weight: 700; font-size: var(--font-size-sm); color: var(--text-primary); margin-bottom: 4px;">Nueva Etapa</div>
        <p style="font-size: 11px; color: var(--text-muted); margin-bottom: 12px;">Agrega otra columna al proceso de tu emprendimiento</p>
        <button class="btn btn-secondary btn-sm" id="btn-kanban-add-col-card" style="font-size: 11px;">
          + Crear Columna
        </button>
      </div>
    `;

    board.innerHTML = colsHtml + addColumnCardHtml;

    attachCardActions();
    attachColumnActions();
    attachDragAndDrop();
  }

  function attachCardActions() {
    // Editar tarea
    boardElement().querySelectorAll('.btn-edit-task').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const taskId = btn.getAttribute('data-task-id');
        if (window.MiHummApp) window.MiHummApp.openEditTaskModal(taskId);
      });
    });

    // Eliminar tarea con confirmación
    boardElement().querySelectorAll('.btn-delete-task').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const taskId = btn.getAttribute('data-task-id');
        if (confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
          store.deleteTask(taskId);
          if (window.MiHummApp) {
            window.MiHummApp.showToast('Tarea eliminada correctamente', 'success');
            window.MiHummApp.refreshCurrentView();
          }
        }
      });
    });

    // Selector de estado en móvil
    boardElement().querySelectorAll('.mobile-status-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const taskId = sel.getAttribute('data-task-id');
        const newStatus = e.target.value;
        store.updateTask(taskId, { status: newStatus });
        if (window.MiHummApp) {
          window.MiHummApp.showToast('Estado actualizado', 'success');
          window.MiHummApp.refreshCurrentView();
        }
      });
    });

    // Botón agregar tarea en columna específica
    boardElement().querySelectorAll('.btn-quick-add-to-col').forEach(btn => {
      btn.addEventListener('click', () => {
        const colId = btn.getAttribute('data-col-id');
        if (window.MiHummApp) {
          const form = document.getElementById('form-modal-task');
          if (form) {
            form.removeAttribute('data-edit-id');
            form.reset();
            document.getElementById('modal-task-header-title').textContent = 'Nueva Tarea';
            document.getElementById('modal-task-status').value = colId;
          }
          window.MiHummApp.openModal('modal-task');
        }
      });
    });
  }

  function attachColumnActions() {
    // Renombrar columna
    boardElement().querySelectorAll('.btn-rename-col').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const colId = btn.getAttribute('data-col-id');
        const currentName = btn.getAttribute('data-col-name');
        const newName = prompt(`Ingresa el nuevo nombre para la etapa "${currentName}":`, currentName);
        if (newName && newName.trim() && newName.trim() !== currentName) {
          store.updateKanbanColumnName(ws.id, colId, newName.trim());
          if (window.MiHummApp) {
            window.MiHummApp.showToast(`Columna renombrada a "${newName.trim()}"`, 'success');
            renderTasksView(container);
          }
        }
      });
    });

    // Eliminar columna personalizada
    boardElement().querySelectorAll('.btn-delete-col').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const colId = btn.getAttribute('data-col-id');
        const colName = btn.getAttribute('data-col-name');
        if (confirm(`¿Estás seguro de eliminar la columna "${colName}"? Las tareas asociadas pasarán a la primera columna.`)) {
          store.deleteKanbanColumn(ws.id, colId);
          if (window.MiHummApp) {
            window.MiHummApp.showToast(`Columna "${colName}" eliminada`, 'info');
            renderTasksView(container);
          }
        }
      });
    });

    // Botón agregar columna desde tarjeta lateral
    boardElement().querySelector('#btn-kanban-add-col-card')?.addEventListener('click', promptAddColumn);
  }

  function promptAddColumn() {
    const colName = prompt('Ingresa el nombre de la nueva columna o etapa de trabajo (ej. "En revisión", "Enviado", "Esperando proveedor"):');
    if (colName && colName.trim()) {
      const added = store.addKanbanColumn(ws.id, colName.trim());
      if (window.MiHummApp) {
        window.MiHummApp.showToast(`Etapa "${added.name}" añadida al tablero`, 'success');
        renderTasksView(container);
      }
    }
  }

  function attachDragAndDrop() {
    const cards = container.querySelectorAll('.kanban-card[draggable="true"]');
    const dropzones = container.querySelectorAll('.kanban-dropzone');

    cards.forEach(card => {
      card.addEventListener('dragstart', (e) => {
        card.classList.add('dragging');
        e.dataTransfer.setData('text/plain', card.getAttribute('data-task-id'));
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
      });
    });

    dropzones.forEach(zone => {
      zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.style.backgroundColor = 'var(--humm-red-subtle)';
      });

      zone.addEventListener('dragleave', () => {
        zone.style.backgroundColor = '';
      });

      zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.style.backgroundColor = '';
        const taskId = e.dataTransfer.getData('text/plain');
        const targetStatus = zone.getAttribute('data-status');

        if (taskId && targetStatus) {
          store.updateTask(taskId, { status: targetStatus });
          const targetCol = store.getKanbanColumns(ws.id).find(c => c.id === targetStatus);
          const colLabel = targetCol ? targetCol.name : 'etapa';
          if (window.MiHummApp) {
            window.MiHummApp.showToast(`Tarea movida a "${colLabel}"`, 'success');
            window.MiHummApp.refreshCurrentView();
          }
        }
      });
    });
  }

  function boardElement() {
    return container.querySelector('#full-kanban-board');
  }

  // Event Listeners de Filtros y Botones Superiores
  container.querySelector('#task-search-input')?.addEventListener('input', filterAndRenderColumns);
  container.querySelector('#task-filter-priority')?.addEventListener('change', filterAndRenderColumns);
  container.querySelector('#task-filter-timing')?.addEventListener('change', filterAndRenderColumns);

  container.querySelector('#btn-add-kanban-col-top')?.addEventListener('click', promptAddColumn);

  container.querySelector('#btn-reset-kanban-cols')?.addEventListener('click', () => {
    if (confirm('¿Deseas restaurar las 3 columnas originales ("Por hacer", "En proceso", "Terminadas")?')) {
      store.resetKanbanColumns(ws.id);
      if (window.MiHummApp) {
        window.MiHummApp.showToast('Columnas restauradas a los 3 estados iniciales', 'info');
        renderTasksView(container);
      }
    }
  });

  container.querySelector('#btn-create-task-main')?.addEventListener('click', () => {
    if (window.MiHummApp) window.MiHummApp.openModal('modal-task');
  });

  filterAndRenderColumns();
}
