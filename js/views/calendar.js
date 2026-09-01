/**
 * MI HUMM - MÓDULO CALENDARIO & AGENDA
 * Comunidad Humm Co-Creation
 */

import { store, formatDateCL, formatMonthName, isDateOverdue } from '../store.js';
import { auth } from '../auth.js';

let currentCalDate = new Date();
let currentCalView = 'month'; // 'month', 'week', 'agenda'
let currentCalFilter = 'all'; // 'all', 'tasks', 'reunion', 'visita', 'mentoria', 'entrega', 'comercial'

export function renderCalendarView(container) {
  const ws = auth.getCurrentWorkspace();
  if (!ws) return;

  const events = store.getEvents(ws.id);
  const tasks = store.getTasks(ws.id);
  const customers = store.getCustomers(ws.id);

  const year = currentCalDate.getFullYear();
  const month = currentCalDate.getMonth(); // 0-11

  // Contadores para métricas
  const thisMonthEvents = events.filter(e => {
    if (!e.date) return false;
    const [ey, em] = e.date.split('-').map(Number);
    return ey === year && em === month + 1;
  });

  const thisMonthTasks = tasks.filter(t => {
    if (!t.dueDate) return false;
    const [ty, tm] = t.dueDate.split('-').map(Number);
    return ty === year && tm === month + 1;
  });

  const meetingsCount = thisMonthEvents.filter(e => e.type === 'reunion' || e.type === 'mentoria').length;
  const visitsCount = thisMonthEvents.filter(e => e.type === 'visita' || e.type === 'entrega').length;

  container.innerHTML = `
    <div class="view-header" style="margin-bottom: 20px;">
      <div class="view-title-group">
        <div style="display: flex; align-items: center; gap: 8px;">
          <h2>Calendario & Agenda</h2>
          <span class="badge badge-primary text-xs">Sincronizable</span>
        </div>
        <p>Revisa tus tareas asignadas, agenda reuniones y sincroniza con Google Calendar, Outlook y Apple Calendar.</p>
      </div>

      <div class="view-actions" style="display: flex; gap: 8px; flex-wrap: wrap;">
        <button class="btn btn-secondary" id="btn-open-sync-modal" title="Conectar con Google Calendar, Outlook o iCal">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </svg>
          Conectar Calendarios
        </button>

        <button class="btn btn-secondary" id="btn-export-full-ics" title="Descargar agenda completa en formato .ICS">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Exportar .ICS
        </button>

        <button class="btn btn-primary" id="btn-open-modal-event">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Agendar Compromiso
        </button>
      </div>
    </div>

    <!-- TARJETAS DE RESUMEN DE AGENDA -->
    <div class="metrics-grid" style="margin-bottom: 20px;">
      <div class="metric-card">
        <div class="metric-card-header">
          <span class="metric-card-title">Compromisos ${formatMonthName(month + 1)}</span>
          <div class="metric-icon-box" style="background: rgba(227, 6, 19, 0.1); color: var(--humm-red-primary);">
            📅
          </div>
        </div>
        <div class="metric-value">${thisMonthEvents.length}</div>
        <div class="metric-comparison"><span class="comparison-neutral">Agendados en el mes</span></div>
      </div>

      <div class="metric-card">
        <div class="metric-card-header">
          <span class="metric-card-title">Reuniones & Mentorías</span>
          <div class="metric-icon-box" style="background: rgba(59, 130, 246, 0.12); color: #2563EB;">
            🤝
          </div>
        </div>
        <div class="metric-value" style="color: #2563EB;">${meetingsCount}</div>
        <div class="metric-comparison"><span class="comparison-positive">Clientes y tutores Humm</span></div>
      </div>

      <div class="metric-card">
        <div class="metric-card-header">
          <span class="metric-card-title">Visitas & Entregas</span>
          <div class="metric-icon-box" style="background: rgba(245, 158, 11, 0.15); color: #D97706;">
            🚗
          </div>
        </div>
        <div class="metric-value" style="color: #D97706;">${visitsCount}</div>
        <div class="metric-comparison"><span class="comparison-neutral">Salidas a terreno y despachos</span></div>
      </div>

      <div class="metric-card">
        <div class="metric-card-header">
          <span class="metric-card-title">Tareas con Plazo</span>
          <div class="metric-icon-box" style="background: rgba(100, 116, 139, 0.15); color: #475569;">
            📋
          </div>
        </div>
        <div class="metric-value">${thisMonthTasks.length}</div>
        <div class="metric-comparison"><span class="comparison-neutral">Fechas límite sincronizadas</span></div>
      </div>
    </div>

    <!-- CONTROLES PRINCIPALES DEL CALENDARIO -->
    <div class="calendar-controls-card" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 16px; margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
        
        <!-- Navegación de Mes -->
        <div style="display: flex; align-items: center; gap: 10px;">
          <button class="btn btn-ghost btn-sm" id="cal-btn-prev" title="Mes anterior" style="padding: 6px 12px; font-weight: 600;">
            ◀ Anterior
          </button>
          <button class="btn btn-secondary btn-sm" id="cal-btn-today" style="font-weight: 700; padding: 6px 14px;">
            Hoy
          </button>
          <button class="btn btn-ghost btn-sm" id="cal-btn-next" title="Mes siguiente" style="padding: 6px 12px; font-weight: 600;">
            Siguiente ▶
          </button>
          <h3 style="margin: 0 0 0 10px; font-size: 1.3rem; font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em;">
            ${formatMonthName(month + 1, year)}
          </h3>
        </div>

        <!-- Selector de Vista (Mes / Semana / Agenda) -->
        <div style="display: flex; gap: 4px; background: var(--bg-body); padding: 4px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
          <button class="btn ${currentCalView === 'month' ? 'btn-primary' : 'btn-ghost'} btn-sm cal-view-btn" data-view="month" style="padding: 5px 14px; font-size: 12px;">
            📅 Mes
          </button>
          <button class="btn ${currentCalView === 'week' ? 'btn-primary' : 'btn-ghost'} btn-sm cal-view-btn" data-view="week" style="padding: 5px 14px; font-size: 12px;">
            🗓️ Semana
          </button>
          <button class="btn ${currentCalView === 'agenda' ? 'btn-primary' : 'btn-ghost'} btn-sm cal-view-btn" data-view="agenda" style="padding: 5px 14px; font-size: 12px;">
            📋 Lista / Agenda
          </button>
        </div>
      </div>

      <!-- Filtro por Tipo de Compromiso -->
      <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center; margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--border-color);">
        <span class="text-xs text-muted" style="font-weight: 600; margin-right: 4px;">Filtrar agenda:</span>
        <button class="btn ${currentCalFilter === 'all' ? 'btn-primary' : 'btn-ghost'} btn-sm cal-filter-btn" data-filter="all" style="font-size: 11px; padding: 4px 10px;">
          Todos (${events.length + tasks.length})
        </button>
        <button class="btn ${currentCalFilter === 'reunion' ? 'btn-primary' : 'btn-ghost'} btn-sm cal-filter-btn" data-filter="reunion" style="font-size: 11px; padding: 4px 10px;">
          🤝 Reuniones (${events.filter(e => e.type === 'reunion').length})
        </button>
        <button class="btn ${currentCalFilter === 'mentoria' ? 'btn-primary' : 'btn-ghost'} btn-sm cal-filter-btn" data-filter="mentoria" style="font-size: 11px; padding: 4px 10px;">
          🎓 Mentorías Humm (${events.filter(e => e.type === 'mentoria').length})
        </button>
        <button class="btn ${currentCalFilter === 'visita' ? 'btn-primary' : 'btn-ghost'} btn-sm cal-filter-btn" data-filter="visita" style="font-size: 11px; padding: 4px 10px;">
          🚗 Visitas (${events.filter(e => e.type === 'visita').length})
        </button>
        <button class="btn ${currentCalFilter === 'entrega' ? 'btn-primary' : 'btn-ghost'} btn-sm cal-filter-btn" data-filter="entrega" style="font-size: 11px; padding: 4px 10px;">
          📦 Entregas (${events.filter(e => e.type === 'entrega').length})
        </button>
        <button class="btn ${currentCalFilter === 'tasks' ? 'btn-primary' : 'btn-ghost'} btn-sm cal-filter-btn" data-filter="tasks" style="font-size: 11px; padding: 4px 10px;">
          📋 Tareas (${tasks.length})
        </button>
      </div>
    </div>

    <!-- CONTENEDOR DE LA VISTA DEL CALENDARIO -->
    <div id="calendar-viewport">
      ${renderCalendarViewport(year, month, events, tasks, customers)}
    </div>
  `;

  attachCalendarEventListeners(container, ws, events, tasks, customers);
}

