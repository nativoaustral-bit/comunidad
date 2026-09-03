/**
 * MI HUMM - MÓDULO VENTAS & SEGUIMIENTO DE PAGOS
 * Comunidad Humm Co-Creation
 */

import { store, formatCLP, formatDateCL, formatMonthName, isDateOverdue } from '../store.js';
import { auth } from '../auth.js';
import { SalesChart } from '../chart.js';

let currentPaymentFilter = 'all';
let currentMonthFilter = 'all';
let currentYearFilter = 'all';
let salesSearchQuery = '';

export function renderSalesView(container) {
  const ws = auth.getCurrentWorkspace();
  if (!ws) return;

  const sales = store.getSales(ws.id);
  const customers = store.getCustomers(ws.id);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;

  const getSaleYear = (s) => s.year || (s.date ? parseInt(s.date.split('-')[0], 10) : (s.saleDate ? parseInt(s.saleDate.split('-')[0], 10) : currentYear));
  const getSaleMonth = (s) => s.month || (s.date ? parseInt(s.date.split('-')[1], 10) : (s.saleDate ? parseInt(s.saleDate.split('-')[1], 10) : currentMonth));

  // Años disponibles en los registros de ventas
  const availableYears = Array.from(new Set(sales.map(s => getSaleYear(s)).filter(Boolean))).sort((a, b) => b - a);
  if (!availableYears.includes(currentYear)) availableYears.unshift(currentYear);

  // Ventas del mes actual
  const currentMonthSales = sales.filter(s => getSaleYear(s) === currentYear && getSaleMonth(s) === currentMonth);
  const prevMonthSales = sales.filter(s => getSaleYear(s) === prevYear && getSaleMonth(s) === prevMonth);

  const currentMonthTotal = currentMonthSales.reduce((sum, s) => sum + (Number(s.amount) || Number(s.totalAmount) || 0), 0);
  const prevMonthTotal = prevMonthSales.reduce((sum, s) => sum + (Number(s.amount) || Number(s.totalAmount) || 0), 0);

  // Total cobrado vs pendiente general (incluye pendientes, en cobranza, abonos y ventas por facturar)
  const totalPaid = sales.filter(s => s.paymentStatus === 'pagado').reduce((sum, s) => sum + (Number(s.amount) || Number(s.totalAmount) || 0), 0);
  const totalPending = sales.filter(s => s.paymentStatus === 'pendiente' || s.paymentStatus === 'vencido' || s.paymentStatus === 'abono' || s.paymentStatus === 'por_facturar').reduce((sum, s) => sum + (Number(s.amount) || Number(s.totalAmount) || 0), 0);
  const pendingCount = sales.filter(s => s.paymentStatus === 'pendiente' || s.paymentStatus === 'vencido' || s.paymentStatus === 'abono' || s.paymentStatus === 'por_facturar').length;

  // Total acumulado general de ventas
  const total12Months = sales.reduce((acc, curr) => acc + (Number(curr.amount) || Number(curr.totalAmount) || 0), 0);

  let diffText = '';
  let diffClass = 'comparison-neutral';
  if (currentMonthTotal > 0 && prevMonthTotal > 0) {
    const diff = currentMonthTotal - prevMonthTotal;
    const pct = Math.round((diff / prevMonthTotal) * 100);
    if (diff >= 0) {
      diffText = `+${pct}% vs mes anterior (${formatCLP(diff)})`;
      diffClass = 'comparison-positive';
    } else {
      diffText = `${pct}% vs mes anterior (${formatCLP(diff)})`;
      diffClass = 'comparison-negative';
    }
  } else if (currentMonthTotal > 0 && prevMonthTotal === 0) {
    diffText = `${currentMonthSales.length} ${currentMonthSales.length === 1 ? 'venta registrada' : 'ventas registradas'} en ${formatMonthName(currentMonth)}`;
    diffClass = 'comparison-positive';
  } else {
    diffText = `Sin ventas registradas en ${formatMonthName(currentMonth)}`;
  }

  // Filtrado de ventas en la tabla por Mes, Año, Estado y Búsqueda
  const filteredSales = sales.filter(sale => {
    const saleYear = getSaleYear(sale);
    const saleMonth = getSaleMonth(sale);

    // Filtro Año
    if (currentYearFilter !== 'all') {
      if (saleYear !== parseInt(currentYearFilter, 10)) return false;
    }

    // Filtro Mes
    if (currentMonthFilter !== 'all') {
      if (saleMonth !== parseInt(currentMonthFilter, 10)) return false;
    }

    // Filtro estado de pago
    if (currentPaymentFilter !== 'all') {
      if (currentPaymentFilter === 'pending_all') {
        if (sale.paymentStatus === 'pagado') return false;
      } else if (sale.paymentStatus !== currentPaymentFilter) {
        return false;
      }
    }

    // Filtro búsqueda
    if (salesSearchQuery.trim() !== '') {
      const q = salesSearchQuery.toLowerCase();
      const customer = sale.customerId ? customers.find(c => c.id === sale.customerId) : null;
      const custName = customer ? `${customer.firstName} ${customer.lastName || ''} ${customer.company || ''}`.toLowerCase() : '';
      const notes = (sale.notes || '').toLowerCase();
      const amountStr = String(sale.amount);

      if (!custName.includes(q) && !notes.includes(q) && !amountStr.includes(q)) {
        return false;
      }
    }

    return true;
  });

  const filteredTotal = filteredSales.reduce((sum, s) => sum + s.amount, 0);
  const isFiltered = currentMonthFilter !== 'all' || currentYearFilter !== 'all' || currentPaymentFilter !== 'all' || salesSearchQuery.trim() !== '';

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <div style="display: flex; align-items: center; gap: 8px;">
          <h2>Registro y Control de Ventas</h2>
          <span class="badge badge-success text-xs">Pesos Chilenos ($ CLP)</span>
        </div>
        <p>Registra tus transacciones con fecha exacta, cliente asignado y seguimiento de cobranza.</p>
      </div>
      <div class="view-actions">
        <button class="btn btn-primary" id="btn-open-modal-sale">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Registrar Venta
        </button>
      </div>
    </div>

    <!-- TARJETAS DE INDICADORES Y COBRANZA -->
    <div class="metrics-grid" style="margin-bottom: 24px;">
      <!-- Métrica 1: Ventas Mes Actual -->
      <div class="metric-card">
        <div class="metric-card-header">
          <span class="metric-card-title">Ventas ${formatMonthName(currentMonth)}</span>
          <div class="metric-icon-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
        </div>
        <div class="metric-value">${formatCLP(currentMonthTotal)}</div>
        <div class="metric-comparison">
          <span class="${diffClass}">${diffText}</span>
        </div>
      </div>

      <!-- Métrica 2: Total Pagado -->
      <div class="metric-card">
        <div class="metric-card-header">
          <span class="metric-card-title">Total Pagado / Recaudado</span>
          <div class="metric-icon-box" style="background: rgba(16, 185, 129, 0.12); color: var(--success);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
        </div>
        <div class="metric-value" style="color: var(--success);">${formatCLP(totalPaid)}</div>
        <div class="metric-comparison"><span class="comparison-positive">Ingresos efectivos</span></div>
      </div>

      <!-- Métrica 3: Cuentas por Cobrar -->
      <div class="metric-card">
        <div class="metric-card-header">
          <span class="metric-card-title">Por Cobrar / En Cobranza</span>
          <div class="metric-icon-box" style="background: rgba(245, 158, 11, 0.15); color: #D97706;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
        </div>
        <div class="metric-value" style="color: ${totalPending > 0 ? '#D97706' : 'var(--text-primary)'};">${formatCLP(totalPending)}</div>
        <div class="metric-comparison">
          <span class="${totalPending > 0 ? 'comparison-negative' : 'comparison-neutral'}">
            ${pendingCount} ${pendingCount === 1 ? 'cuenta por cobrar' : 'cuentas por cobrar'}
          </span>
        </div>
      </div>

      <!-- Métrica 4: Total 12 Meses -->
      <div class="metric-card">
        <div class="metric-card-header">
          <span class="metric-card-title">Total Últimos 12 Meses</span>
          <div class="metric-icon-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 3v18h18"></path>
              <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"></path>
            </svg>
          </div>
        </div>
        <div class="metric-value">${formatCLP(total12Months)}</div>
        <div class="metric-comparison"><span class="comparison-neutral">${sales.length} transacciones registradas</span></div>
      </div>
    </div>

    <!-- GRÁFICO MENSUAL DE VENTAS -->
    <div class="chart-container-card" style="margin-bottom: 24px;">
      <div class="chart-header">
        <div class="chart-title-area">
          <h3>Evolución de ventas mensuales</h3>
          <p>Muestra el comportamiento de tus ingresos en pesos chilenos ($ CLP).</p>
        </div>
      </div>
      <div id="sales-view-chart-wrapper"></div>
    </div>

    <!-- TABLA HISTÓRICA Y SEGUIMIENTO DE COBRANZA -->
    <div class="data-table-container">
      <!-- BARRA DE BÚSQUEDA Y FILTROS POR MES, AÑO Y ESTADO -->
      <div class="table-toolbar" style="flex-wrap: wrap; gap: 12px; align-items: center; justify-content: space-between;">
        <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center; flex: 1;">
          <!-- Buscador -->
          <div class="input-with-icon" style="max-width: 280px; min-width: 200px; flex: 1;">
            <span class="input-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
            <input type="text" id="sales-search-input" class="form-control" placeholder="Buscar por cliente o nota..." value="${salesSearchQuery}" />
          </div>

          <!-- Filtro Mes -->
          <div style="min-width: 145px;">
            <select id="sales-filter-month" class="form-select" style="font-size: 13px; font-weight: 600; padding: 7px 10px;">
              <option value="all" ${currentMonthFilter === 'all' ? 'selected' : ''}>🗓️ Todos los meses</option>
              ${[1,2,3,4,5,6,7,8,9,10,11,12].map(m => `
                <option value="${m}" ${String(currentMonthFilter) === String(m) ? 'selected' : ''}>${formatMonthName(m)}</option>
              `).join('')}
            </select>
          </div>

          <!-- Filtro Año -->
          <div style="min-width: 130px;">
            <select id="sales-filter-year" class="form-select" style="font-size: 13px; font-weight: 600; padding: 7px 10px;">
              <option value="all" ${currentYearFilter === 'all' ? 'selected' : ''}>📅 Todos los años</option>
              ${availableYears.map(y => `
                <option value="${y}" ${String(currentYearFilter) === String(y) ? 'selected' : ''}>Año ${y}</option>
              `).join('')}
            </select>
          </div>

          ${isFiltered ? `
            <button class="btn btn-ghost btn-sm" id="btn-clear-sales-filters" title="Restablecer todos los filtros" style="font-size: 12px; color: var(--humm-red-primary); padding: 6px 10px; font-weight: 700;">
              ✕ Limpiar filtros
            </button>
          ` : ''}
        </div>

        <!-- Resumen de ventas filtradas -->
        <div style="font-size: 13px; color: var(--text-secondary); background: var(--bg-body); padding: 7px 14px; border-radius: var(--radius-md); border: 1px solid var(--border-color); white-space: nowrap;">
          <strong>${filteredSales.length}</strong> ${filteredSales.length === 1 ? 'venta' : 'ventas'} • Total: <strong style="color: var(--text-primary); font-size: 14px;">${formatCLP(filteredTotal)}</strong>
        </div>
      </div>

      <!-- Barra de Filtros Rápidos por Estado de Pago -->
      <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center; padding: 10px 16px; background: var(--bg-body); border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color);">
        <span class="text-xs text-muted" style="font-weight: 700; margin-right: 4px;">Estado de cobro:</span>
        <button class="btn ${currentPaymentFilter === 'all' ? 'btn-primary' : 'btn-ghost'} btn-sm filter-payment-btn" data-filter="all" style="font-size: 11px; padding: 3px 8px;">
          Todos (${sales.length})
        </button>
        <button class="btn ${currentPaymentFilter === 'por_facturar' ? 'btn-primary' : 'btn-ghost'} btn-sm filter-payment-btn" data-filter="por_facturar" style="font-size: 11px; padding: 3px 8px;">
          📄 Por Facturar (${sales.filter(s => s.paymentStatus === 'por_facturar').length})
        </button>
        <button class="btn ${currentPaymentFilter === 'pending_all' ? 'btn-primary' : 'btn-ghost'} btn-sm filter-payment-btn" data-filter="pending_all" style="font-size: 11px; padding: 3px 8px; color: ${currentPaymentFilter === 'pending_all' ? '#FFF' : '#D97706'};">
          ⏳ Por Cobrar (${pendingCount})
        </button>
        <button class="btn ${currentPaymentFilter === 'pagado' ? 'btn-primary' : 'btn-ghost'} btn-sm filter-payment-btn" data-filter="pagado" style="font-size: 11px; padding: 3px 8px;">
          ✅ Pagados (${sales.filter(s => s.paymentStatus === 'pagado').length})
        </button>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Cliente Asociado</th>
            <th>Monto ($ CLP)</th>
            <th>Estado de Pago</th>
            <th>Vencimiento Cobro</th>
            <th>Detalle / Boleta</th>
            <th style="text-align: right;">Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${filteredSales.length > 0 ? [...filteredSales].reverse().map(sale => {
            const customer = sale.customerId ? customers.find(c => c.id === sale.customerId) : null;
            const saleDate = sale.date ? formatDateCL(sale.date) : `${formatMonthName(sale.month)} ${sale.year}`;
            const isToInvoice = sale.paymentStatus === 'por_facturar';
            const isPending = sale.paymentStatus === 'pendiente' || sale.paymentStatus === 'vencido' || sale.paymentStatus === 'abono';
            const isDueOver = sale.dueDate && isDateOverdue(sale.dueDate) && isPending;

            let statusBadge = '<span class="badge badge-success text-xs">✅ Pagado</span>';
            if (isToInvoice) {
              statusBadge = '<span class="badge badge-neutral text-xs" style="background: rgba(100, 116, 139, 0.15); color: #334155; font-weight: 700;">📄 Por Facturar</span>';
            } else if (sale.paymentStatus === 'pendiente') {
              statusBadge = '<span class="badge badge-warning text-xs">⏳ Pendiente</span>';
            } else if (sale.paymentStatus === 'abono') {
              statusBadge = '<span class="badge badge-info text-xs">💳 Abonado</span>';
            } else if (sale.paymentStatus === 'vencido' || isDueOver) {
              statusBadge = '<span class="badge badge-danger text-xs">⚠️ En Cobranza</span>';
            }

            return `
              <tr>
                <td>
                  <strong style="color: var(--text-primary); font-size: var(--font-size-sm);">${saleDate}</strong>
                </td>

                <td>
                  ${customer ? `
                    <div style="font-weight: 600; color: var(--text-primary);">
                      👤 ${customer.firstName} ${customer.lastName || ''}
                    </div>
                    ${customer.company ? `<div class="text-xs text-muted">${customer.company}</div>` : ''}
                  ` : `
                    <span class="text-xs text-muted">🏪 Público general</span>
                  `}
                </td>

                <td style="font-weight: 800; color: var(--text-primary); font-size: var(--font-size-md);">
                  ${formatCLP(sale.amount)}
                </td>

                <td>
                  ${statusBadge}
                </td>

                <td>
                  ${sale.dueDate ? `
                    <span style="font-size: var(--font-size-xs); ${isDueOver ? 'color: var(--danger); font-weight: 700;' : 'color: var(--text-secondary);'}">
                      📅 ${formatDateCL(sale.dueDate)} ${isDueOver ? '(Atrasado)' : ''}
                    </span>
                  ` : '<span class="text-muted text-xs">—</span>'}
                </td>

                <td class="text-secondary text-xs" style="max-width: 200px;">
                  ${sale.notes || '<span class="text-muted">—</span>'}
                </td>

                <td style="text-align: right; white-space: nowrap;">
                  ${isToInvoice ? `
                    <button class="btn btn-secondary btn-sm btn-mark-sale-billed" data-sale-id="${sale.id}" style="font-size: 11px; padding: 4px 8px; margin-right: 4px;" title="Marcar como emitida / pasar a cobro">
                      🧾 Emitir
                    </button>
                  ` : ''}

                  ${isPending || isToInvoice ? `
                    <button class="btn btn-secondary btn-sm btn-mark-sale-paid" data-sale-id="${sale.id}" style="font-size: 11px; padding: 4px 8px; margin-right: 4px;" title="Marcar venta como pagada">
                      💰 Marcar Pagado
                    </button>
                  ` : ''}

                  <button class="btn btn-ghost btn-sm btn-edit-sale" data-sale-id="${sale.id}" title="Editar venta">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 20h9"></path>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                    </svg>
                  </button>

                  <button class="btn btn-ghost btn-sm btn-delete-sale" data-sale-id="${sale.id}" title="Eliminar registro">
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
              <td colspan="7" style="text-align: center; padding: 40px;" class="text-muted">
                No se encontraron ventas con los filtros seleccionados. Haz clic en <strong>"+ Registrar Venta"</strong> para agregar una transacción.
              </td>
            </tr>
          `}
        </tbody>
      </table>

      <!-- Tarjetas móviles de ventas -->
      <div class="responsive-cards-grid">
        ${filteredSales.length > 0 ? [...filteredSales].reverse().map(sale => {
          const customer = sale.customerId ? customers.find(c => c.id === sale.customerId) : null;
          const saleDate = sale.date ? formatDateCL(sale.date) : `${formatMonthName(sale.month)} ${sale.year}`;
          const isToInvoice = sale.paymentStatus === 'por_facturar';
          const isPending = sale.paymentStatus === 'pendiente' || sale.paymentStatus === 'vencido' || sale.paymentStatus === 'abono';
          const isDueOver = sale.dueDate && isDateOverdue(sale.dueDate) && isPending;

          let statusBadge = '<span class="badge badge-success text-xs">✅ Pagado</span>';
          if (isToInvoice) {
            statusBadge = '<span class="badge badge-neutral text-xs" style="background: rgba(100, 116, 139, 0.15); color: #334155; font-weight: 700;">📄 Por Facturar</span>';
          } else if (sale.paymentStatus === 'pendiente') {
            statusBadge = '<span class="badge badge-warning text-xs">⏳ Pendiente</span>';
          } else if (sale.paymentStatus === 'abono') {
            statusBadge = '<span class="badge badge-info text-xs">💳 Abonado</span>';
          } else if (sale.paymentStatus === 'vencido' || isDueOver) {
            statusBadge = '<span class="badge badge-danger text-xs">⚠️ En Cobranza</span>';
          }

          return `
            <div class="adaptive-item-card" style="padding: 16px;">
              <div class="adaptive-card-header" style="margin-bottom: 8px;">
                <div>
                  <strong>${saleDate}</strong>
                  <div style="font-size: var(--font-size-xs); color: var(--text-muted);">
                    ${customer ? `👤 ${customer.firstName} ${customer.lastName || ''}` : '🏪 Público general'}
                  </div>
                </div>
                <div style="font-weight: 800; color: var(--humm-red-primary); font-size: 1.15rem;">
                  ${formatCLP(sale.amount)}
                </div>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: var(--font-size-xs);">
                <span>Estado:</span>
                ${statusBadge}
              </div>

              ${sale.notes ? `<div class="adaptive-card-body" style="font-size: var(--font-size-xs); margin-bottom: 10px;">${sale.notes}</div>` : ''}

              <div class="adaptive-card-footer" style="display: flex; gap: 8px; justify-content: flex-end;">
                ${isToInvoice ? `
                  <button class="btn btn-secondary btn-sm btn-mark-sale-billed" data-sale-id="${sale.id}">
                    🧾 Emitir
                  </button>
                ` : ''}
                ${isPending || isToInvoice ? `
                  <button class="btn btn-secondary btn-sm btn-mark-sale-paid" data-sale-id="${sale.id}">
                    💰 Pagado
                  </button>
                ` : ''}
                <button class="btn btn-ghost btn-sm btn-edit-sale" data-sale-id="${sale.id}">
                  Editar
                </button>
                <button class="btn btn-ghost btn-sm btn-delete-sale" data-sale-id="${sale.id}" style="color: var(--danger);">
                  Eliminar
                </button>
              </div>
            </div>
          `;
        }).join('') : ''}
      </div>
    </div>
  `;

  // Renderizar gráfico de ventas
  const chartWrapper = container.querySelector('#sales-view-chart-wrapper');
  if (chartWrapper) {
    const chart = new SalesChart(chartWrapper);
    chart.render(sales);
  }

  // Event Listeners
  container.querySelector('#btn-open-modal-sale')?.addEventListener('click', () => {
    if (window.MiHummApp) {
      const form = document.getElementById('form-modal-sale');
      if (form) {
        form.removeAttribute('data-edit-id');
        form.reset();
        const dateInput = document.getElementById('modal-sale-date');
        if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
        document.getElementById('modal-sale-header-title').textContent = 'Registrar Venta';
      }
      window.MiHummApp.openModal('modal-sale');
    }
  });

  // Búsqueda en tiempo real
  const searchInput = container.querySelector('#sales-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      salesSearchQuery = e.target.value;
      renderSalesView(container);
      const updated = container.querySelector('#sales-search-input');
      if (updated) {
        updated.focus();
        updated.setSelectionRange(updated.value.length, updated.value.length);
      }
    });
  }

  // Filtros de estado de pago
  container.querySelectorAll('.filter-payment-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentPaymentFilter = btn.getAttribute('data-filter');
      renderSalesView(container);
    });
  });

  // Filtro por Mes
  const monthSelect = container.querySelector('#sales-filter-month');
  if (monthSelect) {
    monthSelect.addEventListener('change', (e) => {
      currentMonthFilter = e.target.value;
      renderSalesView(container);
    });
  }

  // Filtro por Año
  const yearSelect = container.querySelector('#sales-filter-year');
  if (yearSelect) {
    yearSelect.addEventListener('change', (e) => {
      currentYearFilter = e.target.value;
      renderSalesView(container);
    });
  }

  // Botón Limpiar todos los filtros
  container.querySelector('#btn-clear-sales-filters')?.addEventListener('click', () => {
    currentMonthFilter = 'all';
    currentYearFilter = 'all';
    currentPaymentFilter = 'all';
    salesSearchQuery = '';
    renderSalesView(container);
  });

  // Editar venta
  container.querySelectorAll('.btn-edit-sale').forEach(btn => {
    btn.addEventListener('click', () => {
      const saleId = btn.getAttribute('data-sale-id');
      if (window.MiHummApp) window.MiHummApp.openEditSaleModal(saleId);
    });
  });

  // Marcar como emitida / en cobro en 1 clic
  container.querySelectorAll('.btn-mark-sale-billed').forEach(btn => {
    btn.addEventListener('click', () => {
      const saleId = btn.getAttribute('data-sale-id');
      store.updateSalePaymentStatus(saleId, 'pendiente');
      if (window.MiHummApp) {
        window.MiHummApp.showToast('Venta marcada como emitida y pasada a cobro pendiente.', 'info');
        renderSalesView(container);
      }
    });
  });

  // Marcar como pagado en 1 clic
  container.querySelectorAll('.btn-mark-sale-paid').forEach(btn => {
    btn.addEventListener('click', () => {
      const saleId = btn.getAttribute('data-sale-id');
      store.updateSalePaymentStatus(saleId, 'pagado');
      if (window.MiHummApp) {
        window.MiHummApp.showToast('¡Pago registrado con éxito! Saldo actualizado.', 'success');
        renderSalesView(container);
      }
    });
  });

  // Eliminar venta con confirmación
  container.querySelectorAll('.btn-delete-sale').forEach(btn => {
    btn.addEventListener('click', () => {
      const saleId = btn.getAttribute('data-sale-id');
      if (confirm('¿Estás seguro de que deseas eliminar este registro de venta?')) {
        store.deleteSale(saleId);
        if (window.MiHummApp) {
          window.MiHummApp.showToast('Registro de venta eliminado', 'info');
          renderSalesView(container);
        }
      }
    });
  });
}
