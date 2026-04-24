import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authenticateWithGoogle, getCurrentUserProfile, logoutUser } from '../services/authService';
import { getStoredToken, setStoredToken } from '../services/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const clearAuth = useCallback(() => {
    setStoredToken(null);
    setUser(null);
  }, []);

  const bootstrapUser = useCallback(async () => {
    const token = getStoredToken();

    if (!token) {
      setIsInitializing(false);
      return;
    }

    try {
      const profile = await getCurrentUserProfile();
      setUser(profile);
    } catch {
      clearAuth();
    } finally {
      setIsInitializing(false);
    }
  }, [clearAuth]);

  useEffect(() => {
    bootstrapUser();
  }, [bootstrapUser]);

  useEffect(() => {
    const handleUnauthorized = () => {
      clearAuth();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [clearAuth]);

  const loginWithGoogle = useCallback(async (idToken) => {
    const response = await authenticateWithGoogle(idToken);
    setStoredToken(response.accessToken);
    const profile = await getCurrentUserProfile();
    setUser(profile);
    return profile;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } finally {
      clearAuth();
    }
  }, [clearAuth]);

  const value = useMemo(
    () => ({
      user,
      isInitializing,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'ADMIN',
      loginWithGoogle,
      logout,
      refreshProfile: bootstrapUser,
    }),
    [bootstrapUser, isInitializing, loginWithGoogle, logout, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