/**
 * Renderiza el contenido según el modo de vista (Mes, Semana, Agenda)
 */
function renderCalendarViewport(year, month, events, tasks, customers) {
  if (currentCalView === 'week') {
    return renderWeekView(year, month, events, tasks, customers);
  } else if (currentCalView === 'agenda') {
    return renderAgendaView(year, month, events, tasks, customers);
  }
  return renderMonthView(year, month, events, tasks, customers);
}

/**
 * VISTA MENSUAL (Estructura de Rejilla Única Perfectamente Correlacionada)
 */
function renderMonthView(year, month, events, tasks, customers) {
  const dayHeaders = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  // Cálculo exacto de días del mes
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // En JavaScript: 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  // Queremos Lunes = 0, Martes = 1, Miércoles = 2, Jueves = 3, Viernes = 4, Sábado = 5, Domingo = 6
  let startDayOfWeek = firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1;

  const totalDaysInMonth = lastDayOfMonth.getDate();
  const totalDaysInPrevMonth = new Date(year, month, 0).getDate();

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const cells = [];

  // 1. Días del mes anterior para completar la primera semana
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const dayNum = totalDaysInPrevMonth - i;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const dateKey = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    cells.push({
      dayNumber: dayNum,
      dateKey,
      isCurrentMonth: false,
      monthLabel: 'ago'
    });
  }

  // 2. Días del mes actual
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({
      dayNumber: d,
      dateKey,
      isCurrentMonth: true,
      isToday: dateKey === todayKey
    });
  }

  // 3. Días del mes siguiente para completar la última semana (múltiplo exacto de 7)
  const remaining = (7 - (cells.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const dateKey = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({
      dayNumber: d,
      dateKey,
      isCurrentMonth: false,
      monthLabel: 'oct'
    });
  }

  return `
    <div class="calendar-board-container">
      <div class="calendar-board-grid">
        <!-- CABECERAS DE DÍAS (Fijas en las 7 columnas exactas) -->
        ${dayHeaders.map(dayName => `
          <div class="calendar-header-cell">
            ${dayName}
          </div>
        `).join('')}

        <!-- CELDAS DE DÍAS DEL MES -->
        ${cells.map(cell => {
          if (!cell.isCurrentMonth) {
            return `
              <div class="calendar-day-box is-other-month">
                <div class="calendar-day-top">
                  <span class="calendar-date-number text-muted" style="font-size: 11px;">
                    ${cell.dayNumber}
                  </span>
                </div>
              </div>
            `;
          }

          const dayItems = getDayItems(cell.dateKey, events, tasks);

          return `
            <div class="calendar-day-box is-current-month ${cell.isToday ? 'is-today' : ''}" data-date="${cell.dateKey}" title="Clic para agendar en el ${formatDateCL(cell.dateKey)}">
              <div class="calendar-day-top">
                <span class="calendar-date-number">
                  ${cell.dayNumber}
                </span>
                <button type="button" class="calendar-day-add-btn" data-date="${cell.dateKey}" title="Agendar en este día">
                  +
                </button>
              </div>

              <div class="calendar-events-list">
                ${dayItems.slice(0, 3).map(item => renderEventChip(item)).join('')}
                ${dayItems.length > 3 ? `
                  <div class="text-xs font-bold" style="color: var(--humm-red-primary); font-size: 10px; margin-top: 2px;">
                    +${dayItems.length - 3} más...
                  </div>
                ` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * VISTA SEMANAL (7 Columnas con horas y botones)
 */
function renderWeekView(year, month, events, tasks, customers) {
  const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  
  // Calcular los 7 días de la semana seleccionada
  const curr = new Date(currentCalDate);
  const dayOfWeek = curr.getDay() === 0 ? 6 : curr.getDay() - 1;
  const startOfWeek = new Date(curr);
  startOfWeek.setDate(curr.getDate() - dayOfWeek);

  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    weekDays.push(d);
  }

  const todayStr = new Date().toISOString().split('T')[0];

  return `
    <div class="calendar-board-container">
      <div class="calendar-week-container">
        ${weekDays.map((d, idx) => {
          const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          const isToday = dateKey === todayStr;
          const dayItems = getDayItems(dateKey, events, tasks);

          return `
            <div class="calendar-day-box" style="min-height: 420px; background: var(--bg-card);">
              <div style="padding: 10px 4px; text-align: center; border-bottom: 1px solid var(--border-color); background: ${isToday ? 'rgba(227, 6, 19, 0.05)' : 'var(--bg-body)'}; margin: -8px -8px 8px -8px;">
                <div style="font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase;">
                  ${dayNames[idx]}
                </div>
                <div style="font-size: 1.25rem; font-weight: 800; color: ${isToday ? 'var(--humm-red-primary)' : 'var(--text-primary)'}; margin-top: 2px;">
                  ${d.getDate()}
                </div>
              </div>

              <div class="calendar-events-list">
                ${dayItems.length > 0 ? dayItems.map(item => renderEventChip(item, true)).join('') : `
                  <div style="text-align: center; padding: 40px 4px; color: var(--text-muted); font-size: 11px;">
                    Sin compromisos
                  </div>
                `}
              </div>

              <div style="margin-top: auto; padding-top: 8px; border-top: 1px dashed var(--border-color);">
                <button class="btn btn-ghost btn-sm btn-quick-add-day" data-date="${dateKey}" style="font-size: 11px; width: 100%; padding: 4px;">
                  + Agendar
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * VISTA AGENDA / LISTA CRONOLÓGICA
 */
function renderAgendaView(year, month, events, tasks, customers) {
  const allItems = [];

  events.forEach(e => {
    allItems.push({ ...e, itemType: 'event', sortDate: `${e.date} ${e.startTime || '00:00'}` });
  });

  tasks.forEach(t => {
    if (t.dueDate) {
      allItems.push({
        id: t.id,
        title: t.title,
        type: 'task',
        date: t.dueDate,
        startTime: 'Plazo Tarea',
        priority: t.priority,
        status: t.status,
        itemType: 'task',
        sortDate: `${t.dueDate} 23:59`,
        description: t.description
      });
    }
  });

  const filtered = allItems.filter(item => {
    if (currentCalFilter === 'all') return true;
    if (currentCalFilter === 'tasks') return item.itemType === 'task';
    return item.type === currentCalFilter;
  }).sort((a, b) => a.sortDate.localeCompare(b.sortDate));

  if (filtered.length === 0) {
    return `
      <div style="text-align: center; padding: 60px 20px; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-color);">
        <div style="font-size: 2.5rem; margin-bottom: 12px;">📅</div>
        <h3>No tienes compromisos agendados con este filtro</h3>
        <p class="text-xs" style="margin-bottom: 16px;">Comienza agendando una reunión con clientes, visita a terreno o mentoría.</p>
        <button class="btn btn-primary" id="btn-empty-add-event">+ Agendar Primer Compromiso</button>
      </div>
    `;
  }

  return `
    <div style="background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-color); padding: 16px;">
      <div style="display: flex; flex-direction: column; gap: 10px;">
        ${filtered.map(item => {
          const isTask = item.itemType === 'task';
          const typeBadge = getEventTypeBadge(item);
          const formattedDate = formatDateCL(item.date);

          return `
            <div class="agenda-item-card" style="display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-body); transition: all 0.15s ease;">
              <div style="display: flex; align-items: center; gap: 14px; flex: 1;">
                <div style="min-width: 95px; text-align: center; padding: 6px 10px; background: var(--bg-card); border-radius: 6px; border: 1px solid var(--border-color);">
                  <div style="font-weight: 800; font-size: 13px; color: var(--text-primary);">${formattedDate}</div>
                  <div style="font-size: 11px; color: var(--text-muted); font-weight: 600;">${item.startTime || ''}</div>
                </div>

                <div style="flex: 1;">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                    ${typeBadge}
                    <strong style="font-size: var(--font-size-sm); color: var(--text-primary);">${item.title}</strong>
                  </div>
                  ${item.location ? `<div class="text-xs text-muted">📍 ${item.location}</div>` : ''}
                  ${item.meetUrl ? `<div class="text-xs"><a href="${item.meetUrl}" target="_blank" style="color: #2563EB; font-weight: 600;">🔗 Unirse a Google Meet</a></div>` : ''}
                </div>
              </div>

              <div style="display: flex; gap: 6px; align-items: center;">
                ${!isTask ? `
                  <button class="btn btn-ghost btn-sm btn-export-google" data-id="${item.id}" title="Añadir a Google Calendar" style="padding: 6px 8px;">
                    📅 Google
                  </button>
                  <button class="btn btn-ghost btn-sm btn-download-single-ics" data-id="${item.id}" title="Descargar .ICS para Apple / Outlook" style="padding: 6px 8px;">
                    📥 .ICS
                  </button>
                ` : ''}
                <button class="btn btn-secondary btn-sm btn-view-item-detail" data-id="${item.id}" data-type="${item.itemType}">
                  Ver Detalle
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * Obtiene todos los eventos y tareas para una fecha específica
 */
function getDayItems(dateKey, events, tasks) {
  const items = [];

  events.filter(e => e.date === dateKey).forEach(e => {
    if (currentCalFilter === 'all' || currentCalFilter === e.type) {
      items.push({ ...e, itemType: 'event' });
    }
  });

  if (currentCalFilter === 'all' || currentCalFilter === 'tasks') {
    tasks.filter(t => t.dueDate === dateKey).forEach(t => {
      items.push({
        id: t.id,
        title: t.title,
        type: 'task',
        date: t.dueDate,
        priority: t.priority,
        status: t.status,
        itemType: 'task'
      });
    });
  }

  return items;
}

/**
 * Renderiza el chip visual de cada evento/tarea en la cuadrícula
 */
function renderEventChip(item, isFull = false) {
  let chipClass = 'chip-reunion';
  let icon = '🤝';

  if (item.type === 'mentoria') {
    chipClass = 'chip-mentoria';
    icon = '🎓';
  } else if (item.type === 'visita') {
    chipClass = 'chip-visita';
    icon = '🚗';
  } else if (item.type === 'entrega') {
    chipClass = 'chip-entrega';
    icon = '📦';
  } else if (item.type === 'comercial') {
    chipClass = 'chip-comercial';
    icon = '💼';
  } else if (item.itemType === 'task') {
    chipClass = 'chip-task';
    icon = '📋';
  } else if (item.type === 'otro') {
    chipClass = 'chip-otro';
    icon = '📌';
  }

  return `
    <div class="calendar-chip ${chipClass} btn-view-item-detail" data-id="${item.id}" data-type="${item.itemType}" title="${item.title} (${item.startTime || ''})">
      <span>${icon}</span>
      <span style="overflow: hidden; text-overflow: ellipsis;">
        ${item.startTime && item.itemType !== 'task' ? `<strong>${item.startTime}</strong> ` : ''}${item.title}
      </span>
    </div>
  `;
}

/**
 * Retorna el badge de tipo
 */
function getEventTypeBadge(item) {
  if (item.itemType === 'task') {
    return `<span class="badge badge-neutral text-xs">📋 Tarea (${item.priority || 'media'})</span>`;
  }
  switch (item.type) {
    case 'reunion':
      return `<span class="badge text-xs" style="background: rgba(59, 130, 246, 0.15); color: #1D4ED8;">🤝 Reunión</span>`;
    case 'mentoria':
      return `<span class="badge badge-primary text-xs">🎓 Mentoría Humm</span>`;
    case 'visita':
      return `<span class="badge text-xs" style="background: rgba(245, 158, 11, 0.15); color: #B45309;">🚗 Visita</span>`;
    case 'entrega':
      return `<span class="badge badge-success text-xs">📦 Entrega</span>`;
    case 'comercial':
      return `<span class="badge text-xs" style="background: rgba(139, 92, 246, 0.15); color: #6D28D9;">💼 Comercial</span>`;
    default:
      return `<span class="badge badge-neutral text-xs">📌 Compromiso</span>`;
  }
}

/**
 * Genera el enlace directo para añadir a Google Calendar
 */
export function generateGoogleCalendarUrl(event) {
  const title = encodeURIComponent(event.title || 'Compromiso Mi Humm');
  const details = encodeURIComponent(`${event.description || ''}\n\nAgendado desde Mi Humm`);
  const location = encodeURIComponent(event.location || event.meetUrl || '');

  let startIso = '';
  let endIso = '';

  if (event.date) {
    const dStr = event.date.replace(/-/g, '');
    const sTime = (event.startTime || '09:00').replace(/:/g, '') + '00';
    const eTime = (event.endTime || '10:00').replace(/:/g, '') + '00';
    startIso = `${dStr}T${sTime}`;
    endIso = `${dStr}T${eTime}`;
  }

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;
}

/**
 * Genera el enlace directo para añadir a Microsoft Outlook
 */
export function generateOutlookCalendarUrl(event) {
  const subject = encodeURIComponent(event.title || 'Compromiso Mi Humm');
  const body = encodeURIComponent(`${event.description || ''}\n\nAgendado desde Mi Humm`);
  const location = encodeURIComponent(event.location || event.meetUrl || '');

  const startIso = event.date ? `${event.date}T${event.startTime || '09:00'}:00` : '';
  const endIso = event.date ? `${event.date}T${event.endTime || '10:00'}:00` : '';

  return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${subject}&startdt=${encodeURIComponent(startIso)}&enddt=${encodeURIComponent(endIso)}&body=${body}&location=${location}`;
}

/**
 * Descarga un archivo .ICS para importar en Apple Calendar, Outlook, etc.
 */
export function downloadICS(event) {
  const nowStr = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const dStr = (event.date || new Date().toISOString().split('T')[0]).replace(/-/g, '');
  const sTime = (event.startTime || '09:00').replace(/:/g, '') + '00';
  const eTime = (event.endTime || '10:00').replace(/:/g, '') + '00';

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mi Humm//Comunidad Co-Creation//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:humm-evt-${event.id || Date.now()}@mi.humm.cl`,
    `DTSTAMP:${nowStr}`,
    `DTSTART:${dStr}T${sTime}`,
    `DTEND:${dStr}T${eTime}`,
    `SUMMARY:${event.title || 'Compromiso Mi Humm'}`,
    `DESCRIPTION:${(event.description || '').replace(/\n/g, '\\n')}`,
    `LOCATION:${event.location || event.meetUrl || ''}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${(event.title || 'compromiso').toLowerCase().replace(/[^a-z0-9]/g, '_')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Descarga todos los eventos del workspace en un único archivo .ICS
 */
export function downloadAllEventsICS(wsId) {
  const events = store.getEvents(wsId);
  const nowStr = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mi Humm//Comunidad Co-Creation//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Mi Humm - Agenda & Compromisos',
    'X-WR-TIMEZONE:America/Santiago'
  ];

  events.forEach(event => {
    const dStr = (event.date || new Date().toISOString().split('T')[0]).replace(/-/g, '');
    const sTime = (event.startTime || '09:00').replace(/:/g, '') + '00';
    const eTime = (event.endTime || '10:00').replace(/:/g, '') + '00';

    lines.push(
      'BEGIN:VEVENT',
      `UID:humm-evt-${event.id}@mi.humm.cl`,
      `DTSTAMP:${nowStr}`,
      `DTSTART:${dStr}T${sTime}`,
      `DTEND:${dStr}T${eTime}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${(event.description || '').replace(/\n/g, '\\n')}`,
      `LOCATION:${event.location || event.meetUrl || ''}`,
      'STATUS:CONFIRMED',
      'END:VEVENT'
    );
  });

  lines.push('END:VCALENDAR');

  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `mi_humm_agenda_${wsId}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Asocia todos los event listeners de la vista
 */
function attachCalendarEventListeners(container, ws, events, tasks, customers) {
  // Botones navegación mes
  container.querySelector('#cal-btn-prev')?.addEventListener('click', () => {
    currentCalDate.setMonth(currentCalDate.getMonth() - 1);
    renderCalendarView(container);
  });

  container.querySelector('#cal-btn-next')?.addEventListener('click', () => {
    currentCalDate.setMonth(currentCalDate.getMonth() + 1);
    renderCalendarView(container);
  });

  container.querySelector('#cal-btn-today')?.addEventListener('click', () => {
    currentCalDate = new Date();
    renderCalendarView(container);
  });

  // Selector de vista (Mes, Semana, Agenda)
  container.querySelectorAll('.cal-view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentCalView = btn.getAttribute('data-view');
      renderCalendarView(container);
    });
  });

  // Selector de filtros
  container.querySelectorAll('.cal-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentCalFilter = btn.getAttribute('data-filter');
      renderCalendarView(container);
    });
  });

  // Botón abrir modal agendar
  container.querySelector('#btn-open-modal-event, #btn-empty-add-event')?.addEventListener('click', () => {
    if (window.MiHummApp) {
      const form = document.getElementById('form-modal-event');
      if (form) {
        form.removeAttribute('data-edit-id');
        form.reset();
        const dInput = document.getElementById('modal-event-date');
        if (dInput) dInput.value = new Date().toISOString().split('T')[0];
        document.getElementById('modal-event-header-title').textContent = 'Agendar Reunión o Evento';
      }
      window.MiHummApp.openModal('modal-event');
    }
  });

  // Botón abrir modal sincronización
  container.querySelector('#btn-open-sync-modal')?.addEventListener('click', () => {
    if (window.MiHummApp) {
      window.MiHummApp.openModal('modal-calendar-sync');
    }
  });

  // Botón exportar archivo .ICS completo
  container.querySelector('#btn-export-full-ics')?.addEventListener('click', () => {
    downloadAllEventsICS(ws.id);
    if (window.MiHummApp) window.MiHummApp.showToast('Archivo .ICS generado y descargado con éxito', 'success');
  });

  // Clic en celda de día para agendar en esa fecha
  container.querySelectorAll('.calendar-day-box.is-current-month, .btn-quick-add-day, .calendar-day-add-btn').forEach(elem => {
    elem.addEventListener('click', (e) => {
      if (e.target.closest('.calendar-chip')) return;
      const targetDate = elem.getAttribute('data-date');
      if (targetDate && window.MiHummApp) {
        const form = document.getElementById('form-modal-event');
        if (form) {
          form.removeAttribute('data-edit-id');
          form.reset();
          const dInput = document.getElementById('modal-event-date');
          if (dInput) dInput.value = targetDate;
          document.getElementById('modal-event-header-title').textContent = `Agendar para el ${formatDateCL(targetDate)}`;
        }
        window.MiHummApp.openModal('modal-event');
      }
    });
  });

  // Clic en chip de evento o botón ver detalle
  container.querySelectorAll('.btn-view-item-detail').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const itemId = btn.getAttribute('data-id');
      const itemType = btn.getAttribute('data-type');
      showItemDetailModal(itemId, itemType, ws, container);
    });
  });

  // Exportar directo a Google Calendar desde la lista
  container.querySelectorAll('.btn-export-google').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const eventId = btn.getAttribute('data-id');
      const ev = store.getEvent(eventId);
      if (ev) {
        window.open(generateGoogleCalendarUrl(ev), '_blank');
      }
    });
  });

  // Descargar .ICS individual desde la lista
  container.querySelectorAll('.btn-download-single-ics').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const eventId = btn.getAttribute('data-id');
      const ev = store.getEvent(eventId);
      if (ev) {
        downloadICS(ev);
        if (window.MiHummApp) window.MiHummApp.showToast('Archivo .ICS descargado', 'success');
      }
    });
  });
}

