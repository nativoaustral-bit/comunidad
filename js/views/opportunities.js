/**
 * MI HUMM - MÓDULO OPORTUNIDADES (EMBUDO COMERCIAL & SEGUIMIENTO)
 * Comunidad Humm Co-Creation
 */

import { store, formatCLP, formatDateCL, isDateOverdue, sanitizeWhatsAppPhone } from '../store.js?v=5.0';
import { auth } from '../auth.js?v=5.0';

export function renderOpportunitiesView(container) {
  const ws = auth.getCurrentWorkspace();
  if (!ws) return;

  const allOpps = store.getOpportunities(ws.id);
  const customers = store.getCustomers(ws.id);

  const statusLabels = {
    'nuevo': { text: 'Nuevo contacto', badge: 'badge-neutral' },
    'contactado': { text: 'Contactado', badge: 'badge-info' },
    'interesado': { text: 'Interesado', badge: 'badge-warning' },
    'propuesta': { text: 'Propuesta enviada', badge: 'badge-humm' },
    'ganada': { text: 'Venta lograda', badge: 'badge-success' },
    'no_concretado': { text: 'No concretado', badge: 'badge-danger' }
  };

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h2>Oportunidades</h2>
        <p>Personas o empresas que podrían comprar tus productos o servicios. Haz seguimiento a cada conversación comercial.</p>
      </div>
      <div class="view-actions">
        <button class="btn btn-primary" id="btn-create-opp-main">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Nueva Oportunidad
        </button>
      </div>
    </div>

    <!-- Barra de búsqueda y filtros -->
    <div class="table-toolbar" style="background-color: var(--bg-surface); border-radius: var(--radius-lg); margin-bottom: 20px; border: 1px solid var(--border-subtle);">
      <div class="table-search-box input-with-icon" style="max-width: 320px;">
        <span class="input-icon">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </span>
        <input type="text" id="opp-search-input" class="form-control" placeholder="Buscar por contacto o título..." />
      </div>

      <div class="table-filters" style="flex-wrap: wrap; gap: 8px;">
        <select id="opp-filter-status" class="form-control" style="width: auto; padding: 8px 12px; font-size: var(--font-size-xs);">
          <option value="all">Todos los estados</option>
          <option value="nuevo">Nuevo contacto</option>
          <option value="contactado">Contactado</option>
          <option value="interesado">Interesado</option>
          <option value="propuesta">Propuesta enviada</option>
          <option value="ganada">Venta lograda</option>
          <option value="no_concretado">No concretado</option>
        </select>

        <select id="opp-filter-timing" class="form-control" style="width: auto; padding: 8px 12px; font-size: var(--font-size-xs);">
          <option value="all">Todas las fechas</option>
          <option value="overdue">Seguimiento Atrasado</option>
          <option value="upcoming">Próximos 7 días</option>
        </select>
      </div>
    </div>

    <!-- LISTADO Y PIPELINE DE OPORTUNIDADES -->
    <div id="opps-list-container"></div>
  `;

  function filterAndRender() {
    const searchVal = container.querySelector('#opp-search-input')?.value.toLowerCase().trim() || '';
    const statusVal = container.querySelector('#opp-filter-status')?.value || 'all';
    const timingVal = container.querySelector('#opp-filter-timing')?.value || 'all';

    let filtered = allOpps.filter(o => {
      const title = o.title.toLowerCase();
      const contact = o.contactName.toLowerCase();
      const product = (o.productInterest || '').toLowerCase();

      if (searchVal && !title.includes(searchVal) && !contact.includes(searchVal) && !product.includes(searchVal)) {
        return false;
      }
      if (statusVal !== 'all' && o.status !== statusVal) {
        return false;
      }
      if (timingVal === 'overdue') {
        return o.followUpDate && isDateOverdue(o.followUpDate) && o.status !== 'ganada' && o.status !== 'no_concretado';
      }
      if (timingVal === 'upcoming') {
        if (!o.followUpDate || o.status === 'ganada' || o.status === 'no_concretado') return false;
        const due = new Date(o.followUpDate);
        const now = new Date();
        const diffDays = (due - now) / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays <= 7;
      }
      return true;
    });

    const listWrapper = container.querySelector('#opps-list-container');
    if (!listWrapper) return;

    if (allOpps.length === 0) {
      listWrapper.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polygon points="12 6 12 12 16 14"></polygon>
            </svg>
          </div>
          <h4 class="empty-state-title">Anota una oportunidad para no olvidar el seguimiento</h4>
          <p class="empty-state-desc">Registra a personas interesadas en tus productos o servicios y mantén al día las fechas de contacto.</p>
          <button class="btn btn-primary" id="btn-empty-create-opp">
            Crear mi primera oportunidad
          </button>
        </div>
      `;
      listWrapper.querySelector('#btn-empty-create-opp')?.addEventListener('click', () => {
        if (window.MiHummApp) window.MiHummApp.openModal('modal-opportunity');
      });
      return;
    }

    listWrapper.innerHTML = `
      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Oportunidad / Producto</th>
              <th>Persona / Empresa</th>
              <th>Monto Estimado</th>
              <th>Estado</th>
              <th>Próxima Acción / Seguimiento</th>
              <th style="text-align: right;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.length > 0 ? filtered.map(opp => {
              const isOver = opp.followUpDate && isDateOverdue(opp.followUpDate) && opp.status !== 'ganada' && opp.status !== 'no_concretado';
              const cleanPhone = sanitizeWhatsAppPhone(opp.phone);
              const statusCfg = statusLabels[opp.status] || { text: opp.status, badge: 'badge-neutral' };

              return `
                <tr style="${isOver ? 'background-color: rgba(239, 68, 68, 0.03);' : ''}">
                  <td>
                    <div style="font-weight: 700; color: var(--text-primary);">
                      ${opp.title}
                    </div>
                    ${opp.productInterest ? `<div class="text-xs text-secondary">📦 ${opp.productInterest}</div>` : ''}
                  </td>
                  <td>
                    <div style="font-weight: 600;">${opp.contactName}</div>
                    <div style="display: flex; align-items: center; gap: 6px; margin-top: 2px;">
                      ${opp.phone ? `
                        <a href="https://wa.me/${cleanPhone}" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp btn-sm" style="padding: 2px 7px; font-size: 11px;">
                          WhatsApp
                        </a>
                      ` : ''}
                      ${opp.email ? `<span class="text-xs text-muted">${opp.email}</span>` : ''}
                    </div>
                  </td>
                  <td>
                    <strong style="color: var(--text-primary); font-size: var(--font-size-md);">
                      ${opp.estimatedAmount ? formatCLP(opp.estimatedAmount) : '<span class="text-muted font-normal text-xs">Por definir</span>'}
                    </strong>
                  </td>
                  <td>
                    <span class="badge ${statusCfg.badge}">
                      <span class="badge-dot"></span>
                      ${statusCfg.text}
                    </span>
                  </td>
                  <td>
                    <div>${opp.nextAction || '<span class="text-muted">Sin acción anotada</span>'}</div>
                    <div class="text-xs ${isOver ? 'text-danger font-bold' : 'text-muted'}" style="margin-top: 2px;">
                      📅 ${opp.followUpDate ? (isOver ? 'Atrasado: ' : '') + formatDateCL(opp.followUpDate) : 'Sin fecha'}
                    </div>
                  </td>
                  <td style="text-align: right;">
                    <div style="display: flex; justify-content: flex-end; gap: 4px;">
                      ${opp.status !== 'ganada' ? `
                        <button class="btn btn-primary btn-sm btn-mark-won" data-opp-id="${opp.id}" title="Marcar como venta lograda">
                          ✓ Ganada
                        </button>
                      ` : ''}
                      ${!opp.customerId ? `
                        <button class="btn btn-secondary btn-sm btn-convert-customer" data-opp-id="${opp.id}" title="Convertir a Cliente">
                          + Cliente
                        </button>
                      ` : ''}
                      <button class="btn btn-ghost btn-sm btn-edit-opp" data-opp-id="${opp.id}" title="Editar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M12 20h9"></path>
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                        </svg>
                      </button>
                      <button class="btn btn-ghost btn-sm btn-delete-opp" data-opp-id="${opp.id}" title="Eliminar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('') : `
              <tr>
                <td colspan="6" style="text-align: center; padding: 24px;" class="text-muted">
                  No se encontraron oportunidades con los filtros seleccionados.
                </td>
              </tr>
            `}
          </tbody>
        </table>

        <!-- Tarjetas adaptativas en móvil -->
        <div class="responsive-cards-grid">
          ${filtered.length > 0 ? filtered.map(opp => {
            const isOver = opp.followUpDate && isDateOverdue(opp.followUpDate) && opp.status !== 'ganada' && opp.status !== 'no_concretado';
            const cleanPhone = sanitizeWhatsAppPhone(opp.phone);
            const statusCfg = statusLabels[opp.status] || { text: opp.status, badge: 'badge-neutral' };

            return `
              <div class="adaptive-item-card" style="${isOver ? 'border-left: 3px solid var(--danger);' : ''}">
                <div class="adaptive-card-header">
                  <div>
                    <div style="font-weight: 700; font-size: var(--font-size-base);">${opp.title}</div>
                    <div class="text-xs text-secondary">${opp.contactName}</div>
                  </div>
                  <span class="badge ${statusCfg.badge}">${statusCfg.text}</span>
                </div>
                <div class="adaptive-card-body">
                  ${opp.estimatedAmount ? `<div><strong>Monto estimado:</strong> ${formatCLP(opp.estimatedAmount)}</div>` : ''}
                  ${opp.productInterest ? `<div><strong>Interés:</strong> ${opp.productInterest}</div>` : ''}
                  <div><strong>Próxima acción:</strong> ${opp.nextAction || 'Seguimiento'}</div>
                  <div class="${isOver ? 'text-danger font-bold' : ''}"><strong>Fecha:</strong> ${opp.followUpDate ? formatDateCL(opp.followUpDate) : 'Sin fecha'}</div>
                </div>
                <div class="adaptive-card-footer">
                  <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                    ${opp.phone ? `
                      <a href="https://wa.me/${cleanPhone}" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp btn-sm">
                        WhatsApp
                      </a>
                    ` : ''}
                    ${opp.status !== 'ganada' ? `
                      <button class="btn btn-primary btn-sm btn-mark-won" data-opp-id="${opp.id}">
                        ✓ Ganada
                      </button>
                    ` : ''}
                  </div>
                  <div style="display: flex; gap: 6px;">
                    <button class="btn btn-secondary btn-sm btn-edit-opp" data-opp-id="${opp.id}">
                      Editar
                    </button>
                    <button class="btn btn-outline-danger btn-sm btn-delete-opp" data-opp-id="${opp.id}">
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            `;
          }).join('') : '<p class="text-xs text-muted text-center py-4">No hay oportunidades que coincidan con la búsqueda.</p>'}
        </div>
      </div>
    `;

    attachEvents();
  }

  function attachEvents() {
    // Marcar como Venta Lograda
    container.querySelectorAll('.btn-mark-won').forEach(btn => {
      btn.addEventListener('click', () => {
        const oppId = btn.getAttribute('data-opp-id');
        store.updateOpportunity(oppId, { status: 'ganada' });
        const opp = store.getOpportunity(oppId);

        if (window.MiHummApp) {
          window.MiHummApp.openWonCelebrationModal(opp);
        }
      });
    });

    // Convertir en Cliente
    container.querySelectorAll('.btn-convert-customer').forEach(btn => {
      btn.addEventListener('click', () => {
        const oppId = btn.getAttribute('data-opp-id');
        const opp = store.getOpportunity(oppId);
        if (!opp) return;

        const nameParts = opp.contactName.split(' ');
        const firstName = nameParts[0] || opp.contactName;
        const lastName = nameParts.slice(1).join(' ') || '';

        const newCustomer = store.createCustomer(ws.id, {
          firstName,
          lastName,
          company: '',
          phone: opp.phone,
          email: opp.email,
          city: '',
          sourceChannel: opp.sourceChannel,
          status: 'active',
          notes: `Creado desde oportunidad: ${opp.title}`
        });

        store.updateOpportunity(oppId, { customerId: newCustomer.id });

        if (window.MiHummApp) {
          window.MiHummApp.showToast(`¡${opp.contactName} ha sido agregado a tu lista de Clientes!`, 'success');
          window.MiHummApp.refreshCurrentView();
        }
      });
    });

    // Editar
    container.querySelectorAll('.btn-edit-opp').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-opp-id');
        if (window.MiHummApp) window.MiHummApp.openEditOpportunityModal(id);
      });
    });

    // Eliminar
    container.querySelectorAll('.btn-delete-opp').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-opp-id');
        if (confirm('¿Estás seguro de que deseas eliminar esta oportunidad?')) {
          store.deleteOpportunity(id);
          if (window.MiHummApp) {
            window.MiHummApp.showToast('Oportunidad eliminada', 'success');
            window.MiHummApp.refreshCurrentView();
          }
        }
      });
    });
  }

  container.querySelector('#opp-search-input')?.addEventListener('input', filterAndRender);
  container.querySelector('#opp-filter-status')?.addEventListener('change', filterAndRender);
  container.querySelector('#opp-filter-timing')?.addEventListener('change', filterAndRender);

  container.querySelector('#btn-create-opp-main')?.addEventListener('click', () => {
    if (window.MiHummApp) window.MiHummApp.openModal('modal-opportunity');
  });

  filterAndRender();
}
