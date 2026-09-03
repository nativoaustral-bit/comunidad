/**
 * MI HUMM - APLICACIÓN PRINCIPAL & ENRUTADOR (SPA)
 * Comunidad Humm Co-Creation
 */

import { store, formatDateCL, formatCLP } from './store.js';
import { auth } from './auth.js';
import { populateComunasSelect } from './chile-data.js';
import { renderDashboard } from './views/dashboard.js';
import { renderTasksView } from './views/tasks.js';
import { renderCalendarView } from './views/calendar.js';
import { renderNotesView } from './views/notes.js';
import { renderSalesView } from './views/sales.js';
import { renderCustomersView } from './views/customers.js';
import { renderOpportunitiesView } from './views/opportunities.js';
import { renderToolsView } from './views/tools.js';
import { renderAccountView } from './views/account.js';
import { renderDiscountsView } from './views/discounts.js';
import { renderAdminView } from './views/admin.js';

class App {
  constructor() {
    this.currentView = 'inicio';
    this.theme = this.loadThemePreference();
    this.init();
  }

  init() {
    this.applyTheme(this.theme);
    this.setupEventListeners();
    this.setupModals();
    this.setupActivityAndSecurityMonitors();
    this.checkAuthenticationState();

    // Suscribirse a cambios en autenticación
    auth.subscribe(() => {
      this.checkAuthenticationState();
    });

    // Suscribirse a cambios en store para refrescar
    store.subscribe(() => {
      this.updateHeaderBadgeCounts();
    });

    // Manejo de historial hash
    window.addEventListener('hashchange', () => {
      this.handleHashChange();
    });

    // Iniciar con la vista actual según URL o inicio
    this.handleHashChange();
  }

  // =========================================================================
  // SEGURIDAD DE SESIÓN Y MONITOREO DE INACTIVIDAD
  // =========================================================================
  setupActivityAndSecurityMonitors() {
    // 1. Registro de actividad interactiva del usuario
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(evt => {
      window.addEventListener(evt, () => {
        auth.recordActivity();
      }, { passive: true });
    });

    // 2. Verificación inmediata cuando el usuario vuelve a enfocar la pestaña tras horas
    window.addEventListener('focus', () => {
      auth.checkSessionValidity(true);
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        auth.checkSessionValidity(true);
      }
    });

