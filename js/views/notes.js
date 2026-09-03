/**
 * MI HUMM - MÓDULO BLOC DE NOTAS RÁPIDAS (REDISEÑO ELEGANTE Y DINÁMICO)
 * Comunidad Humm Co-Creation
 */

import { store, formatDateCL } from '../store.js';
import { auth } from '../auth.js';

let noteSearchQuery = '';
let currentNoteCategory = 'all'; // 'all', 'ideas', 'tareas', 'clientes', 'proveedores', 'finanzas', 'general'
let composerColor = 'yellow';
let composerCategory = 'general';

export function renderNotesView(container) {
  const ws = auth.getCurrentWorkspace();
  if (!ws) return;

  const notes = store.getNotes(ws.id);

  // Filtrado de notas
  const filteredNotes = notes.filter(n => {
    const matchesSearch = !noteSearchQuery || 
      (n.title && n.title.toLowerCase().includes(noteSearchQuery.toLowerCase())) || 
      (n.content && n.content.toLowerCase().includes(noteSearchQuery.toLowerCase()));

    const matchesCategory = currentNoteCategory === 'all' || n.category === currentNoteCategory;
    return matchesSearch && matchesCategory;
  });

  const pinnedNotes = filteredNotes.filter(n => n.pinned);
  const otherNotes = filteredNotes.filter(n => !n.pinned);

  // Contadores por categoría
  const countIdeas = notes.filter(n => n.category === 'ideas').length;
  const countTasks = notes.filter(n => n.category === 'tareas').length;
  const countClients = notes.filter(n => n.category === 'clientes').length;
  const countProviders = notes.filter(n => n.category === 'proveedores').length;
  const countFinances = notes.filter(n => n.category === 'finanzas').length;

  container.innerHTML = `
    <!-- CABECERA PRINCIPAL -->
    <div class="view-header" style="margin-bottom: 24px;">
      <div class="view-title-group">
        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <h2 style="font-size: 1.6rem; font-weight: 800; letter-spacing: -0.02em;">Bloc de Notas del Emprendedor</h2>
          <span class="note-composer-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            Espacio Creativo
          </span>
          <span class="badge badge-neutral text-xs" style="font-weight: 600;">${notes.length} ${notes.length === 1 ? 'nota' : 'notas'} registradas</span>
        </div>
        <p style="color: var(--text-secondary); margin-top: 4px; font-size: 14px;">
          Captura ideas espontáneas, listas de verificación, recordatorios de clientes y finanzas al instante.
        </p>
      </div>

      <div class="view-actions" style="display: flex; gap: 10px; align-items: center;">
        <button class="btn btn-primary" id="btn-open-modal-new-note" style="display: inline-flex; align-items: center; gap: 8px; font-weight: 700;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Nueva Nota
        </button>
      </div>
    </div>

    <!-- COMPOSITOR PRINCIPAL DE NOTAS (SMART CANVAS / NOTEPAD) -->
    <div class="note-composer-card" id="note-composer-box">
      <form id="form-quick-composer">
        <div class="note-composer-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 1.1rem;">✍️</span>
            <span style="font-size: 13.5px; font-weight: 800; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.04em;">Crear Nueva Nota Rápida</span>
          </div>

          <!-- Muestras Visuales de Color -->
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <span style="font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase;">Color:</span>
            <div class="note-swatches-group" id="composer-color-swatches">
              <button type="button" class="note-color-swatch swatch-yellow ${composerColor === 'yellow' ? 'active' : ''}" data-color="yellow" title="Amarillo Cálido">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </button>
              <button type="button" class="note-color-swatch swatch-green ${composerColor === 'green' ? 'active' : ''}" data-color="green" title="Verde Menta">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </button>
              <button type="button" class="note-color-swatch swatch-blue ${composerColor === 'blue' ? 'active' : ''}" data-color="blue" title="Azul Cielo">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </button>
              <button type="button" class="note-color-swatch swatch-purple ${composerColor === 'purple' ? 'active' : ''}" data-color="purple" title="Lavanda Suave">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </button>
              <button type="button" class="note-color-swatch swatch-rose ${composerColor === 'rose' ? 'active' : ''}" data-color="rose" title="Coral Rosa">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </button>
              <button type="button" class="note-color-swatch swatch-slate ${composerColor === 'slate' ? 'active' : ''}" data-color="slate" title="Gris Neutro">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </button>
            </div>
          </div>
        </div>

        <!-- CAMPO 1: TÍTULO DE LA NOTA (CLARAMENTE DELIMITADO Y RECONOCIBLE) -->
        <div style="margin-bottom: 16px;">
          <label class="note-field-label" for="quick-note-title">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
              <line x1="7" y1="7" x2="7.01" y2="7"></line>
            </svg>
            Título de la nota o tema principal *
          </label>
          <input 
            type="text" 
            id="quick-note-title" 
            class="note-composer-title-input" 
            placeholder="Ej: Lista de compras para feria, Contactos de proveedores, Ideas de packaging..." 
            autocomplete="off"
            required 
          />
        </div>

        <!-- SELECTOR DE CATEGORÍAS (CHIPS INTERACTIVOS) -->
        <div style="margin-bottom: 14px;">
          <label class="note-field-label">Categoría:</label>
          <div class="note-category-chips" id="composer-cat-chips">
            <button type="button" class="note-cat-chip ${composerCategory === 'general' ? 'active' : ''}" data-cat="general">📝 General</button>
            <button type="button" class="note-cat-chip ${composerCategory === 'ideas' ? 'active' : ''}" data-cat="ideas">💡 Idea Creativa</button>
            <button type="button" class="note-cat-chip ${composerCategory === 'tareas' ? 'active' : ''}" data-cat="tareas">📋 Lista / Tareas</button>
            <button type="button" class="note-cat-chip ${composerCategory === 'clientes' ? 'active' : ''}" data-cat="clientes">👥 Clientes</button>
            <button type="button" class="note-cat-chip ${composerCategory === 'proveedores' ? 'active' : ''}" data-cat="proveedores">🌲 Proveedores</button>
            <button type="button" class="note-cat-chip ${composerCategory === 'finanzas' ? 'active' : ''}" data-cat="finanzas">💰 Finanzas</button>
          </div>
        </div>

        <!-- CAMPO 2: CAJA DE TEXTO PARA APUNTES, IDEAS O LISTAS (ESPACIOSA Y CÓMODA) -->
        <div style="margin-bottom: 12px;">
          <label class="note-field-label" for="quick-note-content">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            Contenido de tus apuntes, ideas o listas *
          </label>
          <textarea 
            id="quick-note-content" 
            class="note-composer-textarea" 
            placeholder="Escribe con total libertad tus notas, listas de precios, apuntes de reuniones o ideas de negocio.&#10;&#10;💡 Tip: Puedes usar el botón '+ Casilla' de abajo para convertir tus apuntes en una lista de tareas interactivas." 
            required
          ></textarea>

          <!-- Barra de Accesos Rápidos para Listas -->
          <div class="note-composer-toolbar">
            <button type="button" class="note-tool-btn" id="btn-insert-checklist">
              <span>☑️</span> + Casilla de verificación
            </button>
            <button type="button" class="note-tool-btn" id="btn-insert-bullet">
              <span>•</span> + Viñeta
            </button>
            <span style="font-size: 11px; color: var(--text-muted); margin-left: auto;">
              Atajo: <strong>Ctrl + Enter</strong> para guardar
            </span>
          </div>
        </div>

        <!-- ACCIONES INFERIORES DEL COMPOSITOR -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--border-subtle); flex-wrap: wrap; gap: 12px;">
          <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: var(--text-secondary); cursor: pointer;">
            <input type="checkbox" id="quick-note-pin" style="accent-color: var(--humm-red-primary); width: 16px; height: 16px;" />
            <span>📌 Fijar esta nota en la parte superior</span>
          </label>

          <div style="display: flex; gap: 10px;">
            <button type="button" class="btn btn-ghost btn-sm" id="btn-quick-composer-clear">
              Limpiar
            </button>
            <button type="submit" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 18px; font-weight: 700;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
              </svg>
              Guardar Nota
            </button>
          </div>
        </div>
      </form>
    </div>

    <!-- BARRA DE BÚSQUEDA Y FILTROS POR CATEGORÍA -->
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; margin-bottom: 24px;">
      <!-- Buscador Inteligente con Botón Limpiar -->
      <div style="position: relative; min-width: 260px; flex: 1; max-width: 420px;">
        <svg style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none;" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input 
          type="text" 
          id="input-search-notes" 
          class="form-input" 
          placeholder="Buscar por título, listas o contenido..." 
          value="${escapeHtml(noteSearchQuery)}" 
          style="padding-left: 38px; padding-right: ${noteSearchQuery ? '36px' : '14px'}; font-size: 13.5px; border-radius: var(--radius-full);" 
        />
        ${noteSearchQuery ? `
          <button type="button" id="btn-clear-search-notes" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--text-muted); font-size: 14px; padding: 4px 6px;">✕</button>
        ` : ''}
      </div>

      <!-- Filtros por Categoría (Desplazable en móvil) -->
      <div class="filter-chips-scroll" style="display: flex; gap: 8px; overflow-x: auto; flex-wrap: nowrap; -webkit-overflow-scrolling: touch; padding-bottom: 4px; max-width: 100%;">
        <button class="btn ${currentNoteCategory === 'all' ? 'btn-primary' : 'btn-ghost'} btn-sm note-filter-cat" data-category="all" style="font-size: 12px; padding: 6px 14px; white-space: nowrap; flex-shrink: 0; border-radius: var(--radius-full);">
          Todas (${notes.length})
        </button>
        <button class="btn ${currentNoteCategory === 'ideas' ? 'btn-primary' : 'btn-ghost'} btn-sm note-filter-cat" data-category="ideas" style="font-size: 12px; padding: 6px 14px; white-space: nowrap; flex-shrink: 0; border-radius: var(--radius-full);">
          💡 Ideas (${countIdeas})
        </button>
        <button class="btn ${currentNoteCategory === 'tareas' ? 'btn-primary' : 'btn-ghost'} btn-sm note-filter-cat" data-category="tareas" style="font-size: 12px; padding: 6px 14px; white-space: nowrap; flex-shrink: 0; border-radius: var(--radius-full);">
          📋 Listas (${countTasks})
        </button>
        <button class="btn ${currentNoteCategory === 'clientes' ? 'btn-primary' : 'btn-ghost'} btn-sm note-filter-cat" data-category="clientes" style="font-size: 12px; padding: 6px 14px; white-space: nowrap; flex-shrink: 0; border-radius: var(--radius-full);">
          👥 Clientes (${countClients})
        </button>
        <button class="btn ${currentNoteCategory === 'proveedores' ? 'btn-primary' : 'btn-ghost'} btn-sm note-filter-cat" data-category="proveedores" style="font-size: 12px; padding: 6px 14px; white-space: nowrap; flex-shrink: 0; border-radius: var(--radius-full);">
          🌲 Proveedores (${countProviders})
        </button>
        <button class="btn ${currentNoteCategory === 'finanzas' ? 'btn-primary' : 'btn-ghost'} btn-sm note-filter-cat" data-category="finanzas" style="font-size: 12px; padding: 6px 14px; white-space: nowrap; flex-shrink: 0; border-radius: var(--radius-full);">
          💰 Finanzas (${countFinances})
        </button>
      </div>
    </div>

    <!-- CONTENEDOR DE TARJETAS DE NOTAS -->
    <div id="notes-cards-container">
      ${filteredNotes.length === 0 ? `
        <div style="text-align: center; padding: 60px 24px; background: var(--bg-card); border-radius: var(--radius-xl); border: 2px dashed var(--border-color); margin-top: 10px;">
          <div style="font-size: 3rem; margin-bottom: 14px;">📝</div>
          <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 6px;">
            ${noteSearchQuery || currentNoteCategory !== 'all' ? 'No se encontraron notas con estos filtros' : 'Aún no tienes notas guardadas'}
          </h3>
          <p class="text-xs text-muted" style="max-width: 420px; margin: 0 auto 20px auto; font-size: 13.5px; line-height: 1.5;">
            ${noteSearchQuery || currentNoteCategory !== 'all' 
              ? 'Prueba modificando los términos de búsqueda o selecciona otra categoría.' 
              : 'Escribe tu primera idea en el recuadro superior o pulsa el botón para crear una nueva nota.'}
          </p>
          <div style="display: flex; gap: 10px; justify-content: center;">
            ${noteSearchQuery || currentNoteCategory !== 'all' ? `
              <button class="btn btn-secondary" id="btn-reset-filters">Limpiar Filtros</button>
            ` : `
              <button class="btn btn-primary" id="btn-empty-new-note" style="display: inline-flex; align-items: center; gap: 8px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                + Crear Primera Nota
              </button>
            `}
          </div>
        </div>
      ` : `
        ${pinnedNotes.length > 0 ? `
          <div style="margin-bottom: 28px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 14px;">
              <span style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: var(--text-secondary); letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px;">
                📌 Notas Fijadas (${pinnedNotes.length})
              </span>
            </div>
            <div class="notes-grid">
              ${pinnedNotes.map(n => renderNoteCard(n)).join('')}
            </div>
          </div>
        ` : ''}

        ${otherNotes.length > 0 ? `
          <div>
            ${pinnedNotes.length > 0 ? `
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 14px;">
                <span style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: var(--text-secondary); letter-spacing: 0.05em;">
                  Otras Notas (${otherNotes.length})
                </span>
              </div>
            ` : ''}
            <div class="notes-grid">
              ${otherNotes.map(n => renderNoteCard(n)).join('')}
            </div>
          </div>
        ` : ''}
      `}
    </div>
  `;

  attachNotesEventListeners(container, ws);
}

