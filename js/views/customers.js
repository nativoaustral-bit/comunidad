/**
 * MI HUMM - MÓDULO CLIENTES (DIRECTORIO SIMPLE & WHATSAPP DIRECTO)
 * Comunidad Humm Co-Creation
 */

import { store, formatDateCL, sanitizeWhatsAppPhone } from '../store.js';
import { auth } from '../auth.js';

export function renderCustomersView(container) {
  const ws = auth.getCurrentWorkspace();
  if (!ws) return;

  const allCustomers = store.getCustomers(ws.id);
  const opportunities = store.getOpportunities(ws.id);

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h2>Clientes</h2>
        <p>Mantén organizados los contactos de tus clientes para facilitar la recompra y fidelización.</p>
      </div>
      <div class="view-actions">
        <button class="btn btn-primary" id="btn-create-customer-main">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Agregar Cliente
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
        <input type="text" id="customer-search-input" class="form-control" placeholder="Buscar por nombre, empresa o teléfono..." />
      </div>

      <div class="table-filters" style="flex-wrap: wrap; gap: 8px;">
        <select id="customer-filter-status" class="form-control" style="width: auto; padding: 8px 12px; font-size: var(--font-size-xs);">
          <option value="all">Todos los estados</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>

        <select id="customer-filter-channel" class="form-control" style="width: auto; padding: 8px 12px; font-size: var(--font-size-xs);">
          <option value="all">Todos los orígenes</option>
          <option value="WhatsApp">WhatsApp</option>
          <option value="Instagram">Instagram</option>
          <option value="Facebook">Facebook</option>
          <option value="Correo electrónico">Correo electrónico</option>
          <option value="Recomendación">Recomendación</option>
          <option value="Página web">Página web</option>
          <option value="Actividad o feria">Actividad o feria</option>
          <option value="Otro">Otro</option>
        </select>
      </div>
    </div>

    <!-- TABLA Y TARJETAS DE CLIENTES -->
    <div id="customers-list-container"></div>
  `;

  function filterAndRender() {
    const searchVal = container.querySelector('#customer-search-input')?.value.toLowerCase().trim() || '';
    const statusVal = container.querySelector('#customer-filter-status')?.value || 'all';
    const channelVal = container.querySelector('#customer-filter-channel')?.value || 'all';

    let filtered = allCustomers.filter(c => {
      const fullName = `${c.firstName} ${c.lastName || ''}`.toLowerCase();
      const company = (c.company || '').toLowerCase();
      const phone = (c.phone || '').toLowerCase();
      const rut = (c.rut || '').toLowerCase();
      const location = `${c.region || ''} ${c.comuna || ''} ${c.city || ''} ${c.address || ''}`.toLowerCase();

      if (searchVal && !fullName.includes(searchVal) && !company.includes(searchVal) && !phone.includes(searchVal) && !rut.includes(searchVal) && !location.includes(searchVal)) {
        return false;
      }
      if (statusVal !== 'all' && c.status !== statusVal) {
        return false;
      }
      if (channelVal !== 'all' && c.sourceChannel !== channelVal) {
        return false;
      }
      return true;
    });

    const listWrapper = container.querySelector('#customers-list-container');
    if (!listWrapper) return;

    if (allCustomers.length === 0) {
      listWrapper.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div class="empty-state-title">Aún no tienes clientes registrados</div>
          <div class="empty-state-description">Comienza a registrar los contactos de tus clientes para gestionar pedidos y recompra.</div>
        </div>
      `;
      return;
    }

    listWrapper.innerHTML = `
      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Cliente / Ubicación</th>
              <th>Empresa</th>
              <th>Contacto</th>
              <th>Origen</th>
              <th>Estado</th>
              <th>Oportunidades</th>
              <th style="text-align: right;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.length > 0 ? filtered.map(c => {
              const cleanPhone = sanitizeWhatsAppPhone(c.phone);
              const oppsCount = opportunities.filter(o => o.customerId === c.id).length;
              const locationText = [c.city, c.comuna, c.region].filter(Boolean).join(', ');

              return `
                <tr>
                  <td>
                    <div style="font-weight: 700; color: var(--text-primary);">
                      ${c.firstName} ${c.lastName || ''}
                    </div>
                    ${c.rut ? `<div class="text-xs text-muted" style="font-weight: 600;">RUT: ${c.rut}</div>` : ''}
                    ${locationText ? `
                      <div class="text-xs text-muted" style="display: flex; align-items: center; gap: 4px; margin-top: 2px;">
                        <span>📍</span>
                        <span>${locationText}</span>
                      </div>
                    ` : ''}
                    ${c.address ? `<div class="text-xs text-muted" style="margin-top: 1px;">🏠 ${c.address}</div>` : ''}
                  </td>
                  <td>
                    ${c.company ? `<strong>${c.company}</strong>` : '<span class="text-muted">—</span>'}
                  </td>
                  <td>
                    <div style="display: flex; flex-direction: column; gap: 3px;">
                      ${c.phone ? `
                        <div style="display: flex; align-items: center; gap: 6px;">
                          <span>${c.phone}</span>
                          <a href="https://wa.me/${cleanPhone}" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp btn-sm" style="padding: 2px 8px; font-size: 11px;" title="Abrir chat de WhatsApp">
                            WhatsApp
                          </a>
                        </div>
                      ` : ''}
                      ${c.email ? `<span class="text-xs text-muted">${c.email}</span>` : ''}
                    </div>
                  </td>
                  <td>
                    <span class="badge badge-neutral text-xs">${c.sourceChannel}</span>
                  </td>
                  <td>
                    <span class="badge ${c.status === 'active' ? 'badge-success' : 'badge-neutral'}">
                      <span class="badge-dot"></span>
                      ${c.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    ${oppsCount > 0 ? `<span class="badge badge-warning text-xs">${oppsCount} asociadas</span>` : '<span class="text-muted text-xs">0</span>'}
                  </td>
                  <td style="text-align: right;">
                    <button class="btn btn-ghost btn-sm btn-edit-customer" data-customer-id="${c.id}" title="Editar cliente">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 20h9"></path>
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                      </svg>
                    </button>
                    <button class="btn btn-ghost btn-sm btn-delete-customer" data-customer-id="${c.id}" title="Eliminar cliente">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </td>
                </tr>
              `;
            }).join('') : `
              <tr>
                <td colspan="7" style="text-align: center; padding: 24px;" class="text-muted">
                  No se encontraron clientes con los filtros aplicados.
                </td>
              </tr>
            `}
          </tbody>
        </table>

        <!-- Tarjetas adaptativas para teléfonos -->
        <div class="responsive-cards-grid">
          ${filtered.length > 0 ? filtered.map(c => {
            const cleanPhone = sanitizeWhatsAppPhone(c.phone);
            const locationText = [c.city, c.comuna, c.region].filter(Boolean).join(', ');

            return `
              <div class="adaptive-item-card">
                <div class="adaptive-card-header">
                  <div>
                    <div style="font-weight: 700; font-size: var(--font-size-base);">${c.firstName} ${c.lastName || ''}</div>
                    ${c.company ? `<div class="text-xs text-secondary font-medium">${c.company}</div>` : ''}
                  </div>
                  <span class="badge ${c.status === 'active' ? 'badge-success' : 'badge-neutral'}">
                    ${c.status === 'active' ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div class="adaptive-card-body">
                  ${c.rut ? `<div><strong>RUT:</strong> ${c.rut}</div>` : ''}
                  ${c.phone ? `<div><strong>Teléfono:</strong> ${c.phone}</div>` : ''}
                  ${c.email ? `<div><strong>Correo:</strong> ${c.email}</div>` : ''}
                  ${locationText ? `<div><strong>Ubicación:</strong> ${locationText}</div>` : ''}
                  ${c.address ? `<div><strong>Dirección:</strong> ${c.address}</div>` : ''}
                  <div><strong>Origen:</strong> ${c.sourceChannel}</div>
                  ${c.notes ? `<div style="margin-top: 4px; padding: 6px; background: var(--bg-surface-secondary); border-radius: 4px;">${c.notes}</div>` : ''}
                </div>
                <div class="adaptive-card-footer">
                  ${c.phone ? `
                    <a href="https://wa.me/${cleanPhone}" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp btn-sm">
                      WhatsApp
                    </a>
                  ` : '<div></div>'}
                  <div style="display: flex; gap: 6px;">
                    <button class="btn btn-secondary btn-sm btn-edit-customer" data-customer-id="${c.id}">
                      Editar
                    </button>
                    <button class="btn btn-ghost btn-sm btn-delete-customer" data-customer-id="${c.id}" style="color: var(--danger);">
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            `;
          }).join('') : ''}
        </div>
      </div>
    `;

    // Event Listeners para editar y eliminar
    listWrapper.querySelectorAll('.btn-edit-customer').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-customer-id');
        if (window.MiHummApp) window.MiHummApp.openEditCustomerModal(id);
      });
    });

    listWrapper.querySelectorAll('.btn-delete-customer').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-customer-id');
        if (confirm('¿Estás seguro de eliminar este cliente?')) {
          store.deleteCustomer(id);
          if (window.MiHummApp) {
            window.MiHummApp.showToast('Cliente eliminado', 'success');
            window.MiHummApp.refreshCurrentView();
          }
        }
      });
    });
  }

  // Event Listeners de Filtros
  container.querySelector('#customer-search-input')?.addEventListener('input', filterAndRender);
  container.querySelector('#customer-filter-status')?.addEventListener('change', filterAndRender);
  container.querySelector('#customer-filter-channel')?.addEventListener('change', filterAndRender);

  container.querySelector('#btn-create-customer-main')?.addEventListener('click', () => {
    if (window.MiHummApp) window.MiHummApp.openCreateCustomerModal();
  });

  filterAndRender();
}
