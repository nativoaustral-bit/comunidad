/**
 * MI HUMM - CONTROLADOR DE AUTENTICACIÓN Y SEGURIDAD DE SESIÓN
 * Comunidad Humm Co-Creation
 * Protección con expiración por inactividad y límites máximos de tiempo
 */

import { store } from './store.js?v=6.0';

export const AUTH_CONFIG = {
  SESSION_KEY: 'mi_humm_active_session_v1',

  // 1. Tiempos para Administradores (Mayor rigor de seguridad)
  ADMIN_INACTIVITY_LIMIT: 60 * 60 * 1000,    // 60 minutos de inactividad
  ADMIN_MAX_LIFETIME: 4 * 60 * 60 * 1000,     // 4 horas de sesión máxima absoluta

  // 2. Tiempos para Emprendedores y Asesores
  USER_INACTIVITY_LIMIT_REMEMBER: 2 * 60 * 60 * 1000, // 2 horas con "Recordarme"
  USER_INACTIVITY_LIMIT_NO_REMEMBER: 45 * 60 * 1000,  // 45 minutos sin "Recordarme"
  USER_MAX_LIFETIME: 8 * 60 * 60 * 1000,              // 8 horas de sesión máxima absoluta

  // Intervalo mínimo para registrar actividad en disco
  ACTIVITY_THROTTLE: 30 * 1000 // 30 segundos
};

class AuthService {
  constructor() {
    this.listeners = [];
    this.lastRecordedActivity = Date.now();
    this.session = this.loadSession();
  }

  /**
   * Carga y valida la sesión activa desde almacenamiento
   */
  loadSession() {
    try {
      // Buscar primero en sessionStorage (sesiones no persistentes) y luego en localStorage
      let stored = sessionStorage.getItem(AUTH_CONFIG.SESSION_KEY);
      let isSessionStorage = true;

      if (!stored) {
        stored = localStorage.getItem(AUTH_CONFIG.SESSION_KEY);
        isSessionStorage = false;
      }

      if (stored) {
        const parsed = JSON.parse(stored);
        let user = store.getUser(parsed.userId);

        if (!user && parsed.cachedUser) {
          user = parsed.cachedUser;
          if (!store.data.users) store.data.users = [];
          if (!store.data.users.some(u => u.id === user.id)) {
            store.data.users.push(user);
          }
        }

        const isUserActive = user ? (user.isActive !== false && user.isActive !== 0 && user.is_active !== 0 && user.is_active !== false) : true;
        if (user && isUserActive) {
          user.isActive = true;
          user.is_active = 1;
          const expirationCheck = this.isSessionExpired(parsed, user);
          if (expirationCheck.expired) {
            console.warn('Sesión caducada al cargar:', expirationCheck.reason);
            this.clearAllStorage();
            return null;
          }

          return {
            userId: user.id,
            role: user.role,
            rememberMe: !!parsed.rememberMe,
            loginTime: parsed.loginTime || Date.now(),
            lastActivityTime: parsed.lastActivityTime || Date.now(),
            expiresAt: parsed.expiresAt || (Date.now() + (user.role === 'admin' ? AUTH_CONFIG.ADMIN_MAX_LIFETIME : AUTH_CONFIG.USER_MAX_LIFETIME)),
            impersonatedWorkspaceId: parsed.impersonatedWorkspaceId || null,
            cachedUser: user,
            cachedWorkspace: parsed.cachedWorkspace || null
          };
        }
      }
    } catch (e) {
      console.error('Error al cargar sesión de autenticación:', e);
      this.clearAllStorage();
    }
    return null;
  }

  /**
   * Determina si una sesión ha superado los tiempos límites permitidos
   */
  isSessionExpired(sessionData, user) {
    if (!sessionData) return { expired: true, reason: 'no_session' };

    const now = Date.now();
    const isAdmin = user ? (user.role === 'admin') : (sessionData.role === 'admin');

    const inactivityLimit = isAdmin
      ? AUTH_CONFIG.ADMIN_INACTIVITY_LIMIT
      : (sessionData.rememberMe ? AUTH_CONFIG.USER_INACTIVITY_LIMIT_REMEMBER : AUTH_CONFIG.USER_INACTIVITY_LIMIT_NO_REMEMBER);

    const maxLifetime = isAdmin
      ? AUTH_CONFIG.ADMIN_MAX_LIFETIME
      : AUTH_CONFIG.USER_MAX_LIFETIME;

    const lastActivity = sessionData.lastActivityTime || sessionData.loginTime || now;
    const loginTime = sessionData.loginTime || now;

    // 1. Verificación por inactividad
    if (now - lastActivity > inactivityLimit) {
      return { expired: true, reason: 'inactivity' };
    }

    // 2. Verificación por tiempo máximo absoluto
    if (now - loginTime > maxLifetime || (sessionData.expiresAt && now > sessionData.expiresAt)) {
      return { expired: true, reason: 'max_lifetime' };
    }

    return { expired: false };
  }

