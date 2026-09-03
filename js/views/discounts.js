/**
 * MI HUMM - MÓDULO BENEFICIOS, ALIANZAS Y CONTACTO COMERCIAL DIRECTO
 * Comunidad Humm Co-Creation
 */

import { store, formatDateCL } from '../store.js';

let currentCategoryFilter = 'all';
let searchQuery = '';

export function renderDiscountsView(container) {
  const currentWs = store.getCurrentWorkspace ? store.getCurrentWorkspace() : null;
  const wsId = currentWs ? currentWs.id : null;
  const discounts = store.getCompanyDiscounts({ status: 'active' });
  const myRequests = wsId ? store.getBenefitRequests(wsId) : [];

  // Categorías únicas
  const categories = ['all', ...new Set(discounts.map(d => d.category))];

  // Filtrado de beneficios
  const filtered = discounts.filter(item => {
    const matchesCategory = currentCategoryFilter === 'all' || item.category === currentCategoryFilter;
    const matchesSearch = searchQuery.trim() === '' || 
      (item.companyName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.discountTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.category || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  container.innerHTML = `
    <!-- ENCABEZADO -->
    <div class="view-header" style="margin-bottom: 20px;">
      <div class="view-title-group">
        <div style="display: flex; align-items: center; gap: 8px;">
          <h2>Beneficios y Convenios de la Comunidad</h2>
          <span class="badge badge-success text-xs">Alianzas Humm</span>
        </div>
        <p>Convenios comerciales exclusivos con empresas aliadas para reducir tus costos operativos y potenciar tu negocio. Conéctate directamente con cada proveedor.</p>
      </div>
      ${myRequests.length > 0 ? `
        <div class="view-actions">
          <a href="#mis-beneficios-solicitados" class="btn btn-secondary btn-sm" style="text-decoration: none;">
            📋 Mis Solicitudes (${myRequests.length})
          </a>
        </div>
      ` : ''}
    </div>

    <!-- BARRA DE BÚSQUEDA Y FILTROS POR CATEGORÍA -->
    <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 16px 20px; margin-bottom: 20px; display: flex; flex-direction: column; gap: 14px;">
      <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 240px;">
          <input type="text" id="discount-search-input" class="form-control" placeholder="🔍 Buscar por empresa o tipo de beneficio..." value="${searchQuery}" />
        </div>
      </div>

      <!-- Filtros de categoría (Desplazable horizontalmente en móvil) -->
      <div class="filter-chips-scroll" style="display: flex; gap: 8px; overflow-x: auto; flex-wrap: nowrap; -webkit-overflow-scrolling: touch; padding-bottom: 4px; max-width: 100%;">
        <button class="btn ${currentCategoryFilter === 'all' ? 'btn-primary' : 'btn-ghost'} btn-sm filter-cat-btn" data-category="all" style="white-space: nowrap; flex-shrink: 0; padding: 6px 12px; font-size: 11.5px;">
          Todos (${discounts.length})
        </button>
        ${categories.filter(c => c !== 'all').map(cat => {
          const count = discounts.filter(d => d.category === cat).length;
          return `
            <button class="btn ${currentCategoryFilter === cat ? 'btn-primary' : 'btn-ghost'} btn-sm filter-cat-btn" data-category="${cat}" style="white-space: nowrap; flex-shrink: 0; padding: 6px 12px; font-size: 11.5px;">
              ${cat} (${count})
            </button>
          `;
        }).join('')}
      </div>
    </div>

    <!-- GRID DE TARJETAS DE BENEFICIOS (RESPONSIVO PARA MÓVIL) -->
    <div class="discounts-cards-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; margin-bottom: 40px;">
      ${filtered.length > 0 ? filtered.map(item => {
        const existingReq = myRequests.find(r => r.discountId === item.id);
        const hasWa = !!(item.whatsapp && item.whatsapp.trim());
        const hasIg = !!(item.instagram && item.instagram.trim());
        const hasEmail = !!(item.email && item.email.trim());
        const hasUrl = !!(item.url && item.url.trim());

        // Canal preferido
        const channel = item.preferredChannel || (hasWa ? 'whatsapp' : (hasIg ? 'instagram' : (hasEmail ? 'email' : 'url')));

        // Texto del botón antes de solicitar
        let btnLabel = '🚀 Solicitar Beneficio';
        let btnIcon = '🚀';
        if (channel === 'whatsapp' || hasWa) {
          btnLabel = 'Solicitar por WhatsApp';
          btnIcon = '💬';
        } else if (channel === 'instagram' || (hasIg && !hasWa)) {
          btnLabel = 'Contactar por Instagram';
          btnIcon = '📸';
        } else if (channel === 'email' || (hasEmail && !hasWa && !hasIg)) {
          btnLabel = 'Solicitar por Correo';
          btnIcon = '✉️';
        } else if (hasUrl) {
          btnLabel = 'Canjear en Sitio Web';
          btnIcon = '🌐';
        }

        return `
          <div class="discount-portrait-card" style="background: var(--bg-surface); border: 1px solid var(--border-subtle); ${item.featured ? 'border-top: 3.5px solid var(--humm-red-primary);' : ''} border-radius: var(--radius-lg); padding: 18px 16px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: var(--shadow-card); position: relative; transition: transform var(--transition-fast), box-shadow var(--transition-fast);">
            
            <!-- Parte Superior: Insignias y Cabecera -->
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; gap: 6px;">
                <span class="badge badge-neutral text-xs" style="font-size: 10px; padding: 2px 7px; max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  ${item.category}
                </span>
                ${item.featured ? `<span class="badge badge-humm text-xs" style="font-size: 9px; padding: 2px 6px;">⭐ Destacado</span>` : '<span></span>'}
              </div>

              <!-- Logo e Identidad de la Empresa Centrado -->
              <div style="display: flex; flex-direction: column; align-items: center; text-align: center; margin-bottom: 12px;">
                <div style="width: 56px; height: 56px; border-radius: var(--radius-md); background: var(--bg-surface-secondary); display: flex; align-items: center; justify-content: center; font-size: 1.8rem; border: 1px solid var(--border-subtle); margin-bottom: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.04); overflow: hidden; padding: 4px;">
                  ${item.logo && (item.logo.startsWith('data:image/') || item.logo.startsWith('http://') || item.logo.startsWith('https://') || item.logo.startsWith('/')) 
                    ? `<img src="${item.logo}" alt="${item.companyName}" style="width: 100%; height: 100%; object-fit: contain;" />` 
                    : `<span>${item.logo || '🎁'}</span>`}
                </div>
                <h3 style="font-size: var(--font-size-sm); font-weight: 700; color: var(--text-primary); margin: 0; line-height: 1.2;">
                  ${item.companyName}
                </h3>
              </div>

              <!-- Título Destacado del Descuento -->
              <div style="font-size: 0.95rem; font-weight: 800; color: var(--humm-red-primary); line-height: 1.25; text-align: center; margin-bottom: 8px;">
                ${item.discountTitle}
              </div>

              <!-- Descripción Breve -->
              <p style="font-size: 11.5px; color: var(--text-secondary); line-height: 1.4; text-align: center; margin: 0 0 12px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;" title="${item.description}">
                ${item.description}
              </p>
            </div>

            <!-- Parte Inferior: Estado de Solicitud y Botón de Contacto Directo -->
            <div style="border-top: 1px solid var(--border-subtle); padding-top: 12px; margin-top: auto; display: flex; flex-direction: column; gap: 9px;">
              
              ${existingReq ? `
                <!-- Estado: Ya Solicitado por el Miembro -->
                <div style="background: var(--bg-surface-secondary); border: 1px solid #fed7aa; border-radius: var(--radius-md); padding: 8px 10px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <span style="font-size: 9px; text-transform: uppercase; font-weight: 700; color: var(--humm-red-primary); letter-spacing: 0.04em;">TU CÓDIGO HUMM</span>
                    <span class="badge ${existingReq.status === 'used' ? 'badge-success' : (existingReq.status === 'not_completed' ? 'badge-neutral' : 'badge-humm')} text-xs" style="font-size: 8.5px; padding: 1px 5px;">
                      ${existingReq.status === 'used' ? '✓ Utilizado' : (existingReq.status === 'not_completed' ? 'No concretado' : 'Solicitado')}
                    </span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px;">
                    <span style="font-family: monospace; font-weight: 800; font-size: 11.5px; color: var(--text-primary); letter-spacing: 0.03em;">
                      ${existingReq.personalCode}
                    </span>
                    <button class="btn btn-secondary btn-sm btn-copy-code" data-code="${existingReq.personalCode}" style="padding: 2px 7px; font-size: 10px; height: auto;" title="Copiar mi código">
                      📋 Copiar
                    </button>
                  </div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10.5px; color: var(--text-muted);">
                  <span>Vigencia:</span>
                  <strong style="color: var(--text-secondary);">${item.expiresAt ? formatDateCL(item.expiresAt) : 'Permanente 2026'}</strong>
                </div>

                <button class="btn btn-primary btn-sm btn-block btn-continue-benefit" data-disc-id="${item.id}" data-req-id="${existingReq.id}" style="text-align: center; justify-content: center; font-size: var(--font-size-xs); padding: 8px 10px; font-weight: 700;">
                  ${existingReq.channel === 'instagram' ? '📸 Continuar por Instagram' : (existingReq.channel === 'email' ? '✉️ Continuar por Correo' : '💬 Continuar por WhatsApp')}
                </button>
              ` : `
                <!-- Estado: Aún no Solicitado -->
                <div style="background: var(--bg-surface-secondary); border-radius: var(--radius-sm); padding: 6px 8px; font-size: 10.5px; color: var(--text-secondary); line-height: 1.35; text-align: center; border: 1px dashed var(--border-subtle);">
                  <strong style="color: var(--text-primary); display: block; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.03em; margin-bottom: 2px;">Beneficio para Miembros</strong>
                  Recibirás tu código personal al iniciar el contacto comercial.
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10.5px; color: var(--text-muted);">
                  <span>Vigencia:</span>
                  <strong style="color: var(--text-secondary);">${item.expiresAt ? formatDateCL(item.expiresAt) : 'Permanente 2026'}</strong>
                </div>

                <button class="btn btn-primary btn-sm btn-block btn-request-benefit" data-disc-id="${item.id}" style="text-align: center; justify-content: center; font-size: var(--font-size-xs); padding: 8px 10px; font-weight: 800;">
                  ${btnIcon} ${btnLabel}
                </button>
              `}

            </div>

          </div>
        `;
      }).join('') : `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px; background: var(--bg-surface); border: 1px dashed var(--border-strong); border-radius: var(--radius-lg);">
          <div style="font-size: 2.5rem; margin-bottom: 12px;">🔍</div>
          <h3 style="font-size: var(--font-size-base); font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">
            No se encontraron beneficios con los filtros seleccionados
          </h3>
          <p class="text-xs text-muted">Prueba buscando con otro término o seleccionando otra categoría.</p>
        </div>
      `}
    </div>

    <!-- SECCIÓN: MIS BENEFICIOS SOLICITADOS (HISTORIAL DEL MIEMBRO) -->
    <div id="mis-beneficios-solicitados" style="margin-top: 48px; padding-top: 24px; border-top: 1px solid var(--border-subtle);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
        <div>
          <h3 style="font-size: var(--font-size-lg); font-weight: 800; color: var(--text-primary); margin: 0 0 4px;">
            📋 Mis Beneficios Solicitados
          </h3>
          <p class="text-xs text-secondary" style="margin: 0;">
            Historial de contactos comerciales y códigos personales generados para tu emprendimiento.
          </p>
        </div>
        <span class="badge badge-neutral text-xs">${myRequests.length} Solicitud${myRequests.length === 1 ? '' : 'es'}</span>
      </div>

      ${myRequests.length > 0 ? `
        <div class="data-table-container" style="background: var(--bg-surface); border-radius: var(--radius-lg); box-shadow: var(--shadow-card);">
          <table class="data-table">
            <thead>
              <tr>
                <th>Empresa / Aliado</th>
                <th>Beneficio Solicitado</th>
                <th>Código Personal Humm</th>
                <th>Canal</th>
                <th>Fecha Solicitud</th>
                <th>Estado</th>
                <th style="text-align: right;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${myRequests.map(req => {
                const disc = discounts.find(d => d.id === req.discountId) || store.getCompanyDiscount(req.discountId);
                const partnerName = disc ? disc.companyName : 'Empresa Aliada';
                const benefitTitle = disc ? disc.discountTitle : 'Beneficio Exclusivo';
                const partnerLogo = disc ? disc.logo : '🎁';

                let statusBadge = `<span class="badge badge-humm text-xs">Contacto iniciado</span>`;
                if (req.status === 'in_conversation') {
                  statusBadge = `<span class="badge badge-warning text-xs">En conversación</span>`;
                } else if (req.status === 'used') {
                  statusBadge = `<span class="badge badge-success text-xs">✓ Utilizado</span>`;
                } else if (req.status === 'not_completed') {
                  statusBadge = `<span class="badge badge-neutral text-xs">No concretado</span>`;
                }

                let channelIcon = '💬 WhatsApp';
                if (req.channel === 'instagram') channelIcon = '📸 Instagram';
                else if (req.channel === 'email') channelIcon = '✉️ Correo';
                else if (req.channel === 'url') channelIcon = '🌐 Sitio Web';

                return `
                  <tr>
                    <td>
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 1.2rem;">${partnerLogo || '🎁'}</span>
                        <strong style="color: var(--text-primary); font-size: var(--font-size-xs);">${partnerName}</strong>
                      </div>
                    </td>
                    <td>
                      <div style="font-weight: 700; color: var(--humm-red-primary); font-size: var(--font-size-xs);">${benefitTitle}</div>
                    </td>
                    <td>
                      <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="font-family: monospace; font-weight: 800; font-size: 12px; background: var(--bg-surface-secondary); padding: 3px 7px; border-radius: 4px; border: 1px dashed var(--border-strong); color: var(--text-primary);">
                          ${req.personalCode}
                        </span>
                        <button class="btn btn-ghost btn-sm btn-copy-code" data-code="${req.personalCode}" style="padding: 2px 5px; font-size: 10px;" title="Copiar código">
                          📋
                        </button>
                      </div>
                    </td>
                    <td>
                      <span class="text-xs text-secondary">${channelIcon}</span>
                    </td>
                    <td>
                      <span class="text-xs text-muted">${req.requestedAt ? formatDateCL(req.requestedAt) : 'Reciente'}</span>
                    </td>
                    <td>
                      ${statusBadge}
                    </td>
                    <td style="text-align: right;">
                      <div style="display: flex; justify-content: flex-end; gap: 6px; flex-wrap: wrap;">
                        <button class="btn btn-primary btn-sm btn-continue-benefit" data-disc-id="${req.discountId}" data-req-id="${req.id}" style="font-size: 11px; padding: 4px 8px;" title="Retomar conversación con el proveedor">
                          💬 Continuar
                        </button>
                        ${req.status !== 'used' ? `
                          <button class="btn btn-secondary btn-sm btn-mark-used" data-req-id="${req.id}" style="font-size: 11px; padding: 4px 8px; color: var(--success);" title="Marcar beneficio como utilizado">
                            ✅ Utilizado
                          </button>
                        ` : ''}
                        ${req.status !== 'used' && req.status !== 'not_completed' ? `
                          <button class="btn btn-ghost btn-sm btn-mark-not-completed" data-req-id="${req.id}" style="font-size: 11px; padding: 4px 8px; color: var(--text-muted);" title="Indicar que no se concretó">
                            ✕
                          </button>
                        ` : ''}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      ` : `
        <div style="background: var(--bg-surface); border: 1px dashed var(--border-subtle); border-radius: var(--radius-lg); padding: 28px; text-align: center;">
          <div style="font-size: 2rem; margin-bottom: 8px;">🎁</div>
          <p style="font-size: var(--font-size-sm); color: var(--text-secondary); margin-bottom: 4px; font-weight: 600;">
            Aún no has solicitado beneficios de la comunidad
          </p>
          <p class="text-xs text-muted" style="margin: 0;">
            Explora las alianzas disponibles arriba y presiona "Solicitar" para conectar directamente con el proveedor y obtener tu código de descuento.
          </p>
        </div>
      `}
    </div>
  `;

  // Attach Events
  const searchInput = container.querySelector('#discount-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderDiscountsView(container);
      const updatedInput = container.querySelector('#discount-search-input');
      if (updatedInput) {
        updatedInput.focus();
        updatedInput.setSelectionRange(updatedInput.value.length, updatedInput.value.length);
      }
    });
  }

  container.querySelectorAll('.filter-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentCategoryFilter = btn.getAttribute('data-category');
      renderDiscountsView(container);
    });
  });

  // Copiar código al portapapeles
  container.querySelectorAll('.btn-copy-code').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const code = btn.getAttribute('data-code');
      if (navigator.clipboard) {
        navigator.clipboard.writeText(code).then(() => {
          if (window.MiHummApp) window.MiHummApp.showToast(`Código "${code}" copiado al portapapeles`, 'success');
        });
      } else {
        if (window.MiHummApp) window.MiHummApp.showToast(`Código: ${code}`, 'info');
      }
    });
  });

  // Solicitar Beneficio (Abre modal de solicitud y selección de canal)
  container.querySelectorAll('.btn-request-benefit').forEach(btn => {
    btn.addEventListener('click', () => {
      const discId = btn.getAttribute('data-disc-id');
      if (window.MiHummApp && window.MiHummApp.openRequestBenefitModal) {
        window.MiHummApp.openRequestBenefitModal(discId);
      }
    });
  });

  // Continuar conversación existente
  container.querySelectorAll('.btn-continue-benefit').forEach(btn => {
    btn.addEventListener('click', () => {
      const discId = btn.getAttribute('data-disc-id');
      const reqId = btn.getAttribute('data-req-id');
      if (window.MiHummApp && window.MiHummApp.continueBenefitContact) {
        window.MiHummApp.continueBenefitContact(discId, reqId);
      }
    });
  });

  // Marcar como Utilizado
  container.querySelectorAll('.btn-mark-used').forEach(btn => {
    btn.addEventListener('click', () => {
      const reqId = btn.getAttribute('data-req-id');
      if (window.MiHummApp && window.MiHummApp.openBenefitFeedbackUsedModal) {
        window.MiHummApp.openBenefitFeedbackUsedModal(reqId);
      }
    });
  });

  // Indicar que no se concretó
  container.querySelectorAll('.btn-mark-not-completed').forEach(btn => {
    btn.addEventListener('click', () => {
      const reqId = btn.getAttribute('data-req-id');
      if (window.MiHummApp && window.MiHummApp.openBenefitFeedbackNotCompletedModal) {
        window.MiHummApp.openBenefitFeedbackNotCompletedModal(reqId);
      }
    });
  });
}
