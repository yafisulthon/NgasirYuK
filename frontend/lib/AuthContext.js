'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('ngasiryuk_token');
    const savedUser = localStorage.getItem('ngasiryuk_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
    }
    setLoading(false);
  }, []);

  const login = (tokenData, userData) => {
    setToken(tokenData);
    setUser(userData);
    localStorage.setItem('ngasiryuk_token', tokenData);
    localStorage.setItem('ngasiryuk_user', JSON.stringify(userData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${tokenData}`;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('ngasiryuk_token');
    localStorage.removeItem('ngasiryuk_user');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