  /**
   * Limpia todos los almacenamientos locales
   */
  clearAllStorage() {
    try {
      localStorage.removeItem(AUTH_CONFIG.SESSION_KEY);
      sessionStorage.removeItem(AUTH_CONFIG.SESSION_KEY);
    } catch (e) {
      console.warn('Error al limpiar almacenamiento de sesión:', e);
    }
  }

  /**
   * Guarda o elimina la sesión activa
   */
  saveSession(sessionData) {
    this.session = sessionData;
    this.clearAllStorage();

    if (sessionData) {
      const dataStr = JSON.stringify(sessionData);
      if (sessionData.rememberMe) {
        localStorage.setItem(AUTH_CONFIG.SESSION_KEY, dataStr);
      } else {
        sessionStorage.setItem(AUTH_CONFIG.SESSION_KEY, dataStr);
      }
    }

    this.notify();
  }

  /**
   * Registra actividad del usuario para renovar el contador de inactividad
   */
  recordActivity() {
    if (!this.session) return;

    const now = Date.now();
    if (now - this.lastRecordedActivity < AUTH_CONFIG.ACTIVITY_THROTTLE) {
      return;
    }

    this.lastRecordedActivity = now;
    this.session.lastActivityTime = now;

    try {
      const dataStr = JSON.stringify(this.session);
      if (this.session.rememberMe) {
        localStorage.setItem(AUTH_CONFIG.SESSION_KEY, dataStr);
      } else {
        sessionStorage.setItem(AUTH_CONFIG.SESSION_KEY, dataStr);
      }
    } catch (e) {
      // Ignorar errores menores de almacenamiento
    }
  }