/**
 * Abre el modal con el detalle completo del evento o tarea
 */
function showItemDetailModal(itemId, itemType, ws, container) {
  if (itemType === 'task') {
    if (window.MiHummApp) window.MiHummApp.openEditTaskModal(itemId);
    return;
  }

  const ev = store.getEvent(itemId);
  if (!ev) return;

  const customer = ev.customerId ? store.getCustomer(ev.customerId) : null;
  const content = document.getElementById('event-detail-content');
  const title = document.getElementById('event-detail-title');
  const footer = document.getElementById('event-detail-footer');

  if (!content || !title || !footer) return;

  title.textContent = ev.title;

  content.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 14px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        ${getEventTypeBadge(ev)}
        <span style="font-weight: 700; color: var(--text-primary); font-size: 13px;">
          📅 ${formatDateCL(ev.date)} (${ev.startTime || '09:00'} - ${ev.endTime || '10:00'})
        </span>
      </div>

      ${customer ? `
        <div style="background: var(--bg-body); padding: 10px 12px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
          <div class="text-xs text-muted">Cliente asociado:</div>
          <strong style="color: var(--text-primary);">👤 ${customer.firstName} ${customer.lastName || ''}</strong>
          ${customer.company ? `<div class="text-xs text-muted">${customer.company}</div>` : ''}
          ${customer.phone ? `<div class="text-xs" style="margin-top: 4px;">📞 ${customer.phone}</div>` : ''}
        </div>
      ` : ''}

      ${ev.location ? `
        <div>
          <span class="text-xs text-muted">📍 Lugar:</span>
          <div style="font-weight: 600; color: var(--text-primary);">${ev.location}</div>
        </div>
      ` : ''}

      ${ev.meetUrl ? `
        <div>
          <span class="text-xs text-muted">🔗 Videollamada:</span>
          <div><a href="${ev.meetUrl}" target="_blank" style="color: #2563EB; font-weight: 700; text-decoration: underline;">Abrir enlace de reunión virtual</a></div>
        </div>
      ` : ''}

      ${ev.description ? `
        <div>
          <span class="text-xs text-muted">📝 Temario / Notas:</span>
          <div style="font-size: var(--font-size-sm); color: var(--text-secondary); white-space: pre-line; margin-top: 4px;">${ev.description}</div>
        </div>
      ` : ''}

      <!-- Acciones de sincronización externa -->
      <div style="padding-top: 12px; border-top: 1px solid var(--border-color);">
        <div style="font-weight: 700; font-size: var(--font-size-xs); margin-bottom: 8px;">Exportar a tu calendario personal:</div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <a href="${generateGoogleCalendarUrl(ev)}" target="_blank" class="btn btn-secondary btn-sm" style="flex: 1; text-align: center; text-decoration: none;">
            📅 Google Calendar
          </a>
          <a href="${generateOutlookCalendarUrl(ev)}" target="_blank" class="btn btn-secondary btn-sm" style="flex: 1; text-align: center; text-decoration: none;">
            ✉️ Outlook
          </a>
          <button type="button" class="btn btn-secondary btn-sm btn-modal-download-ics" style="flex: 1;">
            📥 Apple / .ICS
          </button>
        </div>
      </div>
    </div>
  `;

  footer.innerHTML = `
    <button type="button" class="btn btn-ghost btn-sm btn-modal-delete-event" style="color: var(--danger); margin-right: auto;">
      🗑️ Eliminar
    </button>
    <button type="button" class="btn btn-secondary modal-cancel-btn">Cerrar</button>
    <button type="button" class="btn btn-primary btn-modal-edit-event">✏️ Editar Compromiso</button>
  `;

  footer.querySelector('.btn-modal-edit-event')?.addEventListener('click', () => {
    if (window.MiHummApp) {
      window.MiHummApp.closeAllModals();
      window.MiHummApp.openEditEventModal(ev.id);
    }
  });

  footer.querySelector('.btn-modal-delete-event')?.addEventListener('click', () => {
    if (confirm(`¿Eliminar el compromiso "${ev.title}"?`)) {
      store.deleteEvent(ev.id);
      if (window.MiHummApp) {
        window.MiHummApp.showToast('Compromiso eliminado de la agenda', 'info');
        window.MiHummApp.closeAllModals();
        renderCalendarView(container);
      }
    }
  });

  content.querySelector('.btn-modal-download-ics')?.addEventListener('click', () => {
    downloadICS(ev);
    if (window.MiHummApp) window.MiHummApp.showToast('Archivo .ICS descargado con éxito', 'success');
  });

  if (window.MiHummApp) window.MiHummApp.openModal('modal-event-detail');
}
