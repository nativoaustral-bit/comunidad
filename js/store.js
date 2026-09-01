/**
 * MI HUMM - STORE & CAPA DE DATOS (PERSISTENCIA LOCAL & AISLAMIENTO MULTI-EMPRENDIMIENTO)
 * Comunidad Humm Co-Creation
 */

const STORAGE_KEY = 'mi_humm_db_prod_v1';

// Catálogo maestro inicial de Herramientas Humm
const INITIAL_TOOLS = [
  {
    id: 'tool-reloop',
    name: 'ReLoop',
    description: 'Optimiza tus procesos comerciales, recompra y fidelización de clientes.',
    category: 'Ventas',
    status: 'disponible',
    url: 'https://reloop.humm.cl',
    icon: 'reloop',
    order: 1,
    isVisible: true,
    isIncluded: true
  },
  {
    id: 'tool-hummailing',
    name: 'Hummailing',
    description: 'Envía comunicaciones y campañas efectivas y personalizadas a tu lista de clientes.',
    category: 'Comunicación',
    status: 'disponible',
    url: 'https://mailing.humm.cl',
    icon: 'mail',
    order: 2,
    isVisible: true,
    isIncluded: true
  },
  {
    id: 'tool-kinetic',
    name: 'Kinetic Control',
    description: 'Supervisa y organiza las operaciones diarias y tiempos de tu negocio.',
    category: 'Gestión',
    status: 'disponible',
    url: 'https://kinetic.humm.cl',
    icon: 'activity',
    order: 3,
    isVisible: true,
    isIncluded: true
  },
  {
    id: 'tool-humm-radar',
    name: 'Humm Radar',
    description: 'Diagnostica la salud de tu emprendimiento y descubre oportunidades de mejora.',
    category: 'Diagnóstico',
    status: 'disponible',
    url: 'https://radar.humm.cl',
    icon: 'radar',
    order: 4,
    isVisible: true,
    isIncluded: true
  },
  {
    id: 'tool-humm-link',
    name: 'Humm Link',
    description: 'Tu vitrina digital y enlace directo con botones de compra para bio y redes.',
    category: 'Comunicación',
    status: 'disponible',
    url: 'https://link.humm.cl',
    icon: 'link',
    order: 5,
    isVisible: true,
    isIncluded: true
  },
  {
    id: 'tool-orientador',
    name: 'Orientador de Financiamiento',
    description: 'Descubre fondos concursables, subsidios y opciones de financiamiento para tu etapa.',
    category: 'Financiamiento',
    status: 'proximamente',
    url: 'https://fondos.humm.cl',
    icon: 'dollar-sign',
    order: 6,
    isVisible: true,
    isIncluded: false
  }
];

const INITIAL_DISCOUNTS = [];

// Semilla de datos iniciales limpia (Partida de cero en producción)
const INITIAL_STATE = {
  workspaces: [],
  supportRequests: [],
  broadcasts: [],
  companyDiscounts: [],
  users: [
    {
      id: 'usr-admin',
      name: 'Administrador Humm',
      email: 'admin@humm.cl',
      password: 'admin',
      role: 'admin',
      workspaceId: null,
      avatar: 'AH',
      theme: 'light',
      lastAccess: null,
      isActive: true,
      assignedToolIds: [],
      createdAt: '2026-01-01T08:00:00.000Z'
    }
  ],
  subscriptionPlans: [
    {
      id: 'plan-base',
      name: 'Plan Emprendedor Base',
      price: 19990,
      trialDays: 14,
      description: 'Acceso a herramientas esenciales de gestión comercial y red de apoyo.',
      features: ['2 Herramientas Humm a elección', '14 días de prueba gratuita', 'Soporte y comunidad', 'Acceso a red de convenios'],
      status: 'active',
      order: 1
    },
    {
      id: 'plan-crecimiento',
      name: 'Plan Crecimiento Humm',
      price: 34990,
      trialDays: 30,
      description: 'El plan más popular para negocios en expansión. Acceso a todas las herramientas y tutoría.',
      features: ['Todas las herramientas Humm habilitadas', '30 días de prueba gratuita', 'Tutor y ejecutivo exclusivo', 'Descuentos de empresas colaboradoras'],
      status: 'active',
      order: 2
    },
    {
      id: 'plan-pro',
      name: 'Plan Pro Co-Creation',
      price: 59990,
      trialDays: 0,
      description: 'Máximo nivel de acompañamiento con consultoría 1 a 1 y vitrina comercial destacada.',
      features: ['Suite completa de soluciones Humm', 'Mentorías personalizadas mensuales', 'Vitrina y difusión destacada', 'Sin periodo de prueba (Pago directo)'],
      status: 'active',
      order: 3
    }
  ],
  subscriptions: [],
  tools: INITIAL_TOOLS,
  tasks: [],
  sales: [],
  customers: [],
  opportunities: [],
  events: [],
  calendarSettings: [],
  notes: []
};

class Store {
  constructor() {
    this.listeners = [];
    this.data = this.loadState();
  }

