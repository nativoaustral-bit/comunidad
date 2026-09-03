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
    let existingTooltip = document.getElementById('chart-global-tooltip');
    if (existingTooltip) {
      this.tooltip = existingTooltip;
    } else {
      this.tooltip = document.createElement('div');
      this.tooltip.className = 'chart-tooltip';
      this.tooltip.id = 'chart-global-tooltip';
      document.body.appendChild(this.tooltip);
    }
  }

  render(salesData = []) {
    if (!this.container) return;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12

    // Construir los últimos 12 meses consecutivos terminando en el mes actual
    const monthlyBuckets = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(currentYear, (currentMonth - 1) - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      monthlyBuckets.push({
        year: y,
        month: m,
        amount: 0,
        count: 0,
        sales: []
      });
    }

    // Extraer año y mes de cada venta registrada y agregar a su respectivo mes
    (salesData || []).forEach(s => {
      let y = s.year ? parseInt(s.year, 10) : null;
      let m = s.month ? parseInt(s.month, 10) : null;
      const dateStr = s.date || s.saleDate || s.createdAt;
      if ((!y || !m) && dateStr) {
        const parts = dateStr.split('-');
        if (parts.length >= 2) {
          y = parseInt(parts[0], 10);
          m = parseInt(parts[1], 10);
        }
      }
      y = y || currentYear;
      m = m || currentMonth;

      const amt = Math.max(0, parseInt(s.amount, 10) || parseInt(s.totalAmount, 10) || 0);
      const bucket = monthlyBuckets.find(b => b.year === y && b.month === m);
      if (bucket) {
        bucket.amount += amt;
        bucket.count += 1;
        bucket.sales.push(s);
      }
    });

    const maxAmount = Math.max(...monthlyBuckets.map(d => d.amount), 100000);
    // Redondear el máximo para una escala limpia
    const yMax = Math.ceil(maxAmount * 1.2);

    const width = 800;
    const height = 220;
    const padding = { top: 25, right: 20, bottom: 40, left: 20 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const barWidth = 26;
    const step = chartWidth / monthlyBuckets.length;

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
    monthlyBuckets.forEach((item, index) => {
      const hasSales = item.amount > 0;
      const barHeight = hasSales ? Math.max(8, (item.amount / yMax) * chartHeight) : 3;
      const x = padding.left + index * step + (step - barWidth) / 2;
      const y = padding.top + chartHeight - barHeight;
      const isCurrentMonth = index === monthlyBuckets.length - 1;

      const shortMonth = formatMonthName(item.month).substring(0, 3);
      const isHighlighted = isCurrentMonth 
        ? (hasSales ? 'var(--humm-red-primary)' : 'rgba(230, 0, 35, 0.4)') 
        : (hasSales ? 'var(--chart-bar-bg)' : 'rgba(148, 163, 184, 0.25)');

      barsHtml += `
        <g class="chart-bar-group" 
           data-month="${formatMonthName(item.month, item.year)}" 
           data-amount="${formatCLP(item.amount)}"
           data-count="${item.count}"
           data-current="${isCurrentMonth ? '1' : '0'}"
           style="cursor: pointer;">
          <!-- Barra de fondo transparente para aumentar área táctil/hover -->
          <rect x="${x - 6}" y="${padding.top}" width="${barWidth + 12}" height="${chartHeight}" fill="transparent" />
          
          <!-- Barra visible -->
          <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" 
                rx="${hasSales ? 5 : 2}" ry="${hasSales ? 5 : 2}"
                fill="${isHighlighted}" 
                class="chart-bar-rect"
                style="transition: all 0.2s ease;" />
                
          <!-- Etiqueta del mes en Eje X -->
          <text x="${x + barWidth / 2}" y="${height - 12}" 
                text-anchor="middle" 
                fill="${isCurrentMonth ? 'var(--humm-red-primary)' : 'var(--text-secondary)'}" 
                font-size="12" 
                font-weight="${isCurrentMonth ? '800' : '600'}"
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
        const count = parseInt(group.getAttribute('data-count'), 10) || 0;

        rect.setAttribute('fill', 'var(--humm-red-hover)');
        rect.style.transform = 'scaleY(1.05)';
        rect.style.transformOrigin = 'bottom';

        this.tooltip.innerHTML = `
          <div class="chart-tooltip-month">${month}</div>
          <div class="chart-tooltip-amount">${amount}</div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 3px;">
            ${count > 0 ? `${count} ${count === 1 ? 'venta registrada' : 'ventas registradas'}` : 'Sin ventas este mes'}
          </div>
        `;

        const groupBounds = rect.getBoundingClientRect();
        this.tooltip.style.left = `${groupBounds.left + groupBounds.width / 2 + window.scrollX}px`;
        this.tooltip.style.top = `${groupBounds.top + window.scrollY - 8}px`;
        this.tooltip.classList.add('visible');
      };

      const hideTooltip = () => {
        const isCurrent = group.getAttribute('data-current') === '1';
        const count = parseInt(group.getAttribute('data-count'), 10) || 0;
        const hasSales = count > 0;

        const defaultFill = isCurrent 
          ? (hasSales ? 'var(--humm-red-primary)' : 'rgba(230, 0, 35, 0.4)') 
          : (hasSales ? 'var(--chart-bar-bg)' : 'rgba(148, 163, 184, 0.25)');

        rect.setAttribute('fill', defaultFill);
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
    this.render([]);
  }
}
