/**
 * MI HUMM - MÓDULO BENEFICIOS Y DESCUENTOS DE EMPRESAS PARA EMPRENDEDORES
 * Comunidad Humm Co-Creation
 */

import { store, formatDateCL } from '../store.js';

let currentCategoryFilter = 'all';
let searchQuery = '';

export function renderDiscountsView(container) {
  const discounts = store.getCompanyDiscounts({ status: 'active' });

  // Categorías únicas
  const categories = ['all', ...new Set(discounts.map(d => d.category))];

  // Filtrado
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
          <h2>Beneficios y Descuentos para la Comunidad</h2>
          <span class="badge badge-success text-xs">Alianzas Humm</span>
        </div>
        <p>Convenios exclusivos con empresas y servicios aliados para reducir tus costos operativos y acelerar tus ventas.</p>
      </div>
    </div>

    <!-- BARRA DE BÚSQUEDA Y FILTROS POR CATEGORÍA -->
    <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 16px 20px; margin-bottom: 24px; display: flex; flex-direction: column; gap: 14px;">
      <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 260px;">
          <input type="text" id="discount-search-input" class="form-control" placeholder="🔍 Buscar por empresa, servicio o tipo de descuento..." value="${searchQuery}" />
        </div>
      </div>

      <!-- Filtros de categoría -->
      <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
        <span class="text-xs text-muted" style="font-weight: 600;">Categoría:</span>
        <button class="btn ${currentCategoryFilter === 'all' ? 'btn-primary' : 'btn-ghost'} btn-sm filter-cat-btn" data-category="all">
          Todos (${discounts.length})
        </button>
        ${categories.filter(c => c !== 'all').map(cat => {
          const count = discounts.filter(d => d.category === cat).length;
          return `
            <button class="btn ${currentCategoryFilter === cat ? 'btn-primary' : 'btn-ghost'} btn-sm filter-cat-btn" data-category="${cat}">
              ${cat} (${count})
            </button>
          `;
        }).join('')}
      </div>
    </div>

    <!-- GRID DE TARJETAS DE BENEFICIOS (FORMATO VERTICAL / RETRATO) -->
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(215px, 1fr)); gap: 16px; margin-bottom: 32px;">
      ${filtered.length > 0 ? filtered.map(item => {
        return `
          <div class="discount-portrait-card" style="background: var(--bg-surface); border: 1px solid var(--border-subtle); ${item.featured ? 'border-top: 3px solid var(--humm-red-primary);' : ''} border-radius: var(--radius-lg); padding: 16px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: var(--shadow-card); position: relative; transition: transform var(--transition-fast), box-shadow var(--transition-fast); min-height: 390px;">
            
            <!-- Parte Superior: Insignias y Cabecera -->
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; gap: 6px;">
                <span class="badge badge-neutral text-xs" style="font-size: 10px; padding: 2px 7px; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  ${item.category}
                </span>
                ${item.featured ? `<span class="badge badge-humm text-xs" style="font-size: 9px; padding: 2px 5px;">⭐ Destacado</span>` : '<span></span>'}
              </div>

              <!-- Logo e Identidad de la Empresa Centrado -->
              <div style="display: flex; flex-direction: column; align-items: center; text-align: center; margin-bottom: 10px;">
                <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--bg-surface-secondary); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; border: 1px solid var(--border-subtle); margin-bottom: 6px; box-shadow: 0 2px 5px rgba(0,0,0,0.03);">
                  ${item.logo || '🎁'}
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

            <!-- Parte Inferior: Canje, Código y Botón -->
            <div style="border-top: 1px solid var(--border-subtle); padding-top: 10px; margin-top: auto; display: flex; flex-direction: column; gap: 8px;">
              ${item.code ? `
                <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-surface-secondary); border: 1px dashed var(--border-strong); border-radius: var(--radius-sm); padding: 5px 8px;">
                  <div>
                    <div style="font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-muted); font-weight: 700;">Cupón</div>
                    <div style="font-family: monospace; font-weight: 800; font-size: 11px; color: var(--text-primary);">${item.code}</div>
                  </div>
                  <button class="btn btn-secondary btn-sm btn-copy-code" data-code="${item.code}" style="padding: 2px 7px; font-size: 10px; height: auto;" title="Copiar código">
                    📋 Copiar
                  </button>
                </div>
              ` : ''}

              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10.5px; color: var(--text-muted);">
                <span>Vigencia:</span>
                <strong style="color: var(--text-secondary);">${item.expiresAt ? formatDateCL(item.expiresAt) : 'Permanente'}</strong>
              </div>

              ${item.url ? `
                <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm btn-block" style="text-align: center; text-decoration: none; justify-content: center; font-size: var(--font-size-xs); padding: 6px 10px;">
                  Canjear Beneficio ➔
                </a>
              ` : `
                <button class="btn btn-secondary btn-sm btn-block" style="font-size: var(--font-size-xs); padding: 6px 10px;" disabled>
                  Solicitar vía Tutor
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
    btn.addEventListener('click', () => {
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
}