  // Carga el estado desde LocalStorage o inicia con la semilla limpia
  loadState() {
    try {
      // Limpiar versiones anteriores con datos de prueba
      try {
        localStorage.removeItem('mi_humm_db_v1');
        localStorage.removeItem('mi_humm_db_v0');
      } catch (e) {}

      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        
        let loadedUsers = (parsed.users || INITIAL_STATE.users).filter(u => 
          u.email.toLowerCase() === 'admin@humm.cl' || 
          (!['usr-carolina', 'usr-juan', 'usr-ignacia', 'usr-diego', 'usr-patricia', 'usr-valentina'].includes(u.id) &&
           !['carolina@humm.cl', 'juan@humm.cl', 'ignacia@humm.cl', 'diego@humm.cl', 'patricia@humm.cl', 'valentina@humm.cl'].includes(u.email.toLowerCase()))
        );

        // Asegurar que el administrador siempre esté disponible
        const adminExists = loadedUsers.some(u => u.email.toLowerCase() === 'admin@humm.cl');
        if (!adminExists) {
          loadedUsers.push(INITIAL_STATE.users[0]);
        }

        const loadedWorkspaces = (parsed.workspaces || []).filter(w => !['ws-taller-austral', 'ws-cafe-valle', 'ws-bio-patagonia', 'ws-nativa-gourmet'].includes(w.id));

        return {
          workspaces: loadedWorkspaces,
          users: loadedUsers,
          subscriptionPlans: parsed.subscriptionPlans || INITIAL_STATE.subscriptionPlans,
          subscriptions: (parsed.subscriptions || []).filter(s => !['sub-carolina', 'sub-juan', 'sub-ignacia', 'sub-diego', 'sub-patricia'].includes(s.id)),
          tools: parsed.tools || INITIAL_TOOLS,
          tasks: (parsed.tasks || []).filter(t => !['ws-taller-austral', 'ws-cafe-valle', 'ws-bio-patagonia', 'ws-nativa-gourmet'].includes(t.workspaceId)),
          sales: (parsed.sales || []).filter(s => !['ws-taller-austral', 'ws-cafe-valle', 'ws-bio-patagonia', 'ws-nativa-gourmet'].includes(s.workspaceId)),
          customers: (parsed.customers || []).filter(c => !['ws-taller-austral', 'ws-cafe-valle', 'ws-bio-patagonia', 'ws-nativa-gourmet'].includes(c.workspaceId)),
          opportunities: (parsed.opportunities || []).filter(o => !['ws-taller-austral', 'ws-cafe-valle', 'ws-bio-patagonia', 'ws-nativa-gourmet'].includes(o.workspaceId)),
          supportRequests: (parsed.supportRequests || []).filter(sr => !['ws-taller-austral', 'ws-cafe-valle', 'ws-bio-patagonia', 'ws-nativa-gourmet'].includes(sr.workspaceId)),
          broadcasts: parsed.broadcasts || [],
          companyDiscounts: (parsed.companyDiscounts || []).filter(d => !['disc-1', 'disc-2', 'disc-3', 'disc-4', 'disc-5', 'disc-6'].includes(d.id)),
          events: (parsed.events || []).filter(e => !['ws-taller-austral', 'ws-cafe-valle', 'ws-bio-patagonia', 'ws-nativa-gourmet'].includes(e.workspaceId)),
          calendarSettings: (parsed.calendarSettings || []).filter(cs => !['ws-taller-austral', 'ws-cafe-valle', 'ws-bio-patagonia', 'ws-nativa-gourmet'].includes(cs.workspaceId)),
          notes: (parsed.notes || []).filter(n => !['ws-taller-austral', 'ws-cafe-valle', 'ws-bio-patagonia', 'ws-nativa-gourmet'].includes(n.workspaceId))
        };
      }
    } catch (err) {
      console.warn('Error reading from localStorage, using initial state:', err);
    }
    this.saveState(INITIAL_STATE);
    return JSON.parse(JSON.stringify(INITIAL_STATE));
  }

  // Guarda en LocalStorage y notifica suscriptores
  saveState(stateToSave = null) {
    if (stateToSave) {
      this.data = stateToSave;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (err) {
      console.error('Error saving state to localStorage:', err);
    }
    this.notify();
  }

  // Sincronización transparente con la API MySQL en HostGator
  async syncWithBackend(role = 'entrepreneur', workspaceId = null) {
    if (typeof window === 'undefined' || !window.fetch) return;
    try {
      const url = `api/data.php?role=${encodeURIComponent(role)}&workspace_id=${encodeURIComponent(workspaceId || '')}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          if (Array.isArray(json.data.tools)) this.data.tools = json.data.tools.length > 0 ? json.data.tools : INITIAL_TOOLS;
          if (Array.isArray(json.data.company_discounts)) this.data.companyDiscounts = json.data.company_discounts.length > 0 ? json.data.company_discounts : INITIAL_DISCOUNTS;
          if (Array.isArray(json.data.subscription_plans)) this.data.subscriptionPlans = json.data.subscription_plans.length > 0 ? json.data.subscription_plans : INITIAL_STATE.subscriptionPlans;
          if (Array.isArray(json.data.users)) this.data.users = json.data.users;
          if (Array.isArray(json.data.workspaces)) this.data.workspaces = json.data.workspaces;
          if (Array.isArray(json.data.subscriptions)) this.data.subscriptions = json.data.subscriptions;
          if (Array.isArray(json.data.customers)) this.data.customers = json.data.customers;
          if (Array.isArray(json.data.sales)) this.data.sales = json.data.sales;
          if (Array.isArray(json.data.tasks)) this.data.tasks = json.data.tasks;
          if (Array.isArray(json.data.calendar_events)) this.data.calendarEvents = json.data.calendar_events;
          if (Array.isArray(json.data.quick_notes)) this.data.quickNotes = json.data.quick_notes;
          if (Array.isArray(json.data.opportunities)) this.data.opportunities = json.data.opportunities;
          this.saveState();
          this.notify();
        }
      }
    } catch (e) {
      // Modo offline transparente
    }
  }

  // Mutación en background hacia MySQL en HostGator
  async apiSave(entity, item, action = 'save') {
    if (typeof window === 'undefined' || !window.fetch) return;
    try {
      await fetch('api/save.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity, item, action })
      });
    } catch (e) {
      // Offline fallback
    }
  }

  // Reinicia los datos a los de fábrica
  resetToDefault() {
    this.data = JSON.parse(JSON.stringify(INITIAL_STATE));
    this.saveState();
  }

  subscribe(fn) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  notify() {
    if (this.listeners && Array.isArray(this.listeners)) {
      this.listeners.forEach(fn => {
        try { fn(this.data); } catch(err) { console.error('Listener error in store:', err); }
      });
    }
  }

  // =========================================================================
  // WORKSPACES & USERS
  // =========================================================================
  getWorkspace(workspaceId) {
    return this.data.workspaces.find(w => w.id === workspaceId) || null;
  }

  getAllWorkspaces() {
    return [...this.data.workspaces];
  }

  updateWorkspace(workspaceId, updates) {
    const idx = this.data.workspaces.findIndex(w => w.id === workspaceId);
    if (idx !== -1) {
      this.data.workspaces[idx] = { ...this.data.workspaces[idx], ...updates };
      this.saveState();
      this.apiSave('workspaces', this.data.workspaces[idx], 'save');
      return this.data.workspaces[idx];
    }
    return null;
  }

  deleteWorkspace(workspaceId) {
    const idx = this.data.workspaces.findIndex(w => w.id === workspaceId);
    if (idx !== -1) {
      this.data.workspaces.splice(idx, 1);
      this.saveState();
      this.apiSave('workspaces', { id: workspaceId }, 'delete');
      return true;
    }
    return false;
  }

  createWorkspace(workspaceData) {
    const id = 'ws-' + Date.now();
    const ownerFirst = (workspaceData.ownerFirstName || '').trim();
    const ownerLast = (workspaceData.ownerLastName || '').trim();
    const computedOwner = workspaceData.ownerName || (ownerFirst ? `${ownerFirst} ${ownerLast}`.trim() : 'Titular');

    const newWs = {
      id,
      name: workspaceData.name || 'Nuevo Emprendimiento',
      rut: workspaceData.rut || '',
      ownerFirstName: ownerFirst,
      ownerLastName: ownerLast,
      ownerName: computedOwner,
      email: workspaceData.email || '',
      phone: workspaceData.phone || '',
      region: workspaceData.region || '',
      comuna: workspaceData.comuna || workspaceData.city || '',
      city: workspaceData.comuna || workspaceData.city || '',
      locality: workspaceData.locality || '',
      address: workspaceData.address || '',
      industry: workspaceData.industry || '',
      description: workspaceData.description || '',
      membershipStatus: 'active',
      membershipType: workspaceData.membershipType || 'Membresía Humm Co-Creation',
      advisorName: (workspaceData.advisorName && workspaceData.advisorName.trim()) ? workspaceData.advisorName.trim() : null,
      advisorEmail: (workspaceData.advisorEmail && workspaceData.advisorEmail.trim()) ? workspaceData.advisorEmail.trim() : null,
      createdAt: new Date().toISOString(),
      assignedTools: ['tool-reloop', 'tool-hummailing', 'tool-kinetic', 'tool-humm-radar', 'tool-humm-link']
    };
    this.data.workspaces.push(newWs);
    this.saveState();
    this.apiSave('workspaces', newWs, 'save');
    return newWs;
  }

  getAvailableAdvisors() {
    const users = this.getAllUsers();
    const workspaces = this.getAllWorkspaces();
    const advisorMap = new Map();

    // 1. Usuarios con rol admin o advisor
    users.filter(u => u.role === 'admin' || u.role === 'advisor').forEach(u => {
      if (u.email && !advisorMap.has(u.email.toLowerCase())) {
        advisorMap.set(u.email.toLowerCase(), {
          name: u.name,
          email: u.email
        });
      }
    });

    // 2. Tutores registrados en workspaces existentes
    workspaces.forEach(w => {
      if (w.advisorEmail && w.advisorName && !advisorMap.has(w.advisorEmail.toLowerCase())) {
        advisorMap.set(w.advisorEmail.toLowerCase(), {
          name: w.advisorName,
          email: w.advisorEmail
        });
      }
    });

    return Array.from(advisorMap.values());
  }

  // =========================================================================
  // MÉTRICAS Y ALERTAS GLOBALES DE LA COMUNIDAD (ADMINISTRADOR HUMM)
  // =========================================================================
  getCommunityMetrics() {
    const workspaces = this.getAllWorkspaces();
    const users = this.getAllUsers();
    const supportRequests = this.getSupportRequests();
    const tasks = this.data.tasks || [];
    const sales = this.data.sales || [];
    const customers = this.data.customers || [];
    const opportunities = this.data.opportunities || [];

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Ventas de la comunidad en el mes actual
    const currentMonthSales = sales
      .filter(s => parseInt(s.year, 10) === currentYear && parseInt(s.month, 10) === currentMonth)
      .reduce((sum, s) => sum + (parseInt(s.amount, 10) || 0), 0);

    // Ventas de la comunidad acumuladas en el año
    const currentYearSales = sales
      .filter(s => parseInt(s.year, 10) === currentYear)
      .reduce((sum, s) => sum + (parseInt(s.amount, 10) || 0), 0);

    // Tareas
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const activeTasks = tasks.filter(t => t.status !== 'done').length;

    // Oportunidades
    const openOpps = opportunities.filter(o => o.status !== 'ganada' && o.status !== 'no_concretado');
    const pipelineValue = openOpps.reduce((sum, o) => sum + (parseInt(o.estimatedAmount, 10) || 0), 0);

    // Actividad reciente (usuarios activos en los últimos 7 días)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activeRecentUsers = users.filter(u => u.lastAccess && new Date(u.lastAccess) >= sevenDaysAgo).length;

    return {
      totalMembers: workspaces.length,
      activeMembers: workspaces.filter(w => w.membershipStatus === 'active').length,
      activeUsers: users.filter(u => u.isActive).length,
      totalUsers: users.length,
      activeRecentUsers,
      currentMonthSales,
      currentYearSales,
      totalCustomers: customers.length,
      completedTasks,
      activeTasks,
      totalTasks: tasks.length,
      openOpportunitiesCount: openOpps.length,
      pipelineValue,
      pendingSupportRequests: supportRequests.filter(r => r.status === 'pendiente').length,
      inProgressSupportRequests: supportRequests.filter(r => r.status === 'en_proceso').length,
      totalSupportRequests: supportRequests.length
    };
  }

  getCommunityAlerts() {
    const alerts = [];
    const workspaces = this.getAllWorkspaces();
    const users = this.getAllUsers();
    const supportRequests = this.getSupportRequests();
    const sales = this.data.sales || [];
    const opportunities = this.data.opportunities || [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // 1. Solicitudes de apoyo pendientes
    supportRequests.filter(r => r.status === 'pendiente').forEach(req => {
      const ws = this.getWorkspace(req.workspaceId);
      alerts.push({
        id: `alert-req-${req.id}`,
        type: 'support_pending',
        severity: 'critical', // 'critical', 'warning', 'info'
        title: `Solicitud de apoyo pendiente: ${req.userName} (${ws ? ws.name : 'Emprendimiento'})`,
        description: `Requerimiento: "${req.subject}". Tutor asignado: ${req.advisorName}. Esperando respuesta.`,
        workspaceId: req.workspaceId,
        advisorName: req.advisorName,
        advisorEmail: req.advisorEmail,
        actionLabel: 'Atender solicitud',
        targetTab: 'requests',
        createdAt: req.createdAt
      });
    });

    // 2. Emprendedores sin ventas registradas en el mes actual
    workspaces.forEach(ws => {
      const hasSaleThisMonth = sales.some(s => s.workspaceId === ws.id && parseInt(s.year, 10) === currentYear && parseInt(s.month, 10) === currentMonth);
      if (!hasSaleThisMonth && ws.membershipStatus === 'active') {
        alerts.push({
          id: `alert-nosale-${ws.id}`,
          type: 'no_sales',
          severity: 'warning',
          title: `Sin registro de ventas este mes: ${ws.name}`,
          description: `No ha reportado ventas para ${now.toLocaleString('es-CL', { month: 'long' })}. Conviene que su tutor (${ws.advisorName || 'Equipo Humm'}) haga seguimiento.`,
          workspaceId: ws.id,
          advisorName: ws.advisorName,
          advisorEmail: ws.advisorEmail,
          actionLabel: 'Ver emprendimiento',
          targetTab: 'members',
          createdAt: new Date().toISOString()
        });
      }
    });

    // 3. Oportunidades comerciales atrasadas en la comunidad
    opportunities.filter(o => o.status !== 'ganada' && o.status !== 'no_concretado' && o.followUpDate && isDateOverdue(o.followUpDate)).forEach(opp => {
      const ws = this.getWorkspace(opp.workspaceId);
      alerts.push({
        id: `alert-opp-${opp.id}`,
        type: 'overdue_opportunity',
        severity: 'warning',
        title: `Oportunidad con seguimiento vencido en ${ws ? ws.name : 'Emprendimiento'}`,
        description: `Oportunidad "${opp.title}" (${opp.estimatedAmount ? formatCLP(opp.estimatedAmount) : 'Sin monto'}) con fecha de seguimiento vencida el ${formatDateCL(opp.followUpDate)}.`,
        workspaceId: opp.workspaceId,
        advisorName: ws ? ws.advisorName : 'Equipo Humm',
        advisorEmail: ws ? ws.advisorEmail : 'contacto@humm.cl',
        actionLabel: 'Auditar espacio',
        targetTab: 'members',
        createdAt: opp.updatedAt || opp.createdAt
      });
    });

    // 4. Miembros inactivos sin ingresar en más de 7 días
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    users.filter(u => u.role === 'entrepreneur' && u.isActive && (!u.lastAccess || new Date(u.lastAccess) < sevenDaysAgo)).forEach(u => {
      const ws = this.getWorkspace(u.workspaceId);
      alerts.push({
        id: `alert-inactive-${u.id}`,
        type: 'inactive_user',
        severity: 'info',
        title: `Emprendedor sin actividad reciente: ${u.name}`,
        description: `No ha ingresado a la plataforma en los últimos 7 días. Último acceso: ${u.lastAccess ? formatDateCL(u.lastAccess) : 'Nunca'}.`,
        workspaceId: u.workspaceId,
        advisorName: ws ? ws.advisorName : 'Equipo Humm',
        advisorEmail: ws ? ws.advisorEmail : 'contacto@humm.cl',
        actionLabel: 'Ver miembro',
        targetTab: 'members',
        createdAt: u.lastAccess || u.createdAt
      });
    });

    return alerts;
  }

  /**
   * Obtiene todos los clientes consolidados de la comunidad con los datos de su emprendimiento
   */
  getAllCommunityCustomers() {
    const allCustomers = [];
    const workspaces = this.getAllWorkspaces();
    const wsMap = new Map(workspaces.map(w => [w.id, w]));

    (this.data.customers || []).forEach(cust => {
      const ws = wsMap.get(cust.workspaceId);
      allCustomers.push({
        ...cust,
        workspaceName: ws ? ws.name : 'Emprendimiento',
        workspaceIndustry: ws ? ws.industry : '',
        workspaceCity: ws ? (ws.comuna || ws.city || '') : ''
      });
    });

    return allCustomers.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }

  /**
   * Obtiene resumen de tutores/asesores con carga de emprendimientos, usuarios y solicitudes
   */
  getAdvisorsSummary() {
    const workspaces = this.getAllWorkspaces();
    const users = this.getAllUsers();
    const requests = this.getSupportRequests();

    const advisorsMap = new Map();

    // Tutores base del ecosistema Humm
    const baseAdvisors = [
      { name: 'Valentina Castro', email: 'valentina@humm.cl' },
      { name: 'Rodrigo Merino', email: 'rodrigo@humm.cl' },
      { name: 'Camila Fuentes', email: 'camila@humm.cl' }
    ];

    baseAdvisors.forEach(b => {
      const key = `${b.name}__${b.email}`;
      advisorsMap.set(key, {
        name: b.name,
        email: b.email,
        workspaces: [],
        users: [],
        pendingRequestsCount: 0,
        totalRequestsCount: 0
      });
    });

    workspaces.forEach(ws => {
      const advName = ws.advisorName || 'Valentina Castro';
      const advEmail = ws.advisorEmail || 'valentina@humm.cl';
      const key = `${advName}__${advEmail}`;

      if (!advisorsMap.has(key)) {
        advisorsMap.set(key, {
          name: advName,
          email: advEmail,
          workspaces: [],
          users: [],
          pendingRequestsCount: 0,
          totalRequestsCount: 0
        });
      }

      const adv = advisorsMap.get(key);
      if (!adv.workspaces.some(w => w.id === ws.id)) {
        adv.workspaces.push(ws);
      }
    });

    users.forEach(u => {
      if (u.role === 'admin' || u.role === 'advisor') return;
      const ws = u.workspaceId ? workspaces.find(w => w.id === u.workspaceId) : null;
      const advName = u.advisorName || (ws ? ws.advisorName : null) || 'Valentina Castro';
      const advEmail = u.advisorEmail || (ws ? ws.advisorEmail : null) || 'valentina@humm.cl';
      const key = `${advName}__${advEmail}`;

      if (!advisorsMap.has(key)) {
        advisorsMap.set(key, {
          name: advName,
          email: advEmail,
          workspaces: [],
          users: [],
          pendingRequestsCount: 0,
          totalRequestsCount: 0
        });
      }

      const adv = advisorsMap.get(key);
      if (!adv.users.some(item => item.id === u.id)) {
        adv.users.push(u);
      }
    });

    requests.forEach(req => {
      const advName = req.advisorName || 'Valentina Castro';
      const advEmail = req.advisorEmail || 'valentina@humm.cl';
      const key = `${advName}__${advEmail}`;

      if (advisorsMap.has(key)) {
        const adv = advisorsMap.get(key);
        adv.totalRequestsCount++;
        if (req.status === 'pendiente') {
          adv.pendingRequestsCount++;
        }
      }
    });

    return Array.from(advisorsMap.values());
  }

  assignAdvisorToUserOrWorkspace({ userId, workspaceId, advisorName, advisorEmail }) {
    if (userId) {
      const user = this.getUser(userId);
      if (user) {
        this.updateUser(userId, { advisorName, advisorEmail });
        if (user.workspaceId) {
          this.updateWorkspace(user.workspaceId, { advisorName, advisorEmail });
        }
      }
    } else if (workspaceId) {
      this.updateWorkspace(workspaceId, { advisorName, advisorEmail });
      this.data.users.forEach(u => {
        if (u.workspaceId === workspaceId) {
          u.advisorName = advisorName;
          u.advisorEmail = advisorEmail;
        }
      });
      this.saveState();
    }
    return true;
  }

  // =========================================================================
  // REQUERIMIENTOS Y SOLICITUDES DE APOYO HUMM
  // =========================================================================
  getSupportRequests(workspaceId = null) {
    if (!this.data.supportRequests) this.data.supportRequests = [];
    if (workspaceId) {
      return this.data.supportRequests
        .filter(r => r.workspaceId === workspaceId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return [...this.data.supportRequests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  createSupportRequest(workspaceId, requestData) {
    if (!this.data.supportRequests) this.data.supportRequests = [];
    const ws = this.getWorkspace(workspaceId);
    const newRequest = {
      id: 'req-' + Date.now(),
      workspaceId,
      userName: requestData.userName || (ws ? ws.ownerName : 'Emprendedor'),
      userEmail: requestData.userEmail || (ws ? ws.email : ''),
      requestType: requestData.requestType || 'Consulta general',
      subject: requestData.subject.trim(),
      description: requestData.description.trim(),
      contactPreference: requestData.contactPreference || 'Responder por correo',
      advisorName: ws ? (ws.advisorName || 'Equipo Humm') : 'Equipo Humm',
      advisorEmail: ws ? (ws.advisorEmail || 'contacto@humm.cl') : 'contacto@humm.cl',
      status: 'pendiente', // 'pendiente', 'en_proceso', 'respondido'
      createdAt: new Date().toISOString()
    };
    this.data.supportRequests.push(newRequest);
    this.saveState();
    return newRequest;
  }

  updateSupportRequestStatus(requestId, status) {
    if (!this.data.supportRequests) return null;
    const idx = this.data.supportRequests.findIndex(r => r.id === requestId);
    if (idx !== -1) {
      this.data.supportRequests[idx].status = status;
      this.data.supportRequests[idx].updatedAt = new Date().toISOString();
      this.saveState();
      return this.data.supportRequests[idx];
    }
    return null;
  }

  // =========================================================================
  // COMUNICADOS, NOTICIAS Y OFERTAS DE LA COMUNIDAD (DIFUSIÓN MASIVA)
  // =========================================================================
  getBroadcasts() {
    if (!this.data.broadcasts) {
      this.data.broadcasts = [];
    }
    return [...this.data.broadcasts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  createBroadcast(broadcastData) {
    if (!this.data.broadcasts) {
      this.data.broadcasts = [];
    }
    const newBroadcast = {
      id: 'bc-' + Date.now(),
      title: broadcastData.title || 'Comunicado Comunidad Humm',
      category: broadcastData.category || 'Noticia de la Comunidad',
      targetAudience: broadcastData.targetAudience || 'Todos los Emprendedores',
      content: broadcastData.content || '',
      authorName: broadcastData.authorName || 'Administración Humm',
      channels: broadcastData.channels || ['Notificación en Mi Humm'],
      reachCount: broadcastData.reachCount || this.getAllWorkspaces().length,
      createdAt: new Date().toISOString()
    };
    this.data.broadcasts.unshift(newBroadcast);
    this.saveState();
    return newBroadcast;
  }

  deleteBroadcast(id) {
    if (!this.data.broadcasts) return false;
    const initialLen = this.data.broadcasts.length;
    this.data.broadcasts = this.data.broadcasts.filter(b => b.id !== id);
    if (this.data.broadcasts.length !== initialLen) {
      this.saveState();
      return true;
    }
    return false;
  }

  // =========================================================================
  // DESCUENTOS Y CONVENIOS CON OTRAS EMPRESAS (ALIANZAS PARA LA COMUNIDAD)
  // =========================================================================
  getCompanyDiscounts(filter = null) {
    if (!this.data.companyDiscounts) {
      this.data.companyDiscounts = [];
    }
    let list = [...this.data.companyDiscounts];
    if (filter) {
      if (filter.category && filter.category !== 'all') {
        list = list.filter(d => d.category === filter.category);
      }
      if (filter.status) {
        list = list.filter(d => d.status === filter.status);
      }
    }
    return list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  }

  getCompanyDiscount(id) {
    if (!this.data.companyDiscounts) return null;
    return this.data.companyDiscounts.find(d => d.id === id) || null;
  }

  createCompanyDiscount(discountData) {
    if (!this.data.companyDiscounts) {
      this.data.companyDiscounts = [];
    }
    const newDiscount = {
      id: 'disc-' + Date.now(),
      companyName: discountData.companyName || 'Empresa Aliada',
      logo: discountData.logo || '🎁',
      discountTitle: discountData.discountTitle || 'Beneficio Exclusivo Humm',
      category: discountData.category || 'Servicios Generales',
      description: discountData.description || '',
      code: (discountData.code || '').trim().toUpperCase(),
      url: discountData.url || '',
      expiresAt: discountData.expiresAt || null,
      status: discountData.status || 'active',
      featured: !!discountData.featured,
      createdAt: new Date().toISOString()
    };
    this.data.companyDiscounts.unshift(newDiscount);
    this.saveState();
    this.apiSave('company_discounts', newDiscount, 'save');
    return newDiscount;
  }

  updateCompanyDiscount(id, updateData) {
    if (!this.data.companyDiscounts) return null;
    const idx = this.data.companyDiscounts.findIndex(d => d.id === id);
    if (idx !== -1) {
      this.data.companyDiscounts[idx] = {
        ...this.data.companyDiscounts[idx],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      this.saveState();
      this.apiSave('company_discounts', this.data.companyDiscounts[idx], 'save');
      return this.data.companyDiscounts[idx];
    }
    return null;
  }

  deleteCompanyDiscount(id) {
    if (!this.data.companyDiscounts) return false;
    const initialLen = this.data.companyDiscounts.length;
    this.data.companyDiscounts = this.data.companyDiscounts.filter(d => d.id !== id);
    if (this.data.companyDiscounts.length !== initialLen) {
      this.saveState();
      this.apiSave('company_discounts', { id }, 'delete');
      return true;
    }
    return false;
  }

  getUser(userId) {
    return this.data.users.find(u => u.id === userId) || null;
  }

  getUserByEmail(email) {
    if (!email) return null;
    const clean = email.trim().toLowerCase();
    
    // 1. Coincidencia exacta de correo
    let found = this.data.users.find(u => u.email && u.email.toLowerCase() === clean);
    if (found) return found;

    // 2. Coincidencia por nombre de usuario (ej. 'admin' o 'carolina')
    if (!clean.includes('@')) {
      found = this.data.users.find(u => u.email && u.email.toLowerCase().startsWith(clean + '@'));
      if (found) return found;
    }

    // 3. Coincidencia por correo de contacto del emprendimiento
    const ws = this.data.workspaces.find(w => w.email && w.email.toLowerCase() === clean);
    if (ws) {
      found = this.data.users.find(u => u.workspaceId === ws.id);
      if (found) return found;
    }

    return null;
  }

  getAllUsers() {
    return [...this.data.users];
  }

  updateUser(userId, updates) {
    const idx = this.data.users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      this.data.users[idx] = { ...this.data.users[idx], ...updates };
      this.saveState();
      return this.data.users[idx];
    }
    return null;
  }

  createUser(userData) {
    const id = 'usr-' + Date.now();
    const newUser = {
      id,
      name: userData.name || '',
      email: userData.email.trim().toLowerCase(),
      password: userData.password || 'humm2026',
      role: userData.role || 'entrepreneur',
      workspaceId: userData.workspaceId || null,
      avatar: (userData.name || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
      theme: 'light',
      lastAccess: null,
      isActive: userData.isActive !== undefined ? !!userData.isActive : true,
      assignedToolIds: Array.isArray(userData.assignedToolIds) ? userData.assignedToolIds : [],
      createdAt: new Date().toISOString()
    };
    this.data.users.push(newUser);
    this.saveState();
    return newUser;
  }

  toggleUserStatus(userId) {
    const user = this.getUser(userId);
    if (user) {
      user.isActive = !user.isActive;
      this.saveState();
      return user;
    }
    return null;
  }

  deleteUser(userId) {
    const prevLen = this.data.users.length;
    this.data.users = this.data.users.filter(u => u.id !== userId);
    if (this.data.users.length !== prevLen) {
      this.saveState();
      return true;
    }
    return false;
  }

  getUserTools(userId) {
    const user = this.getUser(userId);
    const allTools = this.getAllTools();
    if (!user || !user.assignedToolIds || user.assignedToolIds.length === 0) {
      // Si no tiene asignaciones específicas o es admin, ve todas las herramientas
      return allTools;
    }
    return allTools.filter(t => user.assignedToolIds.includes(t.id));
  }

  // =========================================================================
  // HERRAMIENTAS HUMM (CATÁLOGO & ASIGNACIONES)
  // =========================================================================
  getAllTools() {
    return [...this.data.tools].sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  getToolsForWorkspace(workspaceId) {
    const ws = this.getWorkspace(workspaceId);
    if (!ws) return [];
    const assignedIds = ws.assignedTools || [];
    return this.getAllTools().filter(t => t.isVisible && assignedIds.includes(t.id));
  }

  createTool(toolData) {
    const id = 'tool-' + Date.now();
    const newTool = {
      id,
      name: toolData.name || 'Nueva Herramienta',
      description: toolData.description || '',
      category: toolData.category || 'Gestión',
      status: toolData.status || 'disponible',
      url: toolData.url || 'https://humm.cl',
      icon: toolData.icon || '🚀',
      order: toolData.order || (this.data.tools.length + 1),
      isVisible: toolData.isVisible !== false,
      isIncluded: !!toolData.isIncluded
    };
    this.data.tools.push(newTool);
    this.saveState();
    this.apiSave('tools', newTool, 'save');
    return newTool;
  }

  updateTool(toolId, updates) {
    const idx = this.data.tools.findIndex(t => t.id === toolId);
    if (idx !== -1) {
      this.data.tools[idx] = { ...this.data.tools[idx], ...updates };
      this.saveState();
      this.apiSave('tools', this.data.tools[idx], 'save');
      return this.data.tools[idx];
    }
    return null;
  }

  deleteTool(toolId) {
    const idx = this.data.tools.findIndex(t => t.id === toolId);
    if (idx !== -1) {
      this.data.tools.splice(idx, 1);
      this.saveState();
      this.apiSave('tools', { id: toolId }, 'delete');
      return true;
    }
    return false;
  }

  toggleWorkspaceTool(workspaceId, toolId) {
    const ws = this.getWorkspace(workspaceId);
    if (!ws) return false;
    let assigned = [...(ws.assignedTools || [])];
    if (assigned.includes(toolId)) {
      assigned = assigned.filter(id => id !== toolId);
    } else {
      assigned.push(toolId);
    }
    this.updateWorkspace(workspaceId, { assignedTools: assigned });
    return true;
  }

  // =========================================================================
  // TAREAS (KANBAN AISLADO POR EMPRENDIMIENTO)
  // =========================================================================
  getTasks(workspaceId) {
    return this.data.tasks.filter(t => t.workspaceId === workspaceId);
  }

  getTask(taskId) {
    return this.data.tasks.find(t => t.id === taskId) || null;
  }

  createTask(workspaceId, taskData) {
    const newTask = {
      id: 'tsk-' + Date.now(),
      workspaceId,
      title: taskData.title.trim(),
      description: taskData.description ? taskData.description.trim() : '',
      status: taskData.status || 'todo', // 'todo', 'in_progress', 'done'
      priority: taskData.priority || 'media', // 'baja', 'media', 'alta'
      startDate: taskData.startDate || null,
      dueDate: taskData.dueDate || null,
      tag: taskData.tag ? taskData.tag.trim() : '',
      customerId: taskData.customerId || null,
      opportunityId: taskData.opportunityId || null,
      completedAt: taskData.status === 'done' ? new Date().toISOString() : null,
      createdAt: new Date().toISOString()
    };
    this.data.tasks.push(newTask);
    this.saveState();
    return newTask;
  }

  updateTask(taskId, updates) {
    const idx = this.data.tasks.findIndex(t => t.id === taskId);
    if (idx !== -1) {
      if (updates.status === 'done' && this.data.tasks[idx].status !== 'done') {
        updates.completedAt = new Date().toISOString();
      } else if (updates.status && updates.status !== 'done') {
        updates.completedAt = null;
      }
      this.data.tasks[idx] = { ...this.data.tasks[idx], ...updates, updatedAt: new Date().toISOString() };
      this.saveState();
      return this.data.tasks[idx];
    }
    return null;
  }

  deleteTask(taskId) {
    this.data.tasks = this.data.tasks.filter(t => t.id !== taskId);
    this.saveState();
    return true;
  }

  // =========================================================================
  // COLUMNAS KANBAN PERSONALIZABLES POR WORKSPACE
  // =========================================================================
  getKanbanColumns(workspaceId) {
    const ws = this.getWorkspace(workspaceId);
    if (ws && ws.kanbanColumns && Array.isArray(ws.kanbanColumns) && ws.kanbanColumns.length > 0) {
      return [...ws.kanbanColumns];
    }
    return [
      { id: 'todo', name: 'Por hacer', dotClass: 'dot-todo', isDefault: true },
      { id: 'in_progress', name: 'En proceso', dotClass: 'dot-progress', isDefault: true },
      { id: 'done', name: 'Terminadas', dotClass: 'dot-done', isDefault: true }
    ];
  }

  saveKanbanColumns(workspaceId, columns) {
    const ws = this.getWorkspace(workspaceId);
    if (ws) {
      ws.kanbanColumns = columns;
      this.saveState();
      return ws.kanbanColumns;
    }
    return null;
  }

  updateKanbanColumnName(workspaceId, columnId, newName) {
    const columns = this.getKanbanColumns(workspaceId);
    const col = columns.find(c => c.id === columnId);
    if (col && newName && newName.trim()) {
      col.name = newName.trim();
      this.saveKanbanColumns(workspaceId, columns);
      return col;
    }
    return null;
  }

  addKanbanColumn(workspaceId, columnName) {
    const columns = this.getKanbanColumns(workspaceId);
    const id = 'col_' + Date.now();
    const colorClasses = ['dot-info', 'dot-warning', 'dot-purple', 'dot-progress'];
    const colorIndex = (columns.length - 3) % colorClasses.length;
    const dotClass = colorClasses[colorIndex >= 0 ? colorIndex : 0];

    const newCol = {
      id,
      name: (columnName || 'Nueva etapa').trim(),
      dotClass,
      isDefault: false
    };

    // Insertar justo antes de la columna 'done' si existe, o al final
    const doneIndex = columns.findIndex(c => c.id === 'done');
    if (doneIndex !== -1) {
      columns.splice(doneIndex, 0, newCol);
    } else {
      columns.push(newCol);
    }

    this.saveKanbanColumns(workspaceId, columns);
    return newCol;
  }

  deleteKanbanColumn(workspaceId, columnId) {
    let columns = this.getKanbanColumns(workspaceId);
    if (columns.length <= 1) return false;

    // Si hay tareas asignadas a esta columna, moverlas a la primera columna disponible
    const fallbackCol = columns.find(c => c.id !== columnId)?.id || 'todo';
    if (this.data.tasks) {
      this.data.tasks.forEach(t => {
        if (t.workspaceId === workspaceId && t.status === columnId) {
          t.status = fallbackCol;
        }
      });
    }

    columns = columns.filter(c => c.id !== columnId);
    this.saveKanbanColumns(workspaceId, columns);
    return true;
  }

  resetKanbanColumns(workspaceId) {
    const defaults = [
      { id: 'todo', name: 'Por hacer', dotClass: 'dot-todo', isDefault: true },
      { id: 'in_progress', name: 'En proceso', dotClass: 'dot-progress', isDefault: true },
      { id: 'done', name: 'Terminadas', dotClass: 'dot-done', isDefault: true }
    ];
    this.saveKanbanColumns(workspaceId, defaults);
    return defaults;
  }

  // =========================================================================
  // VENTAS (REGISTRO POR FECHA, CLIENTE, SEGUIMIENTO DE PAGO & HISTÓRICO)
  // =========================================================================
  getSales(workspaceId) {
    return this.data.sales
      .filter(s => s.workspaceId === workspaceId)
      .sort((a, b) => {
        const dateA = a.date || `${a.year}-${String(a.month).padStart(2, '0')}-01`;
        const dateB = b.date || `${b.year}-${String(b.month).padStart(2, '0')}-01`;
        return dateA.localeCompare(dateB);
      });
  }

  getSale(saleId) {
    return this.data.sales.find(s => s.id === saleId) || null;
  }

  saveMonthlySale(workspaceId, saleData) {
    let year = saleData.year ? parseInt(saleData.year, 10) : null;
    let month = saleData.month ? parseInt(saleData.month, 10) : null;
    const date = saleData.date ? saleData.date : null;

    if (date) {
      const parts = date.split('-');
      if (parts.length === 3) {
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
      }
    }

    if (!year || !month) {
      const now = new Date();
      year = year || now.getFullYear();
      month = month || (now.getMonth() + 1);
    }

    const amount = Math.max(0, parseInt(saleData.amount, 10) || 0);
    const notes = saleData.notes ? saleData.notes.trim() : '';
    const customerId = saleData.customerId || null;
    const paymentStatus = saleData.paymentStatus || 'pagado';
    const dueDate = saleData.dueDate || null;
    const editId = saleData.id || null;

    if (editId) {
      const idx = this.data.sales.findIndex(s => s.id === editId);
      if (idx !== -1) {
        this.data.sales[idx] = {
          ...this.data.sales[idx],
          date: date || this.data.sales[idx].date || `${year}-${String(month).padStart(2, '0')}-15`,
          year,
          month,
          amount,
          notes,
          customerId,
          paymentStatus,
          dueDate,
          updatedAt: new Date().toISOString()
        };
        this.saveState();
        return this.data.sales[idx];
      }
    }

    const newSale = {
      id: 'sal-' + Date.now(),
      workspaceId,
      date: date || `${year}-${String(month).padStart(2, '0')}-15`,
      year,
      month,
      amount,
      notes,
      customerId,
      paymentStatus,
      dueDate,
      createdAt: new Date().toISOString()
    };
    this.data.sales.push(newSale);
    this.saveState();
    return newSale;
  }

  updateSalePaymentStatus(saleId, paymentStatus) {
    const sale = this.getSale(saleId);
    if (sale) {
      sale.paymentStatus = paymentStatus;
      sale.updatedAt = new Date().toISOString();
      this.saveState();
      return sale;
    }
    return null;
  }

  deleteSale(saleId) {
    this.data.sales = this.data.sales.filter(s => s.id !== saleId);
    this.saveState();
    return true;
  }

  // =========================================================================
  // CLIENTES (CRM BÁSICO & WHATSAPP)
  // =========================================================================
  getCustomers(workspaceId) {
    return this.data.customers
      .filter(c => c.workspaceId === workspaceId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getCustomer(customerId) {
    return this.data.customers.find(c => c.id === customerId) || null;
  }

  createCustomer(workspaceId, customerData) {
    const newCustomer = {
      id: 'cli-' + Date.now(),
      workspaceId,
      firstName: customerData.firstName.trim(),
      lastName: customerData.lastName ? customerData.lastName.trim() : '',
      company: customerData.company ? customerData.company.trim() : '',
      phone: customerData.phone ? customerData.phone.trim() : '',
      email: customerData.email ? customerData.email.trim() : '',
      city: customerData.city ? customerData.city.trim() : '',
      sourceChannel: customerData.sourceChannel || 'Otro',
      status: customerData.status || 'active',
      notes: customerData.notes ? customerData.notes.trim() : '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.customers.push(newCustomer);
    this.saveState();
    return newCustomer;
  }

  updateCustomer(customerId, updates) {
    const idx = this.data.customers.findIndex(c => c.id === customerId);
    if (idx !== -1) {
      this.data.customers[idx] = {
        ...this.data.customers[idx],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.saveState();
      return this.data.customers[idx];
    }
    return null;
  }

  deleteCustomer(customerId) {
    this.data.customers = this.data.customers.filter(c => c.id !== customerId);
    this.saveState();
    return true;
  }

  // =========================================================================
  // OPORTUNIDADES (PIPELINE COMERCIAL)
  // =========================================================================
  getOpportunities(workspaceId) {
    return this.data.opportunities
      .filter(o => o.workspaceId === workspaceId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getOpportunity(oppId) {
    return this.data.opportunities.find(o => o.id === oppId) || null;
  }

  createOpportunity(workspaceId, oppData) {
    const newOpp = {
      id: 'opp-' + Date.now(),
      workspaceId,
      title: oppData.title.trim(),
      contactName: oppData.contactName.trim(),
      phone: oppData.phone ? oppData.phone.trim() : '',
      email: oppData.email ? oppData.email.trim() : '',
      productInterest: oppData.productInterest ? oppData.productInterest.trim() : '',
      estimatedAmount: oppData.estimatedAmount ? parseInt(oppData.estimatedAmount, 10) : 0,
      status: oppData.status || 'nuevo', // 'nuevo', 'contactado', 'interesado', 'propuesta', 'ganada', 'no_concretado'
      nextAction: oppData.nextAction ? oppData.nextAction.trim() : '',
      followUpDate: oppData.followUpDate || null,
      sourceChannel: oppData.sourceChannel || 'Otro',
      notes: oppData.notes ? oppData.notes.trim() : '',
      customerId: oppData.customerId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.opportunities.push(newOpp);
    this.saveState();
    return newOpp;
  }

  updateOpportunity(oppId, updates) {
    const idx = this.data.opportunities.findIndex(o => o.id === oppId);
    if (idx !== -1) {
      this.data.opportunities[idx] = {
        ...this.data.opportunities[idx],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.saveState();
      return this.data.opportunities[idx];
    }
    return null;
  }

  deleteOpportunity(oppId) {
    this.data.opportunities = this.data.opportunities.filter(o => o.id !== oppId);
    this.saveState();
    return true;
  }

  // =========================================================================
  // CALENDARIO, REUNIONES & INTEGRACIONES EXTERNAS
  // =========================================================================
  getEvents(workspaceId) {
    if (!this.data.events) this.data.events = [];
    return this.data.events
      .filter(e => e.workspaceId === workspaceId)
      .sort((a, b) => {
        const timeA = `${a.date} ${a.startTime || '00:00'}`;
        const timeB = `${b.date} ${b.startTime || '00:00'}`;
        return timeA.localeCompare(timeB);
      });
  }

  getEvent(eventId) {
    if (!this.data.events) this.data.events = [];
    return this.data.events.find(e => e.id === eventId) || null;
  }

  saveEvent(workspaceId, eventData) {
    if (!this.data.events) this.data.events = [];
    const editId = eventData.id || null;

    if (editId) {
      const idx = this.data.events.findIndex(e => e.id === editId);
      if (idx !== -1) {
        this.data.events[idx] = {
          ...this.data.events[idx],
          title: eventData.title.trim(),
          type: eventData.type || 'reunion',
          date: eventData.date,
          startTime: eventData.startTime || '09:00',
          endTime: eventData.endTime || '10:00',
          customerId: eventData.customerId || null,
          location: eventData.location ? eventData.location.trim() : '',
          meetUrl: eventData.meetUrl ? eventData.meetUrl.trim() : '',
          description: eventData.description ? eventData.description.trim() : '',
          updatedAt: new Date().toISOString()
        };
        this.saveState();
        return this.data.events[idx];
      }
    }

    const newEvent = {
      id: 'evt-' + Date.now(),
      workspaceId,
      title: eventData.title.trim(),
      type: eventData.type || 'reunion',
      date: eventData.date,
      startTime: eventData.startTime || '09:00',
      endTime: eventData.endTime || '10:00',
      customerId: eventData.customerId || null,
      location: eventData.location ? eventData.location.trim() : '',
      meetUrl: eventData.meetUrl ? eventData.meetUrl.trim() : '',
      description: eventData.description ? eventData.description.trim() : '',
      createdAt: new Date().toISOString()
    };
    this.data.events.push(newEvent);
    this.saveState();
    return newEvent;
  }

  deleteEvent(eventId) {
    if (!this.data.events) this.data.events = [];
    this.data.events = this.data.events.filter(e => e.id !== eventId);
    this.saveState();
    return true;
  }

  getCalendarSettings(workspaceId) {
    if (!this.data.calendarSettings) this.data.calendarSettings = [];
    let settings = this.data.calendarSettings.find(s => s.workspaceId === workspaceId);
    if (!settings) {
      settings = {
        workspaceId,
        googleConnected: true,
        googleEmail: 'demo@gmail.com',
        outlookConnected: false,
        outlookEmail: '',
        appleIcalActive: true,
        syncTasks: true,
        reminderMinutes: 15,
        updatedAt: new Date().toISOString()
      };
      this.data.calendarSettings.push(settings);
      this.saveState();
    }
    return settings;
  }

  saveCalendarSettings(workspaceId, newSettings) {
    if (!this.data.calendarSettings) this.data.calendarSettings = [];
    const idx = this.data.calendarSettings.findIndex(s => s.workspaceId === workspaceId);
    if (idx !== -1) {
      this.data.calendarSettings[idx] = {
        ...this.data.calendarSettings[idx],
        ...newSettings,
        updatedAt: new Date().toISOString()
      };
      this.saveState();
      return this.data.calendarSettings[idx];
    } else {
      const created = {
        workspaceId,
        ...newSettings,
        updatedAt: new Date().toISOString()
      };
      this.data.calendarSettings.push(created);
      this.saveState();
      return created;
    }
  }

  // =========================================================================
  // BLOC DE NOTAS RÁPIDAS
  // =========================================================================
  getNotes(workspaceId) {
    if (!this.data.notes) this.data.notes = [];
    return this.data.notes
      .filter(n => n.workspaceId === workspaceId)
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt);
      });
  }

  getNote(noteId) {
    if (!this.data.notes) this.data.notes = [];
    return this.data.notes.find(n => n.id === noteId) || null;
  }

  saveNote(workspaceId, noteData) {
    if (!this.data.notes) this.data.notes = [];
    const editId = noteData.id || null;

    if (editId) {
      const idx = this.data.notes.findIndex(n => n.id === editId);
      if (idx !== -1) {
        this.data.notes[idx] = {
          ...this.data.notes[idx],
          title: (noteData.title || '').trim() || 'Sin título',
          content: (noteData.content || '').trim(),
          category: noteData.category || 'general',
          color: noteData.color || 'yellow',
          pinned: noteData.pinned !== undefined ? !!noteData.pinned : this.data.notes[idx].pinned,
          updatedAt: new Date().toISOString()
        };
        this.saveState();
        return this.data.notes[idx];
      }
    }

    const newNote = {
      id: 'not-' + Date.now(),
      workspaceId,
      title: (noteData.title || '').trim() || 'Nota sin título',
      content: (noteData.content || '').trim(),
      category: noteData.category || 'general',
      color: noteData.color || 'yellow',
      pinned: !!noteData.pinned,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.notes.push(newNote);
    this.saveState();
    return newNote;
  }

  togglePinNote(noteId) {
    if (!this.data.notes) this.data.notes = [];
    const note = this.data.notes.find(n => n.id === noteId);
    if (note) {
      note.pinned = !note.pinned;
      note.updatedAt = new Date().toISOString();
      this.saveState();
      return note;
    }
    return null;
  }

  // =========================================================================
  // GESTIÓN DE PLANES DE VENTA MENSUAL Y SUSCRIPCIONES
  // =========================================================================
  getSubscriptionPlans() {
    if (!this.data.subscriptionPlans) {
      this.data.subscriptionPlans = INITIAL_STATE.subscriptionPlans ? [...INITIAL_STATE.subscriptionPlans] : [];
    }
    return [...this.data.subscriptionPlans];
  }

  getSubscriptionPlan(planId) {
    return this.getSubscriptionPlans().find(p => p.id === planId) || null;
  }

  createSubscriptionPlan(planData) {
    if (!this.data.subscriptionPlans) this.data.subscriptionPlans = [];
    const id = 'plan-' + Date.now();
    const newPlan = {
      id,
      name: (planData.name || '').trim(),
      price: parseInt(planData.price) || 0,
      trialDays: parseInt(planData.trialDays) || 0,
      description: (planData.description || '').trim(),
      features: Array.isArray(planData.features) ? planData.features : (planData.features || '').split('\n').map(f => f.trim()).filter(Boolean),
      status: planData.status || 'active',
      order: this.data.subscriptionPlans.length + 1,
      createdAt: new Date().toISOString()
    };
    this.data.subscriptionPlans.push(newPlan);
    this.saveState();
    return newPlan;
  }

  updateSubscriptionPlan(planId, updates) {
    if (!this.data.subscriptionPlans) this.data.subscriptionPlans = [];
    const idx = this.data.subscriptionPlans.findIndex(p => p.id === planId);
    if (idx !== -1) {
      if (updates.price !== undefined) updates.price = parseInt(updates.price) || 0;
      if (updates.trialDays !== undefined) updates.trialDays = parseInt(updates.trialDays) || 0;
      if (updates.features && typeof updates.features === 'string') {
        updates.features = updates.features.split('\n').map(f => f.trim()).filter(Boolean);
      }
      this.data.subscriptionPlans[idx] = {
        ...this.data.subscriptionPlans[idx],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.saveState();
      return this.data.subscriptionPlans[idx];
    }
    return null;
  }

  deleteSubscriptionPlan(planId) {
    if (!this.data.subscriptionPlans) this.data.subscriptionPlans = [];
    this.data.subscriptionPlans = this.data.subscriptionPlans.filter(p => p.id !== planId);
    this.saveState();
    return true;
  }

  getClientSubscriptions() {
    if (!this.data.subscriptions) {
      this.data.subscriptions = INITIAL_STATE.subscriptions ? [...INITIAL_STATE.subscriptions] : [];
    }

    // Sincronizar con nuevos usuarios emprendedores creados en la plataforma
    const users = this.getAllUsers().filter(u => u.role === 'entrepreneur');
    const workspaces = this.getAllWorkspaces();
    const defaultPlan = this.getSubscriptionPlans()[0] || { id: 'plan-base', name: 'Plan Emprendedor Base', price: 19990, trialDays: 14 };

    users.forEach(u => {
      const exists = this.data.subscriptions.some(s => s.userId === u.id);
      if (!exists) {
        const ws = u.workspaceId ? workspaces.find(w => w.id === u.workspaceId) : null;
        const subId = 'sub-' + u.id.replace('usr-', '');
        const newSub = {
          id: subId,
          userId: u.id,
          workspaceId: u.workspaceId || null,
          clientName: u.name,
          clientEmail: u.email,
          clientPhone: (ws && ws.phone) ? ws.phone : '+56900000000',
          businessName: ws ? ws.name : 'Emprendimiento',
          planId: defaultPlan.id,
          planName: defaultPlan.name,
          monthlyPrice: defaultPlan.price,
          status: 'trial',
          trialDaysTotal: defaultPlan.trialDays || 14,
          trialDaysLeft: defaultPlan.trialDays || 14,
          isTrial: (defaultPlan.trialDays || 14) > 0,
          paymentStatus: 'pending',
          joinedDate: u.createdAt ? u.createdAt.substring(0, 10) : new Date().toISOString().substring(0, 10),
          lastPaymentDate: null,
          nextBillingDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
          paymentMethod: 'Por definir (En prueba)',
          paymentLink: `https://pagos.humm.cl/checkout?sub=${subId}&monto=${defaultPlan.price}`
        };
        this.data.subscriptions.push(newSub);
      }
    });

    return [...this.data.subscriptions];
  }

  getClientSubscription(subId) {
    return this.getClientSubscriptions().find(s => s.id === subId) || null;
  }

  updateClientSubscription(subId, updates) {
    if (!this.data.subscriptions) this.data.subscriptions = [];
    const idx = this.data.subscriptions.findIndex(s => s.id === subId);
    if (idx !== -1) {
      if (updates.monthlyPrice !== undefined) updates.monthlyPrice = parseInt(updates.monthlyPrice) || 0;
      if (updates.planId) {
        const plan = this.getSubscriptionPlan(updates.planId);
        if (plan) {
          updates.planName = plan.name;
          if (updates.monthlyPrice === undefined) updates.monthlyPrice = plan.price;
        }
      }
      this.data.subscriptions[idx] = {
        ...this.data.subscriptions[idx],
        ...updates,
        paymentLink: `https://pagos.humm.cl/checkout?sub=${subId}&monto=${updates.monthlyPrice || this.data.subscriptions[idx].monthlyPrice}`,
        updatedAt: new Date().toISOString()
      };
      this.saveState();
      return this.data.subscriptions[idx];
    }
    return null;
  }

  recordSubscriptionPayment(subId, paymentMethod = 'Webpay Débito/Crédito') {
    const sub = this.getClientSubscription(subId);
    if (sub) {
      const todayStr = new Date().toISOString().substring(0, 10);
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 30);
      const nextStr = nextDate.toISOString().substring(0, 10);

      this.updateClientSubscription(subId, {
        paymentStatus: 'paid',
        status: 'active',
        isTrial: false,
        lastPaymentDate: todayStr,
        nextBillingDate: nextStr,
        paymentMethod
      });
      return true;
    }
    return false;
  }

  sendSubscriptionPaymentLinks({ subIds, channel = 'whatsapp', customMessage = '' }) {
    const subs = this.getClientSubscriptions().filter(s => subIds.includes(s.id));
    const results = subs.map(sub => {
      const message = (customMessage || `Hola {NOMBRE}! Te compartimos el link de pago para tu suscripción a {PLAN} en Mi Humm por {MONTO}. Puedes pagar en: {LINK_PAGO}`)
        .replace(/{NOMBRE}/g, sub.clientName)
        .replace(/{PLAN}/g, sub.planName)
        .replace(/{MONTO}/g, formatCLP(sub.monthlyPrice))
        .replace(/{LINK_PAGO}/g, sub.paymentLink)
        .replace(/{FECHA_CORTE}/g, formatDateCL(sub.nextBillingDate));

      const phoneClean = sanitizeWhatsAppPhone(sub.clientPhone);
      const waUrl = `https://wa.me/${phoneClean}?text=${encodeURIComponent(message)}`;

      return {
        subId: sub.id,
        clientName: sub.clientName,
        clientEmail: sub.clientEmail,
        clientPhone: sub.clientPhone,
        channel,
        waUrl,
        message,
        sentAt: new Date().toISOString()
      };
    });

    return results;
  }
}

// =========================================================================
// HELPERS Y FORMATEADORES EN PESOS CHILENOS Y FECHAS
// =========================================================================
export const formatCLP = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '$0';
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatMonthName = (monthNumber, year = null) => {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const name = months[monthNumber - 1] || 'Mes';
  return year ? `${name} ${year}` : name;
};

export const formatDateCL = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr + (dateStr.length === 10 ? 'T12:00:00' : ''));
  if (isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
};

export const isDateOverdue = (dateStr) => {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + (dateStr.length === 10 ? 'T12:00:00' : ''));
  target.setHours(0, 0, 0, 0);
  return target < today;
};

export const sanitizeWhatsAppPhone = (phone) => {
  if (!phone) return '';
  // Limpia cualquier espacio, paréntesis o guión
  let cleaned = phone.replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  } else if (cleaned.startsWith('9') && cleaned.length === 9) {
    cleaned = '56' + cleaned;
  }
  return cleaned;
};

export const store = new Store();
