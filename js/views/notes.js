/**
 * MI HUMM - MÓDULO BLOC DE NOTAS RÁPIDAS
 * Comunidad Humm Co-Creation
 */

import { store, formatDateCL } from '../store.js';
import { auth } from '../auth.js';

let noteSearchQuery = '';
let currentNoteCategory = 'all'; // 'all', 'ideas', 'tareas', 'clientes', 'proveedores', 'finanzas', 'general'
let currentNoteColor = 'all';

export function renderNotesView(container) {
  const ws = auth.getCurrentWorkspace();
  if (!ws) return;

  const notes = store.getNotes(ws.id);

  // Filtrado de notas
  const filteredNotes = notes.filter(n => {
    const matchesSearch = !noteSearchQuery || 
      n.title.toLowerCase().includes(noteSearchQuery.toLowerCase()) || 
      n.content.toLowerCase().includes(noteSearchQuery.toLowerCase());

    const matchesCategory = currentNoteCategory === 'all' || n.category === currentNoteCategory;
    const matchesColor = currentNoteColor === 'all' || n.color === currentNoteColor;

    return matchesSearch && matchesCategory && matchesColor;
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
    <div class="view-header" style="margin-bottom: 20px;">
      <div class="view-title-group">
        <div style="display: flex; align-items: center; gap: 8px;">
          <h2>Bloc de Notas Rápidas</h2>
          <span class="badge badge-primary text-xs">Espacio Creativo</span>
        </div>
        <p>Apunta ideas, recordatorios de clientes, proveedores, listas y borradores de tu negocio en un solo lugar.</p>
      </div>

      <div class="view-actions" style="display: flex; gap: 8px;">
        <button class="btn btn-primary" id="btn-open-modal-new-note">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Nueva Nota
        </button>
      </div>
    </div>

    <!-- COMPOSITOR RÁPIDO SUPERIOR (ESTILO NOTA RÁPIDA) -->
    <div class="quick-note-composer-card" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 16px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
      <form id="form-quick-composer">
        <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 10px; flex-wrap: wrap;">
          <input type="text" id="quick-note-title" class="form-input" placeholder="Título de la nota rápida..." style="font-weight: 700; font-size: 14px; flex: 1; min-width: 200px; border-color: transparent; background: var(--bg-body);" required />
          
          <select id="quick-note-category" class="form-select" style="width: auto; font-size: 12px; padding: 6px 10px; border-color: transparent; background: var(--bg-body);">
            <option value="general">📝 General</option>
            <option value="ideas">💡 Ideas</option>
            <option value="tareas">📋 Listas / Tareas</option>
            <option value="clientes">👥 Clientes</option>
            <option value="proveedores">🌲 Proveedores</option>
            <option value="finanzas">💰 Finanzas</option>
          </select>

          <select id="quick-note-color" class="form-select" style="width: auto; font-size: 12px; padding: 6px 10px; border-color: transparent; background: var(--bg-body);">
            <option value="yellow">🟡 Amarillo</option>
            <option value="green">🟢 Verde</option>
            <option value="blue">🔵 Azul</option>
            <option value="purple">🟣 Morado</option>
            <option value="rose">🔴 Rosa</option>
            <option value="slate">⚪ Gris</option>
          </select>
        </div>

        <textarea id="quick-note-content" class="form-input" rows="2" placeholder="Escribe tu apunte, idea o lista aquí..." style="resize: vertical; font-size: 13px; line-height: 1.5; border-color: transparent; background: var(--bg-body);" required></textarea>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
          <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-secondary); cursor: pointer;">
            <input type="checkbox" id="quick-note-pin" />
            📌 Fijar en la parte superior
          </label>
          <button type="submit" class="btn btn-sm btn-primary">
            💾 Guardar Nota Rápida
          </button>
        </div>
      </form>
    </div>

    <!-- BARRA DE BÚSQUEDA Y FILTROS POR CATEGORÍA -->
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 20px;">
      <!-- Buscador -->
      <div style="position: relative; min-width: 260px; flex: 1; max-width: 400px;">
        <input type="text" id="input-search-notes" class="form-input" placeholder="🔍 Buscar en tus notas..." value="${escapeHtml(noteSearchQuery)}" style="padding-left: 12px; font-size: 13px;" />
      </div>

      <!-- Filtros por Categoría -->
      <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
        <button class="btn ${currentNoteCategory === 'all' ? 'btn-primary' : 'btn-ghost'} btn-sm note-filter-cat" data-category="all" style="font-size: 11px; padding: 4px 10px;">
          Todas (${notes.length})
        </button>
        <button class="btn ${currentNoteCategory === 'ideas' ? 'btn-primary' : 'btn-ghost'} btn-sm note-filter-cat" data-category="ideas" style="font-size: 11px; padding: 4px 10px;">
          💡 Ideas (${countIdeas})
        </button>
        <button class="btn ${currentNoteCategory === 'tareas' ? 'btn-primary' : 'btn-ghost'} btn-sm note-filter-cat" data-category="tareas" style="font-size: 11px; padding: 4px 10px;">
          📋 Listas (${countTasks})
        </button>
        <button class="btn ${currentNoteCategory === 'clientes' ? 'btn-primary' : 'btn-ghost'} btn-sm note-filter-cat" data-category="clientes" style="font-size: 11px; padding: 4px 10px;">
          👥 Clientes (${countClients})
        </button>
        <button class="btn ${currentNoteCategory === 'proveedores' ? 'btn-primary' : 'btn-ghost'} btn-sm note-filter-cat" data-category="proveedores" style="font-size: 11px; padding: 4px 10px;">
          🌲 Proveedores (${countProviders})
        </button>
        <button class="btn ${currentNoteCategory === 'finanzas' ? 'btn-primary' : 'btn-ghost'} btn-sm note-filter-cat" data-category="finanzas" style="font-size: 11px; padding: 4px 10px;">
          💰 Finanzas (${countFinances})
        </button>
      </div>
    </div>

    <!-- CONTENEDOR DE TARJETAS DE NOTAS -->
    <div id="notes-cards-container">
      ${filteredNotes.length === 0 ? `
        <div style="text-align: center; padding: 60px 20px; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
          <div style="font-size: 2.5rem; margin-bottom: 12px;">📝</div>
          <h3>No se encontraron notas</h3>
          <p class="text-xs text-muted" style="margin-bottom: 16px;">Comienza escribiendo una idea en el recuadro superior o crea una nueva nota.</p>
          <button class="btn btn-primary" id="btn-empty-new-note">+ Crear Primera Nota</button>
        </div>
      ` : `
        ${pinnedNotes.length > 0 ? `
          <div style="margin-bottom: 24px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
              <span style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: var(--text-secondary); letter-spacing: 0.05em;">
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
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
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
 * Renderiza cada tarjeta de nota estilo Post-It moderno
 */
function renderNoteCard(note) {
  const colorClass = `note-color-${note.color || 'yellow'}`;
  const categoryBadge = getCategoryBadge(note.category);
  const formattedDate = formatDateCL(note.updatedAt || note.createdAt);

  return `
    <div class="note-card ${colorClass} ${note.pinned ? 'is-pinned' : ''}" data-id="${note.id}">
      <div class="note-card-header">
        <div style="flex: 1; padding-right: 6px;">
          ${categoryBadge}
          <h4 class="note-card-title">${escapeHtml(note.title)}</h4>
        </div>
        <button type="button" class="btn-note-pin ${note.pinned ? 'active' : ''}" data-id="${note.id}" title="${note.pinned ? 'Desfijar nota' : 'Fijar nota al inicio'}">
          📌
        </button>
      </div>

      <div class="note-card-body">
        <p class="note-card-content">${escapeHtml(note.content)}</p>
      </div>

      <div class="note-card-footer">
        <span class="text-xs text-muted" style="font-size: 11px;">
          ${formattedDate}
        </span>

        <div class="note-card-actions">
          <button type="button" class="note-action-btn btn-copy-note" data-id="${note.id}" title="Copiar texto al portapapeles">
            📋
          </button>
          <button type="button" class="note-action-btn btn-edit-note" data-id="${note.id}" title="Editar nota">
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

function getCategoryBadge(category) {
  switch (category) {
    case 'ideas':
      return `<span class="badge text-xs" style="background: rgba(245, 158, 11, 0.15); color: #B45309; margin-bottom: 6px;">💡 Idea</span>`;
    case 'tareas':
      return `<span class="badge text-xs" style="background: rgba(59, 130, 246, 0.15); color: #1D4ED8; margin-bottom: 6px;">📋 Lista</span>`;
    case 'clientes':
      return `<span class="badge text-xs" style="background: rgba(139, 92, 246, 0.15); color: #6D28D9; margin-bottom: 6px;">👥 Cliente</span>`;
    case 'proveedores':
      return `<span class="badge text-xs" style="background: rgba(16, 185, 129, 0.15); color: #047857; margin-bottom: 6px;">🌲 Proveedor</span>`;
    case 'finanzas':
      return `<span class="badge text-xs" style="background: rgba(227, 6, 19, 0.12); color: #B91C1C; margin-bottom: 6px;">💰 Finanzas</span>`;
    default:
      return `<span class="badge badge-neutral text-xs" style="margin-bottom: 6px;">📝 General</span>`;
  }
}

function attachNotesEventListeners(container, ws) {
  // Submit compositor rápido
  const formQuick = container.querySelector('#form-quick-composer');
  if (formQuick) {
    formQuick.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = container.querySelector('#quick-note-title').value.trim();
      const category = container.querySelector('#quick-note-category').value;
      const color = container.querySelector('#quick-note-color').value;
      const content = container.querySelector('#quick-note-content').value.trim();
      const pinned = container.querySelector('#quick-note-pin').checked;

      store.saveNote(ws.id, { title, category, color, content, pinned });

      if (window.MiHummApp) window.MiHummApp.showToast('Nota rápida guardada', 'success');
      formQuick.reset();
      renderNotesView(container);
    });
  }

  // Buscador de notas
  const inputSearch = container.querySelector('#input-search-notes');
  if (inputSearch) {
    inputSearch.addEventListener('input', (e) => {
      noteSearchQuery = e.target.value;
      renderNotesView(container);
      // Restaurar foco
      const newSearch = container.querySelector('#input-search-notes');
      if (newSearch) {
        newSearch.focus();
        newSearch.setSelectionRange(noteSearchQuery.length, noteSearchQuery.length);
      }
    });
  }

  // Filtros de categoría
  container.querySelectorAll('.note-filter-cat').forEach(btn => {
    btn.addEventListener('click', () => {
      currentNoteCategory = btn.getAttribute('data-category');
      renderNotesView(container);
    });
  });

  // Botón abrir modal nueva nota completa
  container.querySelector('#btn-open-modal-new-note, #btn-empty-new-note')?.addEventListener('click', () => {
    if (window.MiHummApp) {
      const form = document.getElementById('form-modal-note');
      if (form) {
        form.removeAttribute('data-edit-id');
        form.reset();
        document.getElementById('modal-note-header-title').textContent = 'Nueva Nota';
      }
      window.MiHummApp.openModal('modal-note');
    }
  });

  // Botón Pin / Desfijar
  container.querySelectorAll('.btn-note-pin').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const noteId = btn.getAttribute('data-id');
      const updated = store.togglePinNote(noteId);
      if (window.MiHummApp) {
        window.MiHummApp.showToast(updated.pinned ? 'Nota fijada al inicio' : 'Nota desfijada', 'info');
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
          if (window.MiHummApp) window.MiHummApp.showToast('Nota copiada al portapapeles', 'success');
        });
      }
    });
  });

  // Botón Editar
  container.querySelectorAll('.btn-edit-note, .note-card').forEach(elem => {
    elem.addEventListener('click', (e) => {
      if (e.target.closest('.btn-note-pin') || e.target.closest('.btn-delete-note') || e.target.closest('.btn-copy-note')) {
        return;
      }
      const noteId = elem.getAttribute('data-id');
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
      if (note && confirm(`¿Eliminar la nota "${note.title}"?`)) {
        store.deleteNote(noteId);
        if (window.MiHummApp) window.MiHummApp.showToast('Nota eliminada', 'info');
        renderNotesView(container);
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