  /**
   * Verifica activamente si la sesión sigue siendo válida
   */
  checkSessionValidity(notifyExpired = true) {
    if (!this.session) return false;

    let user = store.getUser(this.session.userId);
    if (!user && this.session.cachedUser) {
      user = this.session.cachedUser;
      if (!store.data.users) store.data.users = [];
      if (!store.data.users.some(u => u.id === user.id)) {
        store.data.users.push(user);
      }
    }

    if (user) {
      const isUserActive = (user.isActive !== false && user.isActive !== 0 && user.is_active !== 0 && user.is_active !== false);
      if (!isUserActive) {
        this.logout(notifyExpired, 'Tu cuenta ya no está disponible o ha sido desactivada.');
        return false;
      }
    }

    const check = this.isSessionExpired(this.session, user || this.session.cachedUser);
    if (check.expired) {
      const msg = check.reason === 'inactivity'
        ? '🔒 Tu sesión ha caducado automáticamente por inactividad por motivos de seguridad. Por favor, ingresa de nuevo.'
        : '🔒 Tu sesión ha alcanzado el tiempo máximo de duración permitido. Por favor, inicia sesión nuevamente.';
      this.logout(notifyExpired, msg);
      return false;
    }

    return true;
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
        try { fn(this.getCurrentUser()); } catch(err) { console.error('Listener error in auth:', err); }
      });
    }
  }

  isAuthenticated() {
    return this.checkSessionValidity(false) && !!this.getCurrentUser();
  }

  getCurrentUser() {
    if (!this.session) return null;
    let user = store.getUser(this.session.userId);
    if (!user && this.session.cachedUser) {
      user = this.session.cachedUser;
      if (!store.data.users) store.data.users = [];
      if (!store.data.users.some(u => u.id === user.id)) {
        store.data.users.push(user);
      }
    }
    if (!user) {
      user = {
        id: this.session.userId,
        role: this.session.role,
        name: this.session.role === 'admin' ? 'Administrador' : 'Emprendedor',
        email: '',
        isActive: true,
        is_active: 1
      };
    }
    const isUserActive = (user.isActive !== false && user.isActive !== 0 && user.is_active !== 0 && user.is_active !== false);
    if (!isUserActive) {
      this.logout();
      return null;
    }
    return user;
  }

  getCurrentWorkspace() {
    const user = this.getCurrentUser();
    if (!user) return null;

    // Si es administrador y está auditando un espacio específico
    if (user.role === 'admin' && this.session.impersonatedWorkspaceId) {
      return store.getWorkspace(this.session.impersonatedWorkspaceId);
    }

    if (user.workspaceId) {
      let ws = store.getWorkspace(user.workspaceId);
      if (!ws && this.session.cachedWorkspace) {
        ws = this.session.cachedWorkspace;
        if (!store.data.workspaces) store.data.workspaces = [];
        if (!store.data.workspaces.some(w => w.id === ws.id)) {
          store.data.workspaces.push(ws);
        }
      }
      return ws;
    }

    // Para admin sin espacio asignado
    return null;
  }

  async login(email, password, remember = false) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanEmail || !cleanPass) {
      return { success: false, message: 'Por favor ingresa tu correo y contraseña.' };
    }

    // 1. Autenticación estricta con Backend MySQL
    if (typeof window !== 'undefined' && window.fetch) {
      try {
        const res = await fetch('api/auth.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'login',
            email: cleanEmail,
            password: cleanPass
          })
        });

        const json = await res.json();
        if (json.success && json.data && json.data.user) {
          const apiUser = json.data.user;
          const userObj = {
            id: apiUser.id,
            name: apiUser.name,
            email: apiUser.email,
            phone: apiUser.phone || '',
            role: apiUser.role,
            specialty: apiUser.specialty || '',
            avatar: apiUser.avatar || (apiUser.name ? apiUser.name.substring(0, 2).toUpperCase() : 'U'),
            isActive: apiUser.is_active !== undefined ? !!apiUser.is_active : true,
            workspaceId: apiUser.workspace_id || null,
            assignedToolIds: apiUser.assigned_tool_ids || [],
            mustChangePassword: apiUser.must_change_password ? 1 : 0,
            token: json.data.token
          };

          // Guardar usuario en store local para vistas
          if (!store.getUser(userObj.id)) {
            if (!store.data.users) store.data.users = [];
            store.data.users.push(userObj);
          } else {
            store.updateUser(userObj.id, userObj);
          }

          if (json.data.workspace) {
            const wsObj = {
              id: json.data.workspace.id,
              name: json.data.workspace.name,
              ownerName: json.data.workspace.owner_name || json.data.workspace.name,
              email: json.data.workspace.email || '',
              city: json.data.workspace.city || '',
              comuna: json.data.workspace.city || '',
              region: json.data.workspace.region || '',
              membershipStatus: json.data.workspace.membership_status || 'active',
              membershipType: json.data.workspace.membership_type || 'Membresía Humm Co-Creation',
              advisorName: json.data.workspace.advisor_name || null,
              advisorEmail: json.data.workspace.advisor_email || null
            };
            if (!store.getWorkspace(wsObj.id)) {
              if (!store.data.workspaces) store.data.workspaces = [];
              store.data.workspaces.push(wsObj);
            }
          }

          const now = Date.now();
          const isAdmin = userObj.role === 'admin';
          const maxLifetime = isAdmin ? AUTH_CONFIG.ADMIN_MAX_LIFETIME : AUTH_CONFIG.USER_MAX_LIFETIME;

          this.saveSession({
            userId: userObj.id,
            role: userObj.role,
            rememberMe: !!remember,
            loginTime: now,
            lastActivityTime: now,
            expiresAt: now + maxLifetime,
            impersonatedWorkspaceId: null,
            cachedUser: userObj,
            cachedWorkspace: (typeof wsObj !== 'undefined' ? wsObj : null)
          });

          // Sincronizar catálogo completo en background
          store.syncWithBackend(userObj.role, userObj.workspaceId).catch(err => {
            console.warn('Sync en background tras login:', err);
          });

          return { success: true, user: userObj };
        } else {
          // El servidor rechazó la autenticación con error explícito
          return { success: false, message: json.error || json.message || 'Usuario o clave incorrecta.' };
        }
      } catch (err) {
        console.error('Error de red al intentar autenticar:', err);
        return { success: false, message: 'No se pudo conectar con el servidor de autenticación. Verifica tu conexión.' };
      }
    }

    return { success: false, message: 'Servicio de autenticación no disponible.' };
  }

  logout(notifyMessage = false, messageText = null) {
    this.saveSession(null);
    if (notifyMessage && window.MiHummApp && window.MiHummApp.showToast) {
      window.MiHummApp.showToast(messageText || 'Has cerrado sesión correctamente.', 'info');
    }
    return true;
  }

  impersonateWorkspace(workspaceId) {
    const user = this.getCurrentUser();
    if (user && user.role === 'admin') {
      this.session.impersonatedWorkspaceId = workspaceId;
      this.session.lastActivityTime = Date.now();
      this.saveSession(this.session);
      return true;
    }
    return false;
  }

  stopImpersonating() {
    if (this.session) {
      this.session.impersonatedWorkspaceId = null;
      this.session.lastActivityTime = Date.now();
      this.saveSession(this.session);
    }
  }

  async requestPasswordReset(email) {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, message: 'Ingresa un correo electrónico válido.' };
    }

    try {
      const res = await fetch('api/auth.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request_reset',
          email: cleanEmail
        })
      });
      const json = await res.json();
      if (json.success) {
        return {
          success: true,
          message: json.data?.message || `Hemos enviado las instrucciones para restablecer tu contraseña al correo ${cleanEmail}.`
        };
      } else {
        return {
          success: false,
          message: json.error || json.message || 'No se pudo enviar el correo de recuperación. Verifica el correo ingresado.'
        };
      }
    } catch (e) {
      return {
        success: false,
        message: 'Error al conectar con el servidor para recuperación de contraseña.'
      };
    }
  }

  changePassword(currentPassword, newPassword) {
    const user = this.getCurrentUser();
    if (!user) return { success: false, message: 'Sesión no válida o expirada.' };

    if (user.password !== currentPassword.trim()) {
      return { success: false, message: 'La contraseña actual no es correcta.' };
    }

    if (newPassword.trim().length < 4) {
      return { success: false, message: 'La nueva contraseña debe tener al menos 4 caracteres.' };
    }

    store.updateUser(user.id, { password: newPassword.trim() });
    return { success: true, message: 'Tu contraseña ha sido actualizada correctamente.' };
  }
}

export const auth = new AuthService();