    // 3. Verificación periódica cada 30 segundos
    setInterval(() => {
      auth.checkSessionValidity(true);
    }, 30000);
  }

  // =========================================================================
  // GESTIÓN DE TEMAS (CLARO / OSCURO)
  // =========================================================================
  loadThemePreference() {
    const saved = localStorage.getItem('mi_humm_theme');
    if (saved) return saved;
    // Detección automática del dispositivo
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  applyTheme(theme) {
    this.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('mi_humm_theme', theme);
  }

  toggleTheme() {
    const newTheme = this.theme === 'dark' ? 'light' : 'dark';
    this.applyTheme(newTheme);
    this.showToast(`Modo ${newTheme === 'dark' ? 'oscuro' : 'claro'} activado`, 'info');
  }

  // =========================================================================
  // CONTROL DE ACCESO & ESTADO
  // =========================================================================
  checkAuthenticationState() {
    const authScreen = document.getElementById('auth-screen');
    const mainApp = document.getElementById('main-app');

    if (!auth.isAuthenticated()) {
      if (authScreen) authScreen.style.display = 'flex';
      if (mainApp) mainApp.style.display = 'none';
    } else {
      if (authScreen) authScreen.style.display = 'none';
      if (mainApp) mainApp.style.display = 'flex';
      this.updateHeaderUser();
      this.updateHeaderWorkspace();
      this.updateHeaderBadgeCounts();
      this.setupAdminNavVisibility();

      // Sincronizar datos en vivo desde MySQL
      const user = auth.getCurrentUser();
      if (user) {
        const ws = auth.getCurrentWorkspace();
        const isImpersonating = !!(auth.session && auth.session.impersonatedWorkspaceId);
        const wsId = (isImpersonating && auth.session.impersonatedWorkspaceId) ? auth.session.impersonatedWorkspaceId : (ws ? ws.id : null);
        store.syncWithBackend(user.role, wsId);
      }
    }
  }

  setupAdminNavVisibility() {
    const user = auth.getCurrentUser();
    const isImpersonating = !!(auth.session && auth.session.impersonatedWorkspaceId);
    const isDedicatedAdmin = user && user.role === 'admin' && !isImpersonating;

    const entrepreneurSection = document.getElementById('sidebar-section-entrepreneur');
    const adminSection = document.getElementById('sidebar-section-admin');
    const mobileBottomNav = document.querySelector('.mobile-bottom-nav');
    const btnQuickAction = document.getElementById('btn-topbar-quick-action');
    const btnRequestSupport = document.getElementById('btn-topbar-request-support');
    const auditBanner = document.getElementById('admin-audit-banner');
    const auditWsName = document.getElementById('admin-audit-ws-name');

    if (isDedicatedAdmin) {
      // Vista exclusiva para Administrador Humm
      if (entrepreneurSection) entrepreneurSection.style.display = 'none';
      if (adminSection) adminSection.style.display = 'block';
      if (mobileBottomNav) mobileBottomNav.style.display = 'none';
      if (btnQuickAction) btnQuickAction.style.display = 'none';
      if (btnRequestSupport) btnRequestSupport.style.display = 'none';
      if (auditBanner) auditBanner.style.display = 'none';
    } else {
      // Vista de Emprendedor (o Admin en modo auditoría)
      if (entrepreneurSection) entrepreneurSection.style.display = 'block';
      if (adminSection) adminSection.style.display = 'none';
      if (mobileBottomNav) mobileBottomNav.style.display = 'block';
      if (btnQuickAction) btnQuickAction.style.display = 'inline-flex';
      if (btnRequestSupport) btnRequestSupport.style.display = 'inline-flex';

      if (isImpersonating) {
        const ws = auth.getCurrentWorkspace();
        if (auditBanner) auditBanner.style.display = 'flex';
        if (auditWsName) auditWsName.textContent = ws ? ws.name : 'Emprendimiento';
      } else {
        if (auditBanner) auditBanner.style.display = 'none';
      }
    }
  }

  updateHeaderUser() {
    const user = auth.getCurrentUser();
    if (!user) return;

    const isImpersonating = !!(auth.session && auth.session.impersonatedWorkspaceId);
    const isDedicatedAdmin = user.role === 'admin' && !isImpersonating;
    const firstName = user.name.split(' ')[0] || 'Emprendedor';

    const greetingEl = document.getElementById('topbar-greeting-text');
    if (greetingEl) {
      if (isDedicatedAdmin) {
        greetingEl.innerHTML = `Hola, ${firstName}. <span style="font-weight: 500; font-size: var(--font-size-sm); color: var(--text-secondary); margin-left: 4px;">Panel Central de Administración Humm</span>`;
      } else {
        greetingEl.innerHTML = `Hola, ${firstName}. <span style="font-weight: 500; font-size: var(--font-size-sm); color: var(--text-secondary); margin-left: 4px;">Estas son las prioridades de tu emprendimiento.</span>`;
      }
    }

    const dateEl = document.getElementById('topbar-date-text');
    if (dateEl) {
      const now = new Date();
      const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
      dateEl.textContent = now.toLocaleDateString('es-CL', options).replace(/^\w/, c => c.toUpperCase());
    }

    const userNameEl = document.getElementById('sidebar-user-name');
    if (userNameEl) userNameEl.textContent = user.name;

    const userAvatarEl = document.getElementById('sidebar-user-avatar');
    if (userAvatarEl) userAvatarEl.textContent = user.avatar || (user.role === 'admin' ? '🛡️' : 'H');
  }

  updateHeaderWorkspace() {
    const user = auth.getCurrentUser();
    const ws = auth.getCurrentWorkspace();
    const isImpersonating = !!(auth.session && auth.session.impersonatedWorkspaceId);
    const isDedicatedAdmin = user && user.role === 'admin' && !isImpersonating;

    const wsEl = document.getElementById('topbar-workspace-name');
    const wsSidebarEl = document.getElementById('sidebar-workspace-name');

    if (isDedicatedAdmin) {
      if (wsEl) wsEl.textContent = 'Administración Humm';
      if (wsSidebarEl) wsSidebarEl.textContent = 'Administrador General';
    } else if (ws) {
      if (wsEl) wsEl.textContent = ws.name;
      if (wsSidebarEl) wsSidebarEl.textContent = ws.name;
    }
  }

  updateHeaderBadgeCounts() {
    const ws = auth.getCurrentWorkspace();
    if (!ws) return;

    const tasks = store.getTasks(ws.id);
    const todoCount = tasks.filter(t => t.status !== 'done').length;
    const taskBadge = document.getElementById('badge-count-tasks');
    if (taskBadge) taskBadge.textContent = todoCount > 0 ? todoCount : '';

    const events = store.getEvents(ws.id);
    const eventsBadge = document.getElementById('badge-count-events');
    if (eventsBadge) eventsBadge.textContent = events.length > 0 ? events.length : '';

    const notes = store.getNotes(ws.id);
    const notesBadge = document.getElementById('badge-count-notes');
    if (notesBadge) notesBadge.textContent = notes.length > 0 ? notes.length : '';

    const opps = store.getOpportunities(ws.id);
    const openOpps = opps.filter(o => o.status !== 'ganada' && o.status !== 'no_concretado').length;
    const oppsBadge = document.getElementById('badge-count-opps');
    if (oppsBadge) oppsBadge.textContent = openOpps > 0 ? openOpps : '';
  }

  // =========================================================================
  // ENRUTADOR (ROUTER)
  // =========================================================================
  handleHashChange() {
    if (window.location.hash.startsWith('#cambiar-clave')) {
      const parts = window.location.hash.split('?');
      if (parts.length > 1) {
        const urlParams = new URLSearchParams(parts[1]);
        const emailParam = urlParams.get('email') || '';
        const emailInput = document.getElementById('reset-pass-email');
        if (emailInput && emailParam) emailInput.value = emailParam;
      }
      this.openModal('modal-reset-password');
      return;
    }

    if (!auth.isAuthenticated()) return;

    const user = auth.getCurrentUser();
    const isImpersonating = !!(auth.session && auth.session.impersonatedWorkspaceId);
    const isDedicatedAdmin = user && user.role === 'admin' && !isImpersonating;

    let hash = window.location.hash.replace('#', '');

    const adminViews = ['admin-dashboard', 'admin-users', 'admin-subscriptions', 'admin-sales', 'admin-alerts', 'admin-requests', 'admin-members', 'admin-customers', 'admin-advisors', 'admin-broadcasts', 'admin-discounts', 'admin-benefit-requests', 'admin-tools', 'admin'];
    const entrepreneurViews = ['inicio', 'tareas', 'calendario', 'notas', 'ventas', 'clientes', 'oportunidades', 'herramientas', 'beneficios', 'cuenta'];

    if (isDedicatedAdmin) {
      if (!adminViews.includes(hash)) {
        window.location.hash = '#admin-dashboard';
        return;
      }
      if (hash === 'admin') {
        hash = 'admin-dashboard';
      }
    } else {
      if (!entrepreneurViews.includes(hash)) {
        window.location.hash = '#inicio';
        return;
      }
    }

    this.setupAdminNavVisibility();
    this.updateHeaderUser();
    this.updateHeaderWorkspace();

    // Sincronizar datos en background con MySQL
    const currentWs = auth.getCurrentWorkspace();
    const wsId = (isImpersonating && auth.session.impersonatedWorkspaceId) ? auth.session.impersonatedWorkspaceId : (currentWs ? currentWs.id : null);
    store.syncWithBackend(user.role, wsId);

    this.navigate(hash || (isDedicatedAdmin ? 'admin-dashboard' : 'inicio'));
  }

  navigate(viewName) {
    this.currentView = viewName;

    // Actualizar enlaces activos en Sidebar
    document.querySelectorAll('.nav-item-btn').forEach(btn => {
      const btnView = btn.getAttribute('data-view');
      const isActive = btnView === viewName || (viewName === 'admin' && btnView === 'admin-dashboard');
      btn.classList.toggle('active', isActive);
    });

    // Actualizar barra móvil
    document.querySelectorAll('.mobile-nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-view') === viewName);
    });

    // Renderizar contenedor
    const container = document.getElementById('view-mount-point');
    if (!container) return;

    // Scroll to top
    window.scrollTo(0, 0);

    if (viewName.startsWith('admin')) {
      renderAdminView(container, viewName);
    } else {
      switch (viewName) {
        case 'inicio':
          renderDashboard(container);
          break;
        case 'tareas':
          renderTasksView(container);
          break;
        case 'calendario':
          renderCalendarView(container);
          break;
        case 'notas':
          renderNotesView(container);
          break;
        case 'ventas':
          renderSalesView(container);
          break;
        case 'clientes':
          renderCustomersView(container);
          break;
        case 'oportunidades':
          renderOpportunitiesView(container);
          break;
        case 'herramientas':
          renderToolsView(container);
          break;
        case 'beneficios':
          renderDiscountsView(container);
          break;
        case 'cuenta':
          renderAccountView(container);
          break;
        default:
          renderDashboard(container);
          break;
      }
    }

    // Cerrar drawer móvil si está abierto
    this.closeMobileDrawer();
  }

  refreshCurrentView() {
    this.navigate(this.currentView);
  }

  // =========================================================================
  // MODALES & FORMULARIOS
  // =========================================================================
  setupModals() {
    // Cerrar modales con botones .modal-close-btn o fondo
    document.querySelectorAll('.modal-close-btn, .modal-cancel-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.closeAllModals();
      });
    });

    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          this.closeAllModals();
        }
      });
    });

    // ESC para cerrar modales
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });

    // Submit de Nueva Tarea
    const formTask = document.getElementById('form-modal-task');
    if (formTask) {
      formTask.addEventListener('submit', (e) => {
        e.preventDefault();
        const ws = auth.getCurrentWorkspace();
        if (!ws) return;

        const editId = formTask.getAttribute('data-edit-id');
        const title = document.getElementById('modal-task-title').value.trim();
        const description = document.getElementById('modal-task-desc').value.trim();
        const status = document.getElementById('modal-task-status').value;
        const priority = document.getElementById('modal-task-priority').value;
        const startDate = document.getElementById('modal-task-start-date').value || null;
        const dueDate = document.getElementById('modal-task-due-date').value || null;
        const tag = document.getElementById('modal-task-tag').value.trim();
        const customerId = document.getElementById('modal-task-customer').value || null;
        const opportunityId = document.getElementById('modal-task-opp').value || null;

        if (editId) {
          store.updateTask(editId, { title, description, status, priority, startDate, dueDate, tag, customerId, opportunityId });
          this.showToast('Tarea actualizada correctamente', 'success');
        } else {
          store.createTask(ws.id, { title, description, status, priority, startDate, dueDate, tag, customerId, opportunityId });
          this.showToast('Nueva tarea agregada a tu tablero', 'success');
        }

        this.closeAllModals();
        this.refreshCurrentView();
      });
    }

    // Submit de Registrar Venta (con fecha, cliente y seguimiento de pago)
    const formSale = document.getElementById('form-modal-sale');
    if (formSale) {
      formSale.addEventListener('submit', (e) => {
        e.preventDefault();
        const ws = auth.getCurrentWorkspace();
        if (!ws) return;

        const editId = formSale.getAttribute('data-edit-id');
        const date = document.getElementById('modal-sale-date').value || new Date().toISOString().split('T')[0];
        const customerId = document.getElementById('modal-sale-customer').value || null;
        const amountStr = document.getElementById('modal-sale-amount').value.replace(/[^0-9]/g, '');
        const amount = parseInt(amountStr, 10) || 0;
        const paymentStatus = document.getElementById('modal-sale-payment-status').value || 'pagado';
        const dueDate = document.getElementById('modal-sale-due-date') ? document.getElementById('modal-sale-due-date').value || null : null;
        const notes = document.getElementById('modal-sale-notes').value.trim();

        store.saveMonthlySale(ws.id, {
          id: editId || undefined,
          date,
          customerId,
          amount,
          paymentStatus,
          dueDate,
          notes
        });

        this.showToast(editId ? 'Venta actualizada correctamente' : 'Venta registrada con éxito', 'success');
        this.closeAllModals();
        this.refreshCurrentView();
      });

      // Formateador en tiempo real de miles para input monto
      const amountInput = document.getElementById('modal-sale-amount');
      if (amountInput) {
        amountInput.addEventListener('input', (e) => {
          let val = e.target.value.replace(/[^0-9]/g, '');
          if (val) {
            e.target.value = parseInt(val, 10).toLocaleString('es-CL');
          }
        });
      }
    }

    // Botón rápido: Crear nuevo cliente desde el modal de venta
    const btnQuickClient = document.getElementById('btn-quick-new-client-from-sale');
    if (btnQuickClient) {
      btnQuickClient.addEventListener('click', (e) => {
        e.preventDefault();
        const formSale = document.getElementById('form-modal-sale');
        this.saleDraft = {
          editId: formSale ? formSale.getAttribute('data-edit-id') : null,
          date: document.getElementById('modal-sale-date') ? document.getElementById('modal-sale-date').value : '',
          amount: document.getElementById('modal-sale-amount') ? document.getElementById('modal-sale-amount').value : '',
          paymentStatus: document.getElementById('modal-sale-payment-status') ? document.getElementById('modal-sale-payment-status').value : 'pagado',
          dueDate: document.getElementById('modal-sale-due-date') ? document.getElementById('modal-sale-due-date').value : '',
          notes: document.getElementById('modal-sale-notes') ? document.getElementById('modal-sale-notes').value : ''
        };
        this.returnToSaleAfterCustomerCreate = true;
        this.openCreateCustomerModal();
      });
    }

    // Cambio dinámico de comunas según región seleccionada en Modal de Cliente
    const custRegionSelect = document.getElementById('modal-cust-region');
    const custComunaSelect = document.getElementById('modal-cust-comuna');
    if (custRegionSelect && custComunaSelect) {
      custRegionSelect.addEventListener('change', () => {
        populateComunasSelect(custRegionSelect, custComunaSelect);
      });
    }

    // Submit de Cliente
    const formCust = document.getElementById('form-modal-customer');
    if (formCust) {
      formCust.addEventListener('submit', (e) => {
        e.preventDefault();
        const ws = auth.getCurrentWorkspace();
        if (!ws) return;

        const editId = formCust.getAttribute('data-edit-id');
        const firstName = document.getElementById('modal-cust-name').value.trim();
        const lastName = document.getElementById('modal-cust-lastname').value.trim();
        const rut = document.getElementById('modal-cust-rut') ? document.getElementById('modal-cust-rut').value.trim() : '';
        const company = document.getElementById('modal-cust-company').value.trim();
        const phone = document.getElementById('modal-cust-phone').value.trim();
        const email = document.getElementById('modal-cust-email').value.trim();
        const region = document.getElementById('modal-cust-region') ? document.getElementById('modal-cust-region').value : '';
        const comuna = document.getElementById('modal-cust-comuna') ? document.getElementById('modal-cust-comuna').value : '';
        const city = document.getElementById('modal-cust-city').value.trim();
        const address = document.getElementById('modal-cust-address') ? document.getElementById('modal-cust-address').value.trim() : '';
        const sourceChannel = document.getElementById('modal-cust-channel').value;
        const status = document.getElementById('modal-cust-status').value;
        const notes = document.getElementById('modal-cust-notes').value.trim();

        if (editId) {
          store.updateCustomer(editId, { firstName, lastName, rut, company, phone, email, region, comuna, city, address, sourceChannel, status, notes });
          this.showToast('Cliente actualizado correctamente', 'success');
          this.closeAllModals();
          this.refreshCurrentView();
        } else {
          const newCust = store.createCustomer(ws.id, { firstName, lastName, rut, company, phone, email, region, comuna, city, address, sourceChannel, status, notes });
          
          // Si venía desde el modal de ventas, retornar directamente a la venta con el cliente seleccionado
          if (this.returnToSaleAfterCustomerCreate) {
            this.returnToSaleAfterCustomerCreate = false;
            this.showToast(`Cliente "${firstName}" registrado y seleccionado en tu venta`, 'success');
            
            this.populateSaleModalSelects(newCust.id);
            const formSale = document.getElementById('form-modal-sale');
            if (formSale && this.saleDraft) {
              if (this.saleDraft.editId) {
                formSale.setAttribute('data-edit-id', this.saleDraft.editId);
                document.getElementById('modal-sale-header-title').textContent = 'Editar Venta';
              } else {
                formSale.removeAttribute('data-edit-id');
                document.getElementById('modal-sale-header-title').textContent = 'Registrar Venta';
              }
              if (document.getElementById('modal-sale-date')) document.getElementById('modal-sale-date').value = this.saleDraft.date || new Date().toISOString().split('T')[0];
              if (document.getElementById('modal-sale-amount')) document.getElementById('modal-sale-amount').value = this.saleDraft.amount || '';
              if (document.getElementById('modal-sale-payment-status')) document.getElementById('modal-sale-payment-status').value = this.saleDraft.paymentStatus || 'pagado';
              if (document.getElementById('modal-sale-due-date')) document.getElementById('modal-sale-due-date').value = this.saleDraft.dueDate || '';
              if (document.getElementById('modal-sale-notes')) document.getElementById('modal-sale-notes').value = this.saleDraft.notes || '';
            }
            if (document.getElementById('modal-sale-customer')) {
              document.getElementById('modal-sale-customer').value = newCust.id;
            }
            this.openModal('modal-sale');
            this.refreshCurrentView();
            return;
          }

          // Si venía desde el modal de eventos, retornar directamente al evento con el cliente seleccionado
          if (this.returnToEventAfterCustomerCreate) {
            this.returnToEventAfterCustomerCreate = false;
            this.showToast(`Cliente "${firstName}" registrado y vinculado a tu compromiso`, 'success');

            this.populateEventModalSelects(newCust.id);
            const formEvt = document.getElementById('form-modal-event');
            if (formEvt && this.eventDraft) {
              if (this.eventDraft.editId) {
                formEvt.setAttribute('data-edit-id', this.eventDraft.editId);
                document.getElementById('modal-event-header-title').textContent = 'Editar Compromiso';
              } else {
                formEvt.removeAttribute('data-edit-id');
                document.getElementById('modal-event-header-title').textContent = 'Agendar Reunión o Evento';
              }
              if (document.getElementById('modal-event-title')) document.getElementById('modal-event-title').value = this.eventDraft.title || '';
              if (document.getElementById('modal-event-type')) document.getElementById('modal-event-type').value = this.eventDraft.type || 'reunion';
              if (document.getElementById('modal-event-date')) document.getElementById('modal-event-date').value = this.eventDraft.date || new Date().toISOString().split('T')[0];
              if (document.getElementById('modal-event-start-time')) document.getElementById('modal-event-start-time').value = this.eventDraft.startTime || '10:00';
              if (document.getElementById('modal-event-end-time')) document.getElementById('modal-event-end-time').value = this.eventDraft.endTime || '11:00';
              if (document.getElementById('modal-event-location')) document.getElementById('modal-event-location').value = this.eventDraft.location || '';
              if (document.getElementById('modal-event-meet-url')) document.getElementById('modal-event-meet-url').value = this.eventDraft.meetUrl || '';
              if (document.getElementById('modal-event-desc')) document.getElementById('modal-event-desc').value = this.eventDraft.description || '';
            }
            if (document.getElementById('modal-event-customer')) {
              document.getElementById('modal-event-customer').value = newCust.id;
            }
            this.openModal('modal-event');
            this.refreshCurrentView();
            return;
          }

          this.showToast('Cliente registrado con éxito', 'success');
          this.closeAllModals();
          this.refreshCurrentView();
        }
      });
    }

    // Submit de Evento / Compromiso de Calendario
    const formEvent = document.getElementById('form-modal-event');
    if (formEvent) {
      formEvent.addEventListener('submit', (e) => {
        e.preventDefault();
        const ws = auth.getCurrentWorkspace();
        if (!ws) return;

        const editId = formEvent.getAttribute('data-edit-id');
        const title = document.getElementById('modal-event-title').value.trim();
        const type = document.getElementById('modal-event-type').value;
        const customerId = document.getElementById('modal-event-customer').value || null;
        const date = document.getElementById('modal-event-date').value;
        const startTime = document.getElementById('modal-event-start-time').value;
        const endTime = document.getElementById('modal-event-end-time').value;
        const location = document.getElementById('modal-event-location').value.trim();
        const meetUrl = document.getElementById('modal-event-meet-url').value.trim();
        const description = document.getElementById('modal-event-desc').value.trim();

        store.saveEvent(ws.id, {
          id: editId || undefined,
          title,
          type,
          customerId,
          date,
          startTime,
          endTime,
          location,
          meetUrl,
          description
        });

        this.showToast(editId ? 'Compromiso actualizado con éxito' : 'Compromiso agendado en tu calendario', 'success');
        this.closeAllModals();
        this.refreshCurrentView();
      });

      // Botón rápido: Crear nuevo cliente desde el modal de evento
      const btnQuickClientEvent = document.getElementById('btn-quick-new-client-from-event');
      if (btnQuickClientEvent) {
        btnQuickClientEvent.addEventListener('click', (e) => {
          e.preventDefault();
          this.eventDraft = {
            editId: formEvent ? formEvent.getAttribute('data-edit-id') : null,
            title: document.getElementById('modal-event-title') ? document.getElementById('modal-event-title').value : '',
            type: document.getElementById('modal-event-type') ? document.getElementById('modal-event-type').value : 'reunion',
            date: document.getElementById('modal-event-date') ? document.getElementById('modal-event-date').value : '',
            startTime: document.getElementById('modal-event-start-time') ? document.getElementById('modal-event-start-time').value : '10:00',
            endTime: document.getElementById('modal-event-end-time') ? document.getElementById('modal-event-end-time').value : '11:00',
            location: document.getElementById('modal-event-location') ? document.getElementById('modal-event-location').value : '',
            meetUrl: document.getElementById('modal-event-meet-url') ? document.getElementById('modal-event-meet-url').value : '',
            description: document.getElementById('modal-event-desc') ? document.getElementById('modal-event-desc').value : ''
          };
          this.returnToEventAfterCustomerCreate = true;
          this.openCreateCustomerModal();
        });
      // Conmutador entre Evento y Tarea desde el modal de agendar
      document.querySelectorAll('input[name="modal-event-kind"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
          if (e.target.value === 'task') {
            const title = document.getElementById('modal-event-title') ? document.getElementById('modal-event-title').value.trim() : '';
            const targetDate = document.getElementById('modal-event-date') ? document.getElementById('modal-event-date').value : '';
            const customerId = document.getElementById('modal-event-customer') ? document.getElementById('modal-event-customer').value : null;
            const description = document.getElementById('modal-event-desc') ? document.getElementById('modal-event-desc').value.trim() : '';
            
            // Reestablecer radio a "event" para próximas aperturas
            const evtRadio = document.querySelector('input[name="modal-event-kind"][value="event"]');
            if (evtRadio) evtRadio.checked = true;

            this.closeAllModals();
            this.openCreateTaskModal(targetDate, 'todo', {
              title,
              description,
              customerId,
              dueDate: targetDate
            });
          }
        });
      });
    }

    // Submit de Nota Rápida (Bloc de Notas)
    const formNote = document.getElementById('form-modal-note');
    if (formNote) {
      formNote.addEventListener('submit', (e) => {
        e.preventDefault();
        const ws = auth.getCurrentWorkspace();
        if (!ws) return;

        const editId = formNote.getAttribute('data-edit-id');
        const title = document.getElementById('modal-note-title').value.trim();
        const category = document.getElementById('modal-note-category').value;
        const color = document.getElementById('modal-note-color').value;
        const content = document.getElementById('modal-note-content').value.trim();
        const pinned = document.getElementById('modal-note-pinned').checked;

        store.saveNote(ws.id, {
          id: editId || undefined,
          title,
          category,
          color,
          content,
          pinned
        });

        this.showToast(editId ? 'Nota actualizada con éxito' : 'Nueva nota guardada', 'success');
        this.closeAllModals();
        this.refreshCurrentView();
      });
    }

    // Submit de Oportunidad
    const formOpp = document.getElementById('form-modal-opp');
    if (formOpp) {
      formOpp.addEventListener('submit', (e) => {
        e.preventDefault();
        const ws = auth.getCurrentWorkspace();
        if (!ws) return;

        const editId = formOpp.getAttribute('data-edit-id');
        const title = document.getElementById('modal-opp-title').value.trim();
        const contactName = document.getElementById('modal-opp-contact').value.trim();
        const phone = document.getElementById('modal-opp-phone').value.trim();
        const email = document.getElementById('modal-opp-email').value.trim();
        const productInterest = document.getElementById('modal-opp-product').value.trim();
        const amountStr = document.getElementById('modal-opp-amount').value.replace(/[^0-9]/g, '');
        const estimatedAmount = amountStr ? parseInt(amountStr, 10) : 0;
        const status = document.getElementById('modal-opp-status').value;
        const nextAction = document.getElementById('modal-opp-next-action').value.trim();
        const followUpDate = document.getElementById('modal-opp-date').value || null;
        const sourceChannel = document.getElementById('modal-opp-channel').value;
        const notes = document.getElementById('modal-opp-notes').value.trim();

        if (editId) {
          store.updateOpportunity(editId, { title, contactName, phone, email, productInterest, estimatedAmount, status, nextAction, followUpDate, sourceChannel, notes });
          this.showToast('Oportunidad actualizada', 'success');
        } else {
          store.createOpportunity(ws.id, { title, contactName, phone, email, productInterest, estimatedAmount, status, nextAction, followUpDate, sourceChannel, notes });
          this.showToast('Oportunidad registrada para seguimiento', 'success');
        }

        this.closeAllModals();
        this.refreshCurrentView();
      });

      const oppAmountInput = document.getElementById('modal-opp-amount');
      if (oppAmountInput) {
        oppAmountInput.addEventListener('input', (e) => {
          let val = e.target.value.replace(/[^0-9]/g, '');
          if (val) {
            e.target.value = parseInt(val, 10).toLocaleString('es-CL');
          }
        });
      }
    }

    // Submit de Solicitud de Apoyo / Requerimiento del Emprendedor a Humm
    const formReqSupport = document.getElementById('form-request-support');
    if (formReqSupport) {
      formReqSupport.addEventListener('submit', (e) => {
        e.preventDefault();
        const ws = auth.getCurrentWorkspace();
        const user = auth.getCurrentUser();
        if (!ws || !user) return;

        const requestType = document.getElementById('req-type').value;
        const subject = document.getElementById('req-subject').value.trim();
        const description = document.getElementById('req-description').value.trim();
        const contactPreference = document.getElementById('req-contact-pref').value;

        const advisorName = ws.advisorName || 'Equipo de Apoyo Humm';
        const advisorEmail = ws.advisorEmail || 'contacto@humm.cl';

        store.createSupportRequest(ws.id, {
          userName: user.name,
          userEmail: user.email,
          requestType,
          subject,
          description,
          contactPreference
        });

        this.showToast(`¡Requerimiento enviado con éxito! Se ha notificado a ${advisorName} (${advisorEmail}) y contacto@humm.cl`, 'success', 'Solicitud Recibida');
        formReqSupport.reset();
        this.closeAllModals();
        this.refreshCurrentView();
      });
    }

    // Submit de Admin - Crear Workspace
    const formAdminWs = document.getElementById('form-admin-create-ws');
    if (formAdminWs) {
      // Cambio interactivo de tutor asignado
      const wsAdvisorSelect = document.getElementById('admin-ws-advisor-select');
      const wsAdvisorName = document.getElementById('admin-ws-advisor-name');
      const wsAdvisorEmail = document.getElementById('admin-ws-advisor-email');
      const wsCustomRow = document.getElementById('admin-ws-advisor-custom-row');

      if (wsAdvisorSelect) {
        wsAdvisorSelect.addEventListener('change', () => {
          const val = wsAdvisorSelect.value;
          if (val === 'custom') {
            if (wsCustomRow) wsCustomRow.style.display = 'flex';
            if (wsAdvisorName) {
              wsAdvisorName.value = '';
              wsAdvisorName.focus();
            }
            if (wsAdvisorEmail) wsAdvisorEmail.value = '';
          } else if (val && val.includes('|')) {
            const [name, email] = val.split('|');
            if (wsAdvisorName) wsAdvisorName.value = name;
            if (wsAdvisorEmail) wsAdvisorEmail.value = email;
            if (wsCustomRow) wsCustomRow.style.display = 'none';
          } else {
            if (wsAdvisorName) wsAdvisorName.value = '';
            if (wsAdvisorEmail) wsAdvisorEmail.value = '';
            if (wsCustomRow) wsCustomRow.style.display = 'none';
          }
        });
      }

      formAdminWs.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('admin-ws-name').value.trim();
        const rut = document.getElementById('admin-ws-rut')?.value.trim() || '';
        const ownerFirstName = document.getElementById('admin-ws-owner-name')?.value.trim() || '';
        const ownerLastName = document.getElementById('admin-ws-owner-lastname')?.value.trim() || '';
        const email = document.getElementById('admin-ws-email').value.trim();
        const phone = document.getElementById('admin-ws-phone').value.trim();
        const region = document.getElementById('admin-ws-region')?.value || '';
        const comuna = document.getElementById('admin-ws-comuna')?.value.trim() || '';
        const locality = document.getElementById('admin-ws-locality')?.value.trim() || '';
        const address = document.getElementById('admin-ws-address')?.value.trim() || '';
        const industry = document.getElementById('admin-ws-industry').value.trim();
        const advisorName = document.getElementById('admin-ws-advisor-name')?.value.trim() || null;
        const advisorEmail = document.getElementById('admin-ws-advisor-email')?.value.trim() || null;
        const description = document.getElementById('admin-ws-desc').value.trim();

        store.createWorkspace({
          name,
          rut,
          ownerFirstName,
          ownerLastName,
          email,
          phone,
          region,
          comuna,
          locality,
          address,
          industry,
          advisorName,
          advisorEmail,
          description
        });

        this.showToast(`Emprendimiento "${name}" creado exitosamente`, 'success');
        formAdminWs.reset();
        const comunaSelect = document.getElementById('admin-ws-comuna');
        if (comunaSelect) {
          comunaSelect.innerHTML = '<option value="">Primero selecciona una región...</option>';
          comunaSelect.disabled = true;
        }
        this.closeAllModals();
        this.refreshCurrentView();
      });

      // Cambio dinámico de comunas según región seleccionada
      const regionSelect = document.getElementById('admin-ws-region');
      const comunaSelect = document.getElementById('admin-ws-comuna');
      if (regionSelect && comunaSelect) {
        regionSelect.addEventListener('change', () => {
          populateComunasSelect(regionSelect, comunaSelect);
        });
      }
    }

    // Submit de Admin - Asignar Tutor / Ejecutivo a Usuario o Workspace
    const formAdminAdvisor = document.getElementById('form-admin-edit-advisor');
    if (formAdminAdvisor) {
      formAdminAdvisor.addEventListener('submit', (e) => {
        e.preventDefault();
        const targetSelect = document.getElementById('edit-advisor-target-user');
        const advisorSelect = document.getElementById('edit-advisor-select');
        const nameInput = document.getElementById('edit-advisor-name');
        const emailInput = document.getElementById('edit-advisor-email');

        let advisorName = '';
        let advisorEmail = '';

        if (advisorSelect && advisorSelect.value === 'custom') {
          advisorName = nameInput ? nameInput.value.trim() : '';
          advisorEmail = emailInput ? emailInput.value.trim() : '';
        } else if (advisorSelect) {
          const parts = advisorSelect.value.split('|');
          advisorName = parts[0];
          advisorEmail = parts[1];
        } else {
          advisorName = nameInput ? nameInput.value.trim() : '';
          advisorEmail = emailInput ? emailInput.value.trim() : '';
        }

        if (!advisorName || !advisorEmail) {
          this.showToast('Por favor completa el nombre y correo del tutor', 'danger');
          return;
        }

        const selectedTarget = targetSelect ? targetSelect.value : '';
        if (selectedTarget.startsWith('user:')) {
          const uId = selectedTarget.replace('user:', '');
          store.assignAdvisorToUserOrWorkspace({ userId: uId, advisorName, advisorEmail });
          const u = store.getUser(uId);
          this.showToast(`Tutor "${advisorName}" asignado a ${u ? u.name : 'usuario'}`, 'success');
        } else if (selectedTarget.startsWith('ws:')) {
          const wId = selectedTarget.replace('ws:', '');
          store.assignAdvisorToUserOrWorkspace({ workspaceId: wId, advisorName, advisorEmail });
          const w = store.getWorkspace(wId);
          this.showToast(`Tutor "${advisorName}" asignado a ${w ? w.name : 'emprendimiento'}`, 'success');
        } else {
          const wsId = formAdminAdvisor.getAttribute('data-ws-id');
          if (wsId) {
            store.assignAdvisorToUserOrWorkspace({ workspaceId: wsId, advisorName, advisorEmail });
            this.showToast(`Tutor "${advisorName}" asignado correctamente`, 'success');
          }
        }

        this.closeAllModals();
        this.refreshCurrentView();
      });
    }

    // Submit de Admin - Crear / Editar Usuario & Asignar Herramientas
    const formAdminUser = document.getElementById('form-admin-create-user');
    if (formAdminUser) {
      formAdminUser.addEventListener('submit', (e) => {
        e.preventDefault();
        const editId = formAdminUser.getAttribute('data-edit-id');
        const name = document.getElementById('admin-user-name').value.trim();
        const email = document.getElementById('admin-user-email').value.trim();
        const password = document.getElementById('admin-user-password').value.trim();
        const role = document.getElementById('admin-user-role').value;
        const workspaceId = document.getElementById('admin-user-workspace').value || null;
        const isActive = document.getElementById('admin-user-is-active') ? document.getElementById('admin-user-is-active').checked : true;

        // Recolectar herramientas seleccionadas
        const toolCheckboxes = document.querySelectorAll('.user-tool-checkbox');
        const assignedToolIds = Array.from(toolCheckboxes).filter(cb => cb.checked).map(cb => cb.value);

        const submitBtn = document.getElementById('btn-save-admin-user');
        if (submitBtn) submitBtn.disabled = true;

        if (editId) {
          const updates = { name, email, role, workspaceId, isActive, assignedToolIds };
          if (password) updates.password = password;
          store.updateUser(editId, updates);
          this.showToast(`Usuario "${name}" actualizado con éxito`, 'success');
          if (submitBtn) submitBtn.disabled = false;
          this.closeAllModals();
          this.refreshCurrentView();
        } else {
          const sendWelcome = document.getElementById('admin-user-send-welcome') ? document.getElementById('admin-user-send-welcome').checked : true;
          const mustChangePass = document.getElementById('admin-user-must-change-pass') ? document.getElementById('admin-user-must-change-pass').checked : true;
          const initialPass = password || 'humm2026';

          store.createUser({
            name,
            email,
            password: initialPass,
            role,
            workspaceId,
            isActive,
            assignedToolIds,
            mustChangePassword: mustChangePass
          });

          this.showToast(`Usuario "${name}" creado con éxito`, 'success');

          // Despacho de correo de bienvenida real vía PHP mail
          if (sendWelcome) {
            fetch('api/mail.php', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'welcome',
                email,
                name,
                password: initialPass,
                loginUrl: window.location.origin
              })
            }).catch(err => console.warn('Welcome email dispatch notice:', err));
          }

          // Poblado del modal de confirmación y bienvenida
          const emailTarget = document.getElementById('created-user-email-target');
          const nameDisplay = document.getElementById('created-user-name-display');
          const emailDisplay = document.getElementById('created-user-email-display');
          const passDisplay = document.getElementById('created-user-pass-display');
          const btnCopy = document.getElementById('btn-copy-user-credentials');
          const btnWhatsapp = document.getElementById('btn-whatsapp-user-credentials');

          if (emailTarget) emailTarget.textContent = email;
          if (nameDisplay) nameDisplay.textContent = name;
          if (emailDisplay) emailDisplay.textContent = email;
          if (passDisplay) passDisplay.textContent = initialPass;

          if (btnCopy) {
            btnCopy.onclick = () => {
              const credText = `🎉 ¡Bienvenido/a a la Comunidad Humm!\n\nTu cuenta ha sido creada exitosamente:\n🔗 Plataforma: https://comunidad.humm.cl\n👤 Usuario: ${email}\n🔑 Contraseña inicial: ${initialPass}\n\nPuedes cambiar tu clave ingresando a Mi Cuenta o a través del enlace de tu correo de bienvenida.`;
              navigator.clipboard.writeText(credText).then(() => {
                this.showToast('Datos de acceso copiados al portapapeles', 'success');
              });
            };
          }

          if (btnWhatsapp) {
            const ws = workspaceId ? store.getWorkspace(workspaceId) : null;
            const phone = ws && ws.phone ? ws.phone.replace(/[^0-9]/g, '') : '';
            const waText = encodeURIComponent(`Hola ${name}! Te damos la bienvenida a la Comunidad Humm Co-Creation.\n\nYa tienes acceso a tu plataforma:\n🔗 https://comunidad.humm.cl\n👤 Usuario: ${email}\n🔑 Contraseña: ${initialPass}`);
            btnWhatsapp.href = phone ? `https://wa.me/${phone}?text=${waText}` : `https://wa.me/?text=${waText}`;
          }

          if (submitBtn) submitBtn.disabled = false;
          this.closeAllModals();
          this.refreshCurrentView();
          this.openModal('modal-user-created-success');
        }
      });

      // Botones rápidos: marcar / desmarcar todas las herramientas
      document.getElementById('btn-select-all-user-tools')?.addEventListener('click', () => {
        document.querySelectorAll('.user-tool-checkbox').forEach(cb => cb.checked = true);
      });
      document.getElementById('btn-unselect-all-user-tools')?.addEventListener('click', () => {
        document.querySelectorAll('.user-tool-checkbox').forEach(cb => cb.checked = false);
      });
    }

    // Submit de Admin - Herramienta
    const formAdminTool = document.getElementById('form-admin-tool-edit');
    if (formAdminTool) {
      const fileToolLogo = document.getElementById('admin-tool-logo-file');
      const previewToolLogo = document.getElementById('admin-tool-logo-preview');
      const hiddenToolLogoData = document.getElementById('admin-tool-logo-data');
      const btnClearToolLogo = document.getElementById('btn-clear-tool-logo');
      const iconToolInput = document.getElementById('admin-tool-icon');

      if (fileToolLogo) {
        fileToolLogo.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (!file) return;

          if (file.size > 3 * 1024 * 1024) {
            this.showToast('La imagen supera los 3MB. Por favor selecciona una imagen más liviana.', 'warning');
            return;
          }

          const reader = new FileReader();
          reader.onload = (event) => {
            const base64Data = event.target.result;
            if (hiddenToolLogoData) hiddenToolLogoData.value = base64Data;
            if (previewToolLogo) {
              previewToolLogo.innerHTML = `<img src="${base64Data}" alt="Logo" style="width: 100%; height: 100%; object-fit: contain; padding: 2px;" />`;
            }
            if (btnClearToolLogo) btnClearToolLogo.style.display = 'inline-block';
          };
          reader.readAsDataURL(file);
        });
      }

      if (btnClearToolLogo) {
        btnClearToolLogo.addEventListener('click', () => {
          if (fileToolLogo) fileToolLogo.value = '';
          if (hiddenToolLogoData) hiddenToolLogoData.value = '';
          btnClearToolLogo.style.display = 'none';
          const emoji = (iconToolInput && iconToolInput.value.trim()) || '🚀';
          if (previewToolLogo) previewToolLogo.textContent = emoji;
        });
      }

      if (iconToolInput) {
        iconToolInput.addEventListener('input', () => {
          if (!hiddenToolLogoData || !hiddenToolLogoData.value) {
            if (previewToolLogo) previewToolLogo.textContent = iconToolInput.value.trim() || '🚀';
          }
        });
      }

      formAdminTool.addEventListener('submit', (e) => {
        e.preventDefault();
        const editId = formAdminTool.getAttribute('data-edit-id');
        const name = document.getElementById('admin-tool-name').value.trim();
        const description = document.getElementById('admin-tool-desc').value.trim();
        const category = document.getElementById('admin-tool-category').value;
        const status = document.getElementById('admin-tool-status').value;
        const url = document.getElementById('admin-tool-url').value.trim();
        const logoData = document.getElementById('admin-tool-logo-data')?.value;
        const iconVal = document.getElementById('admin-tool-icon')?.value.trim();
        const icon = logoData || iconVal || '🚀';

        if (editId) {
          store.updateTool(editId, { name, description, category, status, url, icon });
          this.showToast('Herramienta actualizada con éxito', 'success');
        } else {
          store.createTool({ name, description, category, status, url, icon });
          this.showToast('Nueva herramienta agregada al catálogo global', 'success');
        }

        this.closeAllModals();
        this.refreshCurrentView();
      });
    }

    // Submit de Admin - Crear Comunicado Masivo / Noticias / Ofertas
    const formBroadcast = document.getElementById('form-create-broadcast');
    if (formBroadcast) {
      formBroadcast.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('broadcast-title').value.trim();
        const category = document.getElementById('broadcast-category').value;
        const targetAudience = document.getElementById('broadcast-audience').value;
        const content = document.getElementById('broadcast-content').value.trim();
        
        const channels = ['Notificación en Mi Humm'];
        if (document.getElementById('channel-email')?.checked) channels.push('Correo Electrónico');
        if (document.getElementById('channel-whatsapp')?.checked) channels.push('WhatsApp');

        const workspacesCount = store.getAllWorkspaces().length;
        const customersCount = store.getAllCommunityCustomers().length;
        let reach = workspacesCount;
        if (targetAudience.includes('Clientes')) reach = customersCount;
        if (targetAudience.includes('Toda la Comunidad')) reach = workspacesCount + customersCount;

        store.createBroadcast({
          title,
          category,
          targetAudience,
          content,
          authorName: 'Administración Humm',
          channels,
          reachCount: reach
        });

        this.showToast(`📢 Comunicado difundido exitosamente a ${reach} destinatarios`, 'success', 'Comunicado Publicado');
        formBroadcast.reset();
        this.closeAllModals();
        this.refreshCurrentView();
      });
    }

    // Submit de Admin - Crear / Editar Descuento de Empresa
    const formDisc = document.getElementById('form-company-discount');
    if (formDisc) {
      // Subida interactiva de archivo de imagen para logo
      const fileLogoInput = document.getElementById('admin-disc-logo-file');
      const previewLogoBox = document.getElementById('admin-disc-logo-preview');
      const hiddenLogoData = document.getElementById('admin-disc-logo-data');
      const btnClearLogo = document.getElementById('btn-clear-disc-logo');
      const emojiLogoInput = document.getElementById('admin-disc-logo');

      if (fileLogoInput) {
        fileLogoInput.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (!file) return;

          if (file.size > 3 * 1024 * 1024) {
            this.showToast('La imagen supera los 3MB. Por favor selecciona una imagen más liviana.', 'warning');
            return;
          }

          const reader = new FileReader();
          reader.onload = (event) => {
            const base64Data = event.target.result;
            if (hiddenLogoData) hiddenLogoData.value = base64Data;
            if (previewLogoBox) {
              previewLogoBox.innerHTML = `<img src="${base64Data}" alt="Logo" style="width: 100%; height: 100%; object-fit: contain; padding: 2px;" />`;
            }
            if (btnClearLogo) btnClearLogo.style.display = 'inline-block';
          };
          reader.readAsDataURL(file);
        });
      }

      if (btnClearLogo) {
        btnClearLogo.addEventListener('click', () => {
          if (fileLogoInput) fileLogoInput.value = '';
          if (hiddenLogoData) hiddenLogoData.value = '';
          btnClearLogo.style.display = 'none';
          const emoji = (emojiLogoInput && emojiLogoInput.value.trim()) || '🎁';
          if (previewLogoBox) previewLogoBox.textContent = emoji;
        });
      }

      if (emojiLogoInput) {
        emojiLogoInput.addEventListener('input', () => {
          if (!hiddenLogoData || !hiddenLogoData.value) {
            if (previewLogoBox) previewLogoBox.textContent = emojiLogoInput.value.trim() || '🎁';
          }
        });
      }

      formDisc.addEventListener('submit', (e) => {
        e.preventDefault();
        const editId = formDisc.getAttribute('data-edit-id');
        const companyName = document.getElementById('admin-disc-company').value.trim();
        const logoData = document.getElementById('admin-disc-logo-data')?.value;
        const emojiVal = document.getElementById('admin-disc-logo')?.value.trim();
        const logo = logoData || emojiVal || '🎁';
        const discountTitle = document.getElementById('admin-disc-title').value.trim();
        const category = document.getElementById('admin-disc-category').value;
        const code = document.getElementById('admin-disc-code').value.trim();
        const description = document.getElementById('admin-disc-desc').value.trim();
        const url = document.getElementById('admin-disc-url').value.trim();
        const expiresAt = document.getElementById('admin-disc-expires').value || null;
        const featured = document.getElementById('admin-disc-featured').checked;

        // Nuevos campos de contacto y condiciones comerciales
        const contactPerson = document.getElementById('admin-disc-contact-person')?.value.trim() || '';
        const contactRole = document.getElementById('admin-disc-contact-role')?.value.trim() || '';
        const phone = document.getElementById('admin-disc-phone')?.value.trim() || '';
        const whatsapp = document.getElementById('admin-disc-whatsapp')?.value.trim() || '';
        const instagram = document.getElementById('admin-disc-instagram')?.value.trim() || '';
        const email = document.getElementById('admin-disc-email')?.value.trim() || '';
        const preferredChannel = document.getElementById('admin-disc-preferred-channel')?.value || 'whatsapp';
        const startsAt = document.getElementById('admin-disc-starts-at')?.value || null;
        const minPurchase = parseFloat(document.getElementById('admin-disc-min-purchase')?.value) || 0;
        const maxDiscount = parseFloat(document.getElementById('admin-disc-max-discount')?.value) || 0;
        const whatsappTemplate = document.getElementById('admin-disc-wa-template')?.value || '';
        const instagramTemplate = document.getElementById('admin-disc-ig-template')?.value || '';
        const emailTemplate = document.getElementById('admin-disc-email-template')?.value || '';
        const hummResponsible = document.getElementById('admin-disc-responsible')?.value.trim() || 'Comunidad Humm';

        const payload = {
          companyName, logo, discountTitle, category, code, description, url, expiresAt, featured,
          contactPerson, contactRole, phone, whatsapp, instagram, email, preferredChannel,
          startsAt, minPurchase, maxDiscount, whatsappTemplate, instagramTemplate, emailTemplate, hummResponsible
        };

        if (editId) {
          store.updateCompanyDiscount(editId, payload);
          this.showToast('Beneficio y canales de contacto actualizados con éxito', 'success');
        } else {
          store.createCompanyDiscount(payload);
          this.showToast(`Convenio con "${companyName}" publicado para los miembros`, 'success');
        }

        this.closeAllModals();
        this.refreshCurrentView();
      });
    }

    // Submit de Miembro - Solicitar Beneficio Comercial
    const formReqBenefit = document.getElementById('form-request-benefit');
    if (formReqBenefit) {
      formReqBenefit.addEventListener('submit', async (e) => {
        e.preventDefault();
        const discId = document.getElementById('req-benefit-discount-id')?.value;
        const selectedRadio = formReqBenefit.querySelector('input[name="req_channel_choice"]:checked');
        const channel = selectedRadio ? selectedRadio.value : 'whatsapp';

        const ws = auth.getCurrentWorkspace();
        if (!ws) {
          this.showToast('Debes iniciar sesión con tu cuenta de emprendimiento', 'warning');
          return;
        }

        const disc = store.getCompanyDiscount(discId);
        if (!disc) {
          this.showToast('Beneficio no encontrado', 'danger');
          return;
        }

        // Registrar solicitud de beneficio (o recuperar existente)
        const req = await store.requestBenefit(ws.id, disc.id, channel);
        const code = req.personalCode;
        const msg = this.buildBenefitMessage(disc, channel, ws.ownerName, ws.name, code, ws.rut);

        this.launchChannelAction(channel, disc, msg, code);
        this.closeAllModals();
        this.refreshCurrentView();
      });
    }

    // Submit de Miembro - Feedback Beneficio Utilizado
    const formFeedbackUsed = document.getElementById('form-benefit-feedback-used');
    if (formFeedbackUsed) {
      formFeedbackUsed.addEventListener('submit', async (e) => {
        e.preventDefault();
        const reqId = document.getElementById('benefit-feedback-used-req-id')?.value;
        const purchaseAmount = parseFloat(document.getElementById('feedback-used-purchase-amount')?.value) || 0;
        const discountAmount = parseFloat(document.getElementById('feedback-used-savings-amount')?.value) || 0;
        const memberRating = parseInt(document.getElementById('feedback-used-rating')?.value, 10) || 5;
        const memberComment = document.getElementById('feedback-used-comment')?.value.trim() || '';

        await store.markBenefitUsed(reqId, { purchaseAmount, discountAmount, memberRating, memberComment });
        this.showToast('¡Muchas gracias! Tu ahorro y evaluación han quedado registrados.', 'success');
        this.closeAllModals();
        this.refreshCurrentView();
      });
    }

    // Submit de Miembro - Feedback Beneficio No Concretado
    const formFeedbackNC = document.getElementById('form-benefit-feedback-not-completed');
    if (formFeedbackNC) {
      formFeedbackNC.addEventListener('submit', async (e) => {
        e.preventDefault();
        const reqId = document.getElementById('benefit-feedback-nc-req-id')?.value;
        const notCompletedReason = document.getElementById('feedback-nc-reason')?.value || 'Otro motivo';
        const memberComment = document.getElementById('feedback-nc-comment')?.value.trim() || '';

        await store.markBenefitNotCompleted(reqId, { notCompletedReason, memberComment });
        this.showToast('Reporte recibido. El equipo Humm revisará la alianza.', 'info');
        this.closeAllModals();
        this.refreshCurrentView();
      });
    }

    // Submit de Admin - Crear / Editar Tutor o Ejecutivo Humm
    const formAdvEdit = document.getElementById('form-admin-advisor-edit');
    if (formAdvEdit) {
      formAdvEdit.addEventListener('submit', (e) => {
        e.preventDefault();
        const editId = formAdvEdit.getAttribute('data-edit-id');
        const name = document.getElementById('admin-adv-name').value.trim();
        const phone = document.getElementById('admin-adv-phone').value.trim();
        const email = document.getElementById('admin-adv-email').value.trim().toLowerCase();
        const specialty = document.getElementById('admin-adv-specialty').value;
        const password = document.getElementById('admin-adv-pass').value.trim();
        const isActive = document.getElementById('admin-adv-active').checked;
        const sendWelcome = document.getElementById('admin-adv-send-welcome')?.checked;
        const mustChangePass = document.getElementById('admin-adv-must-change-pass')?.checked;

        // Extraer IDs de emprendimientos marcados
        const selectedWsIds = Array.from(formAdvEdit.querySelectorAll('input[name="adv_workspace"]:checked')).map(cb => cb.value);

        if (editId) {
          store.updateAdvisor(editId, {
            name, phone, email, specialty,
            ...(password ? { password } : {}),
            isActive,
            assignedWorkspaceIds: selectedWsIds
          });
          this.showToast(`Tutor "${name}" actualizado con éxito`, 'success');
        } else {
          store.createAdvisor({
            name, phone, email, specialty,
            password: password || 'humm2026',
            isActive,
            assignedWorkspaceIds: selectedWsIds,
            mustChangePassword: !!mustChangePass
          });

          // Enviar correo de bienvenida si está marcado
          if (sendWelcome && window.fetch) {
            fetch('api/mail.php', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'welcome_user',
                to: email,
                name: name,
                tempPassword: password || 'humm2026',
                mustChangePassword: !!mustChangePass
              })
            }).catch(() => {});
          }

          this.showToast(`Tutor "${name}" incorporado al equipo Humm`, 'success');
        }

        this.closeAllModals();
        this.refreshCurrentView();
      });
    }

    // Submit de Admin - Asignación rápida de emprendimientos a tutor
    const formAdvAssign = document.getElementById('form-advisor-assign-workspaces');
    if (formAdvAssign) {
      formAdvAssign.addEventListener('submit', (e) => {
        e.preventDefault();
        const advEmail = document.getElementById('assign-advisor-email').value;
        const advName = document.getElementById('assign-advisor-name').value;
        const selectedWsIds = Array.from(formAdvAssign.querySelectorAll('input[name="assign_ws"]:checked')).map(cb => cb.value);

        store.assignWorkspacesToAdvisor(advEmail, advName, selectedWsIds);
        this.showToast(`Emprendimientos asignados exitosamente a ${advName}`, 'success');

        this.closeAllModals();
        this.refreshCurrentView();
      });
    }

    // Modal Sincronización de Calendarios: Google, Outlook, iCal
    const btnToggleGoogle = document.getElementById('btn-toggle-google-sync');
    if (btnToggleGoogle) {
      btnToggleGoogle.addEventListener('click', () => {
        const ws = auth.getCurrentWorkspace();
        if (!ws) return;
        const current = store.getCalendarSettings(ws.id);
        const newState = !current.googleConnected;
        store.saveCalendarSettings(ws.id, { googleConnected: newState });
        btnToggleGoogle.textContent = newState ? '🟢 Conectado' : 'Conectar';
        btnToggleGoogle.className = newState ? 'btn btn-sm btn-secondary' : 'btn btn-sm btn-outline';
        document.getElementById('google-sync-status-text').textContent = newState ? 'Sincronización activa con Google Calendar' : 'Haz clic para conectar tu cuenta Google';
        this.showToast(newState ? 'Google Calendar conectado con éxito' : 'Google Calendar desconectado', 'info');
      });
    }

    const btnToggleOutlook = document.getElementById('btn-toggle-outlook-sync');
    if (btnToggleOutlook) {
      btnToggleOutlook.addEventListener('click', () => {
        const ws = auth.getCurrentWorkspace();
        if (!ws) return;
        const current = store.getCalendarSettings(ws.id);
        const newState = !current.outlookConnected;
        store.saveCalendarSettings(ws.id, { outlookConnected: newState });
        btnToggleOutlook.textContent = newState ? '🟢 Conectado' : 'Conectar';
        btnToggleOutlook.className = newState ? 'btn btn-sm btn-secondary' : 'btn btn-sm btn-outline';
        document.getElementById('outlook-sync-status-text').textContent = newState ? 'Sincronización activa con Microsoft Outlook' : 'Conecta tu cuenta Microsoft / Outlook';
        this.showToast(newState ? 'Microsoft Outlook conectado con éxito' : 'Microsoft Outlook desconectado', 'info');
      });
    }

    const btnCopyIcal = document.getElementById('btn-copy-ical-feed');
    if (btnCopyIcal) {
      btnCopyIcal.addEventListener('click', () => {
        const input = document.getElementById('input-ical-feed-url');
        if (input) {
          navigator.clipboard.writeText(input.value).then(() => {
            this.showToast('Enlace iCal copiado al portapapeles. Pégalo en tu app de calendario.', 'success');
          }).catch(() => {
            input.select();
            document.execCommand('copy');
            this.showToast('Enlace iCal copiado al portapapeles.', 'success');
          });
        }
      });
    }
  }

  openModal(modalId) {
    this.closeAllModals();
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      const firstInput = modal.querySelector('input, select, textarea');
      if (firstInput) setTimeout(() => firstInput.focus(), 100);

      const ws = auth.getCurrentWorkspace();

      // Si es modal tarea, poblar selectores de clientes y oportunidades
      if (modalId === 'modal-task') {
        this.populateTaskModalSelects();
      }

      // Si es modal evento, poblar selector de clientes
      if (modalId === 'modal-event') {
        this.populateEventModalSelects();
      }

      // Si es modal sincronización de calendarios, actualizar URLs y estados
      if (modalId === 'modal-calendar-sync' && ws) {
        const settings = store.getCalendarSettings(ws.id);
        const feedInput = document.getElementById('input-ical-feed-url');
        if (feedInput) {
          feedInput.value = `https://mi.humm.cl/feed/calendar/${ws.id}.ics`;
        }

        const btnGoogle = document.getElementById('btn-toggle-google-sync');
        if (btnGoogle) {
          btnGoogle.textContent = settings.googleConnected ? '🟢 Conectado' : 'Conectar';
          btnGoogle.className = settings.googleConnected ? 'btn btn-sm btn-secondary' : 'btn btn-sm btn-outline';
          document.getElementById('google-sync-status-text').textContent = settings.googleConnected ? 'Sincronización activa con Google Calendar' : 'Haz clic para conectar tu cuenta Google';
        }

        const btnOutlook = document.getElementById('btn-toggle-outlook-sync');
        if (btnOutlook) {
          btnOutlook.textContent = settings.outlookConnected ? '🟢 Conectado' : 'Conectar';
          btnOutlook.className = settings.outlookConnected ? 'btn btn-sm btn-secondary' : 'btn btn-sm btn-outline';
          document.getElementById('outlook-sync-status-text').textContent = settings.outlookConnected ? 'Sincronización activa con Microsoft Outlook' : 'Conecta tu cuenta Microsoft / Outlook';
        }
      }

      // Si es modal venta, poblar selector de clientes y fecha por defecto
      if (modalId === 'modal-sale') {
        const form = document.getElementById('form-modal-sale');
        if (form && !form.getAttribute('data-edit-id')) {
          form.reset();
          const dateInput = document.getElementById('modal-sale-date');
          if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
          document.getElementById('modal-sale-header-title').textContent = 'Registrar Venta';
          if (document.getElementById('modal-sale-payment-status')) {
            document.getElementById('modal-sale-payment-status').value = 'pagado';
          }
        }
        this.populateSaleModalSelects();
      }

      // Si es modal evento, poblar selector de clientes y asegurar radio en evento
      if (modalId === 'modal-event') {
        const evtRadio = document.querySelector('input[name="modal-event-kind"][value="event"]');
        if (evtRadio) evtRadio.checked = true;
        this.populateEventModalSelects();
      }

      // Si es modal crear usuario, poblar selector de workspaces
      if (modalId === 'modal-create-user') {
        const wsSelect = document.getElementById('admin-user-workspace');
        if (wsSelect) {
          const workspaces = store.getAllWorkspaces();
          wsSelect.innerHTML = '<option value="">(Ninguno / Admin)</option>' +
            workspaces.map(w => `<option value="${w.id}">${w.name} (${w.ownerName})</option>`).join('');
        }
      }
    }
  }

  closeAllModals() {
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
  }

  populateEventModalSelects(selectedCustomerId = null) {
    const ws = auth.getCurrentWorkspace();
    if (!ws) return;

    const customers = store.getCustomers(ws.id);
    const custSelect = document.getElementById('modal-event-customer');
    if (custSelect) {
      custSelect.innerHTML = '<option value="">(Opcional) Ninguno</option>' +
        customers.map(c => `<option value="${c.id}" ${c.id === selectedCustomerId ? 'selected' : ''}>${c.firstName} ${c.lastName || ''} ${c.company ? `(${c.company})` : ''}</option>`).join('');
    }
  }

  openEditEventModal(eventId) {
    const ev = store.getEvent(eventId);
    if (!ev) return;

    const form = document.getElementById('form-modal-event');
    if (!form) return;

    form.setAttribute('data-edit-id', ev.id);
    document.getElementById('modal-event-header-title').textContent = 'Editar Compromiso';
    document.getElementById('modal-event-title').value = ev.title;
    document.getElementById('modal-event-type').value = ev.type || 'reunion';
    document.getElementById('modal-event-date').value = ev.date;
    document.getElementById('modal-event-start-time').value = ev.startTime || '10:00';
    document.getElementById('modal-event-end-time').value = ev.endTime || '11:00';
    document.getElementById('modal-event-location').value = ev.location || '';
    document.getElementById('modal-event-meet-url').value = ev.meetUrl || '';
    document.getElementById('modal-event-desc').value = ev.description || '';

    this.populateEventModalSelects(ev.customerId);
    this.openModal('modal-event');
  }

  openEditNoteModal(noteId) {
    const note = store.getNote(noteId);
    if (!note) return;

    const form = document.getElementById('form-modal-note');
    if (!form) return;

    form.setAttribute('data-edit-id', note.id);
    document.getElementById('modal-note-header-title').textContent = 'Editar Nota Rápida';
    document.getElementById('modal-note-title').value = note.title;
    document.getElementById('modal-note-category').value = note.category || 'general';
    document.getElementById('modal-note-color').value = note.color || 'yellow';
    document.getElementById('modal-note-content').value = note.content;
    document.getElementById('modal-note-pinned').checked = !!note.pinned;

    this.openModal('modal-note');
  }

  populateSaleModalSelects(selectedCustomerId = null) {
    const ws = auth.getCurrentWorkspace();
    if (!ws) return;

    const customers = store.getCustomers(ws.id);
    const custSelect = document.getElementById('modal-sale-customer');
    if (custSelect) {
      custSelect.innerHTML = '<option value="">(Opcional / Venta a público general)</option>' +
        customers.map(c => `<option value="${c.id}" ${c.id === selectedCustomerId ? 'selected' : ''}>${c.firstName} ${c.lastName || ''} ${c.company ? `(${c.company})` : ''}</option>`).join('');
    }
  }

  populateTaskModalSelects(selectedCustomerId = null, selectedOppId = null, selectedStatus = null) {
    const ws = auth.getCurrentWorkspace();
    if (!ws) return;

    const customers = store.getCustomers(ws.id);
    const opps = store.getOpportunities(ws.id);
    const columns = store.getKanbanColumns(ws.id);

    // Poblar selector de estado/etapas según las columnas del workspace
    const statusSelect = document.getElementById('modal-task-status');
    if (statusSelect) {
      statusSelect.innerHTML = columns.map(c => `
        <option value="${c.id}" ${c.id === selectedStatus ? 'selected' : ''}>${c.name}</option>
      `).join('');
    }

    const custSelect = document.getElementById('modal-task-customer');
    if (custSelect) {
      custSelect.innerHTML = '<option value="">(Opcional) Ninguno</option>' +
        customers.map(c => `<option value="${c.id}" ${c.id === selectedCustomerId ? 'selected' : ''}>${c.firstName} ${c.lastName || ''} ${c.company ? `(${c.company})` : ''}</option>`).join('');
    }

    const oppSelect = document.getElementById('modal-task-opp');
    if (oppSelect) {
      oppSelect.innerHTML = '<option value="">(Opcional) Ninguna</option>' +
        opps.map(o => `<option value="${o.id}" ${o.id === selectedOppId ? 'selected' : ''}>${o.title} (${o.contactName})</option>`).join('');
    }
  }

  openCreateTaskModal(initialDate = null, initialStatus = 'todo', extraData = {}) {
    const form = document.getElementById('form-modal-task');
    if (form) {
      form.removeAttribute('data-edit-id');
      form.reset();
      document.getElementById('modal-task-header-title').textContent = initialDate ? `Nueva Tarea para el ${formatDateCL(initialDate)}` : 'Nueva Tarea';
      if (document.getElementById('modal-task-title')) {
        document.getElementById('modal-task-title').value = extraData.title || '';
      }
      if (document.getElementById('modal-task-desc')) {
        document.getElementById('modal-task-desc').value = extraData.description || '';
      }
      if (document.getElementById('modal-task-due-date')) {
        document.getElementById('modal-task-due-date').value = initialDate || extraData.dueDate || '';
      }
      if (document.getElementById('modal-task-start-date')) {
        document.getElementById('modal-task-start-date').value = initialDate || extraData.startDate || '';
      }
      if (document.getElementById('modal-task-tag')) {
        document.getElementById('modal-task-tag').value = extraData.tag || '';
      }
    }
    this.populateTaskModalSelects(extraData.customerId || null, extraData.opportunityId || null, initialStatus || 'todo');
    if (document.getElementById('modal-task-status')) {
      document.getElementById('modal-task-status').value = initialStatus || 'todo';
    }
    this.openModal('modal-task');
  }

  openEditTaskModal(taskId) {
    const task = store.getTask(taskId);
    if (!task) return;

    const form = document.getElementById('form-modal-task');
    if (!form) return;

    form.setAttribute('data-edit-id', task.id);
    document.getElementById('modal-task-header-title').textContent = 'Editar Tarea';
    document.getElementById('modal-task-title').value = task.title;
    document.getElementById('modal-task-desc').value = task.description || '';
    document.getElementById('modal-task-priority').value = task.priority;
    document.getElementById('modal-task-start-date').value = task.startDate || '';
    document.getElementById('modal-task-due-date').value = task.dueDate || '';
    document.getElementById('modal-task-tag').value = task.tag || '';

    this.populateTaskModalSelects(task.customerId, task.opportunityId, task.status);
    if (document.getElementById('modal-task-status')) {
      document.getElementById('modal-task-status').value = task.status;
    }
    this.openModal('modal-task');
  }

  openEditSaleModal(saleIdOrData) {
    let sale = null;
    if (typeof saleIdOrData === 'string') {
      sale = store.getSale(saleIdOrData);
    } else {
      sale = saleIdOrData;
    }
    if (!sale) return;

    const form = document.getElementById('form-modal-sale');
    if (!form) return;

    form.setAttribute('data-edit-id', sale.id);
    document.getElementById('modal-sale-header-title').textContent = 'Editar Venta';
    
    const saleDate = sale.date || `${sale.year}-${String(sale.month).padStart(2, '0')}-15`;
    document.getElementById('modal-sale-date').value = saleDate;
    document.getElementById('modal-sale-amount').value = parseInt(sale.amount, 10).toLocaleString('es-CL');
    document.getElementById('modal-sale-payment-status').value = sale.paymentStatus || 'pagado';
    if (document.getElementById('modal-sale-due-date')) {
      document.getElementById('modal-sale-due-date').value = sale.dueDate || '';
    }
    document.getElementById('modal-sale-notes').value = sale.notes || '';

    this.populateSaleModalSelects(sale.customerId);
    this.openModal('modal-sale');
  }

  openCreateCustomerModal() {
    const form = document.getElementById('form-modal-customer');
    if (form) {
      form.removeAttribute('data-edit-id');
      form.reset();
      document.getElementById('modal-cust-header-title').textContent = 'Nuevo Cliente';
      if (document.getElementById('modal-cust-rut')) document.getElementById('modal-cust-rut').value = '';
      if (document.getElementById('modal-cust-address')) document.getElementById('modal-cust-address').value = '';
      const regionSelect = document.getElementById('modal-cust-region');
      const comunaSelect = document.getElementById('modal-cust-comuna');
      if (regionSelect) regionSelect.value = '';
      if (comunaSelect) {
        comunaSelect.innerHTML = '<option value="">Primero selecciona una región...</option>';
        comunaSelect.disabled = true;
      }
    }
    this.openModal('modal-customer');
  }

  openEditCustomerModal(customerId) {
    const c = store.getCustomer(customerId);
    if (!c) return;

    const form = document.getElementById('form-modal-customer');
    if (!form) return;

    form.setAttribute('data-edit-id', c.id);
    document.getElementById('modal-cust-header-title').textContent = 'Editar Cliente';
    document.getElementById('modal-cust-name').value = c.firstName || '';
    document.getElementById('modal-cust-lastname').value = c.lastName || '';
    if (document.getElementById('modal-cust-rut')) document.getElementById('modal-cust-rut').value = c.rut || '';
    document.getElementById('modal-cust-company').value = c.company || '';
    document.getElementById('modal-cust-phone').value = c.phone || '';
    document.getElementById('modal-cust-email').value = c.email || '';
    
    const regionSelect = document.getElementById('modal-cust-region');
    const comunaSelect = document.getElementById('modal-cust-comuna');
    if (regionSelect) {
      regionSelect.value = c.region || '';
      if (comunaSelect) {
        populateComunasSelect(regionSelect, comunaSelect, c.comuna || '');
      }
    }

    document.getElementById('modal-cust-city').value = c.city || '';
    if (document.getElementById('modal-cust-address')) document.getElementById('modal-cust-address').value = c.address || '';
    document.getElementById('modal-cust-channel').value = c.sourceChannel || 'Recomendación';
    document.getElementById('modal-cust-status').value = c.status || 'active';
    document.getElementById('modal-cust-notes').value = c.notes || '';

    this.openModal('modal-customer');
  }

  openEditOpportunityModal(oppId) {
    const opp = store.getOpportunity(oppId);
    if (!opp) return;

    const form = document.getElementById('form-modal-opp');
    if (!form) return;

    form.setAttribute('data-edit-id', opp.id);
    document.getElementById('modal-opp-header-title').textContent = 'Editar Oportunidad';
    document.getElementById('modal-opp-title').value = opp.title;
    document.getElementById('modal-opp-contact').value = opp.contactName;
    document.getElementById('modal-opp-phone').value = opp.phone || '';
    document.getElementById('modal-opp-email').value = opp.email || '';
    document.getElementById('modal-opp-product').value = opp.productInterest || '';
    document.getElementById('modal-opp-amount').value = opp.estimatedAmount ? parseInt(opp.estimatedAmount, 10).toLocaleString('es-CL') : '';
    document.getElementById('modal-opp-status').value = opp.status;
    document.getElementById('modal-opp-next-action').value = opp.nextAction || '';
    document.getElementById('modal-opp-date').value = opp.followUpDate || '';
    document.getElementById('modal-opp-channel').value = opp.sourceChannel || 'Otro';
    document.getElementById('modal-opp-notes').value = opp.notes || '';

    this.openModal('modal-opportunity');
  }

  openWonCelebrationModal(opp) {
    const modal = document.getElementById('modal-won-celebration');
    if (!modal) return;

    document.getElementById('won-opp-title').textContent = opp.title;
    document.getElementById('won-opp-amount').textContent = opp.estimatedAmount ? formatCLP(opp.estimatedAmount) : '';

    this.openModal('modal-won-celebration');

    // Botón para registrar venta mensual
    const btnRegisterSale = document.getElementById('btn-won-to-sales');
    if (btnRegisterSale) {
      btnRegisterSale.onclick = () => {
        this.closeAllModals();
        window.location.hash = '#ventas';
        setTimeout(() => {
          this.openModal('modal-sale');
          if (opp.estimatedAmount) {
            document.getElementById('modal-sale-amount').value = parseInt(opp.estimatedAmount, 10).toLocaleString('es-CL');
            document.getElementById('modal-sale-notes').value = `Venta lograda: ${opp.title} (${opp.contactName})`;
          }
        }, 150);
      };
    }
  }

  openManageWsToolsModal(workspaceId) {
    const ws = store.getWorkspace(workspaceId);
    if (!ws) return;

    document.getElementById('modal-ws-tools-title').textContent = `Herramientas para ${ws.name}`;
    const listContainer = document.getElementById('ws-tools-checkboxes-list');
    const allTools = store.getAllTools();
    const assignedIds = ws.assignedTools || [];

    if (listContainer) {
      listContainer.innerHTML = allTools.map(tool => {
        const isChecked = assignedIds.includes(tool.id);
        return `
          <label style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); cursor: pointer;">
            <div>
              <div style="font-weight: 700; font-size: var(--font-size-sm);">${tool.name} <span class="badge badge-neutral text-xs">${tool.category}</span></div>
              <div style="font-size: var(--font-size-xs); color: var(--text-muted);">${tool.description}</div>
            </div>
            <input type="checkbox" class="ws-tool-toggle-checkbox" data-ws-id="${ws.id}" data-tool-id="${tool.id}" ${isChecked ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--humm-red-primary);" />
          </label>
        `;
      }).join('');

      listContainer.querySelectorAll('.ws-tool-toggle-checkbox').forEach(cb => {
        cb.addEventListener('change', () => {
          const tId = cb.getAttribute('data-tool-id');
          store.toggleWorkspaceTool(ws.id, tId);
          this.showToast('Asignación de herramienta actualizada', 'success');
        });
      });
    }

    this.openModal('modal-manage-ws-tools');
  }

  openEditToolModal(toolId = null) {
    const form = document.getElementById('form-admin-tool-edit');
    if (!form) return;

    const fileInput = document.getElementById('admin-tool-logo-file');
    const previewBox = document.getElementById('admin-tool-logo-preview');
    const hiddenData = document.getElementById('admin-tool-logo-data');
    const btnClear = document.getElementById('btn-clear-tool-logo');
    const iconInput = document.getElementById('admin-tool-icon');

    if (fileInput) fileInput.value = '';
    if (hiddenData) hiddenData.value = '';

    if (toolId) {
      const tool = store.getAllTools().find(t => t.id === toolId);
      if (!tool) return;

      form.setAttribute('data-edit-id', tool.id);
      document.getElementById('modal-tool-header-title').textContent = 'Editar Herramienta';
      document.getElementById('admin-tool-name').value = tool.name;
      document.getElementById('admin-tool-desc').value = tool.description;
      document.getElementById('admin-tool-category').value = tool.category;
      document.getElementById('admin-tool-status').value = tool.status;
      document.getElementById('admin-tool-url').value = tool.url;
      if (iconInput) iconInput.value = (tool.icon && !tool.icon.startsWith('data:image/') && !tool.icon.startsWith('http')) ? tool.icon : '🚀';

      if (tool.icon && (tool.icon.startsWith('data:image/') || tool.icon.startsWith('http://') || tool.icon.startsWith('https://') || tool.icon.startsWith('/'))) {
        if (hiddenData) hiddenData.value = tool.icon;
        if (previewBox) previewBox.innerHTML = `<img src="${tool.icon}" alt="${tool.name}" style="width: 100%; height: 100%; object-fit: contain; padding: 2px;" />`;
        if (btnClear) btnClear.style.display = 'inline-block';
      } else {
        if (previewBox) previewBox.textContent = tool.icon || '🚀';
        if (btnClear) btnClear.style.display = 'none';
      }
    } else {
      form.removeAttribute('data-edit-id');
      form.reset();
      document.getElementById('modal-tool-header-title').textContent = '🛠️ Nueva Herramienta Humm';
      if (iconInput) iconInput.value = '🚀';
      if (previewBox) previewBox.textContent = '🚀';
      if (btnClear) btnClear.style.display = 'none';
    }

    this.openModal('modal-tool-edit');
  }

  openAdminUserModal(userId = null) {
    const form = document.getElementById('form-admin-create-user');
    if (!form) return;

    const allTools = store.getAllTools();
    const workspaces = store.getAllWorkspaces();
    const wsSelect = document.getElementById('admin-user-workspace');
    const toolsContainer = document.getElementById('admin-user-tools-list');

    // Cargar opciones de workspaces
    if (wsSelect) {
      wsSelect.innerHTML = `
        <option value="">-- Sin asignar / Acceso Central --</option>
        ${workspaces.map(w => `<option value="${w.id}">${w.name} (${w.ownerName})</option>`).join('')}
      `;
    }

    const saveBtn = document.getElementById('btn-save-admin-user');
    if (saveBtn) saveBtn.disabled = false;

    if (userId) {
      const user = store.getUser(userId);
      if (!user) return;

      form.setAttribute('data-edit-id', user.id);
      document.getElementById('modal-user-header-title').textContent = `Editar Usuario: ${user.name}`;
      document.getElementById('admin-user-name').value = user.name || '';
      document.getElementById('admin-user-email').value = user.email || '';
      document.getElementById('admin-user-password').value = '';
      document.getElementById('admin-user-password-hint').textContent = 'Dejar vacío para conservar la contraseña actual';
      document.getElementById('admin-user-role').value = user.role || 'entrepreneur';
      if (wsSelect) wsSelect.value = user.workspaceId || '';
      if (document.getElementById('admin-user-is-active')) {
        document.getElementById('admin-user-is-active').checked = user.isActive !== false;
      }
      document.getElementById('btn-save-admin-user').textContent = 'Guardar Cambios';
      const welcomeOptions = document.getElementById('admin-user-welcome-options');
      if (welcomeOptions) welcomeOptions.style.display = 'none';

      // Checkboxes de herramientas
      const assigned = user.assignedToolIds || [];
      if (toolsContainer) {
        toolsContainer.innerHTML = allTools.map(t => {
          const isChecked = assigned.length === 0 || assigned.includes(t.id);
          return `
            <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; cursor: pointer; padding: 4px 6px; border-radius: 4px; background: var(--bg-surface); border: 1px solid var(--border-color);">
              <input type="checkbox" class="user-tool-checkbox" value="${t.id}" ${isChecked ? 'checked' : ''} style="width: 15px; height: 15px; accent-color: var(--humm-red-primary);" />
              <span style="font-weight: 600; color: var(--text-primary);">${t.name}</span>
            </label>
          `;
        }).join('');
      }
    } else {
      form.removeAttribute('data-edit-id');
      form.reset();
      document.getElementById('modal-user-header-title').textContent = 'Crear Usuario de la Comunidad';
      document.getElementById('admin-user-password').value = 'humm2026';
      document.getElementById('admin-user-password-hint').textContent = 'Contraseña inicial: humm2026';
      document.getElementById('admin-user-role').value = 'entrepreneur';
      if (document.getElementById('admin-user-is-active')) {
        document.getElementById('admin-user-is-active').checked = true;
      }
      document.getElementById('btn-save-admin-user').textContent = 'Crear Usuario';
      const welcomeOptions = document.getElementById('admin-user-welcome-options');
      if (welcomeOptions) welcomeOptions.style.display = 'block';

      // Por defecto todas marcadas
      if (toolsContainer) {
        toolsContainer.innerHTML = allTools.map(t => {
          return `
            <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; cursor: pointer; padding: 4px 6px; border-radius: 4px; background: var(--bg-surface); border: 1px solid var(--border-color);">
              <input type="checkbox" class="user-tool-checkbox" value="${t.id}" checked style="width: 15px; height: 15px; accent-color: var(--humm-red-primary);" />
              <span style="font-weight: 600; color: var(--text-primary);">${t.name}</span>
            </label>
          `;
        }).join('');
      }
    }

    this.openModal('modal-create-user');
  }

  openCompanyDiscountModal(discId = null) {
    const form = document.getElementById('form-company-discount');
    if (!form) return;

    const fileInput = document.getElementById('admin-disc-logo-file');
    const previewBox = document.getElementById('admin-disc-logo-preview');
    const hiddenData = document.getElementById('admin-disc-logo-data');
    const btnClear = document.getElementById('btn-clear-disc-logo');
    const emojiInput = document.getElementById('admin-disc-logo');

    if (fileInput) fileInput.value = '';
    if (hiddenData) hiddenData.value = '';

    if (discId) {
      const d = store.getCompanyDiscount(discId);
      if (!d) return;
      form.setAttribute('data-edit-id', d.id);
      document.getElementById('modal-disc-header-title').textContent = 'Editar Beneficio de Empresa';
      document.getElementById('admin-disc-company').value = d.companyName || '';
      if (emojiInput) emojiInput.value = (d.logo && !d.logo.startsWith('data:image/') && !d.logo.startsWith('http')) ? d.logo : '🎁';
      document.getElementById('admin-disc-title').value = d.discountTitle || '';
      document.getElementById('admin-disc-category').value = d.category || 'Servicios Generales';
      document.getElementById('admin-disc-code').value = d.code || '';
      document.getElementById('admin-disc-desc').value = d.description || '';
      document.getElementById('admin-disc-url').value = d.url || '';
      document.getElementById('admin-disc-expires').value = d.expiresAt || '';
      document.getElementById('admin-disc-featured').checked = !!d.featured;

      // Contact and commercial fields
      if (document.getElementById('admin-disc-contact-person')) document.getElementById('admin-disc-contact-person').value = d.contactPerson || '';
      if (document.getElementById('admin-disc-contact-role')) document.getElementById('admin-disc-contact-role').value = d.contactRole || '';
      if (document.getElementById('admin-disc-phone')) document.getElementById('admin-disc-phone').value = d.phone || '';
      if (document.getElementById('admin-disc-whatsapp')) document.getElementById('admin-disc-whatsapp').value = d.whatsapp || '';
      if (document.getElementById('admin-disc-instagram')) document.getElementById('admin-disc-instagram').value = d.instagram || '';
      if (document.getElementById('admin-disc-email')) document.getElementById('admin-disc-email').value = d.email || '';
      if (document.getElementById('admin-disc-preferred-channel')) document.getElementById('admin-disc-preferred-channel').value = d.preferredChannel || 'whatsapp';
      if (document.getElementById('admin-disc-starts-at')) document.getElementById('admin-disc-starts-at').value = d.startsAt || '';
      if (document.getElementById('admin-disc-min-purchase')) document.getElementById('admin-disc-min-purchase').value = d.minPurchase || '';
      if (document.getElementById('admin-disc-max-discount')) document.getElementById('admin-disc-max-discount').value = d.maxDiscount || '';
      if (document.getElementById('admin-disc-wa-template')) document.getElementById('admin-disc-wa-template').value = d.whatsappTemplate || '';
      if (document.getElementById('admin-disc-ig-template')) document.getElementById('admin-disc-ig-template').value = d.instagramTemplate || '';
      if (document.getElementById('admin-disc-email-template')) document.getElementById('admin-disc-email-template').value = d.emailTemplate || '';
      if (document.getElementById('admin-disc-responsible')) document.getElementById('admin-disc-responsible').value = d.hummResponsible || '';

      if (d.logo && (d.logo.startsWith('data:image/') || d.logo.startsWith('http://') || d.logo.startsWith('https://') || d.logo.startsWith('/'))) {
        if (hiddenData) hiddenData.value = d.logo;
        if (previewBox) previewBox.innerHTML = `<img src="${d.logo}" alt="${d.companyName}" style="width: 100%; height: 100%; object-fit: contain; padding: 2px;" />`;
        if (btnClear) btnClear.style.display = 'inline-block';
      } else {
        if (previewBox) previewBox.textContent = d.logo || '🎁';
        if (btnClear) btnClear.style.display = 'none';
      }
    } else {
      form.removeAttribute('data-edit-id');
      form.reset();
      document.getElementById('modal-disc-header-title').textContent = '🎁 Beneficio / Convenio de Empresa';
      if (emojiInput) emojiInput.value = '🎁';
      if (previewBox) previewBox.textContent = '🎁';
      if (btnClear) btnClear.style.display = 'none';
      document.getElementById('admin-disc-featured').checked = false;
    }

    this.openModal('modal-company-discount');
  }

  buildBenefitMessage(disc, channel, memberName, wsName, personalCode, rut = '') {
    let tpl = '';
    if (channel === 'whatsapp') {
      tpl = disc.whatsappTemplate || '¡Hola! Soy {nombre_miembro} de {nombre_emprendimiento}, miembro de la Comunidad Humm. Quisiera consultar y solicitar el beneficio "{beneficio}". Mi código de descuento es {codigo_beneficio}. ¡Muchas gracias!';
    } else if (channel === 'instagram') {
      tpl = disc.instagramTemplate || '¡Hola! Soy {nombre_miembro} de {nombre_emprendimiento}, miembro de la Comunidad Humm. Quisiera solicitar el beneficio "{beneficio}". Mi código de descuento es {codigo_beneficio}. ¡Muchas gracias!';
    } else if (channel === 'email') {
      tpl = disc.emailTemplate || 'Estimado equipo de {nombre_aliado},\n\nSoy {nombre_miembro} de {nombre_emprendimiento}, miembro activo de la Comunidad Humm.\n\nMe pongo en contacto para solicitar el beneficio: "{beneficio}".\nMi código de convenio Humm es: {codigo_beneficio}.\n\nQuedo atento a su respuesta para coordinar.\n\nSaludos cordiales,\n{nombre_miembro}\n{nombre_emprendimiento}';
    } else {
      tpl = 'Beneficio "{beneficio}" - Código: {codigo_beneficio}';
    }

    return tpl
      .replace(/{nombre_miembro}/g, memberName || 'Emprendedor Humm')
      .replace(/{nombre_emprendimiento}/g, wsName || 'Emprendimiento')
      .replace(/{nombre_aliado}/g, disc.companyName || 'Aliado')
      .replace(/{codigo_beneficio}/g, personalCode || '')
      .replace(/{beneficio}/g, disc.discountTitle || 'Beneficio')
      .replace(/{rut_opcional}/g, rut ? `(RUT: ${rut})` : '');
  }

  openRequestBenefitModal(discId) {
    const ws = auth.getCurrentWorkspace();
    const user = store.getCurrentUser();
    if (!ws || !user) {
      this.showToast('Debes iniciar sesión para solicitar beneficios', 'warning');
      return;
    }

    const disc = store.getCompanyDiscount(discId);
    if (!disc) return;

    // Verificar si ya tiene código solicitado
    const existingReq = store.getBenefitRequestForDiscount(ws.id, disc.id);
    const code = existingReq ? existingReq.personalCode : (store.generateBenefitCode ? store.generateBenefitCode(disc.companyName) : ('HUMM-' + disc.companyName.toUpperCase().slice(0, 6) + '-' + Math.random().toString(36).substring(2, 6).toUpperCase()));

    document.getElementById('req-benefit-discount-id').value = disc.id;
    document.getElementById('req-benefit-company-name').textContent = disc.companyName;
    document.getElementById('req-benefit-badge-category').textContent = disc.category;
    document.getElementById('req-benefit-title').textContent = disc.discountTitle;
    document.getElementById('req-benefit-desc').textContent = disc.description;
    document.getElementById('req-benefit-code-preview').textContent = code;

    const logoEl = document.getElementById('req-benefit-company-logo');
    if (logoEl) {
      if (disc.logo && (disc.logo.startsWith('data:image/') || disc.logo.startsWith('http') || disc.logo.startsWith('/'))) {
        logoEl.innerHTML = `<img src="${disc.logo}" alt="${disc.companyName}" style="width: 100%; height: 100%; object-fit: contain; padding: 2px;" />`;
      } else {
        logoEl.textContent = disc.logo || '🎁';
      }
    }

    // Configurar canales disponibles
    const channelsContainer = document.getElementById('req-benefit-channels-container');
    if (channelsContainer) {
      const hasWa = !!(disc.whatsapp && disc.whatsapp.trim());
      const hasIg = !!(disc.instagram && disc.instagram.trim());
      const hasEmail = !!(disc.email && disc.email.trim());
      const hasUrl = !!(disc.url && disc.url.trim());

      const preferred = disc.preferredChannel || (hasWa ? 'whatsapp' : (hasIg ? 'instagram' : (hasEmail ? 'email' : 'url')));

      let channelOptionsHTML = '';

      if (hasWa) {
        channelOptionsHTML += `
          <label style="display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: var(--bg-surface-secondary); border: 1.5px solid ${preferred === 'whatsapp' ? 'var(--humm-red-primary)' : 'var(--border-subtle)'}; border-radius: var(--radius-md); cursor: pointer; flex: 1; min-width: 180px;">
            <input type="radio" name="req_channel_choice" value="whatsapp" ${preferred === 'whatsapp' ? 'checked' : ''} style="accent-color: var(--humm-red-primary);" />
            <div>
              <div style="font-weight: 700; color: var(--text-primary); font-size: 12.5px;">💬 WhatsApp (Principal)</div>
              <div class="text-xs text-muted">${disc.whatsapp}</div>
            </div>
          </label>
        `;
      }

      if (hasIg) {
        channelOptionsHTML += `
          <label style="display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: var(--bg-surface-secondary); border: 1.5px solid ${preferred === 'instagram' ? 'var(--humm-red-primary)' : 'var(--border-subtle)'}; border-radius: var(--radius-md); cursor: pointer; flex: 1; min-width: 180px;">
            <input type="radio" name="req_channel_choice" value="instagram" ${preferred === 'instagram' ? 'checked' : ''} style="accent-color: var(--humm-red-primary);" />
            <div>
              <div style="font-weight: 700; color: var(--text-primary); font-size: 12.5px;">📸 Instagram Direct</div>
              <div class="text-xs text-muted">${disc.instagram}</div>
            </div>
          </label>
        `;
      }

      if (hasEmail) {
        channelOptionsHTML += `
          <label style="display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: var(--bg-surface-secondary); border: 1.5px solid ${preferred === 'email' ? 'var(--humm-red-primary)' : 'var(--border-subtle)'}; border-radius: var(--radius-md); cursor: pointer; flex: 1; min-width: 180px;">
            <input type="radio" name="req_channel_choice" value="email" ${preferred === 'email' ? 'checked' : ''} style="accent-color: var(--humm-red-primary);" />
            <div>
              <div style="font-weight: 700; color: var(--text-primary); font-size: 12.5px;">✉️ Correo Electrónico</div>
              <div class="text-xs text-muted">${disc.email}</div>
            </div>
          </label>
        `;
      }

      if (hasUrl && !hasWa && !hasIg && !hasEmail) {
        channelOptionsHTML += `
          <label style="display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: var(--bg-surface-secondary); border: 1.5px solid var(--humm-red-primary); border-radius: var(--radius-md); cursor: pointer; flex: 1; min-width: 180px;">
            <input type="radio" name="req_channel_choice" value="url" checked style="accent-color: var(--humm-red-primary);" />
            <div>
              <div style="font-weight: 700; color: var(--text-primary); font-size: 12.5px;">🌐 Sitio Web Oficial</div>
              <div class="text-xs text-muted">Canje online</div>
            </div>
          </label>
        `;
      }

      channelsContainer.innerHTML = channelOptionsHTML;

      // Actualizar vista previa del mensaje
      const updatePreview = () => {
        const selected = document.querySelector('input[name="req_channel_choice"]:checked')?.value || preferred;
        const msg = this.buildBenefitMessage(disc, selected, ws.ownerName, ws.name, code, ws.rut);
        const previewEl = document.getElementById('req-benefit-preview-text');
        if (previewEl) previewEl.value = msg;
      };

      updatePreview();
      channelsContainer.querySelectorAll('input[name="req_channel_choice"]').forEach(radio => {
        radio.addEventListener('change', updatePreview);
      });
    }

    this.openModal('modal-request-benefit');
  }

  launchChannelAction(channel, disc, msg, code) {
    if (channel === 'whatsapp') {
      const cleanPhone = (disc.whatsapp || disc.phone || '').replace(/[^0-9]/g, '');
      const finalPhone = (cleanPhone.length === 9 && !cleanPhone.startsWith('56')) ? `56${cleanPhone}` : cleanPhone;
      const url = `https://wa.me/${finalPhone}?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank');
      this.showToast(`¡Solicitud registrada! Abriendo WhatsApp con ${disc.companyName}...`, 'success');
    } else if (channel === 'instagram') {
      const igUser = (disc.instagram || '').replace(/^@/, '').trim();
      if (navigator.clipboard) {
        navigator.clipboard.writeText(msg);
      }
      this.showToast(`¡Mensaje copiado al portapapeles! Pégalo en el chat de @${igUser}`, 'info', 'Instagram Direct');
      window.open(`https://ig.me/m/${igUser}`, '_blank');
    } else if (channel === 'email') {
      const mailUrl = `mailto:${disc.email}?subject=${encodeURIComponent('Solicitud Beneficio Humm - ' + disc.discountTitle)}&body=${encodeURIComponent(msg)}`;
      window.location.href = mailUrl;
      this.showToast(`¡Solicitud registrada! Abriendo tu correo...`, 'success');
    } else if (channel === 'url') {
      if (disc.url) window.open(disc.url, '_blank');
      this.showToast(`¡Código personal generado (${code})! Abriendo sitio web...`, 'success');
    }
  }

  continueBenefitContact(discId, reqId) {
    const ws = auth.getCurrentWorkspace();
    const disc = store.getCompanyDiscount(discId);
    if (!disc || !ws) return;

    const req = (store.getBenefitRequests(ws.id) || []).find(r => r.id === reqId) || store.getAllBenefitRequests().find(r => r.id === reqId);
    if (!req) {
      this.openRequestBenefitModal(discId);
      return;
    }

    const msg = this.buildBenefitMessage(disc, req.channel, ws.ownerName, ws.name, req.personalCode, ws.rut);
    this.launchChannelAction(req.channel, disc, msg, req.personalCode);
  }

  openBenefitFeedbackUsedModal(reqId) {
    const ws = auth.getCurrentWorkspace();
    if (!ws) return;

    const req = (store.getBenefitRequests(ws.id) || []).find(r => r.id === reqId) || store.getAllBenefitRequests().find(r => r.id === reqId);
    if (!req) return;

    const disc = store.getCompanyDiscount(req.discountId);

    document.getElementById('benefit-feedback-used-req-id').value = req.id;
    document.getElementById('feedback-used-title').textContent = disc ? disc.discountTitle : 'Beneficio';
    document.getElementById('feedback-used-company').textContent = disc ? disc.companyName : 'Aliado Humm';
    document.getElementById('feedback-used-code').textContent = req.personalCode;
    document.getElementById('feedback-used-purchase-amount').value = req.purchaseAmount || '';
    document.getElementById('feedback-used-savings-amount').value = req.discountAmount || '';
    document.getElementById('feedback-used-rating').value = req.memberRating || 5;
    document.getElementById('feedback-used-comment').value = req.memberComment || '';

    this.openModal('modal-benefit-feedback-used');
  }

  openBenefitFeedbackNotCompletedModal(reqId) {
    const ws = auth.getCurrentWorkspace();
    if (!ws) return;

    const req = (store.getBenefitRequests(ws.id) || []).find(r => r.id === reqId) || store.getAllBenefitRequests().find(r => r.id === reqId);
    if (!req) return;

    const disc = store.getCompanyDiscount(req.discountId);

    document.getElementById('benefit-feedback-nc-req-id').value = req.id;
    document.getElementById('feedback-nc-title').textContent = disc ? disc.discountTitle : 'Beneficio';
    document.getElementById('feedback-nc-company').textContent = disc ? disc.companyName : 'Aliado Humm';
    document.getElementById('feedback-nc-reason').value = req.notCompletedReason || 'Condiciones no aplicables';
    document.getElementById('feedback-nc-comment').value = req.memberComment || '';

    this.openModal('modal-benefit-feedback-not-completed');
  }

  openRequestSupportModal() {
    const ws = auth.getCurrentWorkspace();
    if (!ws) return;

    const advisorName = ws.advisorName || 'Equipo de Apoyo Humm';
    const advisorEmail = ws.advisorEmail || 'contacto@humm.cl';

    const nameEl = document.getElementById('req-support-advisor-name');
    const emailEl = document.getElementById('req-support-advisor-email');

    if (nameEl) nameEl.textContent = advisorName;
    if (emailEl) emailEl.textContent = advisorEmail;

    this.openModal('modal-request-support');
  }

  openCreateWorkspaceModal() {
    const form = document.getElementById('form-admin-create-ws');
    if (form) form.reset();

    const comunaSelect = document.getElementById('admin-ws-comuna');
    if (comunaSelect) {
      comunaSelect.innerHTML = '<option value="">Primero selecciona una región...</option>';
      comunaSelect.disabled = true;
    }

    const advisorSelect = document.getElementById('admin-ws-advisor-select');
    const advisorNameInput = document.getElementById('admin-ws-advisor-name');
    const advisorEmailInput = document.getElementById('admin-ws-advisor-email');
    const customRow = document.getElementById('admin-ws-advisor-custom-row');

    if (advisorSelect) {
      const advisors = store.getAvailableAdvisors();
      let optionsHtml = '<option value="">-- Sin tutor asignado (Opcional) --</option>';
      advisors.forEach(adv => {
        optionsHtml += `<option value="${adv.name}|${adv.email}">${adv.name} (${adv.email})</option>`;
      });
      optionsHtml += '<option value="custom">✏️ Ingresar otro tutor / ejecutivo manualmente...</option>';
      advisorSelect.innerHTML = optionsHtml;
      advisorSelect.value = '';
    }

    if (advisorNameInput) advisorNameInput.value = '';
    if (advisorEmailInput) advisorEmailInput.value = '';
    if (customRow) customRow.style.display = 'none';

    this.openModal('modal-create-ws');
  }

  openEditWsAdvisorModal(wsId, wsName, currentAdvisorName, currentAdvisorEmail) {
    const form = document.getElementById('form-admin-edit-advisor');
    if (!form) return;

    form.setAttribute('data-ws-id', wsId || '');

    const users = store.getAllUsers();
    const workspaces = store.getAllWorkspaces();
    const targetSelect = document.getElementById('edit-advisor-target-user');
    const advisorSelect = document.getElementById('edit-advisor-select');
    const customFields = document.getElementById('advisor-custom-fields');
    const nameInput = document.getElementById('edit-advisor-name');
    const emailInput = document.getElementById('edit-advisor-email');

    if (targetSelect) {
      let optionsHtml = '<optgroup label="👤 Usuarios de la Comunidad">';
      users.filter(u => u.role !== 'admin').forEach(u => {
        const ws = u.workspaceId ? workspaces.find(w => w.id === u.workspaceId) : null;
        const wsText = ws ? ` (${ws.name})` : '';
        optionsHtml += `<option value="user:${u.id}">${u.name} - ${u.email}${wsText}</option>`;
      });
      optionsHtml += '</optgroup><optgroup label="🏢 Emprendimientos Directos">';
      workspaces.forEach(w => {
        const selected = (wsId && w.id === wsId) ? 'selected' : '';
        optionsHtml += `<option value="ws:${w.id}" ${selected}>${w.name} (Dueño: ${w.ownerName})</option>`;
      });
      optionsHtml += '</optgroup>';
      targetSelect.innerHTML = optionsHtml;
    }

    if (advisorSelect) {
      const advisors = store.getAvailableAdvisors();
      let optionsHtml = '<option value="">-- Sin tutor asignado --</option>';
      advisors.forEach(adv => {
        optionsHtml += `<option value="${adv.name}|${adv.email}">${adv.name} (${adv.email})</option>`;
      });
      optionsHtml += '<option value="custom">✏️ Ingresar otro tutor / ejecutivo...</option>';
      advisorSelect.innerHTML = optionsHtml;

      if (currentAdvisorName) {
        const matching = advisors.find(adv => adv.name === currentAdvisorName || adv.email === currentAdvisorEmail);
        if (matching) {
          advisorSelect.value = `${matching.name}|${matching.email}`;
          if (customFields) customFields.style.display = 'none';
        } else {
          advisorSelect.value = 'custom';
          if (customFields) {
            customFields.style.display = 'block';
            if (nameInput) nameInput.value = currentAdvisorName;
            if (emailInput) emailInput.value = currentAdvisorEmail || '';
          }
        }
      } else {
        advisorSelect.value = '';
        if (customFields) customFields.style.display = 'none';
        if (nameInput) nameInput.value = '';
        if (emailInput) emailInput.value = '';
      }
    }

    this.openModal('modal-edit-ws-advisor');
  }

  openAdvisorEditModal(advisorId = null) {
    import('./views/admin.js').then(module => {
      if (module.openAdvisorEditModalDirect) {
        module.openAdvisorEditModalDirect(advisorId);
      }
    });
  }

  openAdvisorAssignModal(advisorId) {
    import('./views/admin.js').then(module => {
      if (module.openAdvisorAssignModalDirect) {
        module.openAdvisorAssignModalDirect(advisorId);
      }
    });
  }

  async loginDemo(email, pass) {
    const loginEmailInput = document.getElementById('login-email');
    const loginPassInput = document.getElementById('login-password');
    if (loginEmailInput) loginEmailInput.value = email;
    if (loginPassInput) loginPassInput.value = pass;

    try {
      const res = await auth.login(email, pass, true);
      if (res.success) {
        this.showToast(`¡Bienvenido/a a Mi Humm, ${res.user.name}!`, 'success');
        const targetHash = res.user.role === 'admin' ? '#admin-dashboard' : '#inicio';
        window.location.hash = targetHash;
        this.checkAuthenticationState();
        this.handleHashChange();
      } else {
        this.showToast(res.message || 'Error al iniciar sesión', 'danger');
      }
    } catch (err) {
      this.showToast('Error al conectar con el servidor', 'danger');
    }
  }

  launchTool(toolName, url) {
    this.showToast(`Abriendo ${toolName} en entorno seguro...`, 'info');
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  // =========================================================================
  // TOAST NOTIFICATIONS
  // =========================================================================
  showToast(message, type = 'info', title = null) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = {
      success: '✓',
      warning: '⚠️',
      danger: '✕',
      info: 'ℹ️'
    };

    toast.innerHTML = `
      <span class="toast-icon" style="font-weight: 800;">${icons[type] || '•'}</span>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close">✕</button>
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.remove();
    });

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }

  // =========================================================================
  // EVENT LISTENERS GLOBALES
  // =========================================================================
  setupEventListeners() {
    // Switch de tema
    document.querySelectorAll('.theme-toggle-btn, #btn-toggle-theme-account').forEach(btn => {
      btn.addEventListener('click', () => this.toggleTheme());
    });

    // Formulario de login
    const formLogin = document.getElementById('form-login');
    if (formLogin) {
      formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-password').value;
        const remember = document.getElementById('login-remember')?.checked || false;

        const btnSubmit = formLogin.querySelector('button[type="submit"]');
        const originalText = btnSubmit ? btnSubmit.innerHTML : 'Ingresar a mi Plataforma';
        if (btnSubmit) {
          btnSubmit.disabled = true;
          btnSubmit.innerHTML = 'Verificando credenciales...';
        }

        try {
          const res = await auth.login(email, pass, remember);
          if (res.success) {
            this.showToast(`¡Bienvenido a Mi Humm, ${res.user.name.split(' ')[0]}!`, 'success');
            const targetHash = res.user.role === 'admin' ? '#admin-dashboard' : '#inicio';
            window.location.hash = targetHash;
            this.checkAuthenticationState();
            this.handleHashChange();
          } else {
            this.showToast(res.message || 'Error al verificar credenciales. Verifica tu correo y contraseña.', 'danger');
          }
        } catch (err) {
          console.error('Error al iniciar sesión:', err);
          this.showToast('Ocurrió un error al procesar el ingreso. Intenta nuevamente.', 'danger');
        } finally {
          if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = originalText;
          }
        }
      });
    }

    // Toggle de visibilidad de contraseña en login
    const togglePassBtn = document.getElementById('btn-toggle-password-visibility');
    if (togglePassBtn) {
      togglePassBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const passInput = document.getElementById('login-password');
        if (passInput) {
          const isPass = passInput.getAttribute('type') === 'password';
          passInput.setAttribute('type', isPass ? 'text' : 'password');
          togglePassBtn.textContent = isPass ? 'Ocultar' : 'Mostrar';
        }
      });
    }

    // Recuperar contraseña
    document.getElementById('link-forgot-password')?.addEventListener('click', (e) => {
      e.preventDefault();
      const loginEmail = document.getElementById('login-email')?.value || '';
      const forgotEmailInput = document.getElementById('forgot-email');
      if (forgotEmailInput && loginEmail) forgotEmailInput.value = loginEmail;
      this.openModal('modal-forgot-password');
    });

    document.getElementById('form-forgot-password')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = (document.getElementById('forgot-email')?.value || '').trim();
      const btnSubmit = e.target.querySelector('button[type="submit"]');
      const origText = btnSubmit ? btnSubmit.textContent : 'Enviar enlace';
      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Enviando...';
      }

      const res = await auth.requestPasswordReset(email);
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.textContent = origText;
      }

      if (res.success) {
        this.showToast(res.message, 'success');
        this.closeAllModals();
      } else {
        this.showToast(res.message, 'danger');
      }
    });

    // Formulario de cambio directo de contraseña desde enlace de correo
    document.getElementById('form-reset-password')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = (document.getElementById('reset-pass-email')?.value || '').trim();
      const passNew = (document.getElementById('reset-pass-new')?.value || '').trim();
      const passConfirm = (document.getElementById('reset-pass-confirm')?.value || '').trim();

      if (passNew !== passConfirm) {
        this.showToast('Las contraseñas no coinciden. Por favor verifica.', 'danger');
        return;
      }

      if (passNew.length < 4) {
        this.showToast('La nueva contraseña debe tener al menos 4 caracteres.', 'danger');
        return;
      }

      const res = await store.resetUserPassword(email, passNew);
      if (res.success) {
        this.showToast('¡Contraseña actualizada exitosamente! Iniciando sesión...', 'success');
        this.closeAllModals();
        const loginRes = await auth.login(email, passNew, true);
        if (loginRes.success) {
          const targetHash = loginRes.user.role === 'admin' ? '#admin-dashboard' : '#inicio';
          window.location.hash = targetHash;
          this.checkAuthenticationState();
          this.handleHashChange();
        } else {
          window.location.hash = '#inicio';
          this.checkAuthenticationState();
          this.handleHashChange();
        }
      } else {
        this.showToast(res.message || 'Error al actualizar contraseña', 'danger');
      }
    });

    // Enlace de ayuda Humm y envío de alerta a contacto@humm.cl
    document.getElementById('link-auth-help')?.addEventListener('click', (e) => {
      e.preventDefault();
      const loginEmail = document.getElementById('login-email')?.value || '';
      const helpEmailInput = document.getElementById('auth-help-email');
      if (helpEmailInput && loginEmail) helpEmailInput.value = loginEmail;
      this.openModal('modal-auth-help');
    });

    document.getElementById('form-auth-help')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = (document.getElementById('auth-help-name')?.value || '').trim();
      const email = (document.getElementById('auth-help-email')?.value || '').trim();
      const message = (document.getElementById('auth-help-message')?.value || '').trim();
      const btnSubmit = document.getElementById('btn-submit-auth-help');

      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Enviando alerta...';
      }

      try {
        const res = await fetch('api/mail.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'auth_help_alert',
            name,
            email,
            message
          })
        });
        const json = await res.json();
        this.showToast('🚨 Alerta enviada a contacto@humm.cl. Te contactaremos a la brevedad.', 'success');
        this.closeAllModals();
        e.target.reset();
      } catch (err) {
        this.showToast('Error al enviar la alerta. Puedes escribir directamente a contacto@humm.cl.', 'danger');
      } finally {
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.textContent = '🚨 Enviar Alerta a Soporte';
        }
      }
    });

    // Botón Cerrar Sesión
    document.querySelectorAll('.btn-logout-action').forEach(btn => {
      btn.addEventListener('click', () => {
        auth.logout();
        this.showToast('Sesión cerrada con éxito', 'info');
        this.checkAuthenticationState();
      });
    });

    // Botón de salir del modo auditoría
    document.getElementById('btn-exit-audit-mode')?.addEventListener('click', () => {
      auth.stopImpersonating();
      window.location.hash = '#admin';
      this.showToast('Has regresado al Panel de Administración Humm', 'info');
      this.checkAuthenticationState();
      this.handleHashChange();
    });

    // Botón Superior: Solicitar apoyo Humm / Contactar tutor
    document.getElementById('btn-topbar-request-support')?.addEventListener('click', () => {
      this.openRequestSupportModal();
    });

    // Botón de acción rápida superior: + Nueva tarea
    document.getElementById('btn-topbar-quick-action')?.addEventListener('click', () => {
      this.openCreateTaskModal(null, 'todo');
    });

    // Mobile Drawer Toggle & Overlay
    const menuToggle = document.getElementById('mobile-menu-toggle-btn');
    const overlay = document.getElementById('sidebar-overlay');
    const sidebar = document.getElementById('app-sidebar');

    if (menuToggle && sidebar && overlay) {
      menuToggle.addEventListener('click', () => {
        sidebar.classList.add('mobile-open');
        overlay.classList.add('active');
      });

      overlay.addEventListener('click', () => {
        this.closeMobileDrawer();
      });
    }

    // Navegación Sidebar y Bottom Nav
    document.querySelectorAll('.nav-item-btn, .mobile-nav-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = btn.getAttribute('data-view');
        if (view) {
          window.location.hash = `#${view}`;
        }
      });
    });
  }

  closeMobileDrawer() {
    const sidebar = document.getElementById('app-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (overlay) overlay.classList.remove('active');
  }
}

// Inicialización inmediata y robusta de la aplicación
function bootstrapMiHumm() {
  if (!window.MiHummApp) {
    window.MiHummApp = new App();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapMiHumm);
} else {
  bootstrapMiHumm();
}

export { App };
