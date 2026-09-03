import { store, formatDateCL } from '../store.js?v=5.0';
import { auth } from '../auth.js?v=5.0';
import { CHILE_REGIONES_COMUNAS, populateComunasSelect } from '../chile-data.js?v=5.0';

export function renderAccountView(container) {
  const user = auth.getCurrentUser();
  const ws = auth.getCurrentWorkspace();

  if (!user || !ws) {
    container.innerHTML = `<div class="empty-state"><p>No se pudo cargar la información de la cuenta.</p></div>`;
    return;
  }

  const currentRegion = ws.region || '';
  const currentComuna = ws.comuna || ws.city || '';

  const regionOptions = Object.keys(CHILE_REGIONES_COMUNAS).map(reg => {
    return `<option value="${reg}" ${reg === currentRegion ? 'selected' : ''}>${reg}</option>`;
  }).join('');

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h2>Mi Cuenta</h2>
        <p>Administra los datos de tu emprendimiento, tu información de acceso y preferencias.</p>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px;">
      
      <!-- FORMULARIO 1: DATOS DEL EMPRENDIMIENTO -->
      <div class="data-table-container" style="padding: 24px;">
        <h3 class="title-sm" style="margin-bottom: 6px;">Información de tu Emprendimiento</h3>
        <p class="text-xs text-muted" style="margin-bottom: 20px;">Estos datos identifican tu espacio privado en Mi Humm.</p>

        <form id="form-workspace-profile">
          <div class="form-row">
            <div class="form-group" style="flex: 2;">
              <label class="form-label" for="ws-name">Nombre del Emprendimiento *</label>
              <input type="text" id="ws-name" class="form-control" value="${ws.name || ''}" required />
            </div>
            <div class="form-group" style="flex: 1.2;">
              <label class="form-label" for="ws-rut">RUT del Emprendimiento (opcional)</label>
              <input type="text" id="ws-rut" class="form-control" value="${ws.rut || ''}" placeholder="76.123.456-7" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="ws-industry">Rubro / Industria</label>
            <input type="text" id="ws-industry" class="form-control" value="${ws.industry || ''}" placeholder="Ej. Gastronomía, Diseño, Servicios..." />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="ws-region">Región</label>
              <select id="ws-region" class="form-control">
                <option value="">Selecciona una región...</option>
                ${regionOptions}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="ws-comuna">Comuna</label>
              <select id="ws-comuna" class="form-control" ${!currentRegion ? 'disabled' : ''}>
                <option value="">Primero selecciona una región...</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="ws-locality">Localidad</label>
              <input type="text" id="ws-locality" class="form-control" value="${ws.locality || ''}" placeholder="Ej. Sector Centro, Ensenada..." />
            </div>
            <div class="form-group">
              <label class="form-label" for="ws-address">Dirección</label>
              <input type="text" id="ws-address" class="form-control" value="${ws.address || ''}" placeholder="Ej. Av. Los Colonos 450" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="ws-description">Descripción breve de lo que haces</label>
            <textarea id="ws-description" class="form-control" rows="3" placeholder="Describe brevemente tus productos o servicios">${ws.description || ''}</textarea>
          </div>

          <button type="submit" class="btn btn-primary btn-sm">
            Guardar cambios del negocio
          </button>
        </form>
      </div>

      <!-- FORMULARIO 2: DATOS PERSONALES DEL EMPRENDEDOR -->
      <div class="data-table-container" style="padding: 24px;">
        <h3 class="title-sm" style="margin-bottom: 6px;">Perfil del Titular</h3>
        <p class="text-xs text-muted" style="margin-bottom: 20px;">Tus datos de contacto principales como usuario responsable.</p>

        <form id="form-user-profile">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="user-first-name">Nombre del Titular *</label>
              <input type="text" id="user-first-name" class="form-control" value="${ws.ownerFirstName || (user.name ? user.name.split(' ')[0] : '')}" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="user-last-name">Apellido del Titular *</label>
              <input type="text" id="user-last-name" class="form-control" value="${ws.ownerLastName || (user.name ? user.name.split(' ').slice(1).join(' ') : '')}" required />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="user-email">Correo electrónico de acceso</label>
            <input type="email" id="user-email" class="form-control" value="${user.email || ''}" required />
            <span class="form-hint">Se utiliza para iniciar sesión en Mi Humm.</span>
          </div>

          <div class="form-group">
            <label class="form-label" for="ws-phone">Teléfono / WhatsApp de contacto</label>
            <input type="tel" id="ws-phone" class="form-control" value="${ws.phone || ''}" placeholder="+569..." />
          </div>

          <button type="submit" class="btn btn-primary btn-sm">
            Actualizar mis datos
          </button>
        </form>
      </div>

      <!-- SECCIÓN 3: SEGURIDAD Y CAMBIO DE CONTRASEÑA -->
      <div class="data-table-container" style="padding: 24px;">
        <h3 class="title-sm" style="margin-bottom: 6px;">Seguridad de la Cuenta</h3>
        <p class="text-xs text-muted" style="margin-bottom: 20px;">Cambia tu clave periódicamente para proteger tu información.</p>

        <form id="form-change-password">
          <div class="form-group">
            <label class="form-label" for="pass-current">Contraseña actual</label>
            <input type="password" id="pass-current" class="form-control" required />
          </div>

          <div class="form-group">
            <label class="form-label" for="pass-new">Nueva contraseña</label>
            <input type="password" id="pass-new" class="form-control" minlength="4" required />
          </div>

          <button type="submit" class="btn btn-secondary btn-sm">
            Cambiar contraseña
          </button>
        </form>
      </div>

      <!-- SECCIÓN 4: INFORMACIÓN DE MEMBRESÍA HUMM (SOLO LECTURA) -->
      <div class="data-table-container" style="padding: 24px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
          <h3 class="title-sm">Membresía Humm</h3>
          <span class="badge badge-success">
            <span class="badge-dot"></span>
            Activa
          </span>
        </div>
        <p class="text-xs text-muted" style="margin-bottom: 20px;">Detalles de tu plan en la Comunidad Humm Co-Creation.</p>

        <div style="display: flex; flex-direction: column; gap: 12px; font-size: var(--font-size-sm);">
          <div>
            <span class="text-muted text-xs">Tipo de membresía:</span>
            <div style="font-weight: 700; color: var(--text-primary); font-size: var(--font-size-base);">${ws.membershipType || 'Membresía Humm Emprendedor'}</div>
          </div>

          <div>
            <span class="text-muted text-xs">Identificador de espacio:</span>
            <div style="font-family: monospace; font-size: var(--font-size-xs); color: var(--text-secondary);">${ws.id}</div>
          </div>

          <div>
            <span class="text-muted text-xs">Fecha de alta:</span>
            <div style="font-weight: 600;">${formatDateCL(ws.createdAt)}</div>
          </div>

          <div>
            <span class="text-muted text-xs">Herramientas Humm asignadas:</span>
            <div style="font-weight: 600; color: var(--humm-red-primary);">${(ws.assignedTools || []).length} herramientas habilitadas</div>
          </div>
        </div>

        <div style="margin-top: 20px; padding: 12px; background-color: var(--bg-surface-secondary); border-radius: var(--radius-md); border: 1px solid var(--border-subtle); font-size: var(--font-size-xs); color: var(--text-secondary);">
          ℹ️ Los cambios de plan o adición de herramientas adicionales son gestionados por el Administrador de Comunidad Humm.
        </div>
      </div>

      <!-- SECCIÓN 5: CERRAR SESIÓN -->
      <div class="data-table-container" style="padding: 24px; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <h3 class="title-sm" style="margin-bottom: 6px;">Sesión en Mi Humm</h3>
          <p class="text-xs text-muted" style="margin-bottom: 16px;">Finaliza tu sesión de forma segura si estás en un computador compartido.</p>
          <div class="text-xs text-secondary" style="margin-bottom: 18px;">
            Sesión iniciada como: <strong>${user.name}</strong> (${user.email})
          </div>
        </div>

        <button class="btn btn-secondary btn-block btn-logout-action" style="color: var(--danger); border-color: rgba(220, 38, 38, 0.3); font-weight: 600;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          Cerrar sesión de Mi Humm
        </button>
      </div>

    </div>
  `;

  // Poblar comunas iniciales y conectar evento change
  const regionSelect = container.querySelector('#ws-region');
  const comunaSelect = container.querySelector('#ws-comuna');
  if (regionSelect && comunaSelect) {
    if (currentRegion) {
      populateComunasSelect(regionSelect, comunaSelect, currentComuna);
    }
    regionSelect.addEventListener('change', () => {
      populateComunasSelect(regionSelect, comunaSelect);
    });
  }

  // Listener para guardar perfil del negocio
  container.querySelector('#form-workspace-profile')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = container.querySelector('#ws-name').value.trim();
    const rut = container.querySelector('#ws-rut').value.trim();
    const industry = container.querySelector('#ws-industry').value.trim();
    const region = container.querySelector('#ws-region').value.trim();
    const comuna = container.querySelector('#ws-comuna').value.trim();
    const locality = container.querySelector('#ws-locality').value.trim();
    const address = container.querySelector('#ws-address').value.trim();
    const description = container.querySelector('#ws-description').value.trim();

    store.updateWorkspace(ws.id, { name, rut, industry, region, comuna, city: comuna, locality, address, description });
    if (window.MiHummApp) {
      window.MiHummApp.showToast('Datos del emprendimiento actualizados correctamente', 'success');
      window.MiHummApp.updateHeaderWorkspace();
    }
  });

  // Listener para guardar datos del usuario y titular
  container.querySelector('#form-user-profile')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const firstName = container.querySelector('#user-first-name').value.trim();
    const lastName = container.querySelector('#user-last-name').value.trim();
    const fullName = `${firstName} ${lastName}`.trim();
    const email = container.querySelector('#user-email').value.trim();
    const phone = container.querySelector('#ws-phone').value.trim();

    store.updateUser(user.id, { name: fullName, email });
    store.updateWorkspace(ws.id, { ownerFirstName: firstName, ownerLastName: lastName, ownerName: fullName, phone, email });

    if (window.MiHummApp) {
      window.MiHummApp.showToast('Tus datos de titular han sido actualizados', 'success');
      window.MiHummApp.updateHeaderUser();
    }
  });

  // Listener para cambio de clave
  container.querySelector('#form-change-password')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const curr = container.querySelector('#pass-current').value;
    const newP = container.querySelector('#pass-new').value;

    const res = auth.changePassword(curr, newP);
    if (res.success) {
      if (window.MiHummApp) window.MiHummApp.showToast(res.message, 'success');
      e.target.reset();
    } else {
      if (window.MiHummApp) window.MiHummApp.showToast(res.message, 'danger');
    }
  });

  // Listener para cerrar sesión desde Mi Cuenta
  container.querySelectorAll('.btn-logout-action').forEach(btn => {
    btn.addEventListener('click', () => {
      auth.logout();
      if (window.MiHummApp) {
        window.MiHummApp.showToast('Sesión cerrada con éxito', 'info');
        window.MiHummApp.checkAuthenticationState();
      }
    });
  });
}
