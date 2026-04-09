import React, { createContext, useState, useEffect } from 'react';
import { saveToken, saveUser, getUser, removeToken, removeUser, saveRefreshToken, removeRefreshToken } from '../utils/storage';
import { authService, userService } from '../services';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadTokenAndUser = async () => {
      const storedUser = await getUser();

      if (storedUser) {
        setUser(storedUser);
        setIsAuthenticated(true);
        if (storedUser._id || storedUser.id) {
          setUserId(storedUser._id || storedUser.id);
        }
      }
      setIsLoading(false);
    };
    loadTokenAndUser();
  }, []);

  const fetchUserInfo = async (id) => {
    try {
      const userData = await userService.getInfo(id);
      setUser(userData);
      await saveUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('AuthContext: Ошибка при получении данных пользователя:', error);
      await removeToken();
      await removeUser();
      setIsAuthenticated(false);
    }
  };

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      const { access_token, refresh_token, user: userData } = await authService.login(email, password);

      await saveToken(access_token);
      if (refresh_token) {
        await saveRefreshToken(refresh_token);
      }
      await saveUser(userData);

      const decodedToken = jwtDecode(access_token);
      setUserId(decodedToken.sub);
      setUser(userData);

      setIsAuthenticated(true);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('AuthContext: Ошибка входа:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    await authService.logout();
    await removeToken();
    await removeRefreshToken();
    await removeUser();
    setIsAuthenticated(false);
    setUserId(null);
    setUser(null);
  };

  // Хелперы для проверки ролей
  const isWorker = () => user?.role === 'worker';
  const isProjectAdmin = () => user?.role === 'projectAdmin';
  const isCompanyAdmin = () => user?.role === 'companyAdmin';
  const canManageProjects = () => ['companyAdmin', 'projectAdmin'].includes(user?.role);
  const canManageWorkers = () => ['companyAdmin', 'projectAdmin'].includes(user?.role);

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      isLoading, 
      login, 
      logout, 
      userId, 
      user,
      setIsAuthenticated,
      isWorker,
      isProjectAdmin,
      isCompanyAdmin,
      canManageProjects,
      canManageWorkers,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

