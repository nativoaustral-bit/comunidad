/**
 * MI HUMM - RENDERIZADOR DE GRÁFICO DE VENTAS INTERACTIVO (SVG/CANVAS PURO)
 * Comunidad Humm Co-Creation
 */

import { formatCLP, formatMonthName } from './store.js';

export class SalesChart {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.options = options;
    this.tooltip = null;
    this.initTooltip();
  }

  initTooltip() {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'chart-tooltip';
    this.tooltip.id = 'chart-global-tooltip';
    document.body.appendChild(this.tooltip);
  }

  render(salesData = []) {
    if (!this.container) return;

    if (!salesData || salesData.length === 0) {
      this.renderEmptyState();
      return;
    }

    // Preparar los últimos 12 meses ordenados
    const sorted = [...salesData].sort((a, b) => (a.year !== b.year ? a.year - b.year : a.month - b.month));
    const recent = sorted.slice(-12);

    const maxAmount = Math.max(...recent.map(d => d.amount), 100000);
    // Redondear el máximo para una escala limpia
    const yMax = Math.ceil(maxAmount * 1.15);

    const width = 800;
    const height = 220;
    const padding = { top: 20, right: 20, bottom: 40, left: 20 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const barWidth = Math.min(36, (chartWidth / recent.length) * 0.55);
    const step = chartWidth / recent.length;

    let barsHtml = '';
    let gridHtml = '';

    // Líneas de guía horizontales
    const gridLines = 4;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (chartHeight / gridLines) * i;
      gridHtml += `
        <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" 
              stroke="var(--chart-grid-line)" stroke-width="1" stroke-dasharray="${i === gridLines ? '0' : '4 4'}" />
      `;
    }

    // Renderizado de barras interactivas
    recent.forEach((item, index) => {
      const barHeight = Math.max(4, (item.amount / yMax) * chartHeight);
      const x = padding.left + index * step + (step - barWidth) / 2;
      const y = padding.top + chartHeight - barHeight;
      const isCurrentMonth = index === recent.length - 1;

      const shortMonth = formatMonthName(item.month).substring(0, 3);
      const isHighlighted = isCurrentMonth ? 'var(--humm-red-primary)' : 'var(--chart-bar-bg)';

      barsHtml += `
        <g class="chart-bar-group" 
           data-month="${formatMonthName(item.month, item.year)}" 
           data-amount="${formatCLP(item.amount)}"
           data-notes="${item.notes ? item.notes.replace(/"/g, '&quot;') : ''}"
           style="cursor: pointer;">
          <!-- Barra de fondo transparente para aumentar área táctil/hover -->
          <rect x="${x - 6}" y="${padding.top}" width="${barWidth + 12}" height="${chartHeight}" fill="transparent" />
          
          <!-- Barra visible -->
          <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" 
                rx="5" ry="5"
                fill="${isHighlighted}" 
                class="chart-bar-rect"
                style="transition: all 0.2s ease;" />
                
          <!-- Etiqueta del mes -->
          <text x="${x + barWidth / 2}" y="${height - 12}" 
                text-anchor="middle" 
                fill="var(--text-muted)" 
                font-size="11.5" 
                font-weight="${isCurrentMonth ? '700' : '500'}"
                font-family="var(--font-family)">
            ${shortMonth}
          </text>
        </g>
      `;
    });

    this.container.innerHTML = `
      <div class="chart-canvas-wrap">
        <svg viewBox="0 0 ${width} ${height}" class="chart-svg" preserveAspectRatio="none">
          ${gridHtml}
          ${barsHtml}
        </svg>
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    const groups = this.container.querySelectorAll('.chart-bar-group');
    groups.forEach(group => {
      const rect = group.querySelector('.chart-bar-rect');

      const showTooltip = (e) => {
        const month = group.getAttribute('data-month');
        const amount = group.getAttribute('data-amount');
        const notes = group.getAttribute('data-notes');

        rect.setAttribute('fill', 'var(--humm-red-hover)');
        rect.style.transform = 'scaleY(1.03)';
        rect.style.transformOrigin = 'bottom';

        this.tooltip.innerHTML = `
          <div class="chart-tooltip-month">${month}</div>
          <div class="chart-tooltip-amount">${amount}</div>
          ${notes ? `<div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">${notes}</div>` : ''}
        `;

        const groupBounds = rect.getBoundingClientRect();
        this.tooltip.style.left = `${groupBounds.left + groupBounds.width / 2}px`;
        this.tooltip.style.top = `${groupBounds.top - 12}px`;
        this.tooltip.classList.add('visible');
      };

      const hideTooltip = () => {
        const isCurrent = group === groups[groups.length - 1];
        rect.setAttribute('fill', isCurrent ? 'var(--humm-red-primary)' : 'var(--chart-bar-bg)');
        rect.style.transform = 'scaleY(1)';
        this.tooltip.classList.remove('visible');
      };

      group.addEventListener('mouseenter', showTooltip);
      group.addEventListener('mouseleave', hideTooltip);
      group.addEventListener('touchstart', (e) => {
        showTooltip(e);
      }, { passive: true });
    });
  }

  renderEmptyState() {
    this.container.innerHTML = `
      <div class="empty-state" style="margin: 0; padding: 32px 16px;">
        <div class="empty-state-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
        </div>
        <h4 class="empty-state-title">Aún no tienes ventas registradas</h4>
        <p class="empty-state-desc">Ingresa tu primera venta mensual para comenzar a visualizar tus avances en pesos chilenos y comparar mes a mes.</p>
        <button class="btn btn-primary btn-sm" id="btn-chart-empty-register">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Registrar ventas
        </button>
      </div>
    `;

    const btn = this.container.querySelector('#btn-chart-empty-register');
    if (btn) {
      btn.addEventListener('click', () => {
        if (window.MiHummApp) {
          window.MiHummApp.openModal('modal-sale');
        }
      });
    }
  }
}
