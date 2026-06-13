import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user profile if token is in local storage
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser({ ...res.data, token });
        } catch (err) {
          console.warn('Failed to load session profile, clearing token:', err.message);
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  // Register User
  const register = async (username, email, password) => {
    setError(null);
    try {
      const res = await api.post('/auth/register', { username, email, password });
      const userData = res.data;
      localStorage.setItem('token', userData.token);
      setUser(userData);
      return userData;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  // Login User
  const login = async (email, password) => {
    setError(null);
    try {
      const res = await api.post('/auth/login', { email, password });
      const userData = res.data;
      localStorage.setItem('token', userData.token);
      setUser(userData);
      return userData;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  // Logout User
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setError(null);
  };

  // Update User Profile
  const updateProfile = async (username, email) => {
    setError(null);
    try {
      const res = await api.put('/auth/profile', { username, email });
      const updatedData = res.data;
      setUser((prev) => ({ ...prev, ...updatedData }));
      return updatedData;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Profile update failed';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  // Update Avatar File
  const updateAvatar = async (file) => {
    setError(null);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const res = await api.post('/auth/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const { profilePictureUrl } = res.data;
      setUser((prev) => ({ ...prev, profilePictureUrl }));
      return profilePictureUrl;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Avatar upload failed';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  // Change Password
  const changePassword = async (currentPassword, newPassword) => {
    setError(null);
    try {
      await api.put('/auth/password', { currentPassword, newPassword });
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Password update failed';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        register,
        login,
        logout,
        updateProfile,
        updateAvatar,
        changePassword,
        setError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