/**
 * Renderiza cada tarjeta de nota estilo Post-It / Canvas moderno con soporte de checklists interactivas
 */
function renderNoteCard(note) {
  const colorClass = `note-color-${note.color || 'yellow'}`;
  const categoryBadge = getCategoryBadge(note.category);
  const formattedDate = formatDateCL(note.updatedAt || note.createdAt);

  // Renderizar contenido con soporte para listas interactivas
  const renderedBody = renderNoteBodyWithChecklists(note.id, note.content);

  return `
    <div class="note-card ${colorClass} ${note.pinned ? 'is-pinned' : ''}" data-id="${note.id}">
      <div class="note-card-header">
        <div style="flex: 1; min-width: 0; padding-right: 6px;">
          ${categoryBadge}
          <h4 class="note-card-title">${escapeHtml(note.title || 'Sin título')}</h4>
        </div>
        <button type="button" class="btn-note-pin ${note.pinned ? 'active' : ''}" data-id="${note.id}" title="${note.pinned ? 'Desfijar nota' : 'Fijar nota al inicio'}">
          📌
        </button>
      </div>

      <div class="note-card-body">
        ${renderedBody}
      </div>

      <div class="note-card-footer">
        <span class="text-xs text-muted" style="font-size: 11px; font-weight: 500;">
          ${formattedDate}
        </span>

        <div class="note-card-actions">
          <button type="button" class="note-action-btn btn-copy-note" data-id="${note.id}" title="Copiar texto al portapapeles">
            📋
          </button>
          <button type="button" class="note-action-btn btn-edit-note" data-id="${note.id}" title="Editar nota completa">
            ✏️
          </button>
          <button type="button" class="note-action-btn btn-delete-note" data-id="${note.id}" title="Eliminar nota" style="color: var(--danger);">
            🗑️
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Parsea el texto de la nota para renderizar checklists interactivas o párrafos
 */
function renderNoteBodyWithChecklists(noteId, content) {
  if (!content) return `<p class="note-card-content text-muted" style="font-style: italic;">(Sin contenido)</p>`;

  const lines = content.split('\n');
  const hasChecklist = lines.some(l => /^\s*(-|\*|\+)?\s*\[[ xX]\]/.test(l));

  if (!hasChecklist) {
    return `<p class="note-card-content">${escapeHtml(content)}</p>`;
  }

  let html = `<div class="note-checklist">`;
  lines.forEach((line, idx) => {
    const checkMatch = line.match(/^\s*(-|\*|\+)?\s*\[([ xX])\]\s*(.*)$/);
    if (checkMatch) {
      const isChecked = checkMatch[2].toLowerCase() === 'x';
      const itemText = checkMatch[3];
      html += `
        <label class="note-checklist-item ${isChecked ? 'is-done' : ''}" data-note-id="${noteId}" data-line="${idx}">
          <input type="checkbox" class="note-checklist-checkbox" data-note-id="${noteId}" data-line="${idx}" ${isChecked ? 'checked' : ''} />
          <span>${escapeHtml(itemText)}</span>
        </label>
      `;
    } else if (line.trim()) {
      html += `<div style="font-size: 13.5px; line-height: 1.5; margin: 4px 0;">${escapeHtml(line)}</div>`;
    }
  });
  html += `</div>`;
  return html;
}

function getCategoryBadge(category) {
  switch (category) {
    case 'ideas':
      return `<span class="badge text-xs" style="background: rgba(245, 158, 11, 0.15); color: #B45309; margin-bottom: 6px; font-weight: 700;">💡 Idea</span>`;
    case 'tareas':
      return `<span class="badge text-xs" style="background: rgba(59, 130, 246, 0.15); color: #1D4ED8; margin-bottom: 6px; font-weight: 700;">📋 Lista</span>`;
    case 'clientes':
      return `<span class="badge text-xs" style="background: rgba(139, 92, 246, 0.15); color: #6D28D9; margin-bottom: 6px; font-weight: 700;">👥 Cliente</span>`;
    case 'proveedores':
      return `<span class="badge text-xs" style="background: rgba(16, 185, 129, 0.15); color: #047857; margin-bottom: 6px; font-weight: 700;">🌲 Proveedor</span>`;
    case 'finanzas':
      return `<span class="badge text-xs" style="background: rgba(227, 6, 19, 0.12); color: #B91C1C; margin-bottom: 6px; font-weight: 700;">💰 Finanzas</span>`;
    default:
      return `<span class="badge badge-neutral text-xs" style="margin-bottom: 6px; font-weight: 700;">📝 General</span>`;
  }
}

function attachNotesEventListeners(container, ws) {
  // Selector de color del compositor
  container.querySelectorAll('#composer-color-swatches .note-color-swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
      composerColor = swatch.getAttribute('data-color') || 'yellow';
      container.querySelectorAll('#composer-color-swatches .note-color-swatch').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
    });
  });

  // Selector de categoría del compositor
  container.querySelectorAll('#composer-cat-chips .note-cat-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      composerCategory = chip.getAttribute('data-cat') || 'general';
      container.querySelectorAll('#composer-cat-chips .note-cat-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
    });
  });

  // Botón insertar casilla de verificación en textarea
  container.querySelector('#btn-insert-checklist')?.addEventListener('click', () => {
    const textarea = container.querySelector('#quick-note-content');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    const prefix = (start === 0 || value[start - 1] === '\n') ? '- [ ] ' : '\n- [ ] ';
    
    textarea.value = value.substring(0, start) + prefix + value.substring(end);
    textarea.focus();
    const newPos = start + prefix.length;
    textarea.setSelectionRange(newPos, newPos);
  });

  // Botón insertar viñeta en textarea
  container.querySelector('#btn-insert-bullet')?.addEventListener('click', () => {
    const textarea = container.querySelector('#quick-note-content');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    const prefix = (start === 0 || value[start - 1] === '\n') ? '• ' : '\n• ';
    
    textarea.value = value.substring(0, start) + prefix + value.substring(end);
    textarea.focus();
    const newPos = start + prefix.length;
    textarea.setSelectionRange(newPos, newPos);
  });

  // Atajo Ctrl+Enter / Cmd+Enter en el formulario del compositor
  const formQuick = container.querySelector('#form-quick-composer');
  if (formQuick) {
    formQuick.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        formQuick.requestSubmit();
      }
    });

    formQuick.addEventListener('submit', (e) => {
      e.preventDefault();
      const titleInput = container.querySelector('#quick-note-title');
      const contentInput = container.querySelector('#quick-note-content');
      const pinInput = container.querySelector('#quick-note-pin');

      const title = (titleInput?.value || '').trim();
      const content = (contentInput?.value || '').trim();
      const pinned = !!pinInput?.checked;

      if (!title && !content) {
        if (window.MiHummApp) window.MiHummApp.showToast('Por favor escribe un título o apunte', 'warning');
        titleInput?.focus();
        return;
      }

      store.saveNote(ws.id, {
        title: title || 'Sin título',
        category: composerCategory,
        color: composerColor,
        content,
        pinned
      });

      if (window.MiHummApp) window.MiHummApp.showToast('Nota guardada con éxito', 'success');
      formQuick.reset();
      renderNotesView(container);
    });
  }

  // Botón limpiar compositor
  container.querySelector('#btn-quick-composer-clear')?.addEventListener('click', () => {
    formQuick?.reset();
    composerCategory = 'general';
    composerColor = 'yellow';
    container.querySelectorAll('#composer-color-swatches .note-color-swatch').forEach(s => {
      s.classList.toggle('active', s.getAttribute('data-color') === 'yellow');
    });
    container.querySelectorAll('#composer-cat-chips .note-cat-chip').forEach(c => {
      c.classList.toggle('active', c.getAttribute('data-cat') === 'general');
    });
  });

  // Checklists interactivas en tarjetas
  container.querySelectorAll('.note-checklist-checkbox').forEach(chk => {
    chk.addEventListener('change', (e) => {
      e.stopPropagation();
      const noteId = chk.getAttribute('data-note-id');
      const lineIdx = parseInt(chk.getAttribute('data-line'), 10);
      const note = store.getNote(noteId);
      if (!note || !note.content) return;

      const lines = note.content.split('\n');
      if (lines[lineIdx] !== undefined) {
        const isChecked = chk.checked;
        if (isChecked) {
          lines[lineIdx] = lines[lineIdx].replace(/\[[ ]\]/, '[x]');
        } else {
          lines[lineIdx] = lines[lineIdx].replace(/\[[xX]\]/, '[ ]');
        }
        const updatedContent = lines.join('\n');
        store.updateNoteContent(noteId, updatedContent);

        // Feedback visual inmediato sin recargar toda la vista
        const itemLabel = chk.closest('.note-checklist-item');
        if (itemLabel) {
          itemLabel.classList.toggle('is-done', isChecked);
        }
      }
    });
  });

  // Buscador de notas
  const inputSearch = container.querySelector('#input-search-notes');
  if (inputSearch) {
    inputSearch.addEventListener('input', (e) => {
      noteSearchQuery = e.target.value;
      renderNotesView(container);
      const newSearch = container.querySelector('#input-search-notes');
      if (newSearch) {
        newSearch.focus();
        newSearch.setSelectionRange(noteSearchQuery.length, noteSearchQuery.length);
      }
    });
  }

  // Botón limpiar búsqueda
  container.querySelector('#btn-clear-search-notes')?.addEventListener('click', () => {
    noteSearchQuery = '';
    renderNotesView(container);
  });

  // Botón limpiar filtros en estado vacío
  container.querySelector('#btn-reset-filters')?.addEventListener('click', () => {
    noteSearchQuery = '';
    currentNoteCategory = 'all';
    renderNotesView(container);
  });

  // Filtros de categoría superiores
  container.querySelectorAll('.note-filter-cat').forEach(btn => {
    btn.addEventListener('click', () => {
      currentNoteCategory = btn.getAttribute('data-category');
      renderNotesView(container);
    });
  });

  // TODOS los botones para abrir modal de nueva nota (incluye el botón de cabecera y el botón de estado vacío)
  container.querySelectorAll('#btn-open-modal-new-note, #btn-empty-new-note').forEach(btn => {
    btn.addEventListener('click', () => {
      // Enfocar compositor si está visible, o abrir modal completo
      const composerBox = container.querySelector('#note-composer-box');
      const titleInput = container.querySelector('#quick-note-title');
      if (composerBox && titleInput) {
        composerBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          titleInput.focus();
          composerBox.style.boxShadow = '0 0 0 4px rgba(229, 56, 59, 0.2)';
          setTimeout(() => composerBox.style.boxShadow = '', 1200);
        }, 200);
      } else if (window.MiHummApp) {
        const form = document.getElementById('form-modal-note');
        if (form) {
          form.removeAttribute('data-edit-id');
          form.reset();
          document.getElementById('modal-note-header-title').textContent = 'Nueva Nota';
        }
        window.MiHummApp.openModal('modal-note');
      }
    });
  });

  // Botón Pin / Desfijar
  container.querySelectorAll('.btn-note-pin').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const noteId = btn.getAttribute('data-id');
      const updated = store.togglePinNote(noteId);
      if (window.MiHummApp) {
        window.MiHummApp.showToast(updated.pinned ? 'Nota fijada al inicio 📌' : 'Nota desfijada', 'info');
      }
      renderNotesView(container);
    });
  });

  // Botón Copiar texto
  container.querySelectorAll('.btn-copy-note').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const noteId = btn.getAttribute('data-id');
      const note = store.getNote(noteId);
      if (note) {
        const fullText = `${note.title}\n\n${note.content}`;
        navigator.clipboard.writeText(fullText).then(() => {
          if (window.MiHummApp) window.MiHummApp.showToast('Nota copiada al portapapeles 📋', 'success');
        });
      }
    });
  });

  // Botón Editar (abre modal con los datos cargados)
  container.querySelectorAll('.btn-edit-note').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const noteId = btn.getAttribute('data-id');
      if (noteId && window.MiHummApp) {
        window.MiHummApp.openEditNoteModal(noteId);
      }
    });
  });

  // Clic en la tarjeta para editar (evitando propagación de botones internos)
  container.querySelectorAll('.note-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (
        e.target.closest('.btn-note-pin') || 
        e.target.closest('.btn-delete-note') || 
        e.target.closest('.btn-copy-note') || 
        e.target.closest('.btn-edit-note') ||
        e.target.closest('.note-checklist-checkbox') ||
        e.target.closest('.note-checklist-item')
      ) {
        return;
      }
      const noteId = card.getAttribute('data-id');
      if (noteId && window.MiHummApp) {
        window.MiHummApp.openEditNoteModal(noteId);
      }
    });
  });

  // Botón Eliminar
  container.querySelectorAll('.btn-delete-note').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const noteId = btn.getAttribute('data-id');
      const note = store.getNote(noteId);
      if (note && confirm(`¿Estás seguro de eliminar la nota "${note.title}"?`)) {
        const deleted = store.deleteNote(noteId);
        if (deleted) {
          if (window.MiHummApp) window.MiHummApp.showToast('Nota eliminada', 'info');
          renderNotesView(container);
        } else {
          if (window.MiHummApp) window.MiHummApp.showToast('No se pudo eliminar la nota', 'error');
        }
      }
    });
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m]));
}
