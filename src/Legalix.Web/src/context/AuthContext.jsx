import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import api, { setApiTenantId } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({
    currency: 'COP',
    language: 'es-CO',
    timeZone: 'SA Pacific Standard Time'
  });
  const [currentTenantId, setCurrentTenantId] = useState(null);
  const [currentTenantName, setCurrentTenantName] = useState('');

  const refreshConfig = async (tenantId) => {
    if (!tenantId) return;
    try {
      const response = await api.get('/companies/settings', {
        headers: { 'X-Tenant-Id': tenantId }
      });
      
      if (response.data) {
        const newConfig = {
          currency: response.data.currencyCode || 'COP',
          timeZone: response.data.timeZone || 'SA Pacific Standard Time',
          language: response.data.language || 'es-CO'
        };
        setConfig(newConfig);
        window.legalixConfig = newConfig;
      }
    } catch (error) {
      console.error("Error refreshing tenant config:", error);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          const tid = parsedUser.companyId || parsedUser.CompanyId;
          setCurrentTenantId(tid);
          setCurrentTenantName(parsedUser.companyName || parsedUser.CompanyName);
          setApiTenantId(tid);
          localStorage.setItem('selectedTenantId', tid);
          await refreshConfig(tid);
        }
      } catch (e) {
        console.error("Error parsing saved user:", e);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (email, password, twoFactorCode = null) => {
    try {
      const response = await api.post('/auth/login', { 
        email, 
        password, 
        twoFactorCode 
      });
      
      if (response.data.requires2FA) {
        return { requires2FA: true };
      }

      const userData = response.data;
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      const tid = userData.companyId || userData.CompanyId;
      setCurrentTenantId(tid);
      setCurrentTenantName(userData.companyName || userData.CompanyName);
      setApiTenantId(tid);
      localStorage.setItem('selectedTenantId', tid);
      
      await refreshConfig(tid);
      return { 
        success: true, 
        requirePasswordChange: userData.requirePasswordChange,
        is2FAEnabled: userData.is2FAEnabled
      };
    } catch (error) {
      throw error.response?.data?.message || 'Error al iniciar sesión';
    }
  };

  const switchTenant = async (tenantId, tenantName) => {
    setCurrentTenantId(tenantId);
    setCurrentTenantName(tenantName);
    setApiTenantId(tenantId);
    localStorage.setItem('selectedTenantId', tenantId);
    await refreshConfig(tenantId);
  };

  // The api instance already has an interceptor in services/api.js
  // that uses dynamicTenantId set via setApiTenantId(tenantId).

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setCurrentTenantId(null);
    setCurrentTenantName(null);
    setConfig({
      currency: 'COP',
      language: 'es-CO',
      timeZone: 'SA Pacific Standard Time'
    });
  };

  const updateUser = (data) => {
    const newUser = { ...user, ...data };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token: user?.token, 
      loading,
      currentTenantId,
      currentTenantName,
      config,
      login, 
      logout, 
      switchTenant,
      refreshConfig,
      updateUser,
      isAuthenticated: !!user, 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
