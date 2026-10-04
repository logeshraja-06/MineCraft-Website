import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('mindcraft_token'));
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('mindcraft_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('mindcraft_token');
    if (storedToken) {
      authApi.getCurrentUser()
        .then((res) => {
          if (res.user) {
            setUser(res.user);
            localStorage.setItem('mindcraft_user', JSON.stringify(res.user));
          }
        })
        .catch(() => {
          localStorage.removeItem('mindcraft_token');
          localStorage.removeItem('mindcraft_user');
          setToken(null);
          setUser(null);
        });
    }
  }, []);

  const handleLogin = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      const res = await authApi.login(credentials);
      if (res.token && res.user) {
        localStorage.setItem('mindcraft_token', res.token);
        localStorage.setItem('mindcraft_user', JSON.stringify(res.user));
        setToken(res.token);
        setUser(res.user);
      }
      return res;
    } catch (err) {
      const msg = err.response?.data?.message || (err.message?.includes('Network') || !err.response ? 'Unable to reach backend server. Please verify the backend is running.' : 'Login failed. Please check your credentials.');
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      const res = await authApi.adminLogin(credentials);
      if (res.token && res.user) {
        localStorage.setItem('mindcraft_token', res.token);
        localStorage.setItem('mindcraft_user', JSON.stringify(res.user));
        setToken(res.token);
        setUser(res.user);
      }
      return res;
    } catch (err) {
      const msg = err.response?.data?.message || (err.message?.includes('Network') || !err.response ? 'Unable to reach backend server. Please verify the backend is running.' : 'Invalid admin credentials.');
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('mindcraft_token');
    localStorage.removeItem('mindcraft_user');
    localStorage.removeItem('mindcraft_participant');
    setToken(null);
    setUser(null);
    setError(null);
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('mc_') || k.startsWith('mindcraft_') || k.startsWith('challenge_') || k.startsWith('timer_'))) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (_) {}
  };

  const setAuthSession = (newToken, newUser) => {
    if (newToken) {
      localStorage.setItem('mindcraft_token', newToken);
      setToken(newToken);
    }
    if (newUser) {
      localStorage.setItem('mindcraft_user', JSON.stringify(newUser));
      setUser(newUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        role: user?.role || 'participant',
        loading,
        error,
        login: handleLogin,
        adminLogin: handleAdminLogin,
        logout: handleLogout,
        setAuthSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
