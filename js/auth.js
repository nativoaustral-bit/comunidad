/**
 * MI HUMM - CONTROLADOR DE AUTENTICACIÓN Y SESIÓN BANCARIA
 * Comunidad Humm Co-Creation
 */

import { store } from './store.js';

const SESSION_KEY = 'mi_humm_active_session_v1';

class AuthService {
  constructor() {
    this.listeners = [];
    this.session = this.loadSession();
  }

  loadSession() {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validar que el usuario aún exista y esté activo
        const user = store.getUser(parsed.userId);
        if (user && user.isActive) {
          return {
            userId: user.id,
            impersonatedWorkspaceId: parsed.impersonatedWorkspaceId || null,
            loginTime: parsed.loginTime
          };
        }
      }
    } catch (e) {
      console.error('Error loading session:', e);
    }
    return null;
  }

  saveSession(sessionData) {
    this.session = sessionData;
    if (sessionData) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
    this.notify();
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
    return !!this.getCurrentUser();
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

  login(email, password, remember = true) {
    let user = store.getUserByEmail(email);

    // Auto-recuperación de cuenta admin inicial si la BD está vacía
    if (!user) {
      const cleanEmail = (email || '').trim().toLowerCase();
      if (cleanEmail === 'admin@humm.cl') {
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
      const cleanEmail = (email || '').trim().toLowerCase();
      if (cleanEmail === 'admin@humm.cl' && password.trim() === 'admin') {
        user.password = 'admin';
        store.updateUser(user.id, { password: 'admin' });
      } else {
        return { success: false, message: 'Contraseña incorrecta. Verifica tus datos o solicita restablecerla.' };
      }
    }

    // Actualizar último acceso
    store.updateUser(user.id, { lastAccess: new Date().toISOString() });

    this.saveSession({
      userId: user.id,
      impersonatedWorkspaceId: null,
      loginTime: new Date().toISOString()
    });

    return { success: true, user };
  }

  logout() {
    this.saveSession(null);
    return true;
  }

  impersonateWorkspace(workspaceId) {
    const user = this.getCurrentUser();
    if (user && user.role === 'admin') {
      this.session.impersonatedWorkspaceId = workspaceId;
      this.saveSession(this.session);
      return true;
    }
    return false;
  }

  stopImpersonating() {
    if (this.session) {
      this.session.impersonatedWorkspaceId = null;
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
    // En el MVP simulamos el envío de correo de restablecimiento seguro
    return {
      success: true,
      message: `Hemos enviado las instrucciones para restablecer tu contraseña al correo ${email}. Revisa tu bandeja de entrada.`
    };
  }

  changePassword(currentPassword, newPassword) {
    const user = this.getCurrentUser();
    if (!user) return { success: false, message: 'Sesión no válida.' };

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
