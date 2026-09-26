import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('stocksense_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('stocksense_jwt_token') || null;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync token with API instance & LocalStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('stocksense_jwt_token', token);
    } else {
      localStorage.removeItem('stocksense_jwt_token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('stocksense_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('stocksense_user');
    }
  }, [user]);

  // LOGIN
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token: jwtToken, user: userData } = response.data;
      setToken(jwtToken);
      setUser(userData);
      setLoading(false);
      return { success: true, user: userData };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      setError(msg);
      setLoading(false);
      return { success: false, error: msg };
    }
  };

  // REGISTER
  const register = async (name, email, password, role) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/register', { name, email, password, role });
      const { token: jwtToken, user: userData } = response.data;
      setToken(jwtToken);
      setUser(userData);
      setLoading(false);
      return { success: true, user: userData };
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      setError(msg);
      setLoading(false);
      return { success: false, error: msg };
    }
  };

  // REQUEST OTP FORGOT PASSWORD
  const requestOTP = async (email) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/forgot-password', { email });
      setLoading(false);
      return { success: true, message: response.data.message, otp: response.data.otp };
    } catch (err) {
      const msg = err.response?.data?.message || 'Request OTP failed';
      setError(msg);
      setLoading(false);
      return { success: false, error: msg };
    }
  };

  // VERIFY OTP
  const verifyOTP = async (email, otp) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/verify-otp', { email, otp });
      setLoading(false);
      return { success: true, message: response.data.message };
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid OTP code';
      setError(msg);
      setLoading(false);
      return { success: false, error: msg };
    }
  };

  // RESET PASSWORD
  const resetPassword = async (email, otp, newPassword) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/reset-password', { email, otp, newPassword });
      setLoading(false);
      return { success: true, message: response.data.message };
    } catch (err) {
      const msg = err.response?.data?.message || 'Reset password failed';
      setError(msg);
      setLoading(false);
      return { success: false, error: msg };
    }
  };

  // LOGOUT
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('stocksense_jwt_token');
    localStorage.removeItem('stocksense_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        error,
        setError,
        login,
        register,
        requestOTP,
        verifyOTP,
        resetPassword,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
