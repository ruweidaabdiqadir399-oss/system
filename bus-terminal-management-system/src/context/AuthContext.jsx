import { useCallback, useEffect, useState } from 'react';
import * as authService from '../services/authService';
import { getMyDriverProfile } from '../services/driverService';
import { STORAGE_KEYS } from '../utils/constants';
import { AuthContext } from './auth-context';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
    if (storedToken && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch {
        clearStorage();
      }
    }
    setIsLoading(false);
  }, []);

  const clearStorage = () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  };

  const persistSession = (nextUser, accessToken, refreshToken) => {
    localStorage.setItem(STORAGE_KEYS.TOKEN, accessToken);
    if (refreshToken) localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(nextUser));
    setUser(nextUser);
    setToken(accessToken);
  };

  const enrichDriverUser = async (baseUser, accessToken, refreshToken) => {
    persistSession(baseUser, accessToken, refreshToken);
    try {
      const driverData = await getMyDriverProfile();
      const enriched = {
        ...baseUser,
        totalTrips: driverData.driverProfile?.totalTrips ?? 0,
        rating: driverData.driverProfile?.rating ?? null,
        assignedBusId: driverData.driverProfile?.assignedBusId ?? null,
        licenseNumber: driverData.driverProfile?.licenseNumber ?? '',
        licenseExpiry: driverData.driverProfile?.licenseExpiry ?? '',
      };
      persistSession(enriched, accessToken, refreshToken);
      return enriched;
    } catch {
      return baseUser;
    }
  };

  const login = useCallback(async (credentials) => {
    const { user: loggedInUser, accessToken, refreshToken } = await authService.login(credentials);
    if (loggedInUser.role === 'driver') {
      return enrichDriverUser(loggedInUser, accessToken, refreshToken);
    }
    persistSession(loggedInUser, accessToken, refreshToken);
    return loggedInUser;
  }, []);

  const register = useCallback(async (data) => {
    const { user: newUser, accessToken, refreshToken } = await authService.register(data);
    if (newUser.role === 'driver') {
      return enrichDriverUser(newUser, accessToken, refreshToken);
    }
    persistSession(newUser, accessToken, refreshToken);
    return newUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      await authService.logout(refreshToken);
    } catch {
      // Ignore errors — clear session regardless
    } finally {
      clearStorage();
      setUser(null);
      setToken(null);
    }
  }, []);

  const updateUser = useCallback((partial) => {
    setUser((prev) => {
      const next = { ...prev, ...partial };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = {
    user,
    token,
    role: user?.role ?? null,
    isAuthenticated: Boolean(user && token),
    isLoading,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
