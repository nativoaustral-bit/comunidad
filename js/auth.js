/**
 * MI HUMM - CONTROLADOR DE AUTENTICACIÓN Y SEGURIDAD DE SESIÓN
 * Comunidad Humm Co-Creation
 * Protección con expiración por inactividad y límites máximos de tiempo
 */

import { store } from './store.js';

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
        const user = store.getUser(parsed.userId);

        if (user && user.isActive) {
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
            impersonatedWorkspaceId: parsed.impersonatedWorkspaceId || null
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

    const user = store.getUser(this.session.userId);
    if (!user || !user.isActive) {
      this.logout(notifyExpired, 'Tu cuenta ya no está disponible o ha sido desactivada.');
      return false;
    }

    const check = this.isSessionExpired(this.session, user);
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
    const user = store.getUser(this.session.userId);
    if (!user || !user.isActive) {
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
      return store.getWorkspace(user.workspaceId);
    }

    // Para admin sin espacio asignado
    return null;
  }

  login(email, password, remember = false) {
    let user = store.getUserByEmail(email);

    // Auto-recuperación de cuenta admin inicial si la BD está vacía
    if (!user) {
      // Solo inicializar si no hay usuarios en la base de datos local
      if (store.getAllUsers().length === 0) {
        user = store.createUser({
          id: 'usr-admin',
          name: 'Administrador Humm',
          email: 'admin@humm.cl',
          password: 'admin',
          role: 'admin',
          workspaceId: null
        });
      }
    }

    if (!user) {
      return { success: false, message: 'El correo electrónico no se encuentra registrado en Comunidad Humm.' };
    }

    if (!user.isActive) {
      return { success: false, message: 'Esta cuenta ha sido desactivada por el equipo de administración de Humm. Contacta a soporte para reactivar tu acceso.' };
    }

    if (user.password !== password.trim()) {
      return { success: false, message: 'Contraseña incorrecta. Verifica tus datos o solicita restablecerla.' };
    }

    // Actualizar último acceso
    store.updateUser(user.id, { lastAccess: new Date().toISOString() });

    const now = Date.now();
    const isAdmin = user.role === 'admin';
    const maxLifetime = isAdmin ? AUTH_CONFIG.ADMIN_MAX_LIFETIME : AUTH_CONFIG.USER_MAX_LIFETIME;

    this.saveSession({
      userId: user.id,
      role: user.role,
      rememberMe: !!remember,
      loginTime: now,
      lastActivityTime: now,
      expiresAt: now + maxLifetime,
      impersonatedWorkspaceId: null
    });

    return { success: true, user };
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

  requestPasswordReset(email) {
    const user = store.getUserByEmail(email);
    if (!user) {
      return {
        success: false,
        message: 'No existe ninguna cuenta asociada a este correo electrónico.'
      };
    }
    
    // Despacho real de correo de restablecimiento vía PHP
    fetch('api/mail.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'reset_password',
        email: user.email,
        name: user.name
      })
    }).catch(err => console.warn('Reset email dispatch notice:', err));

    return {
      success: true,
      message: `Hemos enviado el enlace para cambiar tu contraseña al correo ${email}. Revisa tu bandeja de entrada.`
    };
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
